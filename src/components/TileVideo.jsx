import { useEffect, useRef } from 'react'

/**
 * Muted background loop for a work tile. It only plays while the tile is on
 * screen, so a grid of clips never decodes video the visitor cannot see, and
 * under prefers-reduced-motion it stays on its poster frame.
 *
 * video: { webm, mp4, poster } with paths relative to /public.
 */
export default function TileVideo({ video, reduceMotion = false, className = '' }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const node = videoRef.current
    if (!node || reduceMotion) return undefined

    let visible = false
    // play() rejects when the browser blocks autoplay; the poster stays up then.
    const tryPlay = () => {
      if (visible) node.play().catch(() => {})
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) tryPlay()
      else node.pause()
    })
    observer.observe(node)
    // An early play() can land before any data or while the tab is hidden, so
    // retry once the first frame is decodable and whenever the tab comes back.
    node.addEventListener('loadeddata', tryPlay)
    document.addEventListener('visibilitychange', tryPlay)

    return () => {
      observer.disconnect()
      node.removeEventListener('loadeddata', tryPlay)
      document.removeEventListener('visibilitychange', tryPlay)
    }
  }, [reduceMotion])

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      autoPlay={!reduceMotion}
      muted
      loop
      playsInline
      preload={reduceMotion ? 'none' : 'metadata'}
      poster={video.poster}
      className={'h-full w-full object-cover ' + className}
    >
      {video.webm && <source src={video.webm} type="video/webm" />}
      {video.mp4 && <source src={video.mp4} type="video/mp4" />}
    </video>
  )
}
