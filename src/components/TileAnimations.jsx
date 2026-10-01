import { useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// Coded tile loops for the Work page. Each one is a small 2D-canvas animation
// driven by the verified figures of its case study, not a video file: nothing
// to download, nothing to buffer, and it follows the light/dark theme because
// the colours are read from the same CSS tokens as the rest of the site.
//
// Every loop pauses when its tile is off screen (IntersectionObserver) and
// renders a single still frame under prefers-reduced-motion.
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2
const MONO = '10px ui-monospace, "Cascadia Mono", Consolas, monospace'
const COLOR_REFRESH_MS = 1000
const STILL_FRAME_T = 3.2

// Small deterministic PRNG so layouts are identical on every render.
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const ease = (v) => {
  const x = clamp01(v)
  return x * x * (3 - 2 * x)
}

function readColors(node) {
  const style = getComputedStyle(node)
  const triplet = (name, fallback) => style.getPropertyValue(name).trim() || fallback
  const label = triplet('--label-triplet', '244, 243, 238')
  const accent = triplet('--turq-triplet', '31, 227, 196')
  const magenta = triplet('--magenta-triplet', '245, 32, 139')
  return {
    label: (a) => `rgba(${label}, ${a})`,
    accent: (a) => `rgba(${accent}, ${a})`,
    magenta: (a) => `rgba(${magenta}, ${a})`,
  }
}

function text(ctx, value, x, y, color, align = 'left') {
  ctx.font = MONO
  ctx.textAlign = align
  ctx.fillStyle = color
  ctx.fillText(value, x, y)
}

// --- 1. Measurement PWA: a scan line crosses a torso, three tapes resolve ---
const MEASURES = [
  { y: 0.3, half: 0.17, value: 99.5 },
  { y: 0.52, half: 0.125, value: 82.8 },
  { y: 0.72, half: 0.175, value: 101.2 },
]
const TORSO = [
  [0.1, 0.06], [0.2, 0.19], [0.3, 0.17], [0.52, 0.125], [0.72, 0.175], [0.95, 0.15],
]

function drawScan(ctx, w, h, t, c) {
  const cycle = (t % 7) / 7
  const scanY = ease(cycle / 0.45)
  const cx = w * 0.4
  ctx.lineWidth = 1
  ctx.strokeStyle = c.label(0.22)
  for (const side of [-1, 1]) {
    ctx.beginPath()
    TORSO.forEach(([py, half], i) => {
      const x = cx + side * half * w
      const y = py * h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }
  ctx.strokeStyle = c.accent(0.55 * (1 - clamp01((cycle - 0.45) * 8)))
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.26, scanY * h)
  ctx.lineTo(cx + w * 0.26, scanY * h)
  ctx.stroke()
  MEASURES.forEach((m) => {
    const shown = ease((scanY - m.y) * 9 + (cycle > 0.45 ? 1 : 0))
    if (shown <= 0) return
    const y = m.y * h
    const x0 = cx - m.half * w * shown
    const x1 = cx + m.half * w * shown
    ctx.strokeStyle = c.accent(0.9)
    ctx.beginPath()
    ctx.moveTo(x0, y)
    ctx.lineTo(x1, y)
    ctx.moveTo(x0, y - 3)
    ctx.lineTo(x0, y + 3)
    ctx.moveTo(x1, y - 3)
    ctx.lineTo(x1, y + 3)
    ctx.stroke()
    text(ctx, `${(m.value * shown).toFixed(1)} cm`, w * 0.68, y + 3, c.label(0.2 + 0.6 * shown))
  })
}

// --- 2. ARVO: a torus knot turns while a scrub counter runs to frame 121 ---
const KNOT_POINTS = 170

function drawKnot(ctx, w, h, t, c) {
  const cx = w * 0.5
  const cy = h * 0.5
  const scale = Math.min(w, h) * 0.17
  const spin = t * 0.45
  for (let i = 0; i < KNOT_POINTS; i += 1) {
    const u = (i / KNOT_POINTS) * TAU
    const r = 2 + Math.cos(3 * u)
    const x = r * Math.cos(2 * u)
    const y = r * Math.sin(2 * u)
    const z = Math.sin(3 * u)
    const rx = x * Math.cos(spin) - z * Math.sin(spin)
    const rz = x * Math.sin(spin) + z * Math.cos(spin)
    const depth = (rz + 3) / 6
    ctx.fillStyle = i % 9 === 0 ? c.accent(0.35 + 0.65 * depth) : c.label(0.12 + 0.5 * depth)
    ctx.beginPath()
    ctx.arc(cx + rx * scale, cy + y * scale * 0.72, 0.7 + depth * 1.3, 0, TAU)
    ctx.fill()
  }
  const progress = (t % 6) / 6
  const frame = String(Math.round(progress * 120) + 1).padStart(3, '0')
  text(ctx, `FRAME ${frame} / 121`, w * 0.08, h * 0.95, c.label(0.45))
  ctx.fillStyle = c.label(0.14)
  ctx.fillRect(w * 0.08, h * 0.985, w * 0.84, 1)
  ctx.fillStyle = c.accent(0.9)
  ctx.fillRect(w * 0.08, h * 0.985, w * 0.84 * progress, 1)
}

// --- 3. Trading engine: 246 tests go green, one race fails first, then holds ---
const TESTS = 246
const FLAKY_TEST = 151

function drawTests(ctx, w, h, t, c) {
  // Pick a column count that keeps the whole grid inside the upper half of the
  // canvas, whatever the tile's aspect ratio, so the counter fits beneath it.
  const cols = Math.max(14, Math.ceil(Math.sqrt((TESTS * w * 0.84) / (h * 0.5))))
  const cell = (w * 0.84) / cols
  const cycle = (t % 8) / 8
  const done = Math.floor(ease(cycle / 0.6) * TESTS)
  const flakyFixed = cycle > 0.72
  for (let i = 0; i < TESTS; i += 1) {
    const x = w * 0.08 + (i % cols) * cell
    const y = h * 0.08 + Math.floor(i / cols) * cell
    const isFlaky = i === FLAKY_TEST && i < done && !flakyFixed
    if (isFlaky) ctx.fillStyle = c.magenta(0.95)
    else ctx.fillStyle = i < done ? c.accent(0.75) : c.label(0.1)
    ctx.fillRect(x, y, cell - 2.5, cell - 2.5)
  }
  const passed = Math.max(0, done - (done > FLAKY_TEST && !flakyFixed ? 1 : 0))
  const rows = Math.ceil(TESTS / cols)
  text(ctx, `${passed} / ${TESTS} passed`, w * 0.08, h * 0.08 + rows * cell + 14, c.label(0.5))
}

// --- 4. Reel pipeline: a flat pile of posts sorts itself into 23 genre maps ---
const POSTS = 320
const GENRES = 23
const postSeed = mulberry32(6050)
const POST_LAYOUT = Array.from({ length: POSTS }, (_, i) => {
  const genre = i % GENRES
  return {
    sx: postSeed(),
    sy: postSeed(),
    tx: ((genre % 6) + 0.5) / 6 + (postSeed() - 0.5) * 0.09,
    ty: (Math.floor(genre / 6) + 0.5) / 4 + (postSeed() - 0.5) * 0.13,
    genre,
  }
})

function drawSort(ctx, w, h, t, c) {
  const cycle = (t % 9) / 9
  const sorted = ease((cycle - 0.12) / 0.4) * (1 - ease((cycle - 0.86) / 0.12))
  POST_LAYOUT.forEach((p) => {
    const x = (p.sx + (p.tx - p.sx) * sorted) * w * 0.84 + w * 0.08
    const y = (p.sy + (p.ty - p.sy) * sorted) * h * 0.86 + h * 0.06
    ctx.fillStyle = p.genre % 5 === 0 ? c.accent(0.3 + 0.6 * sorted) : c.label(0.18 + 0.3 * sorted)
    ctx.fillRect(x, y, 2, 2)
  })
  const maps = Math.round(sorted * GENRES)
  text(ctx, `6,050 posts / ${String(maps).padStart(2, '0')} maps`, w * 0.08, h * 0.99, c.label(0.5))
}

// --- 5. Agent audit: lines of copy, unsupported claims flagged then struck ---
const CLAIMS = 29
const auditSeed = mulberry32(29)
const AUDIT_LINES = Array.from({ length: 9 }, () => {
  const segments = []
  let x = 0
  while (x < 0.92) {
    const len = 0.08 + auditSeed() * 0.2
    segments.push({ x, len: Math.min(len, 0.96 - x), flagged: auditSeed() < 0.3 })
    x += len + 0.025
  }
  return segments
})
const FLAGGED_TOTAL = AUDIT_LINES.flat().filter((s) => s.flagged).length

function drawAudit(ctx, w, h, t, c) {
  const cycle = (t % 8) / 8
  const reviewed = ease(cycle / 0.7) * FLAGGED_TOTAL
  let seen = 0
  AUDIT_LINES.forEach((segments, row) => {
    const y = h * 0.1 + row * (h * 0.095)
    segments.forEach((s) => {
      const x = w * 0.08 + s.x * w * 0.84
      const len = s.len * w * 0.84
      if (!s.flagged) {
        ctx.fillStyle = c.label(0.2)
        ctx.fillRect(x, y, len, 3)
        return
      }
      const state = clamp01(reviewed - seen)
      seen += 1
      ctx.fillStyle = state > 0 ? c.magenta(0.85 - 0.6 * state) : c.label(0.2)
      ctx.fillRect(x, y, len, 3)
      if (state > 0) {
        ctx.fillStyle = c.label(0.7)
        ctx.fillRect(x - 2, y + 1, (len + 4) * state, 1)
      }
    })
  })
  const count = Math.round((Math.min(reviewed, FLAGGED_TOTAL) / FLAGGED_TOTAL) * CLAIMS)
  text(ctx, `${String(count).padStart(2, '0')} / ${CLAIMS} claims cut`, w * 0.08, h * 0.99, c.label(0.5))
}

// --- 6. Lead engine: a sweep enriches a listing grid, gaps stay honest gaps ---
const LEADS = 152
const leadSeed = mulberry32(152)
const LEAD_GAPS = Array.from({ length: LEADS }, () => leadSeed() < 0.04)

function drawLeads(ctx, w, h, t, c) {
  const cols = 19
  const rows = Math.ceil(LEADS / cols)
  const gx = (w * 0.84) / cols
  const gy = (h * 0.8) / rows
  const cycle = (t % 7) / 7
  const sweep = ease(cycle / 0.65)
  for (let i = 0; i < LEADS; i += 1) {
    const col = i % cols
    const x = w * 0.08 + col * gx + gx / 2
    const y = h * 0.08 + Math.floor(i / cols) * gy + gy / 2
    const enriched = col / cols < sweep
    if (enriched && !LEAD_GAPS[i]) ctx.fillStyle = c.accent(0.85)
    else ctx.fillStyle = c.label(enriched ? 0.35 : 0.14)
    ctx.beginPath()
    ctx.arc(x, y, enriched ? 1.9 : 1.3, 0, TAU)
    ctx.fill()
  }
  if (sweep < 1) {
    ctx.fillStyle = c.accent(0.5)
    ctx.fillRect(w * 0.08 + sweep * w * 0.84, h * 0.06, 1, h * 0.84)
  }
  text(ctx, `${Math.round(sweep * LEADS)} / ${LEADS} leads enriched`, w * 0.08, h * 0.99, c.label(0.5))
}

const DRAW_BY_SLUG = {
  'health-tech-measurement-pwa': drawScan,
  'arvo-demo-studio': drawKnot,
  'trading-signal-engine': drawTests,
  'reel-intelligence-pipeline': drawSort,
  'agent-output-audit': drawAudit,
  'lead-engine': drawLeads,
}

export function hasTileAnimation(slug) {
  return Boolean(DRAW_BY_SLUG[slug])
}

/**
 * Canvas loop for one work tile. The canvas fills its positioned parent; the
 * caller decides how much of the tile it covers.
 */
export default function TileAnimation({ slug, reduceMotion = false, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const draw = DRAW_BY_SLUG[slug]
    if (!canvas || !draw) return undefined

    const ctx = canvas.getContext('2d')
    const size = { w: 0, h: 0 }
    let colors = readColors(canvas)
    let colorsReadAt = 0
    let raf = 0
    let visible = false
    const startedAt = performance.now()

    const render = (now) => {
      if (now - colorsReadAt > COLOR_REFRESH_MS) {
        colors = readColors(canvas)
        colorsReadAt = now
      }
      ctx.clearRect(0, 0, size.w, size.h)
      const t = reduceMotion ? STILL_FRAME_T : (now - startedAt) / 1000
      draw(ctx, size.w, size.h, t, colors)
    }

    const loop = (now) => {
      render(now)
      if (visible && !reduceMotion) raf = requestAnimationFrame(loop)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size.w = rect.width
      size.h = rect.height
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      render(performance.now())
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      const wasVisible = visible
      visible = entry.isIntersecting
      if (visible && !wasVisible && !reduceMotion) raf = requestAnimationFrame(loop)
      if (!visible) cancelAnimationFrame(raf)
    })
    visibilityObserver.observe(canvas)

    resize()

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
    }
  }, [slug, reduceMotion])

  return <canvas ref={canvasRef} aria-hidden="true" className={'block h-full w-full ' + className} />
}
