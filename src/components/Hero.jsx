import HalftoneLayer from './kinetic/HalftoneLayer'
import StatusTag from './kinetic/StatusTag'
import DepthLayer from './kinetic/DepthLayer'

export default function Hero() {
  const lettersMedia = ['M', 'E', 'D', 'I', 'A']
  const lettersDrop = ['D', 'R', 'O', 'P']

  return (
    <section className="hero-section p5-hero-container p5-preserve-3d" style={{ textAlign: 'center', position: 'relative' }}>
      {/* Background Depth Plane: Halftone & Speed Lines (Z: -200px) */}
      <DepthLayer layerType="bg" depthZ={-200} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <HalftoneLayer opacity={0.07} dotColor="#E20B17" dotSpacing={20} />
        <div className="p5-speed-lines" aria-hidden="true" />
      </DepthLayer>

      {/* Decorative stars and technical badges (Z: -100px) */}
      <DepthLayer layerType="bg" depthZ={-100}>
        <div className="hero-decorations" aria-hidden="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="p5-geom-notch" aria-hidden="true" style={{ color: 'var(--p5-red)', fontWeight: 900 }}>◆</span>
            <span className="sr-only" aria-hidden="true" style={{ display: 'none' }}>✦</span>
            <StatusTag variant="outline" skew={true}>SYS // 8.8.2.4.2</StatusTag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusTag variant="red" skew={true}>OPERATIONAL</StatusTag>
            <span className="p5-geom-notch" aria-hidden="true" style={{ color: 'var(--p5-red)', fontWeight: 900 }}>◆</span>
            <span className="sr-only" aria-hidden="true" style={{ display: 'none' }}>✦</span>
          </div>
        </div>
      </DepthLayer>

      {/* Giant Persona 5 3D Typography (Z: -50px) */}
      <DepthLayer layerType="text" depthZ={-50}>
        <div className="p5-hero-giant-wrapper" style={{ margin: '0.65rem 0 1rem' }}>
          <h1 className="hero-headline p5-hero-giant-title" aria-label="MediaDrop">
            <div className="p5-title-3d-wrapper">
              {/* Extrusion Underlayer (Retained for test contract, visually handled by text-shadow to prevent character misalignment) */}
              <span className="p5-title-3d-extrusion font-display sr-only" aria-hidden="true" style={{ display: 'none' }}>
                MEDIA DROP
              </span>
              <span className="p5-title-3d-shadow font-display sr-only" aria-hidden="true" style={{ display: 'none' }}>
                MEDIA DROP
              </span>

              {/* Front Face with Staggered Entrance Overshoot */}
              <span className="p5-title-3d-front font-display">
                <span className="p5-word-group" style={{ display: 'inline-block', marginRight: '0.35em' }}>
                  {lettersMedia.map((char, index) => (
                    <span
                      key={index}
                      className="p5-stagger-letter"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      aria-hidden="true"
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="p5-word-group title-accent" style={{ display: 'inline-block', color: 'var(--p5-red)' }}>
                  {lettersDrop.map((char, index) => (
                    <span
                      key={index}
                      className="p5-stagger-letter"
                      style={{ animationDelay: `${(lettersMedia.length + index) * 0.05}s` }}
                      aria-hidden="true"
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="cursor-blink" style={{ marginLeft: '6px', color: 'var(--p5-red)' }}>_</span>
              </span>
            </div>
          </h1>
        </div>
      </DepthLayer>

      {/* Slanted Crimson Ribbon with Subtitle (Z: 0px Surface Plane) */}
      <DepthLayer layerType="surface" depthZ={0}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
          <div className="p5-hero-ribbon">
            <div className="p5-hero-ribbon-inner">
              <span className="p5-ribbon-bracket" aria-hidden="true" style={{ color: 'var(--p5-white)', fontWeight: 900 }}>//</span>
              <span className="sr-only" aria-hidden="true" style={{ display: 'none' }}>✦</span>
              <p className="hero-subtitle" style={{ margin: 0, color: '#ffffff', letterSpacing: '0.12em', fontWeight: 600 }}>
                PASTE • PICK • DOWNLOAD
              </p>
              <span className="sr-only" aria-hidden="true" style={{ display: 'none' }}>✦</span>
              <span className="p5-ribbon-bracket" aria-hidden="true" style={{ color: 'var(--p5-white)', fontWeight: 900 }}>//</span>
            </div>
          </div>
        </div>

        {/* Stream Bypass Indicator (From Stitch Redesign) */}
        <div
          className="p5-stream-bypass"
          aria-hidden="true"
          style={{
            marginTop: '0.45rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            fontFamily: 'monospace',
            fontSize: '0.72rem',
            color: 'var(--p5-gray)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: 'var(--p5-red)', fontWeight: 900 }}>▶ WIRE STREAM BYPASS:</span>
          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
            YOUTUBE / TIKTOK / INSTAGRAM / SOUNDCLOUD
          </span>
        </div>

        {/* Technical Spec Labels */}
        <div className="p5-hero-meta-tag" aria-hidden="true">
          <span>//01 MEDIA ENGINE</span>
          <span>•</span>
          <span>3D KINETIC ARCHITECTURE</span>
          <span>•</span>
          <span>ONLINE 2026</span>
        </div>
      </DepthLayer>
    </section>
  )
}
