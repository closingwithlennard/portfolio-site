import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLang } from '../lang.jsx'
import { createSunsetEnvTexture } from '../lib/sunsetEnv.js'

// Twelve style tiles orbiting the water-glass core — same catalogue as
// TVGlobe. slug drives /tiles/<slug>-t.webp (small, on-orb) and
// /tiles/<slug>.webp (modal, large).
const TILES = [
  { slug: 'dark-luxury', name: 'Dark Luxury' },
  { slug: 'warm-editorial', name: 'Warm Editorial' },
  { slug: 'neo-brutalist', name: 'Neo-Brutalist' },
  { slug: 'glassmorphism', name: 'Glassmorphism' },
  { slug: 'retro-futurism', name: 'Retro-Futurism' },
  { slug: 'fashion-ecom', name: 'Fashion E-Com' },
  { slug: 'saas-dashboard', name: 'SaaS Dashboard' },
  { slug: 'restaurant', name: 'Restaurant' },
  { slug: 'music-dj', name: 'Music / DJ' },
  { slug: 'real-estate', name: 'Real Estate' },
  { slug: 'portfolio', name: 'Portfolio' },
  { slug: 'bento-3d', name: 'Bento 3D' },
]

// Pricing tier per style, shown on the modal + mobile grid.
const TIER_PRICE = {
  'warm-editorial': 800,
  portfolio: 800,
  restaurant: 800,
  'real-estate': 800,
  'dark-luxury': 1500,
  'fashion-ecom': 1500,
  'saas-dashboard': 1500,
  'music-dj': 1500,
  'bento-3d': 1500,
  'neo-brutalist': 3000,
  glassmorphism: 3000,
  'retro-futurism': 3000,
}

const TILE_RADIUS = 1.55 // outside the r=1 glass core — always readable, never refracted
const MOBILE_QUERY = '(max-width: 720px)'

// --- fibonacci sphere + canvas fallback + curved tile geometry (ported from TVGlobe.jsx) ---
function fibonacciSpherePoints(count) {
  const points = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * i
    points.push({ x: Math.cos(theta) * radiusAtY, y, z: Math.sin(theta) * radiusAtY })
  }
  return points
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  const startY = y - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight))
}

// Dark panel + style name — initial texture for every tile, kept permanently
// if the real screenshot fails to load.
function createFallbackTexture(THREE, name) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#14110F'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  grad.addColorStop(0, 'rgba(5,150,105,0.35)')
  grad.addColorStop(1, 'rgba(10,9,8,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = 'rgba(253,250,246,0.18)'
  ctx.lineWidth = 6
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
  ctx.fillStyle = '#FDFAF6'
  ctx.font = '600 32px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  wrapCanvasText(ctx, name, canvas.width / 2, canvas.height / 2, canvas.width - 80, 38)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Flat plane bent along X into a shallow parabola — "curved screen" tile.
function createCurvedTileGeometry(THREE, width, height, curvature) {
  const geometry = new THREE.PlaneGeometry(width, height, 12, 1)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getX(i) / (width / 2)
    pos.setZ(i, curvature * (1 - t * t))
  }
  geometry.computeVertexNormals()
  return geometry
}

// --- compact 3D simplex noise (ported from LiquidGlass.jsx) — drives the gentle liquid wobble ---
const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
]

function dot3(g, x, y, z) {
  return g[0] * x + g[1] * y + g[2] * z
}

function buildPermutation(seed) {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  let s = seed || 1
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    const tmp = p[i]
    p[i] = p[j]
    p[j] = tmp
  }
  const perm = new Uint8Array(512)
  const permMod12 = new Uint8Array(512)
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255]
    permMod12[i] = perm[i] % 12
  }
  return { perm, permMod12 }
}

function makeSimplex3(seed) {
  const { perm, permMod12 } = buildPermutation(seed)
  const F3 = 1 / 3
  const G3 = 1 / 6
  return function simplex3(xin, yin, zin) {
    const s = (xin + yin + zin) * F3
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const k = Math.floor(zin + s)
    const t = (i + j + k) * G3
    const X0 = i - t, Y0 = j - t, Z0 = k - t
    const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0

    let i1, j1, k1, i2, j2, k2
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1 }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1 }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1 }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1 }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
    }

    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3

    const ii = i & 255, jj = j & 255, kk = k & 255
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
    if (t0 >= 0) {
      const gi0 = permMod12[ii + perm[jj + perm[kk]]]
      t0 *= t0
      n0 = t0 * t0 * dot3(GRAD3[gi0], x0, y0, z0)
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
    if (t1 >= 0) {
      const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]
      t1 *= t1
      n1 = t1 * t1 * dot3(GRAD3[gi1], x1, y1, z1)
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
    if (t2 >= 0) {
      const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]
      t2 *= t2
      n2 = t2 * t2 * dot3(GRAD3[gi2], x2, y2, z2)
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
    if (t3 >= 0) {
      const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]
      t3 *= t3
      n3 = t3 * t3 * dot3(GRAD3[gi3], x3, y3, z3)
    }
    return 32 * (n0 + n1 + n2 + n3)
  }
}

