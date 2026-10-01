import { useEffect, useState } from 'react'
import { useMotionMode } from '../../hooks/useMotionMode'

/**
 * ImpactFlash: Brief high-energy red impact flash (70ms - 120ms) mimicking P5 impact frames.
 * Respects calm motion and reduced motion settings.
 */
export default function ImpactFlash({ trigger = 0 }) {
  const { motionCalm } = useMotionMode()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (trigger > 0 && !motionCalm) {
      setActive(true)
      const timer = setTimeout(() => setActive(false), 110)
      return () => clearTimeout(timer)
    }
  }, [trigger, motionCalm])

  if (!active) return null

  return <div className="impact-flash-overlay" aria-hidden="true" />
}
