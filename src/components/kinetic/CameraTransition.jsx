import { useEffect, useState } from 'react'
import { useMotionMode } from '../../hooks/useMotionMode'

/**
 * CameraTransition: Scoped 3D perspective camera rig.
 * Executes subtle cinematic camera zoom (1.00 -> 1.04x, -1.5deg rotation) when transitioning between states.
 * Fully suppressed under calm motion or prefers-reduced-motion.
 */
export default function CameraTransition({
  children,
  phase = 'idle',
  className = '',
  style = {},
}) {
  const { motionCalm } = useMotionMode()
  const [animClass, setAnimClass] = useState('')

  useEffect(() => {
    if (motionCalm) {
      setAnimClass('')
      return
    }

    if (phase === 'analyzing') {
      setAnimClass('p5-camera-zoom-in')
    } else if (phase === 'result' || phase === 'success') {
      setAnimClass('p5-camera-settle')
      const timer = setTimeout(() => setAnimClass(''), 400)
      return () => clearTimeout(timer)
    } else {
      setAnimClass('')
    }
  }, [phase, motionCalm])

  return (
    <div
      className={`p5-camera-rig ${animClass} ${className}`.trim()}
      style={{
        transformOrigin: 'center 40%',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
