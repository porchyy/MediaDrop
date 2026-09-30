/**
 * HalftoneLayer: Comic book halftone dot matrix texture overlay.
 * Uses pure SVG pattern for crisp, high-DPI dot rendering with zero external assets.
 */
export default function HalftoneLayer({
  opacity = 0.06,
  dotColor = 'currentColor',
  dotRadius = 1.4,
  dotSpacing = 16,
  className = '',
}) {
  return (
    <div
      className={`halftone-layer ${className}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        overflow: 'hidden',
      }}
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id="halftone-pattern"
            x="0"
            y="0"
            width={dotSpacing}
            height={dotSpacing}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={dotSpacing / 2} cy={dotSpacing / 2} r={dotRadius} fill={dotColor} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#halftone-pattern)" />
      </svg>
    </div>
  )
}
