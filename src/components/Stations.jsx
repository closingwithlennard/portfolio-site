import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, useInView, useMotionValue, animate } from 'motion/react'
import { useReduced } from '../lib/useReduced.js'
import TiltCard from './TiltCard.jsx'

// staggered reveal for a station's text column
const textContainer = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
const textItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

// depth marker that counts up to its value when the station enters view
function DepthCount({ value, rgb, reduced }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => `-${String(Math.round(v)).padStart(3, '0')}M`)
  useEffect(() => {
    if (!inView) return
    if (reduced) { mv.set(value); return }
    const controls = animate(mv, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [inView, reduced, value, mv])
  return <motion.span ref={ref} style={{ color: `rgb(${rgb})` }}>{text}</motion.span>
}

/*
 * Stations — Scrollworld stage 2: the descent.
 *
 * After the hero dive through the pool surface, the page keeps scrolling DOWN
 * through water. Depth is progress. Each case study is a station at a greater
 * depth, revealed on enter, its image drifting slower than its text (parallax).
 * A continuous descent rail on the left carries depth ticks; a sticky readout
 * interpolates the live depth. Accent alternates per station by theme.
 *
 * All motion is scroll-LINKED, never scroll-hijacked: natural scroll length is
 * preserved. Mobile stacks the layout, softens parallax, and keeps the mood.
 * prefers-reduced-motion freezes every layer to its still frame.
 */

const ACCENT = {
  turq: { rgb: '31,227,196', name: 'turquoise' },
  magenta: { rgb: '245,32,139', name: 'magenta' },
}

const STATIONS = [
  {
    slug: 'health-tech-pwa',
    depth: '-040M',
    kind: 'Shipped for a client',
    kicker: 'PRODUCT / WEB + SECURITY',
    headline: "I moved a client's exposed API key off the browser.",
    proof: 'shipped · key server-side · validated on a real device',
    body:
      'A paying health-tech client had shipped a camera-based body-measurement PWA (Bodygram API) with its key hardcoded in the browser and a faked-measurement fallback. I rebuilt the flow behind a Cloudflare Worker token proxy, so the key never leaves the server, and validated the measurements end-to-end on a real iPhone.',
    img: 'health-tech-pwa',
    accent: 'turq',
  },
  {
    slug: 'reel-intelligence',
    depth: '-120M',
    kind: 'Self-initiated build',
    kicker: 'DATA / KNOWLEDGE',
    headline: 'Six thousand saved posts, none of them findable.',
    proof: '6,050 posts indexed · 3,530 accounts · 21 genre maps',
    body:
      'Five years of saved Instagram posts sat in one flat list nobody could search. I built a sync that lifts every post into a structured database — author, type, caption, collection — then a tagging pass that turned the reels into 21 genre maps I can actually query. An archive became a reference set.',
    img: 'reel',
    accent: 'magenta',
  },
  {
    slug: 'arvo',
    depth: '-200M',
    kind: 'Self-initiated build',
    kicker: 'WEB / 3D',
    headline: 'A studio site that loads a 3D scene without blocking the page.',
    proof: 'live · 108 kb gzip · three.js lazy-loaded · 0 console errors',
    body:
      'A live studio site I built end-to-end: React, a lazy-loaded three.js scene, scroll-scrubbed frames, self-hosted fonts and a strict CSP. Fast where sites like this usually are not.',
    img: 'arvo',
    accent: 'turq',
    link: 'https://cwl-demo-studio-closingwithlennard.vercel.app',
  },
  {
    slug: 'trading',
    depth: '-300M',
    kind: 'Self-initiated build',
    kicker: 'SYSTEMS / RELIABILITY',
    headline: 'A trading engine that checks its own orders against the broker.',
    proof: '246 passing tests · order-lifecycle + broker reconciliation · paper only',
    body:
      'A signal-to-order engine with a reconciliation pass that catches divergence between its own ledger and the broker’s books. 246 tests green, including the Windows file-lock concurrency race that took three attempts to pin down. Paper trading only, never live capital.',
    img: 'trading',
    accent: 'magenta',
  },
]

function Station({ data, index, reduced }) {
  const ref = useRef(null)
  const flip = index % 2 === 1
  const a = ACCENT[data.accent]

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  // parallax: image drifts against the text as the station passes through.
  const imgY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [60, -60])

  return (
    <div
      ref={ref}
      className="relative grid min-h-[92vh] grid-cols-1 items-center gap-10 px-6 py-24 md:grid-cols-12 md:gap-8 md:px-12 lg:px-24"
    >
      {/* depth tick on the rail, counts up on entry */}
      <div className="mono-label absolute left-6 top-24 text-label-3 md:left-12 lg:left-[5.4rem]" aria-hidden="true">
        <DepthCount value={parseInt(data.depth.replace(/\D/g, ''), 10)} rgb={a.rgb} reduced={reduced} />
      </div>

      {/* image */}
      <motion.div
        className={`relative ${flip ? 'md:col-span-6 md:col-start-7' : 'md:col-span-6'}`}
        style={reduced ? {} : { y: imgY }}
        initial={reduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* accent glow bound behind the artifact */}
        <div
          className="pointer-events-none absolute -inset-6 -z-10 blur-2xl"
          aria-hidden="true"
          style={{ background: `radial-gradient(50% 50% at 50% 50%, rgba(${a.rgb},0.22), transparent 70%)` }}
        />
        <TiltCard accentRgb={a.rgb} className="overflow-hidden rounded-xl border border-line">
          <img
            src={`/stations/${data.img}-1000.jpg`}
            srcSet={`/stations/${data.img}-640.jpg 640w, /stations/${data.img}-1000.jpg 1000w`}
            sizes="(max-width: 767px) 100vw, 45vw"
            alt={`${data.slug} case study visual`}
            loading="lazy"
            className="aspect-[3/4] h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
          {!reduced && <div className="hero-shimmer absolute inset-0" aria-hidden="true" />}
        </TiltCard>
      </motion.div>

      {/* text, choreographed line by line on entry */}
      <motion.div
        className={`${flip ? 'md:col-span-5 md:col-start-1 md:row-start-1' : 'md:col-span-5 md:col-start-8'}`}
        variants={reduced ? undefined : textContainer}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'show'}
        viewport={{ once: true, amount: 0.35 }}
      >
        <motion.div variants={reduced ? undefined : textItem} className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className="mono-label"
            style={{ color: data.kind === 'Shipped for a client' ? `rgb(${a.rgb})` : undefined }}
          >
            {data.kind === 'Shipped for a client' ? data.kind : <span className="text-label-4">{data.kind}</span>}
          </span>
          <span className="mono-label text-label-4">{data.kicker}</span>
        </motion.div>
        <motion.h2
          variants={reduced ? undefined : textItem}
          className="font-display text-[clamp(1.9rem,3.4vw,3rem)] font-semibold leading-[1.02] tracking-tight text-label"
        >
          {data.headline}
        </motion.h2>
        <motion.p variants={reduced ? undefined : textItem} className="mono-label mt-6" style={{ color: `rgb(${a.rgb})` }}>
          {data.proof}
        </motion.p>
        <motion.p variants={reduced ? undefined : textItem} className="mt-6 max-w-md text-label-2 leading-relaxed">
          {data.body}
        </motion.p>
        {data.link && (
          <motion.a
            variants={reduced ? undefined : textItem}
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label mt-6 inline-flex items-center gap-2 text-label-2 transition-colors duration-200 hover:text-label"
          >
            view live
            <span aria-hidden="true">→</span>
          </motion.a>
        )}
      </motion.div>
    </div>
  )
}

