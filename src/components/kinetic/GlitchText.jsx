import { useState, useEffect } from 'react'

/**
 * GlitchText: Subtle horizontal RGB offset or slice on state reveal.
 * Runs briefly (200-300ms) then settles to calm state.
 */
export default function GlitchText({
  text,
  className = '',
  as: Component = 'span',
  triggerKey = null,
  ...rest
}) {
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    setGlitching(true)
    const timer = setTimeout(() => setGlitching(false), 260)
    return () => clearTimeout(timer)
  }, [triggerKey, text])

  return (
    <Component
      className={`glitch-text-wrapper ${glitching ? 'glitch-active' : ''} ${className}`}
      data-text={text}
      {...rest}
    >
      <span className="glitch-base">{text}</span>
      {glitching && (
        <>
          <span className="glitch-slice glitch-slice--top" aria-hidden="true">{text}</span>
          <span className="glitch-slice glitch-slice--bottom" aria-hidden="true">{text}</span>
        </>
      )}
    </Component>
  )
}