// Fullscreen tile preview — flies in from a shrunk state (DOM overlay stands
// in for the WebGL tile "flying toward viewer"). Ported from TVGlobe's
// TileModal, plus a price line and an absolute /#contact CTA.
function TileModal({ tile, onClose }) {
  const { s: modalStrings } = useLang()
  const tierIndex = TIER_PRICE[tile.slug] >= 3000 ? 2 : TIER_PRICE[tile.slug] >= 1500 ? 1 : 0
  const tierFeatures = (modalStrings.tier_features?.[tierIndex] ?? []).slice(0, 3)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const price = TIER_PRICE[tile.slug]

  return (
    <motion.div
      key="orb-hub-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${tile.name} style preview`}
      className="fixed inset-0 z-70 flex items-center justify-center px-5 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="absolute inset-0 bg-void/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative z-10 w-full max-w-3xl bg-abyss text-cream rounded-sm overflow-hidden border border-cream/10 shadow-2xl"
      >
        <img
          src={`/tiles/${tile.slug}.webp`}
          alt={tile.name}
          className="w-full aspect-16/10 object-cover bg-void"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-t border-cream/10">
          <div>
            <span className="mono-label text-accent">from ${price} AUD</span>
            <h3 className="font-serif text-2xl mt-1">{tile.name}</h3>
            <ul className="mt-3 space-y-1">
              {tierFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-pearl">
                  <span className="text-accent" aria-hidden="true">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <a
            href="/#contact"
            onClick={onClose}
            className="mono-label inline-flex items-center gap-2 border border-cream/25 rounded-full px-5 py-2.5 text-cream hover:border-accent hover:text-accent transition-colors"
          >
            Want this style? →
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Mobile (<720px): no WebGL, reuse TVGlobe's 2-col grid with a price line added.
function MobileGrid({ onTileClick }) {
  const [broken, setBroken] = useState(() => new Set())

  return (
    <div className="grid grid-cols-2 gap-3">
      {TILES.map((tile) => (
        <button
          key={tile.slug}
          type="button"
          onClick={() => onTileClick(tile.slug)}
          className="group relative aspect-4/3 overflow-hidden rounded-sm border border-ink/10 bg-ink text-left"
        >
          {!broken.has(tile.slug) && (
            <img
              src={`/tiles/${tile.slug}-t.webp`}
              alt={tile.name}
              loading="lazy"
              width={320}
              height={240}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-active:scale-95"
              onError={() =>
                setBroken((prev) => {
                  const next = new Set(prev)
                  next.add(tile.slug)
                  return next
                })
              }
            />
          )}
          {broken.has(tile.slug) && (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-ink to-void px-3 text-center">
              <span className="font-serif text-cream text-lg leading-tight">{tile.name}</span>
            </div>
          )}
          <span className="absolute bottom-0 left-0 right-0 bg-void/70 px-2 py-1.5 flex items-center justify-between gap-2">
            <span className="mono-label text-cream/90">{tile.name}</span>
            <span className="mono-label text-accent">${TIER_PRICE[tile.slug]}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

// AirDrop-style concentric rings — HTML layer, not WebGL. Centered behind the canvas.
function Ripples() {
  const RINGS = [0, 1, 2]
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {RINGS.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-accent/25"
          style={{ width: '58%', height: '58%' }}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: [0.9, 2.6], opacity: [0.5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: i * 1.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// Desktop three.js scene: water-glass core (LiquidGlass material approach) +
// twelve fibonacci-distributed style tiles (TVGlobe tile/raycast/drag logic).
function OrbCanvas({ onTileClick, reduceMotion }) {
  const mountRef = useRef(null)
  const onTileClickRef = useRef(onTileClick)
  onTileClickRef.current = onTileClick

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}
    const mount = mountRef.current
    if (!mount) return

    const io = new IntersectionObserver(
      ([entry], obs) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        boot()
      },
      { threshold: 0.1 }
    )
    io.observe(mount)

    async function boot() {
      let THREE
      try {
        ;[THREE] = await Promise.all([
          import('three'),
        ])
      } catch {
        return
      }
      if (cancelled) return

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      mount.appendChild(renderer.domElement)
      const el = renderer.domElement
      el.style.touchAction = 'none'

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 50)
      camera.position.set(0, 0, 4.95)

      const pmrem = new THREE.PMREMGenerator(renderer)
      const envTexture = createSunsetEnvTexture(THREE, renderer)
      scene.environment = envTexture

      const ambient = new THREE.AmbientLight(0xfdfaf6, 0.8)
      scene.add(ambient)
      const accentLight = new THREE.DirectionalLight(0x059669, 1.1)
      accentLight.position.set(3, 2, 4)
      scene.add(accentLight)
      const sunLight = new THREE.DirectionalLight(0xff7a29, 2.1)
      sunLight.position.set(-4, 3.2, 2.5)
      scene.add(sunLight)
      const fillLight = new THREE.DirectionalLight(0xfdfaf6, 0.5)
      fillLight.position.set(-3, -1.5, 2)
      scene.add(fillLight)

      const group = new THREE.Group()
      scene.add(group)

      // --- water-glass core (LiquidGlass material approach) ---
      const glassGeometry = new THREE.IcosahedronGeometry(1, 5)
      const glassPos = glassGeometry.attributes.position
      const glassBase = glassPos.array.slice()
      const glassVertexCount = glassPos.count
      // liquid chrome core (matches intro film + ribbon), kissed by a warm sun
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xf5f5f4),
        metalness: 1.0,
        roughness: 0.06,
        clearcoat: 0.7,
        clearcoatRoughness: 0.08,
        iridescence: 0.25,
        iridescenceIOR: 1.3,
        envMapIntensity: 1.8,
        sheen: 0.4,
        sheenColor: new THREE.Color(0xff7a29),
      })
      const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial)
      group.add(glassMesh)

      // emerald sparkles orbiting BETWEEN chrome core and the tiles (character layer)
      const SPARKS = 90
      const sparkPositions = new Float32Array(SPARKS * 3)
      for (let i = 0; i < SPARKS; i++) {
        const r = 1.08 + Math.random() * 0.34
        const th = Math.random() * Math.PI * 2
        const ph = Math.acos(2 * Math.random() - 1)
        sparkPositions[i * 3] = r * Math.sin(ph) * Math.cos(th)
        sparkPositions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
        sparkPositions[i * 3 + 2] = r * Math.cos(ph)
      }
      const sparkGeometry = new THREE.BufferGeometry()
      sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3))
      const sparkMaterial = new THREE.PointsMaterial({
        color: 0x6ee7b7,
        size: 0.028,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
      const sparks = new THREE.Points(sparkGeometry, sparkMaterial)
      group.add(sparks)

      const simplex3 = makeSimplex3(11)
      const NOISE_FREQ = 1.4
      const NOISE_AMP = 0.035 // gentle liquid wobble, kept ≤0.04 so the core reads smooth, not faceted

      function displaceGlass(noiseTime) {
        for (let i = 0; i < glassVertexCount; i++) {
          const ix = i * 3
          const bx = glassBase[ix]
          const by = glassBase[ix + 1]
          const bz = glassBase[ix + 2]
          const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1
          const nx = bx / len, ny = by / len, nz = bz / len
          const n = simplex3(
            bx * NOISE_FREQ + noiseTime,
            by * NOISE_FREQ + noiseTime,
            bz * NOISE_FREQ + noiseTime * 0.8
          )
          const disp = n * NOISE_AMP
          glassPos.setXYZ(i, bx + nx * disp, by + ny * disp, bz + nz * disp)
        }
        glassPos.needsUpdate = true
        glassGeometry.computeVertexNormals()
      }
      displaceGlass(0)

      // --- twelve style tiles, fibonacci-distributed outside the glass core ---
      const tileWidth = 0.85
      const tileHeight = 0.53
      const tileGeometry = createCurvedTileGeometry(THREE, tileWidth, tileHeight, 0.04)
      const bezelGeometry = new THREE.PlaneGeometry(tileWidth * 1.16, tileHeight * 1.3)
      const bezelMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a0908,
        roughness: 0.85,
        metalness: 0.15,
      })

      // orange energy threads: one per screen, core surface -> tile back (user: all 12, constant glow)
      const threadMaterial = new THREE.MeshBasicMaterial({
        color: 0xff7a29,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
      const threadGeometry = new THREE.CylinderGeometry(0.011, 0.011, 1, 6, 1, true)
      const threads = []

      const loader = new THREE.TextureLoader()
      const points = fibonacciSpherePoints(TILES.length)
      const meshes = points.map((p, i) => {
        const tile = TILES[i]
        const direction = new THREE.Vector3(p.x, p.y, p.z)
        const position = direction.clone().multiplyScalar(TILE_RADIUS)

        const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial)
        bezel.position.copy(direction.clone().multiplyScalar(TILE_RADIUS - 0.025))
        bezel.lookAt(direction.clone().multiplyScalar(TILE_RADIUS * 2))
        group.add(bezel)

        // glow thread: from just above the chrome surface to this screen
        const inner = direction.clone().multiplyScalar(1.0)
        const outer = direction.clone().multiplyScalar(TILE_RADIUS - 0.05)
        const mid = inner.clone().add(outer).multiplyScalar(0.5)
        const len = outer.distanceTo(inner)
        const thread = new THREE.Mesh(threadGeometry, threadMaterial)
        thread.scale.y = len
        thread.position.copy(mid)
        thread.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
        group.add(thread)
        threads.push(thread)

        const fallbackTexture = createFallbackTexture(THREE, tile.name)
        const material = new THREE.MeshBasicMaterial({ map: fallbackTexture, side: THREE.DoubleSide, toneMapped: false })
        const mesh = new THREE.Mesh(tileGeometry, material)
        mesh.position.copy(position)
        mesh.lookAt(position.clone().multiplyScalar(2))
        mesh.userData.slug = tile.slug
        group.add(mesh)

        loader.load(
          `/tiles/${tile.slug}-t.webp`,
          (texture) => {
            if (cancelled) return
            texture.colorSpace = THREE.SRGBColorSpace
            material.map = texture
            material.needsUpdate = true
            fallbackTexture.dispose()
          },
          undefined,
          () => {
            /* keep the generated fallback texture */
          }
        )

        return mesh
      })

      mount.classList.add('opacity-100')

      const size = () => {
        const w = mount.clientWidth
        const h = mount.clientHeight
        if (!w || !h) return
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        if (reduceMotion) renderer.render(scene, camera)
      }
      size()
      // container-driven sizing (window resize AND the docked shrink transition)
      const resizeObserver = new ResizeObserver(size)
      resizeObserver.observe(mount)

      // --- drag-to-rotate with inertia, click-to-open raycast (from TVGlobe) ---
      const raycaster = new THREE.Raycaster()
      const pointerNDC = new THREE.Vector2()
      let isDragging = false
      let dragMoved = 0
      let lastX = 0
      let lastY = 0
      let velX = 0
      let velY = 0
      const ROTATE_SPEED = 0.006
      const CLICK_THRESHOLD = 6

      const getNDC = (e) => {
        const rect = el.getBoundingClientRect()
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      }

      const onPointerDown = (e) => {
        isDragging = true
        dragMoved = 0
        lastX = e.clientX
        lastY = e.clientY
        velX = 0
        velY = 0
        el.classList.add('cursor-grabbing')
        el.setPointerCapture?.(e.pointerId)
      }

      const onPointerMove = (e) => {
        if (!isDragging) return
        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        dragMoved += Math.abs(dx) + Math.abs(dy)
        velX = dx * ROTATE_SPEED
        velY = dy * ROTATE_SPEED
        group.rotation.y += velX
        group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + velY, -1.05, 1.05)
        lastX = e.clientX
        lastY = e.clientY
        if (reduceMotion) renderer.render(scene, camera)
      }

      const onPointerUp = (e) => {
        isDragging = false
        el.classList.remove('cursor-grabbing')
        if (dragMoved < CLICK_THRESHOLD) {
          getNDC(e)
          raycaster.setFromCamera(pointerNDC, camera)
          const hits = raycaster.intersectObjects(meshes, false)
          if (hits.length) onTileClickRef.current(hits[0].object.userData.slug)
        }
      }

      el.addEventListener('pointerdown', onPointerDown)
      el.addEventListener('pointermove', onPointerMove)
      el.addEventListener('pointerup', onPointerUp)
      el.addEventListener('pointercancel', onPointerUp)

      // --- render loop, paused when tab hidden or section out of view ---
      const clock = new THREE.Clock()
      const DAMPING = 0.92
      const AUTO_SPEED = 0.15
      let noiseTime = 0
      let playing = false

      function frame() {
        const delta = Math.min(clock.getDelta(), 0.1)
        if (!isDragging) {
          if (Math.abs(velX) > 0.00015 || Math.abs(velY) > 0.00015) {
            group.rotation.y += velX
            group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + velY, -1.05, 1.05)
            velX *= DAMPING
            velY *= DAMPING
          } else {
            group.rotation.y += AUTO_SPEED * delta
          }
        }
        noiseTime += delta * 0.3
        displaceGlass(noiseTime)
        // drifting emerald sparkles around the chrome core
        sparks.rotation.y -= delta * 0.08
        sparks.rotation.x += delta * 0.03
        // breathing glow on the orange energy threads
        threadMaterial.opacity = 0.45 + Math.sin(noiseTime * 2.4) * 0.15
        renderer.render(scene, camera)
      }

      function setPlaying(next) {
        if (next === playing) return
        playing = next
        renderer.setAnimationLoop(playing ? frame : null)
      }

      let visIO = null
      let onVisibilityChange = null

      if (reduceMotion) {
        // prefers-reduced-motion: static orb, single frame, no loop
        renderer.render(scene, camera)
      } else {
        let sectionVisible = true
        let tabVisible = !document.hidden
        const syncPlaying = () => setPlaying(sectionVisible && tabVisible)

        visIO = new IntersectionObserver(
          ([entry]) => {
            sectionVisible = entry.isIntersecting
            syncPlaying()
          },
          { threshold: 0 }
        )
        visIO.observe(mount)

        onVisibilityChange = () => {
          tabVisible = !document.hidden
          syncPlaying()
        }
        document.addEventListener('visibilitychange', onVisibilityChange)

        setPlaying(true)
      }

      cleanup = () => {
        renderer.setAnimationLoop(null)
        resizeObserver.disconnect()
        el.removeEventListener('pointerdown', onPointerDown)
        el.removeEventListener('pointermove', onPointerMove)
        el.removeEventListener('pointerup', onPointerUp)
        el.removeEventListener('pointercancel', onPointerUp)
        visIO?.disconnect()
        if (onVisibilityChange) document.removeEventListener('visibilitychange', onVisibilityChange)
        meshes.forEach((m) => {
          m.material.map?.dispose()
          m.material.dispose()
        })
        tileGeometry.dispose()
        bezelGeometry.dispose()
        bezelMaterial.dispose()
        glassGeometry.dispose()
        glassMaterial.dispose()
        pmrem.dispose()
        envTexture.dispose()
        renderer.dispose()
        mount.replaceChildren()
      }
    }

    return () => {
      cancelled = true
      io.disconnect()
      cleanup()
    }
  }, [reduceMotion])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 opacity-0 transition-opacity duration-1000 cursor-grab select-none"
      role="img"
      aria-label="Rotating glass orb with twelve website style windows. Drag to spin, click a window to view it larger"
    />
  )
}

