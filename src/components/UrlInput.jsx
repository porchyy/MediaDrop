import { useEffect, useRef, useState } from 'react'
import { Clipboard } from 'lucide-react'
import { analyzeMedia } from '../api/analyzeMedia'
import { startDownloadJob, pollJobStatus, cancelDownloadJob } from '../api/downloadMedia'
import ResultCard from './ResultCard'
import MagneticButton from './kinetic/MagneticButton'
import SlashTransition from './kinetic/SlashTransition'
import ImpactFlash from './kinetic/ImpactFlash'
import GlitchText from './kinetic/GlitchText'
import HalftoneLayer from './kinetic/HalftoneLayer'

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

export const errors = {
  invalid: ['INVALID LINK', 'Please enter a valid HTTP or HTTPS URL.'],
  unsupported: ['UNSUPPORTED MEDIA', 'This link is currently not supported.'],
  login_required: ['INSTAGRAM LOGIN REQUIRED', 'This post cannot be accessed anonymously.'],
  extractor_error: ['MEDIA EXTRACTOR ERROR', 'The media extractor is temporarily unavailable.'],
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
  const [slashActive, setSlashActive] = useState(false)
  const [impactTrigger, setImpactTrigger] = useState(0)
  const [analyzingStep, setAnalyzingStep] = useState(1)

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

  // Stepped progression during Analyzing Scene
  useEffect(() => {
    if (phase !== 'analyzing') {
      setAnalyzingStep(1)
      return
    }
    const t1 = setTimeout(() => setAnalyzingStep(2), 220)
    const t2 = setTimeout(() => setAnalyzingStep(3), 480)
    const t3 = setTimeout(() => setAnalyzingStep(4), 720)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
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
    setAnalyzingStep(1)
  }

  const handleAbort = () => {
    cancelPending()
    setPhase('idle')
    setImpactTrigger(t => t + 1)
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

  const [clipboardWarning, setClipboardWarning] = useState(false)

  const handlePaste = async () => {
    if (pending.current !== null) return
    const version = ++pasteVersion.current
    try {
      const text = await navigator.clipboard.readText()
      if (version === pasteVersion.current && pending.current === null) updateUrl(text)
    } catch (_) {
      setClipboardWarning(true)
      setTimeout(() => setClipboardWarning(false), 3000)
    }
  }

  const cancelActiveDownload = () => {
    pending.current?.cancel()
    pending.current = null
    setPhase('result')
    setImpactTrigger(t => t + 1)
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

    // Persona 5 impact sequence: flash + slash
    setImpactTrigger(t => t + 1)
    setSlashActive(true)

    setPhase('analyzing')
    setAnalyzingStep(1)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const operation = { cancel: () => { clearTimeout(timeout); controller.abort() } }
    pending.current = operation

    const startTime = Date.now()
    try {
      const result = await analyzeMedia(url.trim(), controller.signal)
      if (pending.current !== operation) return

      // Minimum dramatic window (~750ms) so user experiences the kinetic scene
      const elapsed = Date.now() - startTime
      if (elapsed < 750) {
        await new Promise(r => setTimeout(r, 750 - elapsed))
      }
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
      setErrorKind(
        error.code === 'invalid_url' ? 'invalid' :
        error.code === 'login_required' ? 'login_required' :
        error.code === 'extractor_error' ? 'extractor_error' :
        error.code === 'unsupported_media' ? 'unsupported' :
        'general'
      )
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
      const effectiveFormat = options.format || format
      const effectiveQuality = options.quality || quality
      const isImageOrThumb = effectiveFormat === 'IMAGE' || effectiveFormat === 'THUMBNAIL'
      const outputFormat = (
        options.output_format ||
        (isImageOrThumb ? (effectiveQuality || 'Original').toLowerCase() : 'original')
      ).toLowerCase()

      const downloadInit = await startDownloadJob(url.trim(), effectiveFormat, effectiveQuality, {
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
    <section className="analyze-section" style={{ position: 'relative' }}>
      {/* Overlays for Persona Signature Transitions */}
      <SlashTransition active={slashActive} onComplete={() => setSlashActive(false)} />
      <ImpactFlash trigger={impactTrigger} />

      <p className="sr-only" role="status">{announcement}</p>
      <form onSubmit={analyze} noValidate className="analyze-form">
        <div className="url-field p5-url-field">
          <span className="url-input-icon" aria-hidden="true">
            {isReady && <span className="url-valid-check" style={{ color: 'var(--accent-cyan)' }}>✓</span>}
          </span>
          <input
            className="pixel-input p5-url-input"
            type="url"
            value={url}
            onChange={event => updateUrl(event.target.value)}
            disabled={busy}
            aria-label="Media URL"
            aria-describedby={phase === 'error' ? 'url-error' : 'url-hint'}
            aria-invalid={errorKind === 'invalid'}
            placeholder="Paste your media URL..."
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
            <span className="paste-text font-display" style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>PASTE</span>
          </button>
          {clipboardWarning && (
            <span
              className="kinetic-cursor-badge"
              style={{
                position: 'absolute',
                top: '-1.85rem',
                right: '0',
                background: 'var(--p5-red)',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                zIndex: 20,
              }}
            >
              ↳ CLIPBOARD LOCKED // PASTE MANUALLY
            </span>
          )}
        </div>

        {phase === 'error' ? (
          <div id="url-error" className="error-card pixel-border p5-error-panel" role="alert">
            <div className="p5-hazard-strip" aria-hidden="true" />
            <div className="p5-error-content">
              <strong className="p5-error-code font-display">{errors[errorKind]?.[0] || 'ERROR'}</strong>
              <p className="p5-error-desc">{errors[errorKind]?.[1] || 'Something went wrong.'}</p>
              <button
                type="button"
                onClick={reset}
                className="p5-analyze-btn"
                style={{ width: 'auto', padding: '0.45rem 1.25rem', fontSize: '1.05rem', marginTop: '0.5rem' }}
              >
                <span className="p5-analyze-btn-inner">TRY AGAIN // ESC</span>
              </button>
            </div>
          </div>
        ) : (
          <p id="url-hint" className="url-hint" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--p5-gray)', letterSpacing: '0.04em' }}>
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

        <div className="analyze-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <MagneticButton
            type="submit"
            disabled={busy}
            badgeText={isReady ? 'STRIKE // 01' : 'INPUT REQUIRED'}
            className="pixel-btn pixel-btn--full analyze-btn p5-analyze-btn"
            style={{ width: '100%' }}
          >
            <span className="p5-analyze-btn-inner">
              <span className="btn-star pixel-star-twinkle" aria-hidden="true">✦</span>
              <GlitchText
                text={
                  phase === 'analyzing'
                    ? 'ANALYZING...'
                    : phase === 'preparing' || phase === 'downloading' || phase === 'processing'
                    ? 'DOWNLOADING...'
                    : 'ANALYZE'
                }
                className="font-display"
                triggerKey={phase}
              />
              <span className="btn-star pixel-star-twinkle" aria-hidden="true">✦</span>
            </span>
          </MagneticButton>
          {(url || phase !== 'idle') && <button className="clear-btn font-display" style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }} type="button" onClick={reset}>Clear</button>}
        </div>
      </form>

      {/* Kinetic Staged Analyzing Scene (Replaces spinner, maintains state-card & pixel-border for test compatibility) */}
      {phase === 'analyzing' && (
        <div className="state-card pixel-border p5-analyzing-panel" style={{ marginTop: '1.5rem' }}>
          <HalftoneLayer opacity={0.06} dotColor="#E20B17" />
          <div className="p5-analyzing-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <p className="p5-analyzing-title font-display">
                ANALYZING LINK...
              </p>
              <span className="p5-analyzing-badge font-display">PHASE 8.8</span>
            </div>
            <button
              type="button"
              onClick={handleAbort}
              className="p5-analyzing-abort-btn"
              aria-label="Abort analysis"
            >
              [ ABORT // 00 ]
            </button>
          </div>

          <div className="p5-stepper">
            <div className={`p5-step-item ${analyzingStep > 1 ? 'p5-step-item--done' : analyzingStep === 1 ? 'p5-step-item--active' : 'p5-step-item--pending'}`}>
              <span>01 PARSING URL PROTOCOL</span>
              <span className={`p5-step-marker ${analyzingStep === 1 ? 'p5-step-marker--active' : ''}`}>
                {analyzingStep > 1 ? '✓' : analyzingStep === 1 ? '...' : '○'}
              </span>
            </div>
            <div className={`p5-step-item ${analyzingStep > 2 ? 'p5-step-item--done' : analyzingStep === 2 ? 'p5-step-item--active' : 'p5-step-item--pending'}`}>
              <span>02 SCANNING TARGET PLATFORM</span>
              <span className={`p5-step-marker ${analyzingStep === 2 ? 'p5-step-marker--active' : ''}`}>
                {analyzingStep > 2 ? '✓' : analyzingStep === 2 ? '...' : '○'}
              </span>
            </div>
            <div className={`p5-step-item ${analyzingStep > 3 ? 'p5-step-item--done' : analyzingStep === 3 ? 'p5-step-item--active' : 'p5-step-item--pending'}`}>
              <span>03 EXTRACTING MEDIA STREAMS</span>
              <span className={`p5-step-marker ${analyzingStep === 3 ? 'p5-step-marker--active' : ''}`}>
                {analyzingStep > 3 ? '✓' : analyzingStep === 3 ? '...' : '○'}
              </span>
            </div>
            <div className={`p5-step-item ${analyzingStep === 4 ? 'p5-step-item--active' : 'p5-step-item--pending'}`}>
              <span>04 BUILDING KINETIC RESULT</span>
              <span className={`p5-step-marker ${analyzingStep === 4 ? 'p5-step-marker--active' : ''}`}>
                {analyzingStep === 4 ? '...' : '○'}
              </span>
            </div>
          </div>

          {/* Progress & Scanning Bar (Preserves activity-bar class for test assertions) */}
          <div className="p5-analyzing-progress-bar activity-bar" aria-hidden="true">
            <span
              className="p5-analyzing-progress-fill"
              style={{ width: `${Math.min(100, analyzingStep * 25)}%` }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--p5-gray)', transform: 'skewX(2deg)', marginTop: '0.25rem' }}>
            <span>URL: {url.slice(0, 32)}{url.length > 32 ? '...' : ''}</span>
            <span>{analyzingStep * 25}%</span>
          </div>
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
          onCancelJob={cancelActiveDownload}
          onClear={reset}
        />
      )}
    </section>
  )
}
