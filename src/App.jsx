import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import UrlInput from './components/UrlInput'
import SupportedFormats from './components/SupportedFormats'
import Footer from './components/Footer'
import CameraTransition from './components/kinetic/CameraTransition'
import KineticFavicon from './components/kinetic/KineticFavicon'

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('mediadrop-theme')
      if (stored) return stored
    } catch (_) {}
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
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
    <div className="app-container bg-depth-layer" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      {/* Persona 5 Metaverse Top Hazard Strip */}
      <div className="p5-top-hazard-strip" aria-hidden="true" />

      {/* Atmospheric Typographic Watermarks */}
      <div className="p5-watermark-steal" aria-hidden="true">STEAL</div>
      <div className="p5-watermark-heist" aria-hidden="true">HEIST</div>

      <KineticFavicon phase={currentPhase} />
      <Header theme={theme} onToggle={toggleTheme} />

      <CameraTransition phase={currentPhase} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main
          className="main-content"
          style={{
            flex: 1,
            maxWidth: '46.5rem',
            margin: '0 auto',
            width: '100%',
            padding: '2.5rem 1.25rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.25rem',
          }}
        >
          <Hero />
          <UrlInput onPhaseChange={setCurrentPhase} />
          {(currentPhase === 'idle' || currentPhase === 'error') && (
            <SupportedFormats isIdle={currentPhase === 'idle'} />
          )}
        </main>
      </CameraTransition>

      <Footer />
    </div>
  )
}

export default App
