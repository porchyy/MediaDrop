/**
 * PhantomMask: Original copyright-safe tactical Phantom Mask & Radar Wave SVG glyph.
 * Symbolizes the autonomous media infiltration engine.
 */
export default function PhantomMask({ size = 18, color = '#F4F1E8', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Outer angular stylized mask wings */}
      <path
        d="M2 7L7 5L12 9L17 5L22 7L20 14L15 19L12 16L9 19L4 14L2 7Z"
        fill="#080808"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="miter"
      />
      {/* Inner sharp eye slits */}
      <path
        d="M6 10L10 11L7 13L6 10Z"
        fill="var(--p5-red, #E20B17)"
      />
      <path
        d="M18 10L14 11L17 13L18 10Z"
        fill="var(--p5-red, #E20B17)"
      />
      {/* Center tactical diamond crest */}
      <polygon
        points="12,11 13.5,13 12,15 10.5,13"
        fill={color}
      />
      {/* Tactical Radar Wave glyph arcs */}
      <path
        d="M21 2C22.2 3.2 23 4.8 23 6.5"
        stroke="var(--p5-red, #E20B17)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M19 4C19.8 4.8 20.3 5.8 20.3 7"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
    </svg>
  )
}
