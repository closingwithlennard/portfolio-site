import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useLang } from '../lang.jsx'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-8%' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
}

function Sculpture() {
  const mountRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    let cleanup = () => {}
    let cancelled = false
    const mount = mountRef.current
    if (!mount) return

    const io = new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      boot()
    }, { threshold: 0.1 })
    io.observe(mount)

    async function boot() {
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
      if (cancelled) return

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
      camera.position.set(0, 0, 4.2)

      const pmrem = new THREE.PMREMGenerator(renderer)
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture

      const accent = new THREE.DirectionalLight(0x059669, 2.2)
      accent.position.set(3, 1.5, 2)
      scene.add(accent)
      const fill = new THREE.DirectionalLight(0xfdfaf6, 0.8)
      fill.position.set(-2, -1, 3)
      scene.add(fill)

      const draco = new DRACOLoader()
      draco.setDecoderPath('/draco/')
      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)

      let mesh = null
      loader.load('/sculpture.glb', (gltf) => {
        mesh = gltf.scene
        mesh.scale.setScalar(1.15)
        scene.add(mesh)
        mount.classList.add('opacity-100')
        if (reduce) renderer.render(scene, camera)
      })

      const size = () => {
        const w = mount.clientWidth, h = mount.clientHeight
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      size()
      window.addEventListener('resize', size, { passive: true })

      let tx = 0, ty = 0
      const onMove = (e) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 0.5
        ty = (e.clientY / window.innerHeight - 0.5) * 0.3
      }
      if (!reduce && window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('pointermove', onMove, { passive: true })
      }

      const clock = new THREE.Clock()
      if (!reduce) {
        renderer.setAnimationLoop(() => {
          if (!mesh) return
          const t = clock.getElapsedTime()
          mesh.rotation.y = t * 0.18 + tx
          mesh.rotation.x = Math.sin(t * 0.12) * 0.08 + ty
          renderer.render(scene, camera)
        })
      }

      cleanup = () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', size)
        window.removeEventListener('pointermove', onMove)
        renderer.dispose()
        mount.replaceChildren()
      }
    }

    return () => { cancelled = true; io.disconnect(); cleanup() }
  }, [reduce])

  return (
    <div
      ref={mountRef}
      className="w-full max-w-[440px] aspect-square mx-auto opacity-0 transition-opacity duration-1000"
      role="img"
      aria-label="Interactive 3D chrome sculpture, modelled in Blender"
    />
  )
}

export default function LightWorld() {
  const { s } = useLang()
  const SERVICES = s.services
  const STEPS = s.steps
  return (
    <div className="text-cream">
      {/* services + sculpture */}
      <section id="services" className="px-5 md:px-12 lg:px-24 py-28 grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
        <div>
          <motion.div {...fadeUp} className="flex items-baseline gap-4 border-t border-cream/10 pt-4 mb-10">
            <h2 className="font-serif text-[clamp(1.9rem,3.5vw,3.4rem)]">{s.services_title}</h2>
          </motion.div>
          <ul>
            {SERVICES.map((s) => (
              <motion.li
                {...fadeUp}
                key={s.n}
                className="group relative grid grid-cols-[3rem_1fr] gap-4 py-7 border-t border-cream/10 last:border-b"
              >
                <span className="absolute -top-px left-0 h-0.5 w-full bg-accent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" aria-hidden="true" />
                <span className="mono-label text-cream/40">{s.n}</span>
                <div>
                  <h3 className="font-serif text-[clamp(1.35rem,2vw,1.9rem)]">{s.title}</h3>
                  <p className="text-smoke mt-1 max-w-md">{s.text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <Sculpture />
          <p className="mono-label text-smoke text-center mt-4">Live 3D, modelled in Blender. Move your cursor</p>
        </div>
      </section>

      {/* process */}
      <section className="px-5 md:px-12 lg:px-24 py-20">
        <motion.div {...fadeUp} className="flex items-baseline gap-4 border-t border-cream/10 pt-4 mb-10">
          <h2 className="font-serif text-[clamp(1.9rem,3.5vw,3.4rem)]">{s.process_title}</h2>
        </motion.div>
        <ol className="grid md:grid-cols-3 gap-10 max-w-5xl">
          {STEPS.map((s) => (
            <motion.li {...fadeUp} key={s.n} className="flex gap-4 items-baseline">
              <span className="mono-label text-accent border border-cream/10 rounded-full w-8 h-8 inline-flex items-center justify-center shrink-0">{s.n}</span>
              <p className="text-smoke"><strong className="text-cream font-semibold">{s.title}</strong> {s.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

    </div>
  )
}
