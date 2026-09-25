import { Download, Image, Music, Video } from 'lucide-react'
import { getFileDownloadUrl } from '../api/downloadMedia'

const FORMAT_DEFS = {
  MP3:       { icon: Music, heading: 'AUDIO QUALITY',     choices: ['Best', '320 kbps', '192 kbps', '128 kbps'], initial: 'Best',     availKey: 'audio'     },
  VIDEO:     { icon: Video, heading: 'VIDEO QUALITY',     choices: ['720p', '1080p', 'Best'],                    initial: 'Best',     availKey: 'video'     },
  IMAGE:     { icon: Image, heading: 'IMAGE FORMAT',      choices: ['Original'],                                  initial: 'Original', availKey: 'image'     },
  THUMBNAIL: { icon: Image, heading: 'THUMBNAIL FORMAT',  choices: ['Original'],                                  initial: 'Original', availKey: 'thumbnail' },
}

const mediaDuration = seconds =>
  seconds === null
    ? '--:--'
    : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

const formatBytes = bytes => {
  if (!bytes || bytes <= 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

export default function ResultCard({
  phase,
  media,
  job,
  headingRef,
  format,
  quality,
  onFormatChange,
  onQualityChange,
  onDownload,
  onClear,
}) {
  const availableKeys = media.available_formats ?? ['video', 'audio', 'image']
  const visibleFormats = Object.entries(FORMAT_DEFS).filter(
    ([, def]) => availableKeys.includes(def.availKey),
  )

  const isWorking = phase === 'preparing' || phase === 'downloading' || phase === 'processing'
  const stateTitle =
    phase === 'downloading'
      ? 'DOWNLOADING...'
      : phase === 'processing'
      ? 'PROCESSING FILE...'
      : phase === 'preparing'
      ? 'PREPARING FILE...'
      : 'FILE READY'

  const progressPercent = job?.progress
  const downloadedMb = job?.downloaded_bytes ? formatBytes(job.downloaded_bytes) : null

  return (
    <section className="result-section" aria-label="Analysis result">
      <p className="result-heading" ref={headingRef}>
        {phase === 'result' ? 'RESULT' : isWorking ? 'DOWNLOADING' : 'FILE READY'}
      </p>
      <div className="result-card pixel-border">
        <span className="demo-badge">MEDIA READY</span>
        <div className="result-media">
          <div className="result-thumbnail" role="img" aria-label="Media cover image">
            {media.thumbnail
              ? <img src={media.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Image size={34} strokeWidth={1.5} aria-hidden="true" />}
          </div>
          <div>
            <h2 className="result-title">{media.title}</h2>
            <p className="result-meta">
              {mediaDuration(media.duration)} · {(media.media_type ?? media.type ?? '').toUpperCase()}
            </p>
          </div>
        </div>

        {phase === 'result' ? (
          <>
            <fieldset className="result-fieldset">
              <legend>FORMAT</legend>
              <div className="result-options">
                {visibleFormats.map(([name, { icon: Icon }]) => (
                  <button
                    key={name}
                    className={`result-option${format === name ? ' result-option--active' : ''}`}
                    type="button"
                    aria-pressed={format === name}
                    onClick={() => onFormatChange(name, FORMAT_DEFS[name].initial)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {name}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="result-fieldset">
              <legend>{FORMAT_DEFS[format]?.heading || 'QUALITY'}</legend>
              <div className="result-options">
                {FORMAT_DEFS[format]?.choices.map(choice => (
                  <button
                    key={choice}
                    className={`result-option${quality === choice ? ' result-option--active' : ''}`}
                    type="button"
                    aria-pressed={quality === choice}
                    onClick={() => onQualityChange(choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </fieldset>

            <button className="pixel-btn pixel-btn--full" type="button" onClick={onDownload}>
              <Download size={16} aria-hidden="true" />
              Download
            </button>
          </>
        ) : (
          <div className="result-finish">
            <p className="result-state-title">{stateTitle}</p>
            <p className="result-summary">{format} · {quality}</p>

            {isWorking && (
              <div style={{ marginTop: '0.75rem', width: '100%' }}>
                <div className="activity-bar" aria-hidden="true">
                  <span style={progressPercent != null ? { width: `${progressPercent}%`, transition: 'width 0.3s ease' } : {}} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.35rem', textAlign: 'center' }}>
                  {progressPercent != null
                    ? `${progressPercent}%`
                    : downloadedMb
                    ? `${downloadedMb} downloaded`
                    : 'Starting transfer...'}
                </p>
              </div>
            )}

            {phase === 'success' && (
              <div style={{ marginTop: '0.75rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-subtle, rgba(0,0,0,0.05))', borderRadius: '4px', fontSize: '0.8rem' }}>
                  {job?.filename && <p style={{ fontWeight: '600', wordBreak: 'break-all' }}>{job.filename}</p>}
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    {formatBytes(job?.file_size)} • Expires in 30 minutes
                  </p>
                </div>

                {job?.file_id ? (
                  <a
                    className="pixel-btn pixel-btn--full"
                    href={getFileDownloadUrl(job.file_id)}
                    download={job.filename || true}
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Download size={16} aria-hidden="true" />
                    Download File
                  </a>
                ) : null}

                <button className="clear-btn" type="button" onClick={onClear}>
                  New Link
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
