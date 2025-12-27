"use client"

import { useEffect, useState } from "react"

interface SessionPillsProps {
  meta: {
    intent: string
    emotion: string
    mode: string
    risk: string
  }
}

export default function SessionPills({ meta }: SessionPillsProps) {
  const [animatingKey, setAnimatingKey] = useState<string | null>(null)

  useEffect(() => {
    const keys = Object.keys(meta) as Array<keyof typeof meta>
    keys.forEach((key) => {
      if (meta[key]) {
        setAnimatingKey(key)
        setTimeout(() => setAnimatingKey(null), 600)
      }
    })
  }, [meta])

  const pills = [
    { key: "intent", label: "Intent", value: meta.intent },
    { key: "emotion", label: "Emotion", value: meta.emotion },
    { key: "mode", label: "Mode", value: meta.mode },
    { key: "risk", label: "Risk", value: meta.risk },
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {pills.map((pill) => (
        <div
          key={pill.key}
          className={`flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm transition-all duration-500 ${
            animatingKey === pill.key ? "ring-2 ring-primary/50 scale-105" : ""
          } ${pill.value ? "opacity-100" : "opacity-50"}`}
        >
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{pill.label}</span>
          {pill.value && <span className="text-xs font-semibold text-foreground whitespace-nowrap">{pill.value}</span>}
        </div>
      ))}
    </div>
  )
}
