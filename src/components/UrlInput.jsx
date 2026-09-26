import { useEffect, useRef, useState } from 'react'
import { Clipboard } from 'lucide-react'
import { analyzeMedia } from '../api/analyzeMedia'
import { startDownloadJob, pollJobStatus, cancelDownloadJob } from '../api/downloadMedia'
import ResultCard from './ResultCard'

export function isValidMediaUrl(value) {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

export function getPlatformName(urlStr, mediaType) {
  try {
    const parsed = new URL(urlStr)
    const host = parsed.hostname.toLowerCase()
    if (host.includes('tiktok.com')) return 'TikTok'
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube'
    if (host.includes('instagram.com')) return 'Instagram'
    if (host.includes('twitter.com') || host.includes('x.com')) return 'X'
    if (host.includes('facebook.com') || host.includes('fb.watch')) return 'Facebook'
    if (host.includes('reddit.com')) return 'Reddit'
    if (host.includes('soundcloud.com')) return 'SoundCloud'
    if (host.includes('vimeo.com')) return 'Vimeo'
    if (host.includes('twitch.tv')) return 'Twitch'
  } catch (_) {}
  return (mediaType || 'MEDIA').toUpperCase()
}

const errors = {
  invalid: ['INVALID LINK', 'Please enter a valid HTTP or HTTPS URL.'],
  unsupported: ['UNSUPPORTED MEDIA', 'This link is currently not supported.'],
  too_large: ['FILE TOO LARGE', 'The file exceeds the maximum 500 MB limit.'],
  general: ['SOMETHING WENT WRONG', 'Please try again.'],
}

export default function UrlInput({ onPhaseChange }) {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState('idle')
  const [errorKind, setErrorKind] = useState(null)
  const [media, setMedia] = useState(null)
  const [job, setJob] = useState(null)
  const [format, setFormat] = useState('VIDEO')
  const [quality, setQuality] = useState('Best')
  const pending = useRef(null)
  const pasteVersion = useRef(0)
  const resultHeading = useRef(null)

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  useEffect(() => () => {
    pending.current?.cancel()
    pending.current = null
    pasteVersion.current += 1
  }, [])

  useEffect(() => {
    if (phase !== 'result' || !resultHeading.current) return
    const heading = resultHeading.current
    const position = heading.getBoundingClientRect()
    if (position.bottom <= 0 || position.top >= window.innerHeight) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      heading.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }, [phase])

  const cancelPending = () => {
    pending.current?.cancel()
    pending.current = null
  }

  const reset = () => {
    pasteVersion.current += 1
    cancelPending()
    setUrl('')
    setPhase('idle')
    setErrorKind(null)
    setMedia(null)
    setJob(null)
    setFormat('VIDEO')
    setQuality('Best')
  }

  const updateUrl = value => {
    if (phase === 'analyzing' || phase === 'preparing' || phase === 'downloading' || phase === 'processing') return
    pasteVersion.current += 1
    setUrl(value)
    setPhase('idle')
    setErrorKind(null)
    setMedia(null)
    setJob(null)
    setFormat('VIDEO')
    setQuality('Best')
  }

  const handlePaste = async () => {
    if (pending.current !== null) return
    const version = ++pasteVersion.current
    try {
      const text = await navigator.clipboard.readText()
      if (version === pasteVersion.current && pending.current === null) updateUrl(text)
    } catch (_) {
      // clipboard access denied — silent fail
    }
  }

  const analyze = async event => {
    event.preventDefault()
    if (pending.current !== null) return
    pasteVersion.current += 1
    if (!isValidMediaUrl(url.trim())) {
      setMedia(null)
      setErrorKind('invalid')
      setPhase('error')
      return
    }
    setErrorKind(null)
    setMedia(null)
    setJob(null)
    setFormat('VIDEO')
    setQuality('Best')
    setPhase('analyzing')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const operation = { cancel: () => { clearTimeout(timeout); controller.abort() } }
    pending.current = operation
    try {
      const result = await analyzeMedia(url.trim(), controller.signal)
      if (pending.current !== operation) return
      // Derive initial Format from what the analyzer found
      const avail = result.available_formats ?? []
      const initialFormat =
        avail.includes('video') ? 'VIDEO' :
        avail.includes('audio') ? 'MP3' :
        avail.includes('image') ? 'IMAGE' :
        avail.includes('thumbnail') ? 'THUMBNAIL' : 'VIDEO'
      const initialQuality = (initialFormat === 'IMAGE' || initialFormat === 'THUMBNAIL') ? 'Original' : 'Best'
      setFormat(initialFormat)
      setQuality(initialQuality)
      setMedia(result)
      setPhase('result')
    } catch (error) {
      if (pending.current !== operation) return
      setErrorKind(error.code === 'invalid_url' ? 'invalid' : error.code === 'unsupported_media' ? 'unsupported' : 'general')
      setPhase('error')
    } finally {
      clearTimeout(timeout)
      if (pending.current === operation) pending.current = null
    }
  }

  const startDownload = async (options = {}) => {
    if (phase !== 'result' || pending.current !== null) return
    setPhase('preparing')
    setJob(null)

    let isCancelled = false
    let currentJobId = null
    let pollTimer = null

    const operation = {
      cancel: () => {
        isCancelled = true
        if (pollTimer) clearTimeout(pollTimer)
        if (currentJobId) cancelDownloadJob(currentJobId)
      },
    }
    pending.current = operation

    try {
      const isImageOrThumb = format === 'IMAGE' || format === 'THUMBNAIL'
      const outputFormat = (
        options.output_format ||
        (isImageOrThumb ? (quality || 'Original').toLowerCase() : 'original')
      ).toLowerCase()

      const downloadInit = await startDownloadJob(url.trim(), format, quality, {
        output_format: outputFormat,
        image_index: options.image_index ?? 0,
        download_all: options.download_all ?? false,
      })
      if (isCancelled || pending.current !== operation) return

      currentJobId = downloadInit.job_id
      setJob({ job_id: currentJobId, status: downloadInit.status })

      const fail = (kind = 'general') => {
        if (!isCancelled && pending.current === operation) {
          setErrorKind(kind)
          setPhase('error')
          pending.current = null
        }
      }

      const poll = async () => {
        if (isCancelled || pending.current !== operation) return
        try {
          const statusData = await pollJobStatus(currentJobId)
          if (isCancelled || pending.current !== operation) return
          setJob(statusData)

          if (statusData.status === 'downloading') {
            setPhase('downloading')
          } else if (statusData.status === 'processing') {
            setPhase('processing')
          } else if (statusData.status === 'ready') {
            setPhase('success')
            if (pending.current === operation) pending.current = null
            return
          } else if (statusData.status === 'failed') {
            fail(statusData.error_code === 'file_too_large' ? 'too_large' : 'general')
            return
          }

          pollTimer = setTimeout(poll, 1000)
        } catch (_) {
          fail('general')
        }
      }

      pollTimer = setTimeout(poll, 1000)
    } catch (_) {
      if (!isCancelled && pending.current === operation) {
        setErrorKind('general')
        setPhase('error')
        pending.current = null
      }
    }
  }

  const isTransferring = ['preparing', 'downloading', 'processing'].includes(phase)
  const busy = phase === 'analyzing' || isTransferring
  const isReady = isValidMediaUrl(url.trim())
  const announcement =
    phase === 'analyzing'
      ? 'Analyzing link'
      : phase === 'result'
      ? 'Analysis result ready'
      : isTransferring
      ? 'Downloading and preparing file'
      : phase === 'success'
      ? 'File ready for download'
      : ''

  return (
    <section className="analyze-section">
      <p className="sr-only" role="status">{announcement}</p>
      <form onSubmit={analyze} noValidate className="analyze-form">
        <div className="url-field">
          <span className="url-input-icon" aria-hidden="true">
            {isReady && <span className="url-valid-check">✓</span>}
          </span>
          <input
            className="pixel-input"
            type="url"
            value={url}
            onChange={event => updateUrl(event.target.value)}
            disabled={busy}
            aria-label="Media URL"
            aria-describedby={phase === 'error' ? 'url-error' : 'url-hint'}
            aria-invalid={errorKind === 'invalid'}
            placeholder="Paste your link here..."
            spellCheck={false}
            autoComplete="off"
            style={{ paddingRight: '5.5rem', paddingLeft: '2.5rem' }}
          />
          <button
            type="button"
            onClick={handlePaste}
            disabled={busy}
            title="Paste from clipboard"
            aria-label="Paste from clipboard"
            className="paste-btn paste-btn--cyan"
          >
            <Clipboard size={14} />
            <span className="paste-text">PASTE</span>
          </button>
        </div>
        {phase === 'error' ? (
          <div id="url-error" className="error-card pixel-border" role="alert">
            <strong>{errors[errorKind]?.[0] || 'ERROR'}</strong>
            <p>{errors[errorKind]?.[1] || 'Something went wrong.'}</p>
          </div>
        ) : (
          <p id="url-hint" className="url-hint">
            {phase === 'analyzing'
              ? 'Analyzing link...'
              : phase === 'preparing' || phase === 'downloading' || phase === 'processing'
              ? 'Downloading and processing media...'
              : phase === 'result' || phase === 'success'
              ? '✓ Media detected'
              : isReady
              ? '✓ Ready to analyze'
              : url.trim()
              ? 'Enter a full http(s) link'
              : 'Paste a media link'}
          </p>
        )}
        <div className="analyze-actions">
          <button className="pixel-btn pixel-btn--full analyze-btn" type="submit" disabled={busy}>
            <span className="btn-star pixel-star-twinkle" aria-hidden="true">✦</span>
            {phase === 'analyzing'
              ? 'ANALYZING...'
              : phase === 'preparing' || phase === 'downloading' || phase === 'processing'
              ? 'DOWNLOADING...'
              : 'ANALYZE'}
            <span className="btn-star pixel-star-twinkle" aria-hidden="true">✦</span>
          </button>
          {(url || phase !== 'idle') && <button className="clear-btn" type="button" onClick={reset}>Clear</button>}
        </div>
      </form>
      {phase === 'analyzing' && (
        <div className="state-card pixel-border">
          <p>ANALYZING LINK...</p>
          <div className="activity-bar" aria-hidden="true"><span /></div>
        </div>
      )}
      {media && ['result', 'preparing', 'downloading', 'processing', 'success'].includes(phase) && (
        <ResultCard
          phase={phase}
          media={media}
          platform={getPlatformName(url, media?.media_type)}
          job={job}
          headingRef={resultHeading}
          format={format}
          quality={quality}
          onFormatChange={(next, initial) => { setFormat(next); setQuality(initial) }}
          onQualityChange={setQuality}
          onDownload={startDownload}
          onClear={reset}
        />
      )}
    </section>
  )
}
