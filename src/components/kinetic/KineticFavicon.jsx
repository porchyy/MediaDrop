import { useEffect, useRef } from 'react'

const FAVICON_M = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#080808"/>
  <rect x="2" y="2" width="28" height="28" rx="2" fill="#E20B17"/>
  <text x="16" y="23" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="20" fill="#F4F1E8" text-anchor="middle">M</text>
</svg>
`.trim())}`

const FAVICON_M_SLASH = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#080808"/>
  <rect x="2" y="2" width="28" height="28" rx="2" fill="#E20B17"/>
  <text x="16" y="23" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="20" fill="#F4F1E8" text-anchor="middle">M</text>
  <line x1="5" y1="27" x2="27" y2="5" stroke="#080808" stroke-width="4.5"/>
  <line x1="5" y1="27" x2="27" y2="5" stroke="#F4F1E8" stroke-width="2"/>
</svg>
`.trim())}`

/**
 * KineticFavicon: Alternates browser tab favicon between [M] and [M̸] during active analysis.
 * Pauses automatically when tab is hidden or phase is not 'analyzing'.
 */
export default function KineticFavicon({ phase = 'idle' }) {
  const originalHref = useRef('/favicon.svg')

  useEffect(() => {
    if (typeof document === 'undefined') return

    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    if (link.href && !link.href.startsWith('data:')) {
      originalHref.current = link.href
    }

    const restoreFavicon = () => {
      if (link && originalHref.current) {
        link.href = originalHref.current
      }
    }

    if (phase !== 'analyzing') {
      restoreFavicon()
      return
    }

    let isSlash = false
    let timer = null

    const tick = () => {
      if (document.visibilityState === 'visible') {
        link.href = isSlash ? FAVICON_M_SLASH : FAVICON_M
        isSlash = !isSlash
      } else {
        restoreFavicon()
      }
    }

    tick()
    timer = setInterval(tick, 280)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick()
      } else {
        restoreFavicon()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      restoreFavicon()
    }
  }, [phase])

  return null
}
