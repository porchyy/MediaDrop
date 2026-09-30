import { useRef, useState, useEffect } from 'react'

/**
 * MagneticButton: Adds subtle cursor pull (max 4-8px) to high-priority interactive buttons.
 * Channels Persona 5 snappy tactile feel.
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
  const [isCalm, setIsCalm] = useState(false)

  useEffect(() => {
    const checkCalm = () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const hasCalmClass = document.documentElement.classList.contains('motion-calm')
      setIsCalm(prefersReduced || hasCalmClass)
    }
    checkCalm()

    const observer = new MutationObserver(checkCalm)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

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
    if (!disabled) setIsPressed(true)
  }

  const handlePointerUp = () => {
    setIsPressed(false)
  }

  const transformStyle = isCalm
    ? undefined
    : {
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)${isPressed ? ' scale(0.97)' : ''}`,
        transition: isHovered && !isPressed ? 'transform 0.08s ease-out' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
      }

  return (
    <div className="magnetic-btn-wrapper" style={{ position: 'relative', display: 'inline-block', width: rest.style?.width || 'auto' }}>
      <button
        ref={buttonRef}
        type={type}
        className={`magnetic-btn ${isHovered ? 'magnetic-btn--hovered' : ''} ${isPressed ? 'magnetic-btn--pressed' : ''} ${className}`}
        disabled={disabled}
        onClick={onClick}
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
