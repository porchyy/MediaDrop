import { Music, Video, Image } from 'lucide-react'

const FORMATS = [
  { icon: Music, label: 'MP3', desc: 'Audio', theme: 'audio' },
  { icon: Video, label: 'Video', desc: 'MP4 / WebM', theme: 'video' },
  { icon: Image, label: 'Image', desc: 'JPG / PNG', theme: 'image' },
]

export default function SupportedFormats({ isIdle = true }) {
  return (
    <section className="supported-formats-section">
      {/* Section label */}
      <p className="formats-heading">
        Media Formats
      </p>

      {/* Divider */}
      <hr className="pixel-divider" />

      {/* Cards row */}
      <div className="formats-grid">
        {FORMATS.map(({ icon: Icon, label, desc, theme }) => (
          <div key={label} className={`format-card format-card--${theme}`}>
            <div className={`format-card-icon format-card-icon--${theme}`}>
              <Icon size={20} color="#fff" strokeWidth={2} />
            </div>
            <span className="format-card-label">{label}</span>
            <span className="format-card-desc">{desc}</span>
          </div>
        ))}
      </div>

      {/* Step Guide Strip (01 PASTE ➔ 02 PICK ➔ 03 DOWNLOAD) — Idle Mode Only */}
      {isIdle && (
        <nav className="step-guide-strip" aria-label="Workflow guide">
          <ol className="step-guide-list">
            <li className="step-pill">01 PASTE</li>
            <li className="step-arrow" aria-hidden="true">➔</li>
            <li className="step-pill">02 PICK</li>
            <li className="step-arrow" aria-hidden="true">➔</li>
            <li className="step-pill">03 DOWNLOAD</li>
          </ol>
        </nav>
      )}
    </section>
  )
}
