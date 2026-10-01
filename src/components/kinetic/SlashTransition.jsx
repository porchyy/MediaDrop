import { useEffect, useState } from 'react'
import { useMotionMode } from '../../hooks/useMotionMode'

/**
 * SlashTransition: Persona 5 signature 3D diagonal red slash wipes (////////).
 * Upgraded to 3D perspective with motion blur, red highlights, and speed lines.
 * Fully suppressed under calm motion or prefers-reduced-motion.
 */
export default function SlashTransition({ active = false, onComplete }) {
  const { motionCalm } = useMotionMode()
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (active) {
      if (motionCalm) {
        onComplete?.()
        return
      }
      setAnimating(true)
      const timer = setTimeout(() => {
        setAnimating(false)
        onComplete?.()
      }, 420)
      return () => clearTimeout(timer)
    }
  }, [active, motionCalm, onComplete])

  if (!animating && !active) return null

  return (
    <div className="slash-transition-overlay p5-slash-3d-overlay" aria-hidden="true">
      <div className="slash-bar slash-bar--1 p5-slash-3d-bar" />
      <div className="slash-bar slash-bar--2 p5-slash-3d-bar p5-slash-3d-bar--2" />
      <div className="slash-bar slash-bar--3 p5-slash-3d-bar p5-slash-3d-bar--3" />
      <div className="slash-accent-text font-display">
        <span>MEDIA DROP // 3D STRIKE</span>
      </div>
    </div>
  )
}
