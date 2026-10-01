import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Lenis from 'lenis'

import Nav from './components/Nav.jsx'
import { forceMotion } from './lib/useReduced.js'
import Home from './pages/Home.jsx'
import Work from './pages/Work.jsx'
import About from './pages/About.jsx'
import Privacy from './pages/Privacy.jsx'

// On route change scroll to top; honor hash links (e.g. /#contact) once the target exists.
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // wait a frame so the routed page has rendered before we look up the anchor
      const frame = requestAnimationFrame(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ block: 'start' })
        else window.scrollTo(0, 0)
      })
      return () => cancelAnimationFrame(frame)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

export default function App() {
  // Lenis smooth-scroll (self-hosted, no CDN). Smoothing only, never scroll-jacking:
  // no pinning, no scrub, the page keeps its natural scroll length. Off under reduced-motion.
  useEffect(() => {
    if (!forceMotion() && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.6 })
    let raf
    const loop = (time) => { lenis.raf(time); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [])

  return (
    <>
      <Nav />
      <ScrollToTop />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-8 md:px-12 lg:px-24">
        <span className="mono-label text-label-3">Lennard Capece</span>
        <a className="mono-label text-label-3 transition-colors duration-200 hover:text-label" href="/privacy">
          Privacy
        </a>
      </footer>
    </>
  )
}
