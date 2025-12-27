"use client"

interface AmbientWaveformProps {
  state: "idle" | "recording" | "processing" | "speaking" | "disabled"
}

export default function AmbientWaveform({ state }: AmbientWaveformProps) {
  const getWaveformStyle = () => {
    switch (state) {
      case "recording":
        return "opacity-80 scale-110"
      case "processing":
        return "opacity-60 scale-95"
      case "speaking":
        return "opacity-70 scale-105"
      default:
        return "opacity-50 scale-100"
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className={`transition-all duration-700 ease-out ${getWaveformStyle()}`}>
        {/* Waveform Circles */}
        <div className="relative w-96 h-96">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 blur-3xl animate-breathing" />
          <div className="absolute inset-8 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 blur-2xl animate-breathing-delayed" />
          <div className="absolute inset-16 rounded-full bg-gradient-to-r from-accent/10 to-primary/10 blur-xl animate-breathing" />

          {/* Bars for recording state */}
          {state === "recording" && (
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-primary/40 rounded-full animate-wave"
                  style={{
                    height: `${40 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Floating dots for processing */}
          {state === "processing" && (
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-primary/60 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
