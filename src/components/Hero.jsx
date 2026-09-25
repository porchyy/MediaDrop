export default function Hero() {
  return (
    <section style={{ textAlign: 'center' }}>
      {/* Main headline */}
      <h1
        className="hero-headline"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 'clamp(1rem, 3vw, 1.5rem)',
          color: 'var(--text)',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
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
        style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '1rem',
          color: 'var(--muted)',
          margin: 0,
          letterSpacing: '0.03em',
        }}
      >
        Download audio, video and images
        <br />
        from any link — fast &amp; private.
      </p>
    </section>
  )
}
