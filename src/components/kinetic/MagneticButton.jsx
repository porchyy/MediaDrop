import { useRef, useState } from 'react'
import { useKineticSound } from '../../hooks/useKineticSound'
import { useMotionMode } from '../../hooks/useMotionMode'

/**
 * MagneticButton: Adds subtle cursor pull (max 4-8px) and physical 3D press depth to buttons.
 * Channels Persona 5 snappy tactile feel with procedural audio clicks.
 * Bypassed when user has reduced motion preference or calm mode enabled.
 */
export default function MagneticButton({
  children,
  className = '',
  maxDistance = 6,
  badgeText = null,
  badgePosition = 'bottom-right',
  onClick,
  disabled = false,
  type = 'button',
  ...rest
}) {
  const buttonRef = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const { isCalm } = useMotionMode()
  const { playClick } = useKineticSound()

  const handlePointerMove = e => {
    if (disabled || isCalm || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = (e.clientX - centerX) / (rect.width / 2)
    const deltaY = (e.clientY - centerY) / (rect.height / 2)

    // Clamp offset to maxDistance (4-8px)
    const moveX = Math.max(-maxDistance, Math.min(maxDistance, deltaX * maxDistance))
    const moveY = Math.max(-maxDistance, Math.min(maxDistance, deltaY * maxDistance))
    setOffset({ x: moveX, y: moveY })
  }

  const handlePointerEnter = () => {
    if (!disabled) setIsHovered(true)
  }

  const handlePointerLeave = () => {
    setIsHovered(false)
    setIsPressed(false)
    setOffset({ x: 0, y: 0 })
  }

  const handlePointerDown = () => {
    if (!disabled) {
      setIsPressed(true)
      playClick()
    }
  }

  const handlePointerUp = () => {
    setIsPressed(false)
  }

  const handleClick = e => {
    if (!disabled) {
      onClick?.(e)
    }
  }

  const transformStyle = isCalm
    ? undefined
    : {
        transform: `translate3d(${offset.x}px, ${offset.y}px, ${isPressed ? 'var(--p5-depth-press)' : '0px'})${isPressed ? ' scale(0.97)' : ''}`,
        transition: isHovered && !isPressed ? 'transform 0.08s ease-out' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }

  return (
    <div className="magnetic-btn-wrapper p5-preserve-3d" style={{ position: 'relative', display: 'inline-block', width: rest.style?.width || 'auto' }}>
      <button
        ref={buttonRef}
        type={type}
        className={`magnetic-btn p5-extrusion-btn ${isHovered ? 'magnetic-btn--hovered' : ''} ${isPressed ? 'magnetic-btn--pressed' : ''} ${className}`}
        disabled={disabled}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{ ...transformStyle, ...rest.style }}
        {...rest}
      >
        {children}
      </button>

      {/* Persona micro hover label: ↳ ACTION / ↳ GET FILE */}
      {badgeText && isHovered && !disabled && (
        <span
          className={`kinetic-cursor-badge kinetic-cursor-badge--${badgePosition}`}
          aria-hidden="true"
        >
          ↳ {badgeText}
        </span>
      )}
    </div>
  )
}
