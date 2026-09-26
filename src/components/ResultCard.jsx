import { useState, useEffect } from 'react'
import { Download, Image, Music, Video } from 'lucide-react'
import { getFileDownloadUrl } from '../api/downloadMedia'

const FORMAT_DEFS = {
  MP3:       { icon: Music, heading: 'AUDIO QUALITY',     choices: ['Best', '320 kbps', '192 kbps', '128 kbps'], initial: 'Best',     availKey: 'audio',     theme: 'audio', optionClass: 'result-option--pink'  },
  VIDEO:     { icon: Video, heading: 'VIDEO QUALITY',     choices: ['720p', '1080p', 'Best'],                    initial: 'Best',     availKey: 'video',     theme: 'video', optionClass: 'result-option--purple' },
  IMAGE:     { icon: Image, heading: 'IMAGE FORMAT',      choices: ['Original', 'JPG', 'PNG'],                    initial: 'Original', availKey: 'image',     theme: 'image', optionClass: 'result-option--cyan'   },
  THUMBNAIL: { icon: Image, heading: 'THUMBNAIL FORMAT',  choices: ['Original', 'JPG', 'PNG'],                    initial: 'Original', availKey: 'thumbnail', theme: 'image', optionClass: 'result-option--cyan'   },
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
  platform,
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

  const [imageIndex, setImageIndex] = useState(0)
  const isGallery = media.media_type === 'gallery'
  const images = media.images || []
  const totalImages = media.image_count || images.length || 1
  const currentImage = images[imageIndex] || { url: media.thumbnail }

  useEffect(() => {
    if (!isGallery || totalImages <= 1) return
    const handleKeyDown = e => {
      if (e.key === 'ArrowLeft') {
        setImageIndex(i => (i > 0 ? i - 1 : totalImages - 1))
      } else if (e.key === 'ArrowRight') {
        setImageIndex(i => (i < totalImages - 1 ? i + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGallery, totalImages])

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
  const displayPlatform = platform || (media.media_type ?? media.type ?? 'MEDIA').toUpperCase()
  const themeKey = FORMAT_DEFS[format]?.theme || 'video'

  return (
    <section className="result-section" aria-label="Analysis result" style={{ position: 'relative' }}>
      <div className="card-decorations" aria-hidden="true">
        <span className="card-star card-star--top pixel-star-twinkle">✦</span>
        <span className="card-dot card-dot--bottom">▪</span>
      </div>
      <p className="result-heading" ref={headingRef}>
        {phase === 'result' ? 'RESULT' : isWorking ? 'DOWNLOADING' : 'FILE READY'}
      </p>
      <div
        className={`result-card pixel-border-layered result-card--${themeKey}`}
        data-format-theme={themeKey}
      >
        {/* Large 16:9 Thumbnail Hero or Bounded Gallery Carousel */}
        <div
          className={`result-thumbnail-hero${isGallery ? ' gallery-hero' : ''}`}
          role="img"
          aria-label={isGallery ? `Photo ${imageIndex + 1} of ${totalImages}` : 'Media cover image'}
        >
          {isGallery && currentImage?.url ? (
            <img
              src={currentImage.url}
              alt=""
              className="result-hero-img"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : media.thumbnail ? (
            <img
              src={media.thumbnail}
              alt=""
              className="result-hero-img"
              style={{
                width: '100%',
                height: '100%',
                objectFit: media.media_type === 'image' ? 'contain' : 'cover',
              }}
            />
          ) : media.media_type === 'audio' ? (
            <div className="audio-placeholder">
              <Music size={44} strokeWidth={1.5} aria-hidden="true" />
              <span className="audio-placeholder-label">AUDIO TRACK</span>
            </div>
          ) : (
            <div className="image-placeholder">
              <Image size={44} strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Gallery Carousel Navigation Dock */}
        {isGallery && totalImages > 1 && (
          <div className="carousel-dock" aria-label="Photo gallery navigation">
            <button
              type="button"
              className="pixel-btn carousel-nav-btn"
              aria-label="Previous image"
              onClick={() => setImageIndex(i => (i > 0 ? i - 1 : totalImages - 1))}
            >
              &lt;
            </button>
            <span className="carousel-counter" aria-live="polite">
              {imageIndex + 1} / {totalImages}
            </span>
            <button
              type="button"
              className="pixel-btn carousel-nav-btn"
              aria-label="Next image"
              onClick={() => setImageIndex(i => (i < totalImages - 1 ? i + 1 : 0))}
            >
              &gt;
            </button>
          </div>
        )}

        {/* Media Title & Metadata Hierarchy */}
        <div className="result-info">
          <h2 className="result-title">{media.title}</h2>
          <div className="result-meta-bar">
            <p className="result-meta">
              {displayPlatform} • {isGallery ? `${totalImages} ${totalImages === 1 ? 'IMAGE' : 'IMAGES'}` : mediaDuration(media.duration)}
            </p>
            <span className="detected-badge" aria-label="Media detected">
              <span className="detected-dot" aria-hidden="true">●</span> DETECTED
            </span>
          </div>
        </div>

        {phase === 'result' ? (
          <>
            <fieldset className="result-fieldset">
              <legend>FORMAT</legend>
              <div className="result-options">
                {visibleFormats.map(([name, { icon: Icon, optionClass }]) => (
                  <button
                    key={name}
                    className={`result-option ${optionClass || ''}${format === name ? ' result-option--active' : ''}`}
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
                {FORMAT_DEFS[format]?.choices.map(choice => {
                  const isBest = choice.toLowerCase() === 'best'
                  const isOriginal = choice.toLowerCase() === 'original'
                  const isStarChoice = isBest || isOriginal
                  return (
                    <button
                      key={choice}
                      className={`result-option ${isStarChoice ? 'result-option--best' : ''}${quality === choice ? ' result-option--active' : ''}`}
                      type="button"
                      aria-label={isBest ? 'Best quality (Recommended)' : isOriginal ? 'Original (Recommended)' : choice}
                      aria-pressed={quality === choice}
                      onClick={() => onQualityChange(choice)}
                    >
                      {isBest && <span aria-hidden="true">★ </span>}
                      {choice}
                      {isOriginal && <span aria-hidden="true"> ★</span>}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {isGallery ? (
              totalImages > 1 ? (
                <div className="gallery-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                  <button
                    className={`pixel-btn pixel-btn--full download-cta download-cta--${themeKey}`}
                    type="button"
                    onClick={() => onDownload?.({ output_format: quality.toLowerCase(), image_index: imageIndex, download_all: false })}
                  >
                    <Download size={18} aria-hidden="true" />
                    CURRENT IMAGE
                  </button>
                  <button
                    className="pixel-btn pixel-btn--full download-cta download-cta--zip"
                    type="button"
                    onClick={() => onDownload?.({ output_format: quality.toLowerCase(), download_all: true })}
                  >
                    <Download size={18} aria-hidden="true" />
                    ALL IMAGES (.ZIP)
                  </button>
                </div>
              ) : (
                <button
                  className={`pixel-btn pixel-btn--full download-cta download-cta--${themeKey}`}
                  type="button"
                  onClick={() => onDownload?.({ output_format: quality.toLowerCase(), image_index: 0, download_all: false })}
                >
                  <Download size={18} aria-hidden="true" />
                  DOWNLOAD IMAGE
                </button>
              )
            ) : (
              <button
                className={`pixel-btn pixel-btn--full download-cta download-cta--${themeKey}`}
                type="button"
                onClick={() => onDownload?.({
                  output_format: (format === 'THUMBNAIL' || format === 'IMAGE') ? quality.toLowerCase() : 'original',
                })}
              >
                <Download size={18} aria-hidden="true" />
                DOWNLOAD {format}
              </button>
            )}
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
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem', textAlign: 'center' }}>
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
                <div className="file-info-box pixel-border-sm">
                  {job?.filename && <p className="file-info-name">{job.filename}</p>}
                  <p className="file-info-meta">
                    {formatBytes(job?.file_size)} • Expires in 30 minutes
                  </p>
                </div>

                {job?.file_id ? (
                  <a
                    className="pixel-btn pixel-btn--full download-cta download-file-btn"
                    href={getFileDownloadUrl(job.file_id)}
                    download={job.filename || true}
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                  >
                    <Download size={18} aria-hidden="true" />
                    DOWNLOAD FILE
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
