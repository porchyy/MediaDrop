import { useParallax } from '../../hooks/useParallax'

/**
 * DepthLayer: Positions children on a specific Z-depth plane and responds to cursor parallax.
 * Supported layerTypes: 'bg' (Z:-200, 1°), 'text' (Z:-50, 2°), 'surface' (Z:0, 4°), 'action' (Z:+50, 7°).
 */
export default function DepthLayer({
  children,
  layerType = 'surface',
  depthZ = 0,
  className = '',
  style = {},
  ...props
}) {
  const { getLayerTransform, disabled } = useParallax()

  const layerClass =
    layerType === 'bg'
      ? 'depth-layer--bg'
      : layerType === 'text'
      ? 'depth-layer--text'
      : layerType === 'action'
      ? 'depth-layer--action'
      : 'depth-layer--surface'

  const transformStyle = disabled ? {} : { transform: getLayerTransform(layerType, depthZ) }

  return (
    <div
      className={`p5-preserve-3d ${layerClass} ${className}`.trim()}
      style={{
        ...transformStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
