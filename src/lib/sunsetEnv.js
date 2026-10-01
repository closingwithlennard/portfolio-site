// Shared sunset environment for all chrome materials (globe + ribbon).
// Recreates the validated Blender reference (arvo-globe-blender.png):
// blue-grey sky, glowing glut-orange #FF7A29 horizon band with a sun hotspot,
// abyss-green ground. Painted on a canvas, wrapped as an equirect env map,
// PMREM-filtered so MeshPhysicalMaterial reflections match the render.
export function createSunsetEnvTexture(THREE, renderer) {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // vertical sky gradient: zenith -> horizon -> ground
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0.0, '#5c6b7d')   // muted blue-grey zenith
  sky.addColorStop(0.42, '#9fb0bd')  // pale haze above horizon
  sky.addColorStop(0.5, '#ffb27a')   // warm band at the horizon line
  sky.addColorStop(0.53, '#1a2f28')  // ground falls off fast
  sky.addColorStop(1.0, '#0B1512')   // abyss green floor
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // glut-orange sun hotspot sitting on the horizon (left-ish, like the Blender area light)
  const sunX = w * 0.3
  const sunY = h * 0.5
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.16)
  glow.addColorStop(0, 'rgba(255, 200, 150, 1)')
  glow.addColorStop(0.12, 'rgba(255, 122, 41, 0.95)')
  glow.addColorStop(0.5, 'rgba(255, 122, 41, 0.25)')
  glow.addColorStop(1, 'rgba(255, 122, 41, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // soft emerald bounce low on the opposite side (matches the fill light)
  const em = ctx.createRadialGradient(w * 0.78, h * 0.62, 0, w * 0.78, h * 0.62, w * 0.2)
  em.addColorStop(0, 'rgba(5, 150, 105, 0.5)')
  em.addColorStop(1, 'rgba(5, 150, 105, 0)')
  ctx.fillStyle = em
  ctx.fillRect(0, 0, w, h)

  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace

  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromEquirectangular(texture).texture
  texture.dispose()
  pmrem.dispose()
  return env
}
