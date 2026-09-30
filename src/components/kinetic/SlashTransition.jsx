import { useEffect, useState } from 'react'

/**
 * SlashTransition: Persona 5 signature diagonal red slash wipes (////////).
 * Runs a rapid 350ms-450ms diagonal stripe wipe to mask state transitions.
 */
export default function SlashTransition({ active = false, onComplete }) {
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (active) {
      setAnimating(true)
      const timer = setTimeout(() => {
        setAnimating(false)
        onComplete?.()
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [active, onComplete])

  if (!animating && !active) return null

  return (
    <div className="slash-transition-overlay" aria-hidden="true">
      <div className="slash-bar slash-bar--1" />
      <div className="slash-bar slash-bar--2" />
      <div className="slash-bar slash-bar--3" />
      <div className="slash-accent-text">
        <span>MEDIA DROP // STRIKE</span>
      </div>
    </div>
  )
}
