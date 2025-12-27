"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl z-50 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Auto-play */}
          <div className="flex items-center justify-between">
            <Label htmlFor="autoplay" className="text-sm font-medium">
              Auto-play voice response
            </Label>
            <Switch id="autoplay" defaultChecked />
          </div>

          {/* Show transcript */}
          <div className="flex items-center justify-between">
            <Label htmlFor="transcript" className="text-sm font-medium">
              Show live transcript
            </Label>
            <Switch id="transcript" defaultChecked />
          </div>

          {/* Voice selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Voice</Label>
            <Select defaultValue="calm">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calm">Calm (Default)</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="gentle">Gentle</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Response length */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Response length</Label>
            <Slider defaultValue={[50]} max={100} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short</span>
              <span>Medium</span>
            </div>
          </div>

          {/* Coach style */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Coach style</Label>
            <Select defaultValue="gentle">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">Gentle</SelectItem>
                <SelectItem value="practical">Practical</SelectItem>
                <SelectItem value="encouraging">Encouraging</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <Button onClick={onClose} className="w-full">
            Save Changes
          </Button>
        </div>
      </div>
    </>
  )
}
