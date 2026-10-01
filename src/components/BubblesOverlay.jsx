import { useEffect, useRef } from 'react'
import { forceMotion } from '../lib/useReduced.js'

/*
 * BubblesOverlay — sparse rising bubbles over the dive, for ambient life while
 * standing still. Fixed, pointer-events-none, painted above the spine and below
 * the content. Cheap: one rAF, dpr-capped, few particles, additive glow.
 * reduced-motion (no ?motion=force): renders nothing.
 */
export default function BubblesOverlay() {
  const ref = useRef(null)

  useEffect(() => {
    const reduced = !forceMotion() && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const COUNT = mobile ? 14 : 34
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
    let raf = 0, w = 0, h = 0

    const size = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    const rnd = (a, b) => a + Math.random() * (b - a)
    const parts = Array.from({ length: COUNT }, () => ({
      x: rnd(0, w), y: rnd(0, h), r: rnd(1, 4),
      v: rnd(0.12, 0.5), drift: rnd(-0.15, 0.15),
      a: rnd(0.05, 0.22), mag: Math.random() < 0.25,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.y -= p.v
        p.x += p.drift + Math.sin(p.y * 0.01) * 0.15
        if (p.y + p.r < 0) { p.y = h + p.r; p.x = rnd(0, w) }
        const rgb = p.mag ? '245,32,139' : '31,227,196'
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        g.addColorStop(0, `rgba(${rgb},${p.a})`)
        g.addColorStop(1, `rgba(${rgb},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size) }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
}
