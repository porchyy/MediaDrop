import { useRef, useCallback } from 'react'

/**
 * useKineticSound: Procedural Web Audio API sound synthesizer.
 * Generates tactile cybernetic micro-clicks and low impact thuds with 0KB downloaded assets.
 * Respects user settings and muted states.
 */
let sharedAudioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!sharedAudioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass()
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {})
  }
  return sharedAudioCtx
}

export function useKineticSound() {
  const isMuted = useRef(false)

  const playClick = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx || isMuted.current) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(1100, now)
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.025)

      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.025)
    } catch (_) {}
  }, [])

  const playImpact = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx || isMuted.current) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.07)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.07)
    } catch (_) {}
  }, [])

  const playSlash = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx || isMuted.current) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      const now = ctx.currentTime
      osc.frequency.setValueAtTime(120, now)
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08)
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.32)

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.32)
    } catch (_) {}
  }, [])

  const playSuccess = useCallback(() => {
    try {
      const ctx = getAudioContext()
      if (!ctx || isMuted.current) return

      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'triangle'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, now)
      osc1.frequency.setValueAtTime(659.25, now + 0.08)
      osc1.frequency.setValueAtTime(783.99, now + 0.16)
      osc2.frequency.setValueAtTime(1046.50, now + 0.16)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now + 0.16)
      osc1.stop(now + 0.35)
      osc2.stop(now + 0.35)
    } catch (_) {}
  }, [])

  const playSfx = useCallback((type = 'click') => {
    if (type === 'impact') {
      playImpact()
    } else if (type === 'slash') {
      playSlash()
    } else if (type === 'success') {
      playSuccess()
    } else {
      playClick()
    }
  }, [playClick, playImpact, playSlash, playSuccess])

  return { playSfx, playClick, playImpact, playSlash, playSuccess }
}

export default useKineticSound
