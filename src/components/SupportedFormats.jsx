import { Music, Video, Image } from 'lucide-react'

const FORMATS = [
  { icon: Music, label: 'MP3', desc: 'Audio' },
  { icon: Video, label: 'Video', desc: 'MP4 / WebM' },
  { icon: Image, label: 'Image', desc: 'JPG / PNG' },
]

export default function SupportedFormats() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Section label */}
      <p
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.55rem',
          color: 'var(--muted)',
          textAlign: 'center',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        Media Formats
      </p>

      {/* Divider */}
      <hr className="pixel-divider" />

      {/* Cards row */}
      <div
        className="formats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
        }}
      >
        {FORMATS.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="format-card">
            <div
              style={{
                border: '2px solid var(--border)',
                boxShadow: '2px 2px 0 var(--shadow)',
                backgroundColor: 'var(--accent)',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={20} color="#fff" strokeWidth={2} />
            </div>
            <span
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '0.6rem',
                color: 'var(--text)',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '0.75rem',
                color: 'var(--muted)',
              }}
            >
              {desc}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
