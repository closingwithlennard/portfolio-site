import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { forceMotion } from '../lib/useReduced.js'

/*
 * MagneticButton — the site's one signature interaction.
 *
 * The button eases toward the cursor while hovered (GSAP quickTo, buttery, off
 * the React render cycle) and springs back on leave. Primary variant carries the
 * magenta -> turquoise gradient and an accent glow that blooms under the pointer.
 * Reserved for real CTAs so the move stays special and cheap on an 8 GB machine.
 *
 * Honors reduced-motion: no magnetic pull, static styling. ?motion=force previews it.
 */
export default function MagneticButton({
  href,
  onClick,
  type = 'button',
  children,
  variant = 'primary',
  className = '',
  target,
  rel,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced =
      !forceMotion() && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    const STRENGTH = 0.35

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const mx = e.clientX - (r.left + r.width / 2)
      const my = e.clientY - (r.top + r.height / 2)
      xTo(mx * STRENGTH)
      yTo(my * STRENGTH)
      el.style.setProperty('--px', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--py', `${((e.clientY - r.top) / r.height) * 100}%`)
    }
    const onLeave = () => { xTo(0); yTo(0) }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(el)
    }
  }, [])

  const base =
    'mono-label relative inline-flex min-h-[52px] cursor-pointer items-center justify-center ' +
    'overflow-hidden rounded-full px-9 transition-shadow duration-300 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

  const variants = {
    primary:
      'text-bg bg-[linear-gradient(120deg,var(--color-magenta),var(--color-turq))] ' +
      'shadow-[0_8px_30px_rgba(245,32,139,0.22)] hover:shadow-[0_14px_44px_rgba(31,227,196,0.30)] ' +
      'after:pointer-events-none after:absolute after:inset-0 ' +
      "after:bg-[radial-gradient(circle_at_var(--px,50%)_var(--py,50%),rgba(255,255,255,0.35),transparent_45%)] " +
      'after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300',
    ghost:
      'text-label-2 border border-line hover:text-label hover:border-transparent ' +
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-full " +
      'before:bg-[linear-gradient(120deg,var(--color-magenta),var(--color-turq))] ' +
      'before:opacity-0 hover:before:opacity-15 before:transition-opacity before:duration-300',
  }

  const cls = `${base} ${variants[variant]} ${className}`
  const inner = <span className="relative z-10">{children}</span>

  if (href) {
    return (
      <a ref={ref} href={href} target={target} rel={rel} className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <button ref={ref} type={type} onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}
