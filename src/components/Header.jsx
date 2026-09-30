import { useState, useEffect } from 'react'
import { Download, Zap, Eye } from 'lucide-react'
import StatusTag from './kinetic/StatusTag'

export default function Header({ theme = 'dark', onToggle }) {
  const [motionCalm, setMotionCalm] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const isCalm = document.documentElement.classList.contains('motion-calm')
    setMotionCalm(isCalm)
  }, [])

  const toggleMotion = () => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const nextCalm = !root.classList.contains('motion-calm')
    if (nextCalm) {
      root.classList.add('motion-calm')
      try { localStorage.setItem('mediadrop-motion', 'calm') } catch (_) {}
    } else {
      root.classList.remove('motion-calm')
      try { localStorage.setItem('mediadrop-motion', 'dynamic') } catch (_) {}
    }
    setMotionCalm(nextCalm)
    onToggle?.()
  }

  return (
    <header
      style={{
        borderBottom: '2px solid var(--p5-red)',
        backgroundColor: 'var(--p5-surface)',
        boxShadow: '0 4px 0 #000000',
        position: 'relative',
        zIndex: 50,
      }}
    >
      <div
        className="max-w-2xl mx-auto px-6 py-3.5"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Logo & Tactical Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }} aria-label="MediaDrop">
            <div
              style={{
                border: '2px solid var(--p5-red)',
                boxShadow: '2px 2px 0 #000000',
                backgroundColor: 'var(--p5-red)',
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transform: 'skewX(-4deg)',
              }}
            >
              <Download size={14} color="#fff" strokeWidth={2.8} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                color: 'var(--p5-white)',
                letterSpacing: '0.04em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                transform: 'skewX(-4deg)',
              }}
              className="logo-text"
            >
              Media<span style={{ color: 'var(--p5-red)', marginLeft: '1px' }}>Drop</span>
            </span>
          </div>

          <span className="status-badge" aria-label="System status: Online" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#181818', border: '1px solid var(--p5-red)', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#fff', transform: 'skewX(-4deg)', boxShadow: '2px 2px 0 #000' }}>
            <span className="status-dot" aria-hidden="true" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            ONLINE
          </span>
        </div>

        {/* Motion Mode Toggle: Dynamic vs Calm (Keeps theme-toggle class for test compatibility) */}
        <button
          className="theme-toggle"
          onClick={toggleMotion}
          aria-label={motionCalm ? 'Switch to dynamic motion' : 'Switch to calm motion'}
          title={motionCalm ? 'Motion: Calm (Click for Dynamic)' : 'Motion: Dynamic (Click for Calm)'}
          style={{
            border: '2px solid var(--p5-red)',
            boxShadow: '2px 2px 0 #000000',
            backgroundColor: '#181818',
            color: motionCalm ? 'var(--p5-gray)' : 'var(--p5-red)',
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            transform: 'skewX(-4deg)',
            transition: 'none',
          }}
        >
          {motionCalm ? <Eye size={14} /> : <Zap size={14} fill="currentColor" />}
          <span>{motionCalm ? 'CALM' : 'DYNAMIC'}</span>
        </button>
      </div>
    </header>
  )
}
