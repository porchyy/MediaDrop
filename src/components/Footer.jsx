export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '2px solid var(--border)',
        backgroundColor: 'var(--surface)',
        padding: '1.75rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.6rem',
          color: 'var(--accent)',
          margin: 0,
          letterSpacing: '0.08em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span className="pixel-star-twinkle" style={{ color: 'var(--accent-yellow)' }}>✦</span>
        <span>FAST &amp; COLORFUL</span>
        <span style={{ color: 'var(--accent-pink)' }}>▪</span>
        <span>MEDIA DROP</span>
        <span className="pixel-star-twinkle" style={{ color: 'var(--accent-cyan)' }}>✦</span>
      </p>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8rem',
          color: 'var(--muted)',
          margin: 0,
        }}
      >
        © {new Date().getFullYear()} MediaDrop · Open Source Utility
      </p>
    </footer>
  )
}
