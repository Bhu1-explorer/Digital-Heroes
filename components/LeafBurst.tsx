"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  rotation: number
  rotationSpeed: number
  swayPhase: number
  swaySpeed: number
  scaleX: number
  scaleSpeed: number
  color: string
  shape: Path2D
  scale: number
}

const COLORS = [
  "#5F7A66", // sage
  "#2A4232", // dark green
  "#3A3A22", // olive
  "#3A3A22", 
  "#5F7A66", 
  "#D97736", // copper
  "#E0A96D", // amber
]

// 3 leaf shapes - instantiated inside useEffect to avoid SSR ReferenceError
let SHAPES: Path2D[] = []

export function LeafBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    if (SHAPES.length === 0) {
      SHAPES = [
        new Path2D("M0,0 C10,-10 20,-5 25,10 C15,20 0,15 0,0 Z"),
        new Path2D("M0,0 C15,-15 30,0 20,20 C5,25 -5,10 0,0 Z"),
        new Path2D("M0,0 C-10,-15 5,-25 20,-15 C25,-5 15,10 0,0 Z")
      ]
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let particles: Particle[] = []
    let animationFrameId: number
    let lastTime = 0
    const GRAVITY = 300 // px/s^2

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
    }
    
    resize()
    window.addEventListener("resize", resize)

    const spawnParticles = (x: number, y: number, count: number, spreadX: number = 0) => {
      if (document.hidden) return
      
      const newParticles: Particle[] = Array.from({ length: count }).map(() => {
        const startX = x + (Math.random() - 0.5) * spreadX
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 100 + 50
        return {
          x: startX,
          y,
          vx: Math.cos(angle) * speed,
          vy: -Math.random() * 200 - 50, // Initial upward burst
          life: 0,
          maxLife: Math.random() * 0.8 + 1.8, // 1.8 to 2.6s
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 5,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 3 + 2,
          scaleX: 1,
          scaleSpeed: Math.random() * 4 + 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          scale: Math.random() * 0.4 + 0.6 // 0.6 to 1.0 size
        }
      })

      particles = [...particles, ...newParticles].slice(-80) // Cap at 80
      
      if (!animationFrameId) {
        lastTime = performance.now()
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    const animate = (time: number) => {
      if (!ctx || !canvas) return
      const dt = (time - lastTime) / 1000
      lastTime = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let activeParticles = false

      particles = particles.filter(p => {
        p.life += dt
        if (p.life >= p.maxLife) return false

        activeParticles = true

        p.vy += GRAVITY * dt
        p.x += p.vx * dt + Math.sin(p.swayPhase) * 50 * dt
        p.y += p.vy * dt
        
        p.rotation += p.rotationSpeed * dt
        p.swayPhase += p.swaySpeed * dt
        p.scaleX = Math.cos(p.life * p.scaleSpeed)

        // Fade out over last 30%
        let alpha = 1
        const remaining = p.maxLife - p.life
        const fadeThreshold = p.maxLife * 0.3
        if (remaining < fadeThreshold) {
          alpha = remaining / fadeThreshold
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.scale(p.scaleX * p.scale, p.scale) // Flip effect via scaleX
        ctx.fillStyle = p.color
        ctx.globalAlpha = alpha
        ctx.fill(p.shape)
        ctx.restore()

        return true
      })

      if (activeParticles) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        animationFrameId = 0 // Stop loop
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      // Find if we clicked a button, link, or data-leaf element
      const target = e.target as HTMLElement
      const interactable = target.closest("button, a, [data-leaf]")
      
      if (interactable) {
        const rect = interactable.getBoundingClientRect()
        // Spawn 14-18 leaves along width, from vertical center
        spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, Math.floor(Math.random() * 5) + 14, rect.width)
      } else {
        // Normal click: 6-8 leaves at cursor
        spawnParticles(e.clientX, e.clientY, Math.floor(Math.random() * 3) + 6)
      }
    }

    window.addEventListener("pointerdown", onPointerDown, { capture: true })
    
    const onVisibilityChange = () => {
      if (document.hidden) {
        particles = []
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointerdown", onPointerDown, { capture: true })
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      aria-hidden="true"
    />
  )
}
