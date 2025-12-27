"use client"

import { X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface HistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const mockHistory = [
  { id: 1, text: "I feel like I need some guidance today", intent: "guidance", emotion: "seeking", time: "2 min ago" },
  { id: 2, text: "How can I manage stress better?", intent: "coping", emotion: "anxious", time: "1 hour ago" },
  { id: 3, text: "I want to talk about my goals", intent: "planning", emotion: "motivated", time: "1 day ago" },
]

export default function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-card border-l border-border shadow-2xl z-50 transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Session Notes</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search sessions..." className="pl-9" />
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mockHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <p className="text-sm text-foreground line-clamp-2 mb-2">{item.text}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">{item.intent}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                    {item.emotion}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
