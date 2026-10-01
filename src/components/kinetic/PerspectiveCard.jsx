import { useTilt } from '../../hooks/useTilt'

/**
 * PerspectiveCard: Wraps Result Card with 3D perspective, physical extrusion,
 * mouse-tracking hover tilt, dynamic specular sheen, and lateral entrance slam.
 */
export default function PerspectiveCard({
  children,
  className = '',
  style = {},
  maxTilt = 4.5,
  depth = 12,
  ...props
}) {
  const { ref, style: tiltStyle, specularStyle, onMouseMove, onMouseLeave } = useTilt({ maxTilt, depth })

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`p5-preserve-3d p5-extrusion-card p5-hover-lift p5-entry-slam ${className}`.trim()}
      style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        ...style,
        ...tiltStyle,
      }}
      {...props}
    >
      {/* Dynamic Specular Sheen Tracking Cursor */}
      <div className="p5-specular-sheen" style={specularStyle} aria-hidden="true" />
      {children}
    </div>
  )
}
