"use client"

import AudioPlayerMini from "./audio-player-mini"

interface CoachCardProps {
  text: string
  isStreaming: boolean
  audioUrl: string
  isProcessing: boolean
}

export default function CoachCard({ text, isStreaming, audioUrl, isProcessing }: CoachCardProps) {
  if (isProcessing) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coach</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-card to-accent/5 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Coach</span>
        {isStreaming && <span className="animate-blink text-primary">|</span>}
      </div>
      <p className="mt-3 text-base leading-relaxed text-foreground">{text}</p>
      {audioUrl && (
        <div className="mt-4">
          <AudioPlayerMini audioUrl={audioUrl} />
        </div>
      )}
    </div>
  )
}
