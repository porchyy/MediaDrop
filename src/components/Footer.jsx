export default function Footer() {
  return (
    <footer className="site-footer">
      <p className="footer-brand">
        <span className="pixel-star-twinkle footer-star" aria-hidden="true">✦</span>
        <span>FAST &amp; COLORFUL</span>
        <span className="footer-dot" aria-hidden="true">▪</span>
        <span>MEDIA DROP</span>
        <span className="pixel-star-twinkle footer-star" aria-hidden="true">✦</span>
      </p>
      <p className="footer-copyright">
        © {new Date().getFullYear()} MediaDrop · Open Source Utility
      </p>
    </footer>
  )
}
