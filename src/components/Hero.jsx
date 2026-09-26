export default function Hero() {
  return (
    <section className="hero-section" style={{ textAlign: 'center', position: 'relative' }}>
      <div className="hero-decorations" aria-hidden="true">
        <span className="hero-star hero-star--left pixel-star-twinkle">✦</span>
        <span className="hero-dot hero-dot--left">▪</span>
        <span className="hero-star hero-star--right pixel-star-twinkle">✦</span>
        <span className="hero-dot hero-dot--right">▪</span>
      </div>

      {/* Main headline */}
      <h1
        className="hero-headline"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 'clamp(1rem, 3vw, 1.5rem)',
          color: 'var(--text)',
          lineHeight: 1.6,
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
        }}
      >
        MEDIA
        <br />
        DOWNLOADER
        <span className="cursor-blink" style={{ marginLeft: '4px' }}>
          _
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className="hero-subtitle"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.65rem',
          color: 'var(--muted)',
          margin: 0,
          letterSpacing: '0.08em',
        }}
      >
        Fast • Simple • Colorful
      </p>
    </section>
  )
}
