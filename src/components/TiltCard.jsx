import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useReduced } from '../lib/useReduced.js'

/*
 * TiltCard — subtle 3D tilt toward the cursor plus an accent spotlight that
 * follows the pointer across the surface. Pointer position drives motion values
 * (never React state, so no per-frame re-render), springed for weight.
 *
 * accentRgb is the station's own accent ("31,227,196" | "245,32,139"), so the
 * spotlight matches the station. reduced-motion / no pointer => flat, no tilt.
 */
export default function TiltCard({ accentRgb = '31,227,196', className = '', children }) {
  const ref = useRef(null)
  const reduced = useReduced()

  const px = useMotionValue(50)
  const py = useMotionValue(50)
  const rx = useSpring(useTransform(py, [0, 100], [6, -6]), { stiffness: 150, damping: 18 })
  const ry = useSpring(useTransform(px, [0, 100], [-6, 6]), { stiffness: 150, damping: 18 })

  const onMove = (e) => {
    if (reduced) return
    const r = ref.current.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 100)
    py.set(((e.clientY - r.top) / r.height) * 100)
  }
  const onLeave = () => { px.set(50); py.set(50) }

  const spotlight = useTransform(
    [px, py],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(${accentRgb},0.22), transparent 55%)`
  )

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={reduced ? {} : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={`group relative [transform-style:preserve-3d] ${className}`}
    >
      {children}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          style={{ background: spotlight }}
          className="pointer-events-none absolute inset-0 z-10 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </motion.div>
  )
}
