"use client"

import { useEffect, useRef, useState } from "react"
import StudioHeader from "@/components/studio-header"
import SessionPills from "@/components/session-pills"
import MicButton from "@/components/mic-button"
import AmbientWaveform from "@/components/ambient-waveform"
import TranscriptCard from "@/components/transcript-card"
import CoachCard from "@/components/coach-card"
import HistoryDrawer from "@/components/history-drawer"
import SettingsModal from "@/components/settings-modal"

export default function SessionPage() {
  const [micState, setMicState] = useState<"idle" | "recording" | "processing" | "speaking" | "disabled">("idle")
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [sessionMeta, setSessionMeta] = useState({ intent: "", emotion: "", mode: "", risk: "low" })
  const [userTranscript, setUserTranscript] = useState("")
  const [isUserFinal, setIsUserFinal] = useState(false)
  const [coachText, setCoachText] = useState("")
  const [isCoachStreaming, setIsCoachStreaming] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [sessionId, setSessionId] = useState("")

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const mimeTypeRef = useRef("")
  const audioUrlRef = useRef("")

  const chooseSupportedMimeType = (candidates: string[]) => {
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return ""
  }

  const extensionForMime = (mimeType: string) => {
    if (mimeType.includes("mp4")) return "mp4"
    if (mimeType.includes("ogg")) return "ogg"
    if (mimeType.includes("webm")) return "webm"
    return "webm"
  }

  const updateAudioUrl = (nextUrl: string) => {
    if (audioUrlRef.current && audioUrlRef.current !== nextUrl) {
      URL.revokeObjectURL(audioUrlRef.current)
    }
    audioUrlRef.current = nextUrl
    setAudioUrl(nextUrl)
  }

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  const resetTurn = () => {
    setUserTranscript("")
    setIsUserFinal(false)
    setCoachText("")
    updateAudioUrl("")
    setErrorMessage("")
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    streamRef.current = null
  }

  const handleTranscribe = async () => {
    const mimeType = mimeTypeRef.current
    const blob = new Blob(chunksRef.current, { type: mimeType || undefined })
    const ext = extensionForMime(mimeType)

    const formData = new FormData()
    formData.append("audio", blob, `speech.${ext}`)
    if (sessionId) {
      formData.append("session_id", sessionId)
    }

    let data: Record<string, unknown> = {}
    try {
      const response = await fetch("/api/transcribe", { method: "POST", body: formData })
      data = (await response.json()) as Record<string, unknown>

      if (!response.ok) {
        setErrorMessage("Transcription failed. Please try again.")
        console.error("Transcribe error:", data)
        setMicState("idle")
        setIsCoachStreaming(false)
        return
      }
    } catch (error) {
      setErrorMessage("Transcription failed. Please try again.")
      console.error("Transcribe error:", error)
      setMicState("idle")
      setIsCoachStreaming(false)
      return
    }

    const nextSessionId = (data.session_id as string | undefined) || sessionId
    if (nextSessionId && nextSessionId !== sessionId) {
      setSessionId(nextSessionId)
    }

    const transcript = (data.transcript as string | undefined) || ""
    if (!transcript) {
      setErrorMessage("Transcription missing from response. Please try again.")
      console.error("Missing transcript in response:", data)
      setMicState("idle")
      setIsCoachStreaming(false)
      return
    }

    setUserTranscript(transcript)
    setIsUserFinal(true)
    updateAudioUrl("")

    setMicState("speaking")
    setIsCoachStreaming(true)
    simulateCoachResponse()
  }

  const handleMicClick = () => {
    if (micState === "idle") {
      resetTurn()
      setMicState("recording")
      setIsCoachStreaming(false)
      chunksRef.current = []
      mimeTypeRef.current = chooseSupportedMimeType([
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg",
        "audio/mp4",
      ])

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          streamRef.current = stream
          const recorder = mimeTypeRef.current
            ? new MediaRecorder(stream, { mimeType: mimeTypeRef.current })
            : new MediaRecorder(stream)
          recorderRef.current = recorder

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data)
            }
          }

          recorder.onstop = async () => {
            setMicState("processing")
            stopStream()
            await handleTranscribe()
          }

          recorder.start()
        })
        .catch((error) => {
          console.error("Microphone error:", error)
          setErrorMessage("Microphone access failed. Please check permissions.")
          setMicState("idle")
        })
    } else if (micState === "recording") {
      const recorder = recorderRef.current
      if (recorder && recorder.state !== "inactive") {
        recorder.stop()
      } else {
        setMicState("processing")
      }
    }
  }

  const generateTts = async (text: string) => {
    if (!text.trim()) return

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, session_id: sessionId || undefined }),
      })

      if (!response.ok) {
        const details = await response.text().catch(() => "")
        console.error("TTS error:", response.status, details)
        setErrorMessage("Could not generate audio. Showing transcript only.")
        return
      }

      const contentType = response.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const details = await response.text().catch(() => "")
        console.error("Unexpected TTS JSON response:", details)
        setErrorMessage("Could not generate audio. Showing transcript only.")
        return
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      updateAudioUrl(blobUrl)
    } catch (error) {
      console.error("TTS error:", error)
      setErrorMessage("Could not generate audio. Showing transcript only.")
    }
  }

  const simulateCoachResponse = () => {
    const fullText =
      "I hear you. Taking time for guidance is an act of care. What feels most present for you right now?"
    let currentText = ""
    let index = 0
    const interval = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText[index]
        setCoachText(currentText)
        index++
      } else {
        clearInterval(interval)
        setIsCoachStreaming(false)
        setMicState("idle")
        setSessionMeta({ intent: "guidance", emotion: "seeking", mode: "reflective", risk: "low" })
        void generateTts(fullText)
      }
    }, 30)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden">
      {/* Parallax background layers */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent animate-drift-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--color-accent-rgb),0.1),transparent)] animate-drift-medium" />
      </div>

      <StudioHeader onHistoryClick={() => setIsHistoryOpen(true)} onSettingsClick={() => setIsSettingsOpen(true)} />

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <SessionPills meta={sessionMeta} />

        {/* Center Stage */}
        <div className="mt-8 lg:mt-12 flex flex-col items-center">
          <div className="relative w-full max-w-2xl">
            {/* Ambient Waveform Background */}
            <AmbientWaveform state={micState} />

            {/* Mic Button */}
            <div className="relative z-10 flex justify-center mb-8 lg:mb-12">
              <MicButton state={micState} onClick={handleMicClick} />
            </div>

            {/* Transcript and Coach Cards */}
            <div className="space-y-4">
              {userTranscript && <TranscriptCard text={userTranscript} isFinal={isUserFinal} label="You" />}

              {(coachText || micState === "processing") && (
                <CoachCard
                  text={coachText}
                  isStreaming={isCoachStreaming}
                  audioUrl={audioUrl}
                  isProcessing={micState === "processing"}
                />
              )}

              {errorMessage && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <HistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
