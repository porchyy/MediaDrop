import { useEffect, useRef, useState } from 'react'
import { Search, Clipboard } from 'lucide-react'
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

const errors = {
  invalid: ['INVALID LINK', 'Please enter a valid HTTP or HTTPS URL.'],
  unsupported: ['UNSUPPORTED MEDIA', 'This link is currently not supported.'],
  too_large: ['FILE TOO LARGE', 'The file exceeds the maximum 500 MB limit.'],
  general: ['SOMETHING WENT WRONG', 'Please try again.'],
}

export default function UrlInput() {
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
      setFormat(initialFormat)
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

  const startDownload = async () => {
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
      const downloadInit = await startDownloadJob(url.trim(), format, quality)
      if (isCancelled || pending.current !== operation) return

      currentJobId = downloadInit.job_id
      setJob({ job_id: currentJobId, status: downloadInit.status })

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
            if (statusData.error_code === 'file_too_large') {
              setErrorKind('too_large')
            } else {
              setErrorKind('general')
            }
            setPhase('error')
            if (pending.current === operation) pending.current = null
            return
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

      pollTimer = setTimeout(poll, 1000)
    } catch (_) {
      if (!isCancelled && pending.current === operation) {
        setErrorKind('general')
        setPhase('error')
        pending.current = null
      }
    }
  }

  const busy = phase === 'analyzing' || phase === 'preparing' || phase === 'downloading' || phase === 'processing'
  const isReady = isValidMediaUrl(url.trim())
  const announcement =
    phase === 'analyzing'
      ? 'Analyzing link'
      : phase === 'result'
      ? 'Analysis result ready'
      : phase === 'preparing' || phase === 'downloading' || phase === 'processing'
      ? 'Downloading and preparing file'
      : phase === 'success'
      ? 'File ready for download'
      : ''

  return (
    <section className="analyze-section">
      <p className="sr-only" role="status">{announcement}</p>
      <form onSubmit={analyze} noValidate className="analyze-form">
        <div className="url-field">
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
            style={{ paddingRight: '3.25rem' }}
          />
          <button
            type="button"
            onClick={handlePaste}
            disabled={busy}
            title="Paste from clipboard"
            aria-label="Paste from clipboard"
            className="paste-btn"
          >
            <Clipboard size={13} />
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
              : isReady
              ? '✓ Ready to analyze'
              : url.trim()
              ? 'Enter a full http(s) link'
              : 'Paste a media link'}
          </p>
        )}
        <div className="analyze-actions">
          <button className="pixel-btn pixel-btn--full" type="submit" disabled={busy}>
            <Search size={14} strokeWidth={2.5} />
            {phase === 'analyzing'
              ? 'Analyzing...'
              : phase === 'preparing' || phase === 'downloading' || phase === 'processing'
              ? 'Downloading...'
              : 'Analyze'}
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
