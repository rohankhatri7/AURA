"use client"

import { History, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StudioHeaderProps {
  onHistoryClick: () => void
  onSettingsClick: () => void
}

export default function StudioHeader({ onHistoryClick, onSettingsClick }: StudioHeaderProps) {
  return (
    <header className="border-b border-border/50 backdrop-blur-sm bg-background/80">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-serif text-foreground">Studio Session</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onHistoryClick} className="hover:bg-accent/50 transition-colors">
            <History className="h-5 w-5" />
            <span className="sr-only">History</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="hover:bg-accent/50 transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
