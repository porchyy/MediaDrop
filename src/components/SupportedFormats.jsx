import { Music, Video, Image } from 'lucide-react'

const FORMATS = [
  { icon: Music, label: 'MP3', desc: 'Audio', theme: 'audio', accent: 'var(--accent-pink)' },
  { icon: Video, label: 'Video', desc: 'MP4 / WebM', theme: 'video', accent: 'var(--accent-purple)' },
  { icon: Image, label: 'Image', desc: 'JPG / PNG', theme: 'image', accent: 'var(--accent-cyan)' },
]

export default function SupportedFormats({ isIdle = true }) {
  return (
    <section className="supported-formats-section" style={{ position: 'relative' }}>
      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <p className="formats-heading font-display" style={{ fontSize: '1.25rem', letterSpacing: '0.08em', color: 'var(--p5-white)', margin: 0 }}>
          // SUPPORTED MEDIA ENGINES
        </p>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--p5-gray)' }}>FORMAT / 03</span>
      </div>

      {/* Divider with red slant */}
      <hr className="pixel-divider" style={{ border: 'none', height: '2px', background: 'var(--p5-red)', marginBottom: '1.25rem' }} />

      {/* Cards row with skew geometry */}
      <div className="formats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
        {FORMATS.map(({ icon: Icon, label, desc, theme, accent }) => (
          <div
            key={label}
            className={`format-card format-card--${theme}`}
            style={{
              background: '#121212',
              border: `2px solid ${accent}`,
              boxShadow: '4px 4px 0 #000000',
              padding: '1.1rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transform: 'skewX(-4deg)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              cursor: 'default',
            }}
          >
            <div
              className={`format-card-icon format-card-icon--${theme}`}
              style={{
                background: accent,
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem',
                transform: 'skewX(4deg)',
                boxShadow: '2px 2px 0 #000',
              }}
            >
              <Icon size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="format-card-label font-display" style={{ fontSize: '1.25rem', color: '#fff', transform: 'skewX(4deg)', lineHeight: 1 }}>
              {label}
            </span>
            <span className="format-card-desc" style={{ fontSize: '0.72rem', color: 'var(--p5-gray)', transform: 'skewX(4deg)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
              {desc}
            </span>
          </div>
        ))}
      </div>

      {/* Step Guide Strip (01 PASTE ➔ 02 PICK ➔ 03 DOWNLOAD) — Pruned from visual UI to declutter, retained as accessible semantic nav */}
      {isIdle && (
        <nav className="step-guide-strip" aria-label="Workflow guide" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
          <ol
            className="step-guide-list"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: '#0e0e0e',
              border: '1px solid #262626',
              borderLeft: '3px solid var(--p5-red)',
              boxShadow: '3px 3px 0 #000000',
              padding: '0.3rem 0.85rem',
              listStyle: 'none',
              margin: 0,
              transform: 'skewX(-4deg)',
            }}
          >
            <li className="step-pill font-display" style={{ fontSize: '0.92rem', color: '#fff', transform: 'skewX(4deg)', letterSpacing: '0.05em' }}>
              01 PASTE
            </li>
            <li className="step-arrow" aria-hidden="true" style={{ color: 'var(--p5-red)', fontSize: '0.8rem', transform: 'skewX(4deg)' }}>
              ➔
            </li>
            <li className="step-pill font-display" style={{ fontSize: '0.92rem', color: '#fff', transform: 'skewX(4deg)', letterSpacing: '0.05em' }}>
              02 PICK
            </li>
            <li className="step-arrow" aria-hidden="true" style={{ color: 'var(--p5-red)', fontSize: '0.8rem', transform: 'skewX(4deg)' }}>
              ➔
            </li>
            <li className="step-pill font-display" style={{ fontSize: '0.92rem', color: '#fff', transform: 'skewX(4deg)', letterSpacing: '0.05em' }}>
              03 DOWNLOAD
            </li>
          </ol>
        </nav>
      )}
    </section>
  )
}
