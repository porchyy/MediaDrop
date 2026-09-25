import { Download, Image, Music, Video } from 'lucide-react'

const formats = {
  MP3: { icon: Music, heading: 'AUDIO QUALITY', choices: ['128 kbps', '192 kbps', '320 kbps'], initial: '192 kbps' },
  VIDEO: { icon: Video, heading: 'VIDEO QUALITY', choices: ['720p', '1080p', 'Best'], initial: 'Best' },
  IMAGE: { icon: Image, heading: 'IMAGE FORMAT', choices: ['JPG', 'PNG', 'Original'], initial: 'Original' },
}

const mediaDuration = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export default function ResultCard({
  phase,
  media,
  headingRef,
  format,
  quality,
  showDemoNotice,
  onFormatChange,
  onQualityChange,
  onDownload,
  onDemoDownload,
  onClear,
}) {
  return (
    <section className="result-section" aria-label="Analysis result">
      <p className="result-heading" ref={headingRef}>{phase === 'result' ? 'RESULT' : phase === 'preparing' ? 'PREPARING' : 'DEMO READY'}</p>
      <div className="result-card pixel-border">
        <span className="demo-badge">DEMO PREVIEW</span>
        <div className="result-media">
          <div className="result-thumbnail" role="img" aria-label="Demo cover image">
            <Image size={34} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h2 className="result-title">{media.title}</h2>
            <p className="result-meta">{mediaDuration(media.duration)} · {media.type.toUpperCase()}</p>
          </div>
        </div>

        {phase === 'result' ? (
          <>
            <fieldset className="result-fieldset">
              <legend>FORMAT</legend>
              <div className="result-options">
                {Object.entries(formats).map(([name, { icon: Icon }]) => (
                  <button
                    key={name}
                    className={`result-option${format === name ? ' result-option--active' : ''}`}
                    type="button"
                    aria-pressed={format === name}
                    onClick={() => onFormatChange(name, formats[name].initial)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {name}
                  </button>
                ))}
              </div>
              {format === 'IMAGE' && <p className="result-note">IMAGE uses the demo cover image.</p>}
            </fieldset>

            <fieldset className="result-fieldset">
              <legend>{formats[format].heading}</legend>
              <div className="result-options">
                {formats[format].choices.map(choice => (
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
            <p className="result-state-title">{phase === 'preparing' ? 'PREPARING FILE...' : 'DEMO READY'}</p>
            <p className="result-summary">{format} · {quality}</p>
            {phase === 'preparing' && <div className="activity-bar" aria-hidden="true"><span /></div>}
          </div>
        )}

        {phase === 'success' && (
          <>
            <button className="pixel-btn pixel-btn--full" type="button" onClick={onDemoDownload}>
              <Download size={16} aria-hidden="true" />
              Download File
            </button>
            {showDemoNotice && <p className="download-message" role="status">Demo only — no file is available yet</p>}
            <button className="clear-btn" type="button" onClick={onClear}>New Link</button>
          </>
        )}
      </div>
    </section>
  )
}
