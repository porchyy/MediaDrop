import { useState, useEffect } from 'react'
import { Download, Zap, Eye, ShieldAlert } from 'lucide-react'
import StatusTag from './kinetic/StatusTag'
import HoldUpModal from './kinetic/HoldUpModal'

export default function Header({ theme = 'dark', onToggle }) {
  const [motionCalm, setMotionCalm] = useState(false)
  const [holdUpOpen, setHoldUpOpen] = useState(false)

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

  // Dynamic Persona 5 Calendar & Status HUD info based on TODAY's actual date
  const now = new Date()
  const month = now.getMonth() + 1
  const dateNum = now.getDate()
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const dayStr = days[now.getDay()]
  const hours = now.getHours()

  // Dynamic time of day period
  let periodTag = 'AFTER SCHOOL // ภารกิจ'
  if (hours >= 5 && hours < 12) periodTag = 'MORNING // ภารกิจ'
  else if (hours >= 12 && hours < 16) periodTag = 'AFTERNOON // ภารกิจ'
  else if (hours >= 16 && hours < 19) periodTag = 'AFTER SCHOOL // ภารกิจ'
  else if (hours >= 19 && hours < 23) periodTag = 'NIGHT HEIST // ภารกิจ'
  else periodTag = 'DARK HOUR // ภารกิจ'

  // Dynamic weather cycle based on day & hour
  const weatherList = ['CLOUDY', 'CLEAR', 'HEATWAVE', 'RAIN', 'METAVERSE']
  const weather = weatherList[(dateNum + Math.floor(hours / 4)) % weatherList.length] || 'CLOUDY'
  const dateFormatted = `${month}/${dateNum} [${dayStr}]`

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
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          width: '100%',
        }}
      >
        {/* Logo & Tactical Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} aria-label="MediaDrop">
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

        {/* Center: Authentic Persona 5 Calendar & Weather Widget (From Stitch Kinetic Heist Redesign) */}
        <div
          className="p5-header-calendar"
          aria-hidden="true"
          style={{
            alignItems: 'center',
            background: '#0a0a0c',
            border: '2px solid var(--p5-red)',
            padding: '0.35rem 0.85rem',
            transform: 'skewX(-4deg)',
            boxShadow: '3px 3px 0 #000000',
            position: 'relative',
            gap: '0.85rem',
            marginTop: '0.4rem',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-0.7rem',
              left: '0.5rem',
              background: 'var(--p5-red)',
              color: '#ffffff',
              fontFamily: 'var(--font-display)',
              fontSize: '0.62rem',
              padding: '0.05rem 0.4rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              border: '1px solid var(--p5-white)',
              transform: 'skewX(-2deg)',
              whiteSpace: 'nowrap',
            }}
          >
            {periodTag}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                background: 'var(--p5-red)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 900,
                fontFamily: 'monospace',
                padding: '0.12rem 0.4rem',
                letterSpacing: '0.03em',
              }}
            >
              {dateFormatted}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.88rem',
                color: '#fff',
                letterSpacing: '0.05em',
              }}
            >
              {weather}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              fontFamily: 'monospace',
              color: 'var(--p5-gray)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ color: 'var(--p5-white)', fontWeight: 700 }}>SHIBUYA</span>
            <span style={{ color: 'var(--p5-red)' }}>●</span>
            <span>DIRE</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {/* Persona 5 HOLD UP / Negotiation Modal Trigger */}
          <button
            type="button"
            onClick={() => setHoldUpOpen(true)}
            className="p5-holdup-trigger-btn font-display"
            aria-label="Trigger Hold Up test negotiation"
            style={{
              cursor: 'pointer',
              background: '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
              padding: '0.35rem 0.65rem',
              transform: 'skewX(-4deg)',
              boxShadow: '3px 3px 0 var(--p5-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldAlert size={14} color="var(--p5-red)" />
            <span>HOLD UP! // TEST</span>
          </button>

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
      </div>

      {/* Persona 5 Negotiation Modal */}
      <HoldUpModal
        isOpen={holdUpOpen}
        onClose={() => setHoldUpOpen(false)}
        onConfirm={() => setHoldUpOpen(false)}
        title="SHIBUYA VELOCITY HEIST"
        format="4K MASTER MP4"
        quality="Best"
        fileSize="1.82 GB"
      />
    </header>
  )
}