// Center water-glass orb ringed by twelve style windows. `docked` shrinks it
// into a bottom-right companion bubble once the hero has scrolled past —
// the orchestrator flips the prop, this component owns the transition.
export default function OrbHub({ docked = false }) {
  const { lang } = useLang()
  const reduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
  )
  const [activeSlug, setActiveSlug] = useState(null)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const handleTileClick = useCallback((slug) => setActiveSlug(slug), [])
  const closeModal = useCallback(() => setActiveSlug(null), [])
  const activeTile = useMemo(() => TILES.find((tile) => tile.slug === activeSlug) ?? null, [activeSlug])

  const label = lang === 'de' ? 'Fenster antippen' : 'tap a window'

  // Mobile has no WebGL companion mode — docked collapses to nothing.
  if (isMobile) {
    if (docked) return null
    return (
      <div className="w-full">
        <MobileGrid onTileClick={handleTileClick} />
        <AnimatePresence>
          {activeTile && <TileModal tile={activeTile} onClose={closeModal} />}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      <motion.div
        layout
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={
          docked
            ? 'fixed bottom-6 right-6 w-[140px] h-[140px] z-40 pointer-events-auto'
            : 'relative w-full aspect-square max-w-[70vmin] mx-auto'
        }
      >
        <OrbCanvas onTileClick={handleTileClick} reduceMotion={reduceMotion} />
      </motion.div>
      {!docked && <p className="mono-label text-muted text-center mt-4">{label}</p>}
      <AnimatePresence>
        {activeTile && <TileModal tile={activeTile} onClose={closeModal} />}
      </AnimatePresence>
    </>
  )
}
