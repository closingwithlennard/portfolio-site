import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import PageHeader from './PageHeader.jsx'
import { PLATFORM_URL, PLATFORM_LABEL, repoUrl } from '../components/Nav.jsx'
import TileAnimation, { hasTileAnimation } from '../components/TileAnimations.jsx'
import TileVideo from '../components/TileVideo.jsx'

// ---------------------------------------------------------------------------
// Six real case studies. Every number below is verified against source
// material (contracts, test logs, build output, database counts, data files)
// as of the 2026-09-04 audit, plus the 2026-09-30 additions (agent audit,
// lead engine). Nothing here is invented, rounded up or embellished.
// One earlier case study was pulled 2026-09-04: its client engagement was
// dropped, so the "quote won" framing no longer held.
// If a claim could not be backed by an artefact, it was left out rather than
// guessed at.
//
// Shape is deliberately flat and self-contained so this array can be lifted
// into its own module (e.g. src/data/workItems.js) later without touching
// WorkCard or WorkModal below: they only ever read fields off an item.
//
// size: bento span, keyed rather than index-matched so items can be
// reordered without breaking the layout. See SPAN_BY_SIZE.
// ---------------------------------------------------------------------------
const WORK_ITEMS = [
  {
    slug: 'health-tech-measurement-pwa',
    name: 'Body-Measurement PWA',
    size: 'feature',
    status: 'Anonymised client',
    line: 'I built a camera-based measurement PWA for a health-tech startup, AU.',
    stat: 'AUD 1,950',
    statLabel: 'Project total',
    video: {
      webm: '/tile-video/pwa.webm',
      mp4: '/tile-video/pwa.mp4',
      poster: '/tile-video/pwa-poster.webp',
    },
    problem:
      'The app shipped a hardcoded Bodygram API key in the client bundle, and fell back to fake measurement numbers whenever the API call failed, so a broken integration quietly looked like a working one.',
    built:
      'I built a Cloudflare Worker token proxy that sits between the PWA and the Bodygram API. The key never reaches the client, and I removed the fake-measurement fallback so a failure now fails honestly instead of hiding.',
    outcome:
      'I validated it end to end on iPhone: three body measurements landed at 99.5, 82.8 and 101.2 cm. Contract was AUD 1,400 (M1 1,200 plus M2 200) plus a further AUD 550 change request, for a AUD 1,950 project total, paid in full.',
    figures: [
      { value: 'AUD 1,950', label: 'Project total, paid in full' },
      { value: '99.5 / 82.8 / 101.2', label: 'CM, validated on iPhone' },
    ],
    process: {
      stack: 'PWA in vanilla JavaScript, Cloudflare Workers, Bodygram API',
      approach:
        'I reviewed the agent-assisted code with Claude Code before handover, reading for what happens when a call fails rather than testing only the happy path.',
      caught:
        'A vendor key shipped in client-side JavaScript, and a silent fallback that returned plausible invented measurements instead of an error. Both looked fine in a demo.',
    },
    url: null,
  },
  {
    slug: 'arvo-demo-studio',
    name: 'ARVO Demo Studio',
    size: 'feature',
    status: 'Live',
    line: 'I shipped a scroll-driven three.js demo site, live and clickable.',
    stat: '108 KB',
    statLabel: 'Gzip main bundle',
    url: 'https://cwl-demo-studio-closingwithlennard.vercel.app',
    repo: repoUrl('arvo-demo-studio'),
    // The chrome reveal that plays on the live ARVO site, re-encoded for the tile.
    video: {
      webm: '/tile-video/arvo.webm',
      mp4: '/tile-video/arvo.mp4',
      poster: '/tile-video/arvo-poster.webp',
    },
    problem:
      'A cinematic, scroll-driven 3D demo needed to earn its motion budget instead of shipping the multi-megabyte bundle three.js sites usually carry.',
    built:
      'I code-split three.js into a lazy 185 KB chunk, compressed the GLB with draco down to 147 KB, and built a 121-frame WebP scroll-scrub sequence at 1.5 MB to stand in for video.',
    outcome:
      'It ships with a 108 KB gzip main bundle, builds in 2.9s, zero console errors. I never ran Lighthouse against it, so I am not claiming a score here, only what I actually measured.',
    figures: [
      { value: '108 KB', label: 'Main bundle, gzip' },
      { value: '185 KB', label: 'three.js chunk, lazy' },
      { value: '147 KB', label: 'GLB, draco-compressed' },
      { value: '121', label: 'WebP scroll-scrub frames' },
      { value: '2.9s', label: 'Build time' },
      { value: '0', label: 'Console errors' },
    ],
    process: {
      stack: 'React, Vite, three.js, draco, WebP frame sequence, Vercel',
      approach:
        'Built from scratch with Claude Code against a motion budget: every effect had to justify its bytes, and the figures on this page are read from the build output, not estimated.',
      caught:
        'A deploy run without linking the folder first created a stray project instead of updating the site. I deleted it and now link before every deploy.',
    },
  },
  {
    slug: 'trading-signal-engine',
    name: 'Trading Signal Engine',
    size: 'wide',
    status: 'Paper trading, testnet only',
    line: 'I built an automated signal engine, paper trading and testnet only.',
    stat: '246 / 246',
    statLabel: 'Tests passing',
    video: {
      webm: '/tile-video/trading.webm',
      mp4: '/tile-video/trading.mp4',
      poster: '/tile-video/trading-poster.webp',
    },
    problem:
      'An automated signal engine has to survive concurrent access and bad state without silently corrupting its own trade log, long before it is ever trusted with real capital.',
    built:
      'I built a signal-to-order pipeline with dated signal files, an audit log, circuit-breaker state and a reconciliation pass that compares the engine’s own ledger against the broker’s books, backed by a suite run entirely against paper trading and testnet.',
    outcome:
      '246 of 246 tests pass, verified 4 Sep 2026, up from 152 with one open failure a month earlier. The failure was a Windows file-lock concurrency race in the order guard; it took three attempts to reproduce reliably before it could be fixed. No real capital has touched this system.',
    figures: [
      { value: '246 / 246', label: 'Tests passing' },
      { value: '0', label: 'Known failures' },
      { value: '18', label: 'Dated signal files' },
    ],
    process: {
      stack: 'Python, pytest, broker testnet APIs, Windows Task Scheduler',
      approach:
        'I built the engine with Claude Code and kept the decision evidence separate from the test count: before signing anything off I ran a backtest across the equity universe.',
      caught:
        'With every unit test green, the backtest of the equity strategy came back at minus 53, minus 56 and minus 109 percent with a 0 percent win rate. The tests measured the code, not the strategy. I set the equity side to advisory only.',
    },
    url: null,
  },
  {
    slug: 'reel-intelligence-pipeline',
    name: 'Reel Intelligence Pipeline',
    size: 'tall',
    status: 'Personal knowledge base',
    line: 'I turned 6,050 saved Instagram posts into a queryable knowledge base.',
    stat: '6,050',
    statLabel: 'Posts indexed',
    video: {
      webm: '/tile-video/reel.webm',
      mp4: '/tile-video/reel.mp4',
      poster: '/tile-video/reel-poster.webp',
    },
    problem:
      'Five years of saved Instagram posts, 2021 to 2026, sat in one flat list with no author, no type and no topic. At that size an archive stops being reference material and becomes a pile.',
    built:
      'I built a sync that lifts every saved post into a structured database with author, media type, caption, collection and saved date, then a tagging pass that sorted the reels into genre maps of contained notes.',
    outcome:
      '6,050 posts across 3,530 distinct accounts, 5,878 of them reels, spanning 30 Apr 2021 to 25 Jun 2026, organised into 23 genre maps. Honest caveat: 6,048 of the 6,050 rows are still marked New. The index exists, the review pass is the part I am building next.',
    figures: [
      { value: '6,050', label: 'Posts indexed' },
      { value: '3,530', label: 'Distinct accounts' },
      { value: '5,878', label: 'Reels' },
      { value: '23', label: 'Genre maps' },
    ],
    process: {
      stack: 'Python, Notion API, Linux VPS with cron, Obsidian',
      approach:
        'I traced the run path with Claude Code from the scheduled job down to the API calls, then moved the service from my laptop to a VPS and made the batches resumable.',
      caught:
        'The sync reported success on every run while writing nothing for eight days. Connection errors were retried and then swallowed with exit code 0, and eight duplicate scheduled tasks were racing each other. The agent kept proposing fixes inside the script; the duplicates I found by listing the scheduler myself.',
    },
    url: null,
  },
  {
    slug: 'lead-engine',
    name: 'Lead Engine',
    size: 'tall',
    status: 'Internal tool',
    line: 'I built a scraper that finds local businesses with no website and enriches them.',
    stat: '152',
    statLabel: 'Leads enriched',
    video: {
      webm: '/tile-video/lead.webm',
      mp4: '/tile-video/lead.mp4',
      poster: '/tile-video/lead-poster.webp',
    },
    problem:
      'I needed a list of Sydney businesses that have no website of their own, with enough contact detail to act on, from a directory that serves an empty page to anything that does not look like a browser.',
    built:
      'I built a discovery and enrichment pipeline in Python that reads listing pages, keeps only businesses without a site, enriches each from its profile and writes a sheet-ready file. A Google Apps Script adds status dropdowns, calendar booking and meeting links to the sheet.',
    outcome:
      '152 leads across 30 categories: phone on 98.7 percent, street address on 96.1 percent, a social profile on 23 percent. Honest caveat: only 7.2 percent have an email address and none have a business number yet, so this is a call list, not a mailing list.',
    figures: [
      { value: '152', label: 'Leads enriched' },
      { value: '30', label: 'Categories' },
      { value: '98.7%', label: 'With phone' },
      { value: '96.1%', label: 'With street address' },
      { value: '7.2%', label: 'With email' },
    ],
    process: {
      stack: 'Python 3.14, Scrapling, lxml, Google Apps Script',
      approach:
        'Built with Claude Code on an 8 GB machine, so no browser engine: every fetch goes through a TLS-impersonating HTTP client, and I kept a checkpoint file of hard-won findings so a new session never re-derives them.',
      caught:
        'Substring matching on domains classified a real company website as a social profile, because the short domain of a social network was contained in the company domain. That put a business with a website on the list. Fixed with exact and suffix matching.',
    },
    url: null,
    repo: repoUrl('lead-engine'),
  },
  {
    slug: 'agent-output-audit',
    name: 'Agent Output Audit',
    size: 'wide',
    status: 'Built with Claude Code',
    line: 'I audited agent-written copy against source files and cut every claim it could not back.',
    stat: '29',
    statLabel: 'Unsupported claims removed',
    problem:
      'I had Claude Code draft case-study copy for four of my own projects. It read well, and that was the risk: an agent fills gaps with the statistically likely claim and never flags its own uncertainty.',
    built:
      'Instead of proofreading, I ran a structured fact audit as a writer, critic and synthesiser loop. Each project got its own pass, every sentence had to resolve to a fact in my source files, and anything that did not was cut rather than softened.',
    outcome:
      '29 unsupported statements removed: 4 in the measurement PWA copy, 8 in the trading copy, 10 in the sync pipeline copy and 7 in my bio. One was a fabricated citation to a source that did not exist. The case studies on this page are what survived that audit.',
    figures: [
      { value: '29', label: 'Unsupported claims removed' },
      { value: '4', label: 'Projects audited' },
      { value: '1', label: 'Fabricated citation caught' },
    ],
    process: {
      stack: 'Claude Code, writer, critic and synthesiser loop, Markdown source files',
      approach:
        'The verification pass was built into the structure of the run, not requested politely in the prompt: a second agent pass was adversarial to the first, and an unsupported sentence was deleted, never reworded.',
      caught:
        'The failure mode was not lying, it was smooth interpolation. The agent wrote the claim that was statistically likely, including implied results and a source that did not exist.',
    },
    url: null,
  },
]

