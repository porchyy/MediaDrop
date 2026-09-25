import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import UrlInput from './components/UrlInput'
import SupportedFormats from './components/SupportedFormats'
import Footer from './components/Footer'

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('mediadrop-theme')
      if (stored) return stored
    } catch (_) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('mediadrop-theme', theme)
    } catch (_) {}
  }, [theme])

  const [currentPhase, setCurrentPhase] = useState('idle')
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <>
      {/* CRT scanline overlay */}
      <div className="scanline-overlay" aria-hidden="true" />

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header theme={theme} onToggle={toggleTheme} />

        <main
          className="main-content"
          style={{
            flex: 1,
            maxWidth: '42.5rem',
            margin: '0 auto',
            width: '100%',
            padding: '3rem 1.25rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
          }}
        >
          <Hero />
          <UrlInput onPhaseChange={setCurrentPhase} />
          {(currentPhase === 'idle' || currentPhase === 'error') && <SupportedFormats />}
        </main>

        <Footer />
      </div>
    </>
  )
}

export default App
