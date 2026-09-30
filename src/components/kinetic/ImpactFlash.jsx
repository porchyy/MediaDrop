import { useEffect, useState } from 'react'

/**
 * ImpactFlash: Brief high-energy red flash (50ms - 150ms) mimicking P5 impact frames.
 */
export default function ImpactFlash({ trigger = 0 }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (trigger > 0) {
      setActive(true)
      const timer = setTimeout(() => setActive(false), 140)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  if (!active) return null

  return <div className="impact-flash-overlay" aria-hidden="true" />
}