export default function Stations() {
  const reduced = useReduced()
  const sectionRef = useRef(null)
  const [depth, setDepth] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Live depth readout. Rounded to 5m so re-renders stay bounded (~64 max).
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const d = Math.round((v * 320) / 5) * 5
    setDepth((prev) => (prev === d ? prev : d))
  })

  return (
    <section
      ref={sectionRef}
      id="work"
      aria-label="Selected work"
      className="relative"
      style={{
        /* translucent so the dive spine shows through; darkens with depth for text legibility */
        background:
          'linear-gradient(180deg, rgba(11,13,12,0.20) 0%, rgba(7,19,18,0.45) 45%, rgba(3,10,10,0.78) 100%)',
      }}
    >
      {/* continuous descent rail */}
      <div
        className="pointer-events-none absolute bottom-0 left-6 top-0 w-px bg-line md:left-12 lg:left-20"
        aria-hidden="true"
      />

      {/* sticky live-depth HUD */}
      {!reduced && (
        <div className="pointer-events-none sticky top-6 z-20 h-0" aria-hidden="true">
          <div className="mono-label ml-6 text-label-3 md:ml-12 lg:ml-24">
            depth <span className="text-turq">-{String(depth).padStart(3, '0')}M</span>
          </div>
        </div>
      )}

      {STATIONS.map((s, i) => (
        <Station key={s.slug} data={s} index={i} reduced={reduced} />
      ))}

      {/* seabed → contact handoff */}
      <div className="relative px-6 py-28 text-center md:px-12">
        <p className="mono-label text-label-3">-320M / SEABED</p>
        <h2 className="font-display mx-auto mt-5 max-w-2xl text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-tight text-label">
          You've reached the bottom. Let's build something.
        </h2>
      </div>
    </section>
  )
}
