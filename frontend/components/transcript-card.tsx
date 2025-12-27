"use client"

interface TranscriptCardProps {
  text: string
  isFinal: boolean
  label: string
}

export default function TranscriptCard({ text, isFinal, label }: TranscriptCardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-6 shadow-lg backdrop-blur-sm transition-all duration-500 ${isFinal ? "opacity-100" : "opacity-90"}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {!isFinal && <span className="animate-pulse text-primary">●</span>}
      </div>
      <p className={`mt-3 text-base leading-relaxed text-foreground ${!isFinal ? "animate-fade-in" : ""}`}>{text}</p>
    </div>
  )
}
