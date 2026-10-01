import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { createSunsetEnvTexture } from '../lib/sunsetEnv.js'

// Chrome ribbon: the Blender-sculpture spirit as ONE continuous liquid-metal
// band that travels the whole site. Scroll drives its waveform and drift;
// a spark stream (particle trail, concept-B spirit) rides the band.
// Desktop only, pointer-events-none, pauses when tab hidden.
// Reveals only after the hero cinema has scrolled past.
const MOBILE_QUERY = '(max-width: 719px)'

export default function ChromeRibbon() {
  const mountRef = useRef(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    if (window.matchMedia(MOBILE_QUERY).matches) return
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let cleanup

    async function boot() {
      const THREE = await import('three')
      if (disposed) return

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 50)
      camera.position.set(0, 0, 10)

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
      renderer.setSize(innerWidth, innerHeight)
      renderer.setClearColor(0x000000, 0)
      mount.appendChild(renderer.domElement)

      scene.environment = createSunsetEnvTexture(THREE, renderer)

      const emeraldLight = new THREE.DirectionalLight(0x059669, 1.2)
      emeraldLight.position.set(-2, 3, 5)
      scene.add(emeraldLight)

      const chrome = new THREE.MeshPhysicalMaterial({
        color: 0xf5f5f4,
        metalness: 1.0,
        roughness: 0.07,
        envMapIntensity: 1.7,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1,
      })

      // right screen edge in world units at the z=0 plane
      const worldHalf = () => {
        const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
        return { x: h * camera.aspect, y: h }
      }

      const CTRL = 14
      const SEGMENTS = 140
      const ctrl = Array.from({ length: CTRL }, () => new THREE.Vector3(0, 0, 0))
      const curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5)

      let scrollProgress = 0
      let time = 0
      let velScroll = 0
      let lastScroll = window.scrollY
      let revealed = 0

      // the band is anchored INSIDE the docked globe (bottom-right companion)
      // and rises across the page; scrolling pulls more metal out of it,
      // the free end pendulums softly right -> left -> right
      function updateCurve() {
        const { x: hx, y: hy } = worldHalf()
        const anchorX = hx * 0.87
        const anchorY = -hy * 0.87
        for (let i = 0; i < CTRL; i++) {
          const t = i / (CTRL - 1)
          const spread = Math.min(t * 2.4, 1) // near the globe it stays put
          const y = anchorY + t * hy * 2.7
          const phase = t * 5.2 + scrollProgress * 9 + time * 0.22
          const meander = Math.sin(phase) * hx * 0.14 * spread
          const pendulum = Math.sin(scrollProgress * 5.5 + t * 1.6 + 0.7) * 0.55
          const x = anchorX * (1 - spread) + hx * pendulum * spread + meander
          const z = Math.cos(phase * 0.8) * 1.4 * spread
          ctrl[i].set(x, y, z)
        }
      }

      let ribbonMesh = null
      function buildRibbon() {
        const geo = new THREE.TubeGeometry(curve, SEGMENTS, 0.1, 10, false)
        // draw only the revealed fraction: the metal is physically pulled out
        const eased = revealed * revealed * (3 - 2 * revealed)
        geo.setDrawRange(0, Math.floor(geo.index.count * eased))
        if (ribbonMesh) {
          ribbonMesh.geometry.dispose()
          ribbonMesh.geometry = geo
        } else {
          ribbonMesh = new THREE.Mesh(geo, chrome)
          scene.add(ribbonMesh)
        }
      }

      // spark stream riding the band
      const SPARKS = 120
      const sparkT = new Float32Array(SPARKS)
      for (let i = 0; i < SPARKS; i++) sparkT[i] = Math.random()
      const sparkPos = new Float32Array(SPARKS * 3)
      const sparkGeo = new THREE.BufferGeometry()
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3))
      const sparkMat = new THREE.PointsMaterial({
        color: 0x6ee7b7,
        size: 0.06,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
      const sparks = new THREE.Points(sparkGeo, sparkMat)
      scene.add(sparks)

      const tmp = new THREE.Vector3()
      function updateSparks(delta) {
        for (let i = 0; i < SPARKS; i++) {
          sparkT[i] = (sparkT[i] + delta * 0.05 + Math.abs(velScroll) * 0.0004) % 1
          curve.getPointAt(sparkT[i] * Math.max(revealed, 0.001), tmp)
          const j = i * 3
          sparkPos[j] = tmp.x + Math.sin(i * 12.9 + time * 2) * 0.12
          sparkPos[j + 1] = tmp.y + Math.cos(i * 7.7 + time * 1.6) * 0.12
          sparkPos[j + 2] = tmp.z + 0.15
        }
        sparkGeo.attributes.position.needsUpdate = true
      }

      function readScroll() {
        const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1)
        scrollProgress = window.scrollY / max
        velScroll = window.scrollY - lastScroll
        lastScroll = window.scrollY
        revealed = Math.min(Math.max((window.scrollY - innerHeight * 0.78) / (innerHeight * 0.55), 0), 1)
        // no crossfade: the band is PULLED out of the globe (length grows), layer snaps visible
        mount.style.opacity = revealed > 0 ? '1' : '0'
      }

      const clock = new THREE.Clock()
      function frame() {
        const delta = Math.min(clock.getDelta(), 0.1)
        time += delta
        readScroll()
        if (revealed <= 0) return // fully hidden above the fold: skip all work
        updateCurve()
        buildRibbon()
        updateSparks(delta)
        renderer.render(scene, camera)
      }

      let rafActive = false
      function setPlaying(next) {
        if (next === rafActive) return
        rafActive = next
        renderer.setAnimationLoop(next ? frame : null)
      }
      setPlaying(!document.hidden)
      const onVis = () => setPlaying(!document.hidden)
      document.addEventListener('visibilitychange', onVis)

      const onResize = () => {
        camera.aspect = innerWidth / innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(innerWidth, innerHeight)
      }
      window.addEventListener('resize', onResize)

      cleanup = () => {
        document.removeEventListener('visibilitychange', onVis)
        window.removeEventListener('resize', onResize)
        renderer.setAnimationLoop(null)
        if (ribbonMesh) ribbonMesh.geometry.dispose()
        chrome.dispose()
        sparkGeo.dispose()
        sparkMat.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }

    boot()
    return () => {
      disposed = true
      if (cleanup) cleanup()
    }
  }, [reduceMotion])

  if (reduceMotion) return null
  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none hidden md:block"
      style={{ opacity: 0 }}
    />
  )
}
