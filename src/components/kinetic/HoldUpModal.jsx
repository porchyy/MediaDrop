import { useEffect } from 'react'
import { X, ShieldAlert, Check } from 'lucide-react'
import { useKineticSound } from '../../hooks/useKineticSound'

/**
 * HoldUpModal: Authentic Persona 5 "HOLD UP!" negotiation confirmation modal.
 * Triggered for high-stakes payload confirmation before dispatching heavy downloads.
 */
export default function HoldUpModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'SHIBUYA VELOCITY HEIST',
  format = 'VIDEO',
  quality = 'Best',
  fileSize = null,
}) {
  const { playClick, playSlash, playSuccess } = useKineticSound()

  useEffect(() => {
    if (!isOpen) return
    playSlash()

    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        playClick()
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, playClick, playSlash])

  if (!isOpen) return null

  const handleConfirm = () => {
    playSuccess()
    onConfirm?.()
  }

  const handleCancel = () => {
    playClick()
    onClose?.()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hold Up Negotiation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Halftone dramatic dark backdrop */}
      <div
        onClick={handleCancel}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 5, 8, 0.88)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Slanted Persona 5 Negotiation Dialog Sheet */}
      <div
        className="p5-holdup-dialog p5-shadow-combo"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '36rem',
          background: '#0c0c0e',
          border: '4px solid #ffffff',
          padding: '1.75rem',
          transform: 'skewX(-2deg) rotate(-0.5deg)',
          animation: 'p5-text-punch 0.18s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        }}
      >
        {/* Top Jagged Ribbon Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '3px solid var(--p5-red)',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="font-display"
              style={{
                padding: '0.2rem 0.65rem',
                background: 'var(--p5-red)',
                color: '#ffffff',
                fontSize: '1.25rem',
                letterSpacing: '0.08em',
                transform: 'skewX(-6deg)',
                border: '2px solid #000',
              }}
            >
              HOLD UP!
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 900,
                color: '#ffea00',
                letterSpacing: '0.05em',
              }}
            >
              // HEIST NEGOTIATION
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              fontWeight: 900,
              color: 'var(--p5-red)',
              letterSpacing: '0.1em',
              marginBottom: '0.35rem',
            }}
          >
            REQUISITION AUTHORIZATION REQUIRED
          </div>

          <h3
            className="font-display"
            style={{
              fontSize: '1.85rem',
              color: '#ffffff',
              lineHeight: 1.15,
              margin: '0 0 0.5rem',
              letterSpacing: '0.03em',
            }}
          >
            CONFIRM EXTRACTION? <br />
            <span
              style={{
                color: 'var(--p5-red)',
                textDecoration: 'underline',
                textDecorationColor: '#ffea00',
                textDecorationThickness: '3px',
              }}
            >
              จะปล้นไฟล์นี้จริงดิ?!
            </span>
          </h3>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              color: 'var(--p5-gray)',
              lineHeight: 1.5,
              margin: '0.75rem 0',
            }}
          >
            เตรียมพื้นที่จัดเก็บข้อมูลเป้าหมาย: <strong style={{ color: '#ffea00' }}>{title}</strong> ({format} · {quality}) การดึงสตรีมตรงผ่านช่องทางเข้ารหัสพิเศษ Phantom Pipe พร้อมเริ่มทันที!
          </p>

          {/* Spec breakdown matrix */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              background: '#141416',
              border: '2px solid #333',
              padding: '0.75rem',
              fontFamily: 'monospace',
              marginTop: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--p5-gray)', display: 'block' }}>FORMAT</span>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>{format}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--p5-gray)', display: 'block' }}>QUALITY</span>
              <span style={{ fontSize: '0.85rem', color: '#ffea00', fontWeight: 'bold' }}>{quality}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--p5-gray)', display: 'block' }}>SIZE</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--p5-red)', fontWeight: 'bold' }}>{fileSize || 'CALCULATING'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--p5-gray)', display: 'block' }}>STATUS</span>
              <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 'bold' }}>ARMED</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '2px dashed #444',
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: '0.65rem 1rem',
              background: '#18181a',
              color: '#ffffff',
              border: '2px solid #ffffff',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: 'pointer',
              transform: 'skewX(-4deg)',
              boxShadow: '3px 3px 0 #000',
            }}
          >
            FALL BACK // ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="font-display"
            style={{
              padding: '0.65rem 1rem',
              background: 'var(--p5-red)',
              color: '#ffffff',
              border: '2px solid #000',
              fontSize: '1.2rem',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transform: 'skewX(-6deg)',
              boxShadow: '3px 3px 0 #ffffff',
            }}
          >
            LFG // ปล้นเลย!
          </button>
        </div>
      </div>
    </div>
  )
}
