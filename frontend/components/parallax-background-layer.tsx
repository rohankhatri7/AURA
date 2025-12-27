"use client"

import { useEffect, useState } from "react"

interface ParallaxBackgroundLayerProps {
  mousePosition: { x: number; y: number }
  speed: number
  className?: string
}

export default function ParallaxBackgroundLayer({
  mousePosition,
  speed,
  className = "",
}: ParallaxBackgroundLayerProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const offsetX = (mousePosition.x - centerX) * speed
    const offsetY = (mousePosition.y - centerY) * speed
    setOffset({ x: offsetX, y: offsetY })
  }, [mousePosition, speed])

  return (
    <div
      className={`absolute inset-0 transition-transform duration-700 ease-out ${className}`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    />
  )
}
