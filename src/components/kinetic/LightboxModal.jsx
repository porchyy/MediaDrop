import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Video, Image, Volume2, VolumeX } from 'lucide-react'
import HalftoneLayer from './HalftoneLayer'

/**
 * LightboxModal: Fullscreen tactical preview for single images and multi-image galleries.
 * Supports keyboard navigation (Arrow keys, Esc), mobile touch-swipe, and in-modal HTML5 video playback.
 */
export default function LightboxModal({
  isOpen = false,
  onClose,
  items = [],
  currentIndex = 0,
  onIndexChange,
  title = '',
}) {
  const [touchStart, setTouchStart] = useState(null)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef(null)

  const total = items.length || 1
  const currentItem = items[currentIndex] || { url: '', type: 'image' }
  const isVideo = currentItem?.type === 'video'

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        onClose?.()
      } else if (e.key === 'ArrowLeft' && total > 1) {
        onIndexChange?.(currentIndex > 0 ? currentIndex - 1 : total - 1)
      } else if (e.key === 'ArrowRight' && total > 1) {
        onIndexChange?.(currentIndex < total - 1 ? currentIndex + 1 : 0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, total, currentIndex, onIndexChange, onClose])

  // Mobile Touch Swipe Handling
  const handleTouchStart = e => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = e => {
    if (touchStart === null || total <= 1) return
    const touchEnd = e.changedTouches[0].clientX
    const distance = touchStart - touchEnd
    if (distance > 50) {
      // Swiped left -> next
      onIndexChange?.(currentIndex < total - 1 ? currentIndex + 1 : 0)
    } else if (distance < -50) {
      // Swiped right -> prev
      onIndexChange?.(currentIndex > 0 ? currentIndex - 1 : total - 1)
    }
    setTouchStart(null)
  }

  if (!isOpen) return null

  return (
    <div
      className="p5-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Media Preview Lightbox"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 8, 8, 0.92)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <HalftoneLayer opacity={0.05} dotColor="#E20B17" />

      {/* Main Lightbox Frame with Persona Skew */}
      <div
        className="p5-lightbox-card"
        style={{
          position: 'relative',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          background: '#101010',
          border: '2px solid var(--p5-red)',
          boxShadow: '8px 8px 0 #000000, 14px 14px 0 var(--p5-dark-red)',
          transform: 'skewX(-2deg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            background: '#161616',
            borderBottom: '2px solid var(--p5-dark-red)',
            transform: 'skewX(2deg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <span
              style={{
                background: isVideo ? 'var(--accent-purple)' : 'var(--p5-red)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                padding: '0.15rem 0.5rem',
                boxShadow: '2px 2px 0 #000',
              }}
            >
              {isVideo ? 'VIDEO' : 'IMAGE'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: '#ffffff',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title || 'MEDIA PREVIEW'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {total > 1 && (
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  color: 'var(--p5-white)',
                  letterSpacing: '0.08em',
                }}
              >
                {currentIndex + 1} / {total}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p5-lightbox-close-btn"
              aria-label="Close lightbox"
              style={{
                background: 'transparent',
                border: '1px solid var(--p5-red)',
                color: 'var(--p5-red)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.95rem',
                letterSpacing: '0.08em',
                padding: '0.25rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <X size={16} />
              <span>CLOSE</span>
            </button>
          </div>
        </div>

        {/* Media Viewport (Counter-skewed to 0deg to keep images and videos undistorted) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#050505',
            position: 'relative',
            minHeight: '300px',
            maxHeight: 'calc(90vh - 120px)',
            overflow: 'hidden',
            padding: '1rem',
          }}
        >
          {isVideo ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={videoRef}
                src={currentItem.url}
                controls
                autoPlay
                playsInline
                muted={isMuted}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 150px)',
                  objectFit: 'contain',
                  transform: 'skewX(0deg)',
                }}
              />
              <button
                type="button"
                onClick={() => setIsMuted(m => !m)}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  background: 'rgba(0,0,0,0.8)',
                  border: '1px solid var(--p5-red)',
                  color: '#fff',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          ) : currentItem?.url ? (
            <img
              src={currentItem.url}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 150px)',
                objectFit: 'contain',
                transform: 'skewX(0deg)',
                boxShadow: '0 0 20px rgba(0,0,0,0.8)',
              }}
            />
          ) : (
            <div style={{ color: 'var(--p5-gray)', fontFamily: 'monospace' }}>PREVIEW UNAVAILABLE</div>
          )}

          {/* Left Arrow Button */}
          {total > 1 && (
            <button
              type="button"
              onClick={() => onIndexChange?.(currentIndex > 0 ? currentIndex - 1 : total - 1)}
              aria-label="Previous media"
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#161616',
                border: '2px solid var(--p5-red)',
                color: '#fff',
                padding: '0.75rem 0.5rem',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #000',
                zIndex: 10,
              }}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Arrow Button */}
          {total > 1 && (
            <button
              type="button"
              onClick={() => onIndexChange?.(currentIndex < total - 1 ? currentIndex + 1 : 0)}
              aria-label="Next media"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#161616',
                border: '2px solid var(--p5-red)',
                color: '#fff',
                padding: '0.75rem 0.5rem',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #000',
                zIndex: 10,
              }}
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            padding: '0.5rem 1rem',
            background: '#141414',
            borderTop: '1px solid #222',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: 'var(--p5-gray)',
            transform: 'skewX(2deg)',
          }}
        >
          <span>KEYBOARD: [←/→] NAVIGATE • [ESC] CLOSE</span>
          <span>TOUCH: SWIPE LEFT / RIGHT</span>
        </div>
      </div>
    </div>
  )
}
