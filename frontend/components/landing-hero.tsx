"use client"

import { useRouter } from "next/navigation"
import EnterButton from "./enter-button"
import ParallaxBackgroundLayer from "./parallax-background-layer"
import { useEffect, useState } from "react"

export default function LandingHero() {
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleEnter = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      router.push("/session")
    }, 1200)
  }

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-all duration-1200 ${isTransitioning ? "scale-110 opacity-0" : "scale-100 opacity-100"}`}
    >
      {/* Parallax Background Layers */}
      <ParallaxBackgroundLayer
        mousePosition={mousePosition}
        speed={0.02}
        className="bg-gradient-to-br from-background via-muted/30 to-accent/10"
      />
      <ParallaxBackgroundLayer
        mousePosition={mousePosition}
        speed={0.05}
        className="bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-primary-rgb),0.05),transparent)]"
      />
      <ParallaxBackgroundLayer
        mousePosition={mousePosition}
        speed={0.08}
        className="bg-gradient-to-t from-transparent via-transparent to-foreground/5"
      />

      {/* Floating Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl">
        <h1 className="text-5xl lg:text-7xl font-serif mb-4 text-balance animate-fade-in text-foreground">
          Studio Session
        </h1>
        <p className="text-xl lg:text-2xl text-muted-foreground mb-12 animate-fade-in-up text-balance">
          A reflective voice coach
        </p>
        <EnterButton onClick={handleEnter} />
      </div>

      {/* Footer */}
      <footer className="absolute bottom-8 text-center w-full">
        <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Privacy & Safety
        </a>
      </footer>
    </div>
  )
}