// Bento span, keyed by item.size rather than array position, so the grid
// mechanism survives reordering. Feature cells are the largest (the measurement PWA, ARVO):
// they stay full-width even on a 2-col mobile grid. Wide and tall only kick
// in at md, matching the rest of the site's breakpoint. grid-flow-dense on
// the container packs everything else around them.
const SPAN_BY_SIZE = {
  feature: 'col-span-2 row-span-2',
  wide: 'md:col-span-2',
  tall: 'md:row-span-2',
  default: '',
}

// How far up from the bottom edge the tile loop stops, so it never runs under
// the title block. Double-height tiles have room to spare; single-row tiles
// give half their height to the copy.
const ANIMATION_INSET_BY_SIZE = {
  feature: 'bottom-[30%]',
  tall: 'bottom-[32%]',
  wide: 'bottom-[52%]',
  default: 'bottom-[52%]',
}

function IconArrowUpRight({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClose({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// Tasteful placeholder for tiles that have no photography yet: a token-built
// dot grid over bg-elevated, plus a large ghost index number. Texture and
// hierarchy from the design system itself, not a broken <img> or a flat
// grey box. Brightens on hover/focus via the ancestor button's "group" class
// (pure CSS, no JS state) unless emphasized forces the bright variant, which
// the modal banner uses since it is never hovered.
function TilePlaceholder({ index, emphasized = false }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={
          'absolute inset-0 bg-[image:radial-gradient(circle,rgba(var(--label-triplet),0.16)_1px,transparent_1px)] bg-[size:15px_15px] transition-opacity duration-300 ' +
          (emphasized ? 'opacity-90' : 'opacity-50 group-hover:opacity-90 group-focus-visible:opacity-90')
        }
      />
      <span
        aria-hidden="true"
        className={
          'absolute -right-2 -bottom-6 select-none font-mono font-semibold leading-none text-[4.5rem] sm:text-[5.5rem] transition-colors duration-300 ' +
          (emphasized ? 'text-label-3' : 'text-label-4 group-hover:text-label-3 group-focus-visible:text-label-3')
        }
      >
        {String(index + 1).padStart(2, '0')}
      </span>
    </>
  )
}

// Small outbound link that sits on top of the tile button; stopPropagation
// keeps a click from also opening the case-study modal.
function TilePill({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="mono-label inline-flex cursor-pointer items-center gap-1 rounded-full border border-line bg-bg/70 px-3 py-1.5 text-label-2 backdrop-blur-sm transition-colors duration-300 hover:border-accent hover:text-accent"
    >
      {label}
      <IconArrowUpRight className="h-3 w-3" />
    </a>
  )
}

function WorkCard({ item, index, onOpen, reduceMotion }) {
  const isFeature = item.size === 'feature'

  const enterProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-8%' },
        transition: { duration: 0.6, delay: (index % 6) * 0.08, ease: [0.16, 1, 0.3, 1] },
      }

  return (
    <motion.div {...enterProps} className={'relative ' + (SPAN_BY_SIZE[item.size] || '')}>
      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`View ${item.name} case study`}
        className="group absolute inset-0 block h-full w-full cursor-pointer overflow-hidden rounded-sm border border-line bg-elevated text-left transition-colors duration-300 hover:border-accent focus-visible:border-accent"
      >
        {item.video && (
          <div className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
            <TileVideo video={item.video} reduceMotion={reduceMotion} />
          </div>
        )}

        {hasTileAnimation(item.slug) ? (
          <>
            {/* the loop owns the upper part of the tile; a fade keeps the copy legible */}
            <div
              className={
                'absolute inset-x-0 top-9 opacity-80 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 ' +
                (ANIMATION_INSET_BY_SIZE[item.size] || ANIMATION_INSET_BY_SIZE.default)
              }
            >
              <TileAnimation slug={item.slug} reduceMotion={reduceMotion} />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/85 to-transparent"
            />
          </>
        ) : (
          <TilePlaceholder index={index} />
        )}

        <span className="mono-label absolute left-4 top-4 text-label-3">{item.status}</span>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3
            className={
              'flex items-center gap-1.5 font-sans font-semibold leading-tight text-label ' +
              (isFeature ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl')
            }
          >
            <span>{item.name}</span>
            {/* hover/focus affordance lives inline with the heading, in normal
                flow, so it never collides with the stat row that is also
                anchored to the card's bottom edge on small tiles */}
            <IconArrowUpRight
              aria-hidden="true"
              className="h-[0.55em] w-[0.55em] shrink-0 -translate-x-1 text-accent opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            />
          </h3>
          <p className="mt-1.5 max-w-[36ch] text-sm leading-snug text-label-2">{item.line}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="mono-label text-accent">{item.stat}</span>
            <span className="mono-label text-label-4">{item.statLabel}</span>
          </div>
        </div>
      </button>

      {(item.url || item.repo) && (
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {item.url && <TilePill href={item.url} label="Live" />}
          {item.repo && <TilePill href={item.repo} label="Code" />}
        </div>
      )}
    </motion.div>
  )
}

function ModalLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mono-label inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-label transition-colors duration-300 hover:border-accent hover:text-accent"
    >
      {label}
      <IconArrowUpRight className="h-3.5 w-3.5" />
    </a>
  )
}

