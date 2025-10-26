"use client"

import { useEffect, useRef } from "react"

export function Background3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Particle system
    const particles: Array<{
      x: number
      y: number
      z: number
      vx: number
      vy: number
      vz: number
    }> = []

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: Math.random() * 2 + 1,
      })
    }

    // Grid lines
    const gridLines: Array<{
      x1: number
      y1: number
      x2: number
      y2: number
      z: number
      vz: number
    }> = []

    for (let i = 0; i < 20; i++) {
      gridLines.push({
        x1: Math.random() * canvas.width,
        y1: Math.random() * canvas.height,
        x2: Math.random() * canvas.width,
        y2: Math.random() * canvas.height,
        z: Math.random() * 1000,
        vz: Math.random() * 1 + 0.5,
      })
    }

    let animationId: number

    const animate = () => {
      ctx.fillStyle = "rgba(10, 10, 20, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update grid lines
      gridLines.forEach((line) => {
        line.z -= line.vz
        if (line.z <= 0) {
          line.z = 1000
          line.x1 = Math.random() * canvas.width
          line.y1 = Math.random() * canvas.height
          line.x2 = Math.random() * canvas.width
          line.y2 = Math.random() * canvas.height
        }

        const scale = 1000 / (1000 + line.z)
        const x1 = line.x1 * scale + (canvas.width / 2) * (1 - scale)
        const y1 = line.y1 * scale + (canvas.height / 2) * (1 - scale)
        const x2 = line.x2 * scale + (canvas.width / 2) * (1 - scale)
        const y2 = line.y2 * scale + (canvas.height / 2) * (1 - scale)
        const alpha = 1 - line.z / 1000

        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * 0.3})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // Draw and update particles
      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.z -= particle.vz

        if (particle.z <= 0) {
          particle.z = 1000
          particle.x = Math.random() * canvas.width
          particle.y = Math.random() * canvas.height
        }

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        const scale = 1000 / (1000 + particle.z)
        const x = particle.x * scale + (canvas.width / 2) * (1 - scale)
        const y = particle.y * scale + (canvas.height / 2) * (1 - scale)
        const size = (1 - particle.z / 1000) * 3
        const alpha = 1 - particle.z / 1000

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
        gradient.addColorStop(0, `rgba(0, 200, 255, ${alpha * 0.8})`)
        gradient.addColorStop(0.5, `rgba(100, 150, 255, ${alpha * 0.4})`)
        gradient.addColorStop(1, `rgba(150, 100, 255, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, size * 2, 0, Math.PI * 2)
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-40"
      style={{ background: "radial-gradient(ellipse at center, #0a0a14 0%, #000000 100%)" }}
    />
  )
}
