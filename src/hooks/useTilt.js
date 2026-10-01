import { useState, useRef, useCallback } from 'react'
import { useMotionMode } from './useMotionMode'

/**
 * useTilt: 3D Surface tilt and specular highlight tracking for cards.
 * Computes rotateX, rotateY, and specular highlight percentage coordinates.
 */
export function useTilt(options = {}) {
  const { maxTilt = 7, depth = 15 } = options
  const { motionCalm, isTouchDevice } = useMotionMode()
  const [tiltStyle, setTiltStyle] = useState({})
  const [specularStyle, setSpecularStyle] = useState({ '--specular-opacity': 0 })
  const elementRef = useRef(null)

  const handleMouseMove = useCallback(
    e => {
      if (motionCalm || isTouchDevice || !elementRef.current) return

      const rect = elementRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Normalize -1 to 1
      const nx = (x / rect.width) * 2 - 1
      const ny = (y / rect.height) * 2 - 1

      const rotX = (-ny * maxTilt).toFixed(2)
      const rotY = (nx * maxTilt).toFixed(2)

      const percentX = ((x / rect.width) * 100).toFixed(1)
      const percentY = ((y / rect.height) * 100).toFixed(1)

      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${depth}px)`,
        transition: 'transform 0.08s ease-out',
      })

      setSpecularStyle({
        '--specular-x': `${percentX}%`,
        '--specular-y': `${percentY}%`,
        '--specular-opacity': 0.85,
      })
    },
    [maxTilt, depth, motionCalm, isTouchDevice],
  )

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    })
    setSpecularStyle({
      '--specular-opacity': 0,
    })
  }, [])

  return {
    ref: elementRef,
    style: motionCalm || isTouchDevice ? {} : tiltStyle,
    specularStyle: motionCalm || isTouchDevice ? { display: 'none' } : specularStyle,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  }
}

export default useTilt
