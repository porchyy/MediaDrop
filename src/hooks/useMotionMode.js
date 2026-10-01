import { useState, useEffect } from 'react'

/**
 * useMotionMode: Centralized hook for motion preferences (Dynamic vs Calm).
 * Respects system prefers-reduced-motion, in-app .motion-calm class, and touch device capabilities.
 */
export function useMotionMode() {
  const [motionCalm, setMotionCalm] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const checkReduced = () => {
      const match = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setIsReducedMotion(match)
      return match
    }

    const checkTouch = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
      setIsTouchDevice(Boolean(isCoarse))
    }

    const updateCalm = () => {
      const calmClass = document.documentElement.classList.contains('motion-calm')
      const reduced = checkReduced()
      setMotionCalm(calmClass || reduced)
    }

    checkTouch()
    updateCalm()

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMediaChange = () => updateCalm()
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', onMediaChange)
    }

    // Observer for changes to documentElement classList
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.attributeName === 'class') {
          updateCalm()
        }
      }
    })
    observer.observe(document.documentElement, { attributes: true })

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', onMediaChange)
      }
      observer.disconnect()
    }
  }, [])

  return { motionCalm, isReducedMotion, isTouchDevice }
}

export default useMotionMode
