import HalftoneLayer from './kinetic/HalftoneLayer'
import StatusTag from './kinetic/StatusTag'

export default function Hero() {
  return (
    <section className="hero-section p5-hero-container" style={{ textAlign: 'center', position: 'relative' }}>
      {/* Background Halftone & Ambient Accents */}
      <HalftoneLayer opacity={0.07} dotColor="#E20B17" dotSpacing={20} />

      {/* Decorative stars and technical badges (Preserving test class names) */}
      <div className="hero-decorations" aria-hidden="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="hero-star hero-star--left pixel-star-twinkle" style={{ color: 'var(--p5-red)', fontSize: '1.2rem' }}>✦</span>
          <span className="hero-dot hero-dot--left" style={{ color: 'var(--p5-gray)', fontSize: '0.8rem' }}>▪</span>
          <StatusTag variant="outline" skew={true}>SYS / 8.8</StatusTag>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <StatusTag variant="red" skew={true}>READY</StatusTag>
          <span className="hero-dot hero-dot--right" style={{ color: 'var(--p5-gray)', fontSize: '0.8rem' }}>▪</span>
          <span className="hero-star hero-star--right pixel-star-twinkle" style={{ color: 'var(--p5-red)', fontSize: '1.2rem' }}>✦</span>
        </div>
      </div>

      {/* Giant Persona 5 Headline */}
      <div className="p5-hero-giant-wrapper">
        <h1 className="hero-headline p5-hero-giant-title">
          MEDIA <span className="title-accent">DROP</span>
          <span className="cursor-blink" style={{ marginLeft: '6px', color: 'var(--p5-red)' }}>_</span>
        </h1>
      </div>

      {/* Slanted Crimson Ribbon with Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="p5-hero-ribbon">
          <div className="p5-hero-ribbon-inner">
            <span aria-hidden="true">✦</span>
            <p className="hero-subtitle" style={{ margin: 0, color: '#ffffff', letterSpacing: '0.12em', fontWeight: 600 }}>
              PASTE • PICK • DOWNLOAD
            </p>
            <span aria-hidden="true">✦</span>
          </div>
        </div>
      </div>

      {/* Technical Spec Labels */}
      <div className="p5-hero-meta-tag" aria-hidden="true">
        <span>//01 MEDIA ENGINE</span>
        <span>•</span>
        <span>KINETIC ARCHITECTURE</span>
        <span>•</span>
        <span>ONLINE 2026</span>
      </div>
    </section>
  )
}
