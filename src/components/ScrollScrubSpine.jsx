import { useEffect, useRef, useState } from 'react'
import { forceMotion } from '../lib/useReduced.js'

/*
 * ScrollScrubSpine — the whole-page dive, in three phases.
 *
 *   1. LOADING  a mono HUD preloader counts the dive frames in.
 *   2. INTRO    once enough frames are ready it auto-plays the surface break
 *               (frames 0..INTRO_END) as a short cinematic.
 *   3. SCROLL   from there the user's scroll drives the descent: page progress
 *               0..1 maps to frames INTRO_END..last, so there is no reset jump.
 *
 * A fixed full-viewport canvas behind all content. Frames are pre-extracted webp.
 * Repaints only when the mapped frame changes; scroll is read in rAF, never a
 * scroll handler touching React state. Scrolling before the intro finishes hands
 * control straight to scroll. reduced-motion skips the auto-intro, keeps scrub
 * (scrub is user-driven, not autonomous motion).
 */

const FRAME_COUNT = 181
const INTRO_END = 36
const INTRO_MS = 2600
const framePath = (i) => `/dive/frame-${String(i).padStart(4, '0')}.webp`
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export default function ScrollScrubSpine() {
  const canvasRef = useRef(null)
  const [pct, setPct] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let raf = 0
    let current = -1
    const frames = new Array(FRAME_COUNT)

    const size = () => {
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
    }
    size()

    const drawFrame = (img) => {
      if (!img || !img.complete || img.naturalWidth === 0) return
      const cw = canvas.width, ch = canvas.height
      const ir = img.naturalWidth / img.naturalHeight
      const cr = cw / ch
      let dw, dh, dx, dy
      if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0 }
      else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2 }
      ctx.drawImage(img, dx, dy, dw, dh)
    }

    const getImg = (i) => {
      if (frames[i]) return frames[i]
      const img = new Image()
      img.src = framePath(i)
      frames[i] = img
      return img
    }

    const paint = (idx) => {
      idx = Math.max(0, Math.min(FRAME_COUNT - 1, idx))
      if (idx === current) return
      const img = getImg(idx)
      if (img.complete && img.naturalWidth) drawFrame(img)
      else img.onload = () => drawFrame(img)
      getImg(Math.min(FRAME_COUNT - 1, idx + 2))
      current = idx
    }

    // preload the intro span first, report progress, then hand off to loop.
    const NEED = INTRO_END + 10
    let loaded = 0
    for (let i = 0; i < NEED; i++) {
      const img = getImg(i)
      const done = () => {
        loaded++
        setPct(Math.round((loaded / NEED) * 100))
      }
      if (img.complete && img.naturalWidth) done()
      else { img.onload = done; img.onerror = done }
    }
    // lazily warm the rest
    for (let i = NEED; i < FRAME_COUNT; i++) getImg(i)

    const reduced = !forceMotion() && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scrollFrame = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const p = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      return Math.round(INTRO_END + p * (FRAME_COUNT - 1 - INTRO_END))
    }

    let phase = 'wait' // wait -> intro -> scroll
    let introStart = 0
    let userScrolled = false
    const onScroll = () => { if (window.scrollY > 30) userScrolled = true }
    window.addEventListener('scroll', onScroll, { passive: true })

    const startWhenReady = () => {
      // ready once the intro span is decoded (or a short timeout as a safety net)
      const enough = frames.slice(0, INTRO_END).every((f) => f && f.complete && f.naturalWidth)
      if (!enough) return false
      setReady(true)
      phase = reduced || userScrolled ? 'scroll' : 'intro'
      introStart = performance.now()
      return true
    }

    let started = false
    const loop = (now) => {
      if (!started) started = startWhenReady()
      if (started) {
        if (phase === 'intro') {
          if (userScrolled) { phase = 'scroll' }
          else {
            const t = Math.min(1, (now - introStart) / INTRO_MS)
            paint(Math.floor(easeInOut(t) * INTRO_END))
            if (t >= 1) phase = 'scroll'
          }
        }
        if (phase === 'scroll') paint(scrollFrame())
      } else {
        paint(0)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onResize = () => { size(); current = -1 }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
        style={{ background: '#0B0D0C' }}
      />
      {/* preloader: mono HUD, fades out when the intro span is ready */}
      <div
        aria-hidden={ready}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg transition-opacity duration-700"
        style={{ opacity: ready ? 0 : 1, pointerEvents: ready ? 'none' : 'auto' }}
      >
        <div className="mono-label text-label-3">entering the water</div>
        <div className="mt-6 h-px w-56 overflow-hidden bg-line">
          <div
            className="h-full bg-[linear-gradient(90deg,var(--color-magenta),var(--color-turq))] transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mono-label mt-4 tabular-nums text-turq">{String(pct).padStart(3, '0')}</div>
      </div>
    </>
  )
}
