import { motion } from 'motion/react'
import ScrambleText from './ScrambleText.jsx'
import MagneticButton from './MagneticButton.jsx'
import { useReduced } from '../lib/useReduced.js'

/*
 * HeroOasis — transparent overlay over the ScrollScrubSpine.
 *
 * The dive video (ScrollScrubSpine, fixed behind everything) is the hero visual
 * now: frame 0 is the oasis surface, and scrolling the page dives in. This
 * component is only the copy that floats over that first stretch of the dive,
 * plus a bottom scrim so the text stays legible over the bright surface frames.
 * No own background image, no mist canvas: the spine owns the motion.
 */
export default function HeroOasis() {
  const reduced = useReduced()

  return (
    <section
      className="relative flex min-h-[100dvh] w-full flex-col justify-end px-5 pb-24 md:px-12 lg:px-24"
      aria-label="Intro"
    >
      {/* legibility scrim over the dive, bottom-weighted */}
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,13,12,0.30) 0%, transparent 30%, rgba(11,13,12,0.55) 78%, rgba(11,13,12,0.92) 100%)',
        }}
      />

      <div className="relative z-10">
        <p className="mono-label mb-6 text-label-3">Remote, GMT+7 / available for remote work</p>

        <ScrambleText
          as="h1"
          text="I build the systems most people only design."
          startDelayMs={400}
          className="max-w-5xl font-display text-[clamp(2.6rem,6.5vw,6rem)] font-semibold leading-[0.98] tracking-tight text-label"
        />

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 max-w-xl text-label-2"
        >
          Autonomous agents, data pipelines and 3D web. I ship the whole thing:
          the scraper, the API, the interface, and the visual language on top of it.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <MagneticButton href="#work" variant="primary">See the work</MagneticButton>
          <MagneticButton href="#contact" variant="ghost">Get in touch</MagneticButton>
        </motion.div>

        <div className="mono-label mt-16 flex items-center gap-3 text-label-4" aria-hidden="true">
          <span>scroll to dive in</span>
          <span className="hero-scroll-cue inline-block h-8 w-px bg-label-4" />
        </div>
      </div>
    </section>
  )
}
