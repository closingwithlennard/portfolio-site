import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'

// Primary conversion target for the whole site. Single constant on purpose: one
// edit here updates the nav, the mobile panel and the contact section.
// Tracking params stripped: ?mp_source=share is a share-attribution token, not
// part of the canonical profile URL.
export const PLATFORM_URL = 'https://www.upwork.com/freelancers/~01d9802fd1f1aad387'
export const PLATFORM_LABEL = 'Hire me on Upwork'

// Secondary profile. Referral params stripped for the same reason.
export const PLATFORM_ALT_URL = 'https://contra.com/lennard_capece_hrjmopqg'
export const PLATFORM_ALT_LABEL = 'Contra'

// Public code. Repo links on the Work page are built from this base.
export const GITHUB_URL = 'https://github.com/closingwithlennard'
export const repoUrl = (name) => `${GITHUB_URL}/${name}`

const ROUTES = [
  { to: '/work', label: 'Work' },
  { to: '/about', label: 'About' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close the mobile panel on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // home keeps a transparent top state; every other route needs the bar backing
  // immediately so the label tier stays legible over page content
  const solid = scrolled || pathname !== '/' || open

  const linkClass = ({ isActive }) =>
    'mono-label py-2 transition-colors duration-300 ' +
    (isActive ? 'text-accent' : 'text-label-2 hover:text-label')

  return (
    <header
      className={
        'fixed inset-x-0 top-0 z-50 transition-all duration-500 ' +
        (solid ? 'bg-bg/70 backdrop-blur-md' : '')
      }
    >
      <div className="flex items-center justify-between px-5 py-4 md:px-12">
        <Link to="/" className="mono-label text-label">
          Lennard Capece
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          {ROUTES.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              {label}
            </NavLink>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label py-2 text-label-2 transition-colors duration-300 hover:text-label"
          >
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          <a
            href={PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-line px-5 py-2.5
                       text-label transition-colors duration-300 hover:border-accent hover:text-accent"
          >
            {PLATFORM_LABEL}
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center text-label md:hidden"
          >
            <span
              className={
                'absolute block h-px w-5 bg-current transition-transform duration-300 ' +
                (open ? 'rotate-45' : '-translate-y-1')
              }
            />
            <span
              className={
                'absolute block h-px w-5 bg-current transition-transform duration-300 ' +
                (open ? '-rotate-45' : 'translate-y-1')
              }
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line bg-bg md:hidden"
          >
            <div className="flex flex-col px-5 py-4">
              {ROUTES.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    'border-b border-line py-3 text-2xl transition-colors duration-300 ' +
                    (isActive ? 'text-accent' : 'text-label')
                  }
                >
                  {label}
                </NavLink>
              ))}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-line py-3 text-2xl text-label transition-colors duration-300 hover:text-accent"
              >
                GitHub
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
