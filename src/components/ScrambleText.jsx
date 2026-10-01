import { useEffect, useRef, useState } from 'react'

/*
 * ScrambleText — a headline that decodes character by character on view.
 *
 * One shared 40ms ticker drives every instance (not a timer per element), so a
 * page full of scrambling labels costs a single interval. Each instance
 * subscribes when it scrolls into view and unsubscribes once settled.
 * prefers-reduced-motion short-circuits to the final text with no animation.
 */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>[]{}=+*'
const TICK_MS = 40

// --- shared ticker ------------------------------------------------------------
const subscribers = new Set()
let timer = null

function ensureTicker() {
  if (timer !== null) return
  timer = setInterval(() => {
    for (const fn of subscribers) fn()
    if (subscribers.size === 0) {
      clearInterval(timer)
      timer = null
    }
  }, TICK_MS)
}

function subscribe(fn) {
  subscribers.add(fn)
  ensureTicker()
  return () => subscribers.delete(fn)
}

export default function ScrambleText({ text, as: Tag = 'span', className = '', revealPerTick = 1, startDelayMs = 0 }) {
  const [display, setDisplay] = useState(text)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setDisplay(text)
      return
    }

    let revealed = 0
    let started = false
    let unsub = null

    const step = () => {
      const out = text
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' '
          if (i < revealed) return ch
          return GLYPHS[Math.floor((performance.now() / TICK_MS + i) % GLYPHS.length)]
        })
        .join('')
      setDisplay(out)
      revealed += revealPerTick
      if (revealed >= text.length) {
        setDisplay(text)
        if (unsub) unsub()
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true
          const begin = () => { unsub = subscribe(step) }
          if (startDelayMs > 0) setTimeout(begin, startDelayMs)
          else begin()
          io.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    io.observe(el)

    return () => {
      io.disconnect()
      if (unsub) unsub()
    }
  }, [text, revealPerTick, startDelayMs])

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </Tag>
  )
}
