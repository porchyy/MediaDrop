import { useState, useEffect } from 'react'
import { Download, Image, Music, Video, Sparkles, Maximize2 } from 'lucide-react'
import { getFileDownloadUrl } from '../api/downloadMedia'
import MagneticButton from './kinetic/MagneticButton'
import GlitchText from './kinetic/GlitchText'
import StatusTag from './kinetic/StatusTag'
import HalftoneLayer from './kinetic/HalftoneLayer'
import LightboxModal from './kinetic/LightboxModal'

const FORMAT_DEFS = {
  MP3:       { icon: Music, heading: 'AUDIO QUALITY',     sublabel: 'AUDIO STREAM', choices: ['Best', '320 kbps', '192 kbps', '128 kbps'], initial: 'Best',     availKey: 'audio',     theme: 'audio', optionClass: 'result-option--pink'  },
  VIDEO:     { icon: Video, heading: 'VIDEO QUALITY',     sublabel: 'MP4 / WEBM',    choices: ['720p', '1080p', 'Best'],                    initial: 'Best',     availKey: 'video',     theme: 'video', optionClass: 'result-option--purple' },
  IMAGE:     { icon: Image, heading: 'IMAGE FORMAT',      sublabel: 'PHOTO / ART',   choices: ['Original', 'JPG', 'PNG'],                    initial: 'Original', availKey: 'image',     theme: 'image', optionClass: 'result-option--cyan'   },
  THUMBNAIL: { icon: Image, heading: 'THUMBNAIL FORMAT',  sublabel: 'COVER ART',     choices: ['Original', 'JPG', 'PNG'],                    initial: 'Original', availKey: 'thumbnail', theme: 'image', optionClass: 'result-option--cyan'   },
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
  onCancelJob,
  onClear,
}) {
  const availableKeys = media.available_formats ?? ['video', 'audio', 'image']
  const visibleFormats = Object.entries(FORMAT_DEFS).filter(
    ([, def]) => availableKeys.includes(def.availKey),
  )

  const [imageIndex, setImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const isGallery = media.media_type === 'gallery'
  const items = media.items || media.images || []
  const totalItems = media.image_count || items.length || 1
  const currentItem = items[imageIndex] || { url: media.thumbnail, type: 'image' }
  const isCurrentVideo = isGallery && currentItem?.type === 'video'
  const photosCount = items.filter(it => it.type === 'image' || !it.type).length || (isGallery ? totalItems : 1)
  const videosCount = items.filter(it => it.type === 'video').length
  const isMixed = photosCount > 0 && videosCount > 0

  useEffect(() => {
    if (!isGallery || totalItems <= 1) return
    const handleKeyDown = e => {
      if (isLightboxOpen) return // Handled by Lightbox
      if (e.key === 'ArrowLeft') {
        setImageIndex(i => (i > 0 ? i - 1 : totalItems - 1))
      } else if (e.key === 'ArrowRight') {
        setImageIndex(i => (i < totalItems - 1 ? i + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGallery, totalItems, isLightboxOpen])

  const isWorking = phase === 'preparing' || phase === 'downloading' || phase === 'processing'
  const isPackagingZip = (format === 'IMAGE' || isGallery) && (phase === 'processing' || job?.status === 'processing')
  const stateTitle = isPackagingZip
    ? `PACKAGING ${photosCount} PHOTOS INTO .ZIP // ARCHIVING`
    : phase === 'downloading'
    ? 'DOWNLOADING...'
    : phase === 'processing'
    ? 'PROCESSING FILE...'
    : phase === 'preparing'
    ? 'PREPARING FILE...'
    : 'FILE READY'

  const progressPercent = job?.progress
  const downloadedMb = job?.downloaded_bytes ? formatBytes(job.downloaded_bytes) : null
  const displayPlatform = (media.platform || platform || (media.media_type ?? media.type ?? 'MEDIA')).toUpperCase()
  const themeKey = FORMAT_DEFS[format]?.theme || 'video'

  // Items for lightbox
  const lightboxItems = isGallery && items.length > 0
    ? items
    : media.thumbnail
    ? [{ url: media.thumbnail, type: media.media_type === 'video' ? 'video' : 'image' }]
    : []

  return (
    <section className="result-section p5-result-container" aria-label="Analysis result" style={{ position: 'relative' }}>
      <div className="card-decorations" aria-hidden="true" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span className="card-star card-star--top pixel-star-twinkle" style={{ color: 'var(--p5-red)' }}>✦</span>
        <span className="card-dot card-dot--bottom" style={{ color: 'var(--p5-gray)' }}>▪</span>
      </div>

      <p className="result-heading font-display" ref={headingRef} style={{ fontSize: '1.4rem', letterSpacing: '0.08em', color: 'var(--p5-white)', margin: '0 0 0.5rem' }}>
        <GlitchText
          text={phase === 'result' ? 'RESULT' : isWorking ? 'DOWNLOADING' : 'FILE READY'}
          triggerKey={phase}
        />
      </p>

      <div
        className={`result-card pixel-border-layered result-card--${themeKey} p5-result-card`}
        data-format-theme={themeKey}
      >
        <HalftoneLayer opacity={0.05} dotColor="#E20B17" />

        {/* Counter-Skew Inner Container to Protect Media Viewport */}
        <div className="p5-result-inner" style={{ padding: '1.25rem' }}>

          {/* Media Viewport (Aspect ratio preserved, counter-skewed to 0deg, clickable for Lightbox) */}
          <div
            className={`result-thumbnail-hero${isGallery ? ' gallery-hero' : ''} p5-media-viewport`}
            role="img"
            aria-label={isGallery ? `Photo ${imageIndex + 1} of ${totalItems}` : 'Media cover image'}
            onClick={() => lightboxItems.length > 0 && setIsLightboxOpen(true)}
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '0px',
              overflow: 'hidden',
              cursor: lightboxItems.length > 0 ? 'pointer' : 'default',
            }}
            title={lightboxItems.length > 0 ? 'Click to expand in high-res lightbox' : ''}
          >
            {isGallery && currentItem?.url ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  src={currentItem.url}
                  alt=""
                  className="result-hero-img"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transform: 'skewX(0deg)',
                  }}
                />
                {isCurrentVideo && (
                  <div
                    className="video-badge-overlay"
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.85)',
                      border: '2px solid var(--accent-purple, #9D63FF)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      padding: '0.2rem 0.5rem',
                      fontFamily: 'monospace',
                      letterSpacing: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      zIndex: 2,
                    }}
                  >
                    <Video size={14} aria-hidden="true" />
                    <span>VIDEO</span>
                  </div>
                )}
                {/* Lightbox Expand Hint */}
                <div
                  className="lightbox-expand-hint"
                  style={{
                    position: 'absolute',
                    bottom: '0.65rem',
                    right: '0.65rem',
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid var(--p5-red)',
                    color: '#fff',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    zIndex: 2,
                  }}
                >
                  <Maximize2 size={12} />
                  <span>EXPAND</span>
                </div>
              </div>
            ) : media.thumbnail ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  src={media.thumbnail}
                  alt=""
                  className="result-hero-img"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: media.media_type === 'image' ? 'contain' : 'cover',
                    transform: 'skewX(0deg)',
                  }}
                />
                <div
                  className="lightbox-expand-hint"
                  style={{
                    position: 'absolute',
                    bottom: '0.65rem',
                    right: '0.65rem',
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid var(--p5-red)',
                    color: '#fff',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    zIndex: 2,
                  }}
                >
                  <Maximize2 size={12} />
                  <span>EXPAND</span>
                </div>
              </div>
            ) : media.media_type === 'audio' ? (
              <div className="audio-placeholder" style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <Music size={44} strokeWidth={1.5} color="var(--accent-pink)" aria-hidden="true" />
                <span className="audio-placeholder-label font-display" style={{ fontSize: '1.1rem', letterSpacing: '0.08em', color: '#fff' }}>AUDIO TRACK</span>
              </div>
            ) : (
              <div className="image-placeholder" style={{ padding: '3rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image size={44} strokeWidth={1.5} color="var(--accent-cyan)" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Gallery Carousel Navigation Dock */}
          {isGallery && totalItems > 1 && (
            <div className="carousel-dock" aria-label="Photo gallery navigation" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="pixel-btn carousel-nav-btn font-display"
                aria-label="Previous image"
                onClick={e => {
                  e.stopPropagation()
                  setImageIndex(i => (i > 0 ? i - 1 : totalItems - 1))
                }}
              >
                &lt;
              </button>
              <span className="carousel-counter font-display" aria-live="polite" style={{ fontSize: '1.05rem' }}>
                {imageIndex + 1} / {totalItems}
              </span>
              <button
                type="button"
                className="pixel-btn carousel-nav-btn font-display"
                aria-label="Next image"
                onClick={e => {
                  e.stopPropagation()
                  setImageIndex(i => (i < totalItems - 1 ? i + 1 : 0))
                }}
              >
                &gt;
              </button>
            </div>
          )}

          {/* Media Title & Metadata Hierarchy */}
          <div className="result-info" style={{ marginTop: '1rem' }}>
            <h2 className="result-title font-display" style={{ fontSize: '1.65rem', lineHeight: 1.1, color: '#ffffff', letterSpacing: '0.03em', margin: '0 0 0.5rem' }}>
              {media.title}
            </h2>
            <div className="result-meta-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
              <p className="result-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--p5-gray)', margin: 0 }}>
                {displayPlatform} • {
                  displayPlatform === 'INSTAGRAM'
                    ? (totalItems === 1 || media.media_type === 'image'
                        ? 'PHOTO'
                        : `CAROUSEL • ${totalItems} ${isMixed ? 'ITEMS' : 'PHOTOS'}`)
                    : (isGallery
                        ? `${totalItems} ${totalItems === 1 ? 'IMAGE' : 'IMAGES'}`
                        : mediaDuration(media.duration))
                }
              </p>
              <span className="detected-badge" aria-label="Media detected" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#1c1c1c', border: '1px solid var(--p5-red)', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#fff' }}>
                <span className="detected-dot" aria-hidden="true" style={{ color: 'var(--p5-red)' }}>●</span> DETECTED
              </span>
            </div>
          </div>

          {phase === 'result' ? (
            <>
              {/* Oversized Format Selector Grid */}
              <fieldset className="result-fieldset" style={{ border: 'none', padding: 0, margin: '1rem 0 0.5rem' }}>
                <legend className="font-display" style={{ fontSize: '1.15rem', color: 'var(--p5-white)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  FORMAT
                </legend>
                <div className="result-options p5-format-grid" style={{ margin: 0 }}>
                  {visibleFormats.map(([name, { icon: Icon, optionClass, sublabel, theme }]) => {
                    const isActive = format === name
                    return (
                      <button
                        key={name}
                        className={`result-option ${optionClass || ''} p5-format-option ${isActive ? 'result-option--active p5-format-option--active p5-format-option--active-' + theme : ''}`}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onFormatChange(name, FORMAT_DEFS[name].initial)}
                      >
                        <div className="p5-format-option-inner">
                          <Icon size={20} aria-hidden="true" />
                          <span className="format-name font-display">{name}</span>
                          <span className="format-desc">{sublabel}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              {/* Quality Options Selection */}
              {!isCurrentVideo && (
                <fieldset className="result-fieldset" style={{ border: 'none', padding: 0, margin: '1rem 0' }}>
                  <legend className="font-display" style={{ fontSize: '1.15rem', color: 'var(--p5-white)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    {FORMAT_DEFS[format]?.heading || 'QUALITY'}
                  </legend>
                  <div className="result-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {FORMAT_DEFS[format]?.choices.map(choice => {
                      const isBest = choice.toLowerCase() === 'best'
                      const isOriginal = choice.toLowerCase() === 'original'
                      const isStarChoice = isBest || isOriginal
                      const isActive = quality === choice
                      return (
                        <button
                          key={choice}
                          className={`result-option ${isStarChoice ? 'result-option--best' : ''}${isActive ? ' result-option--active' : ''}`}
                          type="button"
                          aria-label={isBest ? 'Best quality (Recommended)' : isOriginal ? 'Original (Recommended)' : choice}
                          aria-pressed={isActive}
                          onClick={() => onQualityChange(choice)}
                          style={{
                            background: isActive ? '#200507' : '#141414',
                            border: `2px solid ${isActive ? 'var(--p5-red)' : '#333'}`,
                            color: '#fff',
                            padding: '0.45rem 0.85rem',
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.05rem',
                            letterSpacing: '0.06em',
                            cursor: 'pointer',
                            transform: 'skewX(-4deg)',
                            boxShadow: isActive ? '3px 3px 0 var(--p5-red)' : '2px 2px 0 #000',
                          }}
                        >
                          <span style={{ transform: 'skewX(4deg)', display: 'inline-block' }}>
                            {isBest && <span aria-hidden="true" style={{ color: 'var(--p5-red)' }}>★ </span>}
                            {choice}
                            {isOriginal && <span aria-hidden="true" style={{ color: 'var(--p5-red)' }}> ★</span>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )}

              {/* Dynamic Action Buttons with Magnetic Pull */}
              {isGallery ? (
                totalItems > 1 ? (
                  <div className="gallery-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                    {isCurrentVideo ? (
                      <MagneticButton
                        badgeText="EXTRACT // VIDEO"
                        className="pixel-btn pixel-btn--full download-cta download-cta--video p5-analyze-btn"
                        style={{ width: '100%', background: 'var(--accent-purple)', borderColor: '#fff' }}
                        onClick={() => onDownload?.({ format: 'video', quality: 'Best', output_format: 'original', image_index: imageIndex, download_all: false })}
                      >
                        <span className="p5-analyze-btn-inner">
                          <Video size={18} aria-hidden="true" />
                          DOWNLOAD VIDEO
                        </span>
                      </MagneticButton>
                    ) : (
                      <MagneticButton
                        badgeText="EXTRACT // IMAGE"
                        className={`pixel-btn pixel-btn--full download-cta download-cta--${themeKey} p5-analyze-btn`}
                        style={{ width: '100%' }}
                        onClick={() => onDownload?.({ output_format: quality.toLowerCase(), image_index: imageIndex, download_all: false })}
                      >
                        <span className="p5-analyze-btn-inner">
                          <Download size={18} aria-hidden="true" />
                          CURRENT IMAGE
                        </span>
                      </MagneticButton>
                    )}
                    {photosCount > 1 && (
                      <MagneticButton
                        badgeText="BUNDLE // ZIP"
                        className="pixel-btn pixel-btn--full download-cta download-cta--zip p5-analyze-btn"
                        style={{ width: '100%', background: 'var(--accent-cyan)', color: '#000', borderColor: '#fff' }}
                        onClick={() => onDownload?.({ output_format: quality.toLowerCase(), download_all: true })}
                      >
                        <span className="p5-analyze-btn-inner">
                          <Download size={18} aria-hidden="true" />
                          {isMixed ? `ALL IMAGES (${photosCount} PHOTOS .ZIP)` : 'ALL IMAGES (.ZIP)'}
                        </span>
                      </MagneticButton>
                    )}
                    {isMixed && photosCount > 1 && (
                      <p className="mixed-media-note" style={{ fontSize: '0.8rem', color: 'var(--p5-gray)', textAlign: 'center', marginTop: '-0.25rem', fontFamily: 'monospace' }}>
                        ℹ Contains {photosCount} photos ({videosCount} {videosCount === 1 ? 'video' : 'videos'} excluded from ZIP)
                      </p>
                    )}
                  </div>
                ) : (
                  isCurrentVideo ? (
                    <MagneticButton
                      badgeText="GET // VIDEO"
                      className="pixel-btn pixel-btn--full download-cta download-cta--video p5-analyze-btn"
                      style={{ width: '100%', background: 'var(--accent-purple)' }}
                      onClick={() => onDownload?.({ format: 'video', quality: 'Best', output_format: 'original', image_index: 0, download_all: false })}
                    >
                      <span className="p5-analyze-btn-inner">
                        <Video size={18} aria-hidden="true" />
                        DOWNLOAD VIDEO
                      </span>
                    </MagneticButton>
                  ) : (
                    <MagneticButton
                      badgeText="GET // IMAGE"
                      className={`pixel-btn pixel-btn--full download-cta download-cta--${themeKey} p5-analyze-btn`}
                      style={{ width: '100%' }}
                      onClick={() => onDownload?.({ output_format: quality.toLowerCase(), image_index: 0, download_all: false })}
                    >
                      <span className="p5-analyze-btn-inner">
                        <Download size={18} aria-hidden="true" />
                        DOWNLOAD IMAGE
                      </span>
                    </MagneticButton>
                  )
                )
              ) : (
                <MagneticButton
                  badgeText={`GET // ${format}`}
                  className={`pixel-btn pixel-btn--full download-cta download-cta--${themeKey} p5-analyze-btn`}
                  style={{ width: '100%' }}
                  onClick={() => onDownload?.({
                    output_format: (format === 'THUMBNAIL' || format === 'IMAGE') ? quality.toLowerCase() : 'original',
                  })}
                >
                  <span className="p5-analyze-btn-inner">
                    <Download size={18} aria-hidden="true" />
                    DOWNLOAD {format}
                  </span>
                </MagneticButton>
              )}
            </>
          ) : (
            <div className="result-finish" style={{ marginTop: '1rem', textAlign: 'center' }}>
              <p className="result-state-title font-display" style={{ fontSize: '1.85rem', letterSpacing: '0.08em', color: 'var(--p5-red)', margin: '0 0 0.25rem' }}>
                <GlitchText text={stateTitle} triggerKey={stateTitle} />
              </p>
              <p className="result-summary" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--p5-gray)', margin: 0 }}>
                {format} · {quality}
              </p>

              {isWorking && (
                <div style={{ marginTop: '1rem', width: '100%' }}>
                  <div className="activity-bar" aria-hidden="true" style={{ height: '8px', background: '#1c1c1c', overflow: 'hidden' }}>
                    <span style={{
                      display: 'block',
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--p5-red), #ff3d48)',
                      width: progressPercent != null ? `${progressPercent}%` : '50%',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--p5-gray)', marginTop: '0.5rem', textAlign: 'center', fontFamily: 'monospace' }}>
                    {progressPercent != null
                      ? `${progressPercent}%`
                      : downloadedMb
                      ? `${downloadedMb} downloaded`
                      : 'Starting transfer...'}
                  </p>

                  {/* Tactical In-Progress Abort Button */}
                  {onCancelJob && (
                    <button
                      type="button"
                      onClick={onCancelJob}
                      className="p5-analyzing-abort-btn font-display"
                      style={{ marginTop: '0.75rem', fontSize: '1rem', padding: '0.35rem 1rem' }}
                    >
                      [ CANCEL DOWNLOAD // 00 ]
                    </button>
                  )}
                </div>
              )}

              {phase === 'success' && (
                <div style={{ marginTop: '1.25rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="file-info-box pixel-border-sm" style={{ background: '#121212', border: '2px solid #34d399', padding: '0.85rem', boxShadow: '3px 3px 0 #000' }}>
                    {job?.filename && (
                      <p className="file-info-name font-display" style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 0.25rem' }}>
                        {job.filename}
                      </p>
                    )}
                    <p className="file-info-meta" style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#34d399', margin: 0 }}>
                      {formatBytes(job?.file_size)} • Expires in 30 minutes
                    </p>
                  </div>

                  {job?.file_id ? (
                    <a
                      className="pixel-btn pixel-btn--full download-cta download-file-btn p5-analyze-btn"
                      href={getFileDownloadUrl(job.file_id)}
                      download={job.filename || true}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem',
                        background: '#059669',
                        borderColor: '#34d399',
                        boxShadow: '4px 4px 0 #000, 7px 7px 0 #047857',
                      }}
                    >
                      <span className="p5-analyze-btn-inner">
                        <Download size={18} aria-hidden="true" />
                        DOWNLOAD FILE
                      </span>
                    </a>
                  ) : null}

                  <button
                    className="clear-btn font-display"
                    type="button"
                    onClick={onClear}
                    style={{
                      fontSize: '1.15rem',
                      color: 'var(--p5-white)',
                      background: '#161616',
                      border: '1px solid var(--p5-red)',
                      padding: '0.5rem 1.25rem',
                      cursor: 'pointer',
                      marginTop: '0.5rem',
                      transform: 'skewX(-4deg)',
                      boxShadow: '3px 3px 0 #000',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span style={{ transform: 'skewX(4deg)' }}>
                      EXTRACT ANOTHER LINK // <span style={{ color: 'var(--p5-red)' }}>New Link</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* High-Resolution Interactive Media Lightbox Modal */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        items={lightboxItems}
        currentIndex={imageIndex}
        onIndexChange={setImageIndex}
        title={media.title}
      />
    </section>
  )
}
