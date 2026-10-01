import { useReducedMotion } from 'motion/react'

/*
 * useReduced — reduced-motion state, with a preview escape hatch.
 *
 * Returns the real prefers-reduced-motion value so genuine visitors are always
 * respected. The one exception: append ?motion=force to the URL and it returns
 * false, so the author can preview the full motion on a machine that has
 * reduced-motion switched on system-wide. Never document this to end users.
 */
export function forceMotion() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('motion') === 'force'
}

export function useReduced() {
  const real = useReducedMotion()
  if (forceMotion()) return false
  return real
}
