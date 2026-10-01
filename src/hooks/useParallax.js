import { useState, useEffect, useRef } from 'react'
import { useMotionMode } from './useMotionMode'

/**
 * useParallax: Multi-layer 3D parallax tracking hook.
 * Calculates normalized coordinates (-1 to +1) from viewport center and provides layer-specific rotation/translation.
 * Automatically disabled under calm motion or on touch devices.
 */
export function useParallax() {
  const { motionCalm, isTouchDevice } = useMotionMode()
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const rafId = useRef(null)
  const targetCoords = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined' || motionCalm || isTouchDevice) {
      setCoords({ x: 0, y: 0 })
      return
    }

    const handleMouseMove = e => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      // Normalized (-1 to +1)
      const nx = Math.max(-1, Math.min(1, (e.clientX - centerX) / centerX))
      const ny = Math.max(-1, Math.min(1, (e.clientY - centerY) / centerY))
      targetCoords.current = { x: nx, y: ny }

      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          setCoords(targetCoords.current)
          rafId.current = null
        })
      }
    }

    const handleMouseLeave = () => {
      targetCoords.current = { x: 0, y: 0 }
      setCoords({ x: 0, y: 0 })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [motionCalm, isTouchDevice])

  /**
   * Returns rotation angles for a specific layer type
   * Background: 1°
   * Typography: 2°
   * Card / Surface: 4°
   * Button / Action: 7°
   */
  const getLayerTransform = (layerType = 'surface', depthZ = 0) => {
    if (motionCalm || isTouchDevice) {
      return depthZ ? `translate3d(0, 0, ${depthZ}px)` : 'none'
    }

    const maxDegree =
      layerType === 'bg' ? 1.0 :
      layerType === 'text' ? 2.0 :
      layerType === 'action' ? 7.0 :
      4.0 // 'surface' / 'card' default

    const rotX = -coords.y * maxDegree
    const rotY = coords.x * maxDegree

    return `translate3d(0, 0, ${depthZ}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`
  }

  return {
    coords,
    getLayerTransform,
    disabled: motionCalm || isTouchDevice,
  }
}

export default useParallax
