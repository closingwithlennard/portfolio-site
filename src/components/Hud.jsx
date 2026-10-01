import { useEffect, useRef, useState } from 'react'

const THEME_KEY = 'theme'
const CLOCK_TZ = 'Asia/Bangkok'

// The abbreviation is read from Intl rather than hardcoded, so the clock stays
// correct if CLOCK_TZ moves to a zone with daylight saving.
const clockFormat = new Intl.DateTimeFormat('en-AU', {
  timeZone: CLOCK_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZoneName: 'short',
})

function readClock() {
  const parts = clockFormat.formatToParts(new Date())
  const get = (type) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('timeZoneName')} ${get('hour')}:${get('minute')}`
}

function initialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'dark'
}

/**
 * Fixed monospace instrument chrome: a live clock (zone set by CLOCK_TZ), a pointer readout, and a
 * theme toggle whose bracketed hint is a real key binding.
 *
 * The pointer readout deliberately bypasses React state. A pointermove that set
 * state would re-render the tree on every mouse pixel; instead one rAF-throttled
 * listener writes textContent directly, so the cost is a single DOM write per frame.
 */
export default function Hud() {
  const [clock, setClock] = useState(readClock)
  const [theme, setTheme] = useState(initialTheme)
  const coordsRef = useRef(null)

  // Clock: align the first tick to the next minute boundary so the display never
  // sits up to 59s stale, then settle into a plain 60s interval.
  useEffect(() => {
    let interval
    const timeout = setTimeout(() => {
      setClock(readClock())
      interval = setInterval(() => setClock(readClock()), 60_000)
    }, (60 - new Date().getSeconds()) * 1000)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [])

  // Pointer readout: one listener, one rAF in flight at a time, direct DOM write.
  useEffect(() => {
    const node = coordsRef.current
    if (!node) return

    let frame = null
    let x = 0
    let y = 0

    const paint = () => {
      frame = null
      const px = String(Math.round(x)).padStart(4, '0')
      const py = String(Math.round(y)).padStart(4, '0')
      node.textContent = `${px} X ${py} Y`
    }

    const onMove = (event) => {
      x = event.clientX
      y = event.clientY
      if (frame === null) frame = requestAnimationFrame(paint)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  // Theme lives on <html> so CSS can swap the two colour triplets. Light mode costs
  // nothing extra: the whole hierarchy is those triplets at varying alpha.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // The bracketed hint is a promise; honour it. Ignore the key while the visitor is
  // typing into a field, and while a modifier is held (those are browser shortcuts).
  useEffect(() => {
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const el = event.target
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      if (event.key.toLowerCase() !== 'a') return
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 px-5 pb-4 md:px-12 lg:px-24">
      <span className="mono-label text-label-3">{clock}</span>

      {/* Decorative telemetry: meaningless to a screen reader, so keep it out of the tree. */}
      <span ref={coordsRef} aria-hidden="true" className="mono-label hidden text-label-4 sm:inline">
        0000 X 0000 Y
      </span>

      <button
        type="button"
        onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme. Keyboard shortcut: A`}
        className="mono-label pointer-events-auto cursor-pointer text-label-3 transition-colors duration-200 hover:text-label"
      >
        Theme<span aria-hidden="true" className="text-label-4">[A]</span>
      </button>
    </div>
  )
}
