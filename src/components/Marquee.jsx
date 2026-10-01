import { motion, useScroll, useVelocity, useSpring, useTransform, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion/react'

// Single source for the marquee copy. Separator is a slash: middots are banned
// by the design direction, as are em/en dashes.
const WORDS = 'AGENTS / INTERFACES / PIPELINES / 3D / '

function Row({ words, baseSpeed, className }) {
  const x = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 })
  const factor = useTransform(smooth, [-1500, 0, 1500], [-4, 1, 4], { clamp: false })
  const reduce = useReducedMotion()
  const xPct = useTransform(x, (v) => v + '%')

  useAnimationFrame((_, delta) => {
    if (reduce) return
    const move = baseSpeed * (delta / 1000) * factor.get()
    let next = x.get() + move
    if (next <= -50) next += 50
    if (next > 0) next -= 50
    x.set(next)
  })

  return (
    <div className="overflow-hidden whitespace-nowrap" aria-hidden="true">
      <motion.div style={{ x: xPct }} className="inline-block will-change-transform">
        <span className={'text-[clamp(3rem,7vw,6.5rem)] font-semibold tracking-tight leading-tight ' + className}>
          {words.repeat(4)}
          {words.repeat(4)}
        </span>
      </motion.div>
    </div>
  )
}

export default function Marquee() {
  return (
    <section
      className="bg-elevated py-20 -rotate-2 scale-105"
      aria-label="Agents, interfaces, pipelines, 3D"
    >
      <Row words={WORDS} baseSpeed={-6} className="text-label-2" />
      <Row words={WORDS} baseSpeed={4.5} className="text-label-4" />
    </section>
  )
}
