import { useState, useEffect } from 'react'
import { useMotionMode } from '../../hooks/useMotionMode'

/**
 * ScreenShake: Executes an ultra-fast tactile micro-shake (40ms - 80ms) upon impact triggers.
 * Disabled completely under calm motion.
 */
export default function ScreenShake({
  children,
  trigger = 0,
  className = '',
  style = {},
}) {
  const { motionCalm } = useMotionMode()
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (trigger > 0 && !motionCalm) {
      setShaking(true)
      const timer = setTimeout(() => setShaking(false), 80)
      return () => clearTimeout(timer)
    }
  }, [trigger, motionCalm])

  return (
    <div
      className={`${shaking ? 'p5-screen-shake' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  )
}
