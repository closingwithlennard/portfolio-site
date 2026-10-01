import { motion } from 'motion/react'
import { useReduced } from '../lib/useReduced.js'

/*
 * Services — what a buyer can actually hire me for. Answers "can this person
 * solve my problem" in the funnel, before the contact section. Rows, not the
 * banned three-equal-cards. Each row reveals on scroll and lights its accent on
 * hover. Copy stays concrete and honest: only things backed by the work above.
 */

const SERVICES = [
  {
    n: '01',
    title: 'Agentic systems & automation',
    line: 'Autonomous agents and data pipelines that run on a schedule, without someone watching them.',
    rgb: '31,227,196',
  },
  {
    n: '02',
    title: 'Full-stack web & 3D',
    line: 'React apps, the API behind them, and scroll-driven 3D interfaces. The scraper, the server, the surface.',
    rgb: '245,32,139',
  },
  {
    n: '03',
    title: 'Scraping & data intelligence',
    line: 'Compliance-aware scrapers and LLM pipelines that turn messy sources into something structured and usable.',
    rgb: '31,227,196',
  },
  {
    n: '04',
    title: 'Security-minded delivery',
    line: 'Keys server-side, tests before I trust anything, and a written record of why each decision was made.',
    rgb: '245,32,139',
  },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

export default function Services() {
  const reduced = useReduced()
  return (
    <section
      id="services"
      aria-label="What I can build for you"
      className="relative px-6 py-28 md:px-12 lg:px-24"
      style={{ background: 'linear-gradient(180deg, rgba(3,10,10,0.82) 0%, rgba(3,10,10,0.62) 100%)' }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl font-display text-[clamp(1.9rem,4vw,3.4rem)] font-semibold leading-[1.03] tracking-tight text-label"
        >
          What I can build for you.
        </motion.h2>

        <motion.div
          variants={reduced ? undefined : container}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'show'}
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 border-t border-line"
        >
          {SERVICES.map((s) => (
            <motion.div
              key={s.n}
              variants={reduced ? undefined : item}
              className="group grid grid-cols-1 gap-3 border-b border-line py-8 md:grid-cols-12 md:items-baseline md:gap-8"
            >
              <span className="mono-label text-label-4 md:col-span-1">{s.n}</span>
              <h3
                className="font-display text-[clamp(1.3rem,2.2vw,1.9rem)] font-semibold tracking-tight text-label md:col-span-5"
                style={{ transition: 'color .3s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = `rgb(${s.rgb})`)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                {s.title}
              </h3>
              <p className="max-w-xl text-label-2 leading-relaxed md:col-span-6">{s.line}</p>
            </motion.div>
          ))}
        </motion.div>

        <p className="mono-label mt-10 text-label-3">
          not sure which one fits?{' '}
          <a href="#contact" className="text-turq hover:underline">tell me the problem</a>
        </p>
      </div>
    </section>
  )
}
