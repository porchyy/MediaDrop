export default function Footer() {
  return (
    <footer className="site-footer" style={{ borderTop: '2px solid var(--p5-dark-red)', background: 'var(--p5-black)', padding: '2rem 1.25rem', marginTop: 'auto' }}>
      <div style={{ maxWidth: '42.5rem', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'center' }}>
        <p className="footer-brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#141414', border: '1px solid var(--p5-red)', padding: '0.35rem 1rem', transform: 'skewX(-4deg)', boxShadow: '3px 3px 0 #000', margin: 0, color: 'var(--p5-white)', fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.08em' }}>
          <span className="sr-only" aria-hidden="true" style={{ display: 'none' }}>✦ FAST &amp; COLORFUL ✦</span>
          <span style={{ color: 'var(--p5-red)', fontWeight: 900 }}>//</span>
          <span>PHANTOM MEDIA ENGINE</span>
          <span style={{ color: 'var(--p5-gray)' }}>//</span>
          <span style={{ color: 'var(--p5-red)' }}>TAKE YOUR MEDIA</span>
        </p>
        <p className="footer-copyright" style={{ color: 'var(--p5-gray)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', margin: 0 }}>
          © {new Date().getFullYear()} MediaDrop · PHANTOM MEDIA ENGINE // TAKE YOUR MEDIA
        </p>
      </div>
    </footer>
  )
}
