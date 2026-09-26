import { Sun, Moon, Download } from 'lucide-react'

export default function Header({ theme, onToggle }) {
  return (
    <header
      style={{
        borderBottom: '2px solid var(--border)',
        backgroundColor: 'var(--surface)',
        boxShadow: '0 4px 0 var(--shadow)',
      }}
    >
      <div
        className="max-w-2xl mx-auto px-6 py-4"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }} aria-label="MediaDrop">
          <div
            style={{
              border: '2px solid var(--border)',
              boxShadow: '2px 2px 0 var(--shadow)',
              backgroundColor: 'var(--accent-purple)',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.75rem',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
            className="logo-text"
          >
            Media<span style={{ color: 'var(--accent-pink)' }}>Drop</span>
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          className="theme-toggle"
          onClick={onToggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            border: '2px solid var(--border)',
            boxShadow: '2px 2px 0 var(--shadow)',
            backgroundColor: 'var(--card-bg)',
            color: theme === 'dark' ? 'var(--accent-yellow)' : 'var(--accent-purple)',
            padding: '0.4rem 0.6rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'none',
          }}
          onMouseDown={e => {
            e.currentTarget.style.boxShadow = '1px 1px 0 var(--shadow)'
            e.currentTarget.style.transform = 'translate(1px, 1px)'
          }}
          onMouseUp={e => {
            e.currentTarget.style.boxShadow = '2px 2px 0 var(--shadow)'
            e.currentTarget.style.transform = ''
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '2px 2px 0 var(--shadow)'
            e.currentTarget.style.transform = ''
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
