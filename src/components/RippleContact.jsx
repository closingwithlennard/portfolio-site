import { motion } from 'motion/react'
import MagneticButton from './MagneticButton.jsx'
import { PLATFORM_URL, PLATFORM_ALT_URL, PLATFORM_ALT_LABEL } from './Nav.jsx'

// Contact section. Ripple rings pulse outward behind the heading.
// Transform/opacity only; reduced-motion gets static rings.

const EMAIL = 'closingwithlennard@gmail.com'
const CALENDLY = 'https://calendly.com/closingwithlennard/30min'

// Primary goal per design-direction.md: "visitor opens the platform profile".
// Sourced from Nav so the nav button and this button can never drift apart.
const PLATFORM = { label: 'View my Upwork profile', href: PLATFORM_URL }

function Rings() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 grid place-items-center motion-reduce:hidden"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.6, opacity: 0.4 }}
          whileInView={{ scale: 1.6, opacity: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 4, delay: i * 1.2, repeat: Infinity, ease: 'easeOut' }}
          className="col-start-1 row-start-1 block h-[min(70vw,34rem)] w-[min(70vw,34rem)] rounded-full"
          style={{ border: '1px solid rgba(31,227,196,0.28)' }}
        />
      ))}
    </div>
  )
}

const inputCls =
  'min-h-[48px] rounded-xl border border-line bg-elevated px-4 text-label ' +
  'transition-colors duration-200 focus:border-turq focus:outline-none ' +
  'hover:border-[rgba(244,243,238,0.24)]'

export default function RippleContact() {
  const primary = PLATFORM ?? { label: 'Book a 30 minute call', href: CALENDLY }

  return (
    <section id="contact" className="relative overflow-hidden px-5 py-32 text-center md:px-12 lg:px-24">
      <Rings />

      <div className="relative">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(2.6rem,6vw,6rem)] font-semibold leading-none tracking-tight text-label"
        >
          Let's build{' '}
          <span className="bg-[linear-gradient(120deg,var(--color-magenta),var(--color-turq))] bg-clip-text text-transparent">
            something
          </span>
        </motion.h2>

        <p className="mx-auto mt-6 mb-10 max-w-md text-label-2">
          Tell me what you are trying to ship. I reply within a day, in your timezone or mine.
        </p>

        <MagneticButton href={primary.href} target="_blank" rel="noopener noreferrer" variant="primary" className="mb-6">
          {primary.label}
        </MagneticButton>

        {/* Secondary routes. Text links on purpose: one primary action only. */}
        <div className="mono-label mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-label-3">
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] cursor-pointer items-center underline decoration-line underline-offset-4 transition-colors hover:text-turq"
          >
            book a 30 minute call
          </a>
          <a
            href={PLATFORM_ALT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] cursor-pointer items-center underline decoration-line underline-offset-4 transition-colors hover:text-turq"
          >
            {PLATFORM_ALT_LABEL}
          </a>
        </div>

        <p className="mono-label mb-6 text-label-3">or send the details</p>

        {/* Composes an email in the visitor's own client. Nothing is stored or transmitted by this site. */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            const body =
              'Name: ' + data.get('name') + '\n' +
              'Email: ' + data.get('email') + '\n\n' +
              data.get('details')
            window.location.href =
              'mailto:' + EMAIL +
              '?subject=' + encodeURIComponent('Project enquiry from ' + data.get('name')) +
              '&body=' + encodeURIComponent(body)
          }}
          className="mx-auto grid max-w-lg gap-4 text-left"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="mono-label text-label-3">Name</span>
              <input name="name" required autoComplete="name" className={inputCls} />
            </label>
            <label className="grid gap-2">
              <span className="mono-label text-label-3">Email</span>
              <input name="email" type="email" required autoComplete="email" className={inputCls} />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="mono-label text-label-3">Project details</span>
            <textarea name="details" rows={4} required className={`${inputCls} resize-y py-3`} />
          </label>

          <div className="mt-2 flex justify-center">
            <MagneticButton type="submit" variant="primary">Send</MagneticButton>
          </div>

          <p className="mt-2 text-center text-xs text-label-4">
            <a
              href={'mailto:' + EMAIL}
              className="cursor-pointer underline decoration-line underline-offset-4 transition-colors hover:text-turq"
            >
              {EMAIL}
            </a>
          </p>
        </form>
      </div>
    </section>
  )
}
