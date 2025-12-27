"use client"

import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MicButtonProps {
  state: "idle" | "recording" | "processing" | "speaking" | "disabled"
  onClick: () => void
}

export default function MicButton({ state, onClick }: MicButtonProps) {
  const getButtonStyles = () => {
    switch (state) {
      case "recording":
        return "bg-destructive hover:bg-destructive/90 animate-pulse ring-4 ring-destructive/30"
      case "processing":
        return "bg-primary/70 cursor-wait"
      case "speaking":
        return "bg-primary/50 cursor-not-allowed"
      case "disabled":
        return "bg-muted cursor-not-allowed opacity-50"
      default:
        return "bg-primary hover:bg-primary/90 hover:scale-105"
    }
  }

  return (
    <div className="relative">
      {/* Ripple effect during recording */}
      {state === "recording" && (
        <>
          <div className="absolute inset-0 rounded-full bg-destructive/30 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-destructive/20 animate-pulse" />
        </>
      )}

      <Button
        onClick={onClick}
        disabled={state === "processing" || state === "speaking" || state === "disabled"}
        className={`relative h-24 w-24 rounded-full shadow-2xl transition-all duration-300 ${getButtonStyles()}`}
      >
        {state === "disabled" ? (
          <MicOff className="h-10 w-10 text-muted-foreground" />
        ) : (
          <Mic className="h-10 w-10 text-primary-foreground" />
        )}
      </Button>
    </div>
  )
}
