"use client"

import { Button } from "@/components/ui/button"

interface EnterButtonProps {
  onClick: () => void
}

export default function EnterButton({ onClick }: EnterButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="relative px-12 py-6 text-lg font-medium rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 animate-breathing group overflow-hidden"
    >
      <span className="relative z-10">Enter</span>
      {/* Ripple effect on hover */}
      <span className="absolute inset-0 rounded-full bg-primary-foreground/10 scale-0 group-hover:scale-100 transition-transform duration-700 ease-out" />
    </Button>
  )
}
