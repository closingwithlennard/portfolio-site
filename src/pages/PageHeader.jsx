import { motion } from 'motion/react'

// Shared page header — same hairline pattern as the PricingMatrix section header:
// top hairline, accent mono-label with dot, serif headline.
export default function PageHeader({ label, title }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap items-baseline gap-4 border-t border-cream/10 pt-4 mb-10"
    >
      <h1 className="font-serif text-[clamp(1.9rem,3.5vw,3.4rem)]">{title}</h1>
    </motion.div>
  )
}