function WorkModal({ item, onClose, reduceMotion }) {
  const closeBtnRef = useRef(null)

  useEffect(() => {
    closeBtnRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const panelProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 24, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 24, scale: 0.97 },
      }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-modal-title"
      className="fixed inset-0 z-70 flex items-center justify-center px-4 py-8 md:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        {...panelProps}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-line bg-bg shadow-2xl"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close case study"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line bg-bg/80 text-label transition-colors duration-300 hover:border-accent hover:text-accent"
        >
          <IconClose className="h-4 w-4" />
        </button>

        <div className="relative h-40 overflow-hidden border-b border-line bg-elevated sm:h-48">
          {item.video && (
            <div className="absolute inset-0 opacity-80">
              <TileVideo video={item.video} reduceMotion={reduceMotion} />
            </div>
          )}
          {hasTileAnimation(item.slug) ? (
            <div className="absolute inset-x-0 inset-y-3">
              <TileAnimation slug={item.slug} reduceMotion={reduceMotion} />
            </div>
          ) : (
            <TilePlaceholder index={0} emphasized />
          )}
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
            <div>
              <span className="mono-label text-accent">{item.status}</span>
              <h2 id="work-modal-title" className="mt-1 font-sans text-3xl font-semibold leading-tight text-label">
                {item.name}
              </h2>
              <p className="mt-2 max-w-md text-label-2">{item.line}</p>
            </div>
            {(item.url || item.repo) && (
              <div className="flex shrink-0 flex-wrap gap-2">
                {item.url && <ModalLink href={item.url} label="Visit live" />}
                {item.repo && <ModalLink href={item.repo} label="View code" />}
              </div>
            )}
          </div>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="mono-label text-label-3">Problem</dt>
              <dd className="mt-1.5 leading-relaxed text-label-2">{item.problem}</dd>
            </div>
            <div>
              <dt className="mono-label text-label-3">What I built</dt>
              <dd className="mt-1.5 leading-relaxed text-label-2">{item.built}</dd>
            </div>
            <div>
              <dt className="mono-label text-label-3">Outcome</dt>
              <dd className="mt-1.5 leading-relaxed text-label-2">{item.outcome}</dd>
            </div>
          </dl>

          {item.process && (
            <div className="mt-7 rounded-sm border border-line bg-elevated p-4 md:p-5">
              <span className="mono-label text-accent">How I built it with Claude Code</span>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="mono-label text-label-3">Stack</dt>
                  <dd className="mt-1 font-mono text-sm leading-relaxed text-label-2">{item.process.stack}</dd>
                </div>
                <div>
                  <dt className="mono-label text-label-3">Approach</dt>
                  <dd className="mt-1 leading-relaxed text-label-2">{item.process.approach}</dd>
                </div>
                <div>
                  <dt className="mono-label text-label-3">What went wrong, and what I caught</dt>
                  <dd className="mt-1 leading-relaxed text-label-2">{item.process.caught}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-7">
            <span className="mono-label text-label-3">Verified figures</span>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {item.figures.map((figure) => (
                <div key={figure.label} className="rounded-sm border border-line bg-elevated p-3">
                  <div className="font-mono text-base leading-snug text-accent sm:text-lg">{figure.value}</div>
                  <div className="mono-label mt-1 text-label-4">{figure.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Work() {
  const reduceMotion = useReducedMotion()
  const [activeItem, setActiveItem] = useState(null)

  const openItem = useCallback((item) => setActiveItem(item), [])
  const closeItem = useCallback(() => setActiveItem(null), [])

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 text-label md:px-12 lg:px-24">
      <PageHeader label="Selected work" title="Work" />
      <p className="mb-14 max-w-xl text-lg leading-relaxed text-label-2">
        Six projects, all built with Claude Code, each with an artefact behind every number on the page. The
        loops in the tiles are coded from those numbers. Underneath run short ambient clips I generated with
        Higgsfield from each project's key art, except ARVO, which plays the reveal from the live site. Open a
        tile to see how it was built and what went wrong along the way.
      </p>

      <div className="grid auto-rows-[190px] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[210px] md:auto-rows-[230px] md:grid-cols-4 md:gap-4">
        {WORK_ITEMS.map((item, index) => (
          <WorkCard key={item.slug} item={item} index={index} onOpen={openItem} reduceMotion={reduceMotion} />
        ))}
      </div>

      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        <span className="mono-label text-label-3">
          Recent projects on request ·{' '}
          <a
            href={repoUrl('portfolio-site')}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line underline-offset-4 transition-colors duration-300 hover:text-accent"
          >
            Code of this site
          </a>
        </span>
        <a
          href={PLATFORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mono-label inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-line px-5 py-2.5 text-label transition-colors duration-300 hover:border-accent hover:text-accent"
        >
          {PLATFORM_LABEL}
        </a>
      </div>

      <AnimatePresence>
        {activeItem && <WorkModal item={activeItem} onClose={closeItem} reduceMotion={reduceMotion} />}
      </AnimatePresence>
    </div>
  )
}
