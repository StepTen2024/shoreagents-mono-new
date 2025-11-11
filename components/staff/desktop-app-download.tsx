"use client"

import { Download, Monitor, CheckCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DesktopAppDownload() {
  const appVersion = "1.0.0"
  const fileSize = "~250 MB"
  // Installer hosted on GitHub Releases
  // Replace YOUR-USERNAME/YOUR-REPO with your actual GitHub repo
  const downloadUrl = "https://github.com/ShoreAgents/shoreagents-mono-new/releases/download/v1.0.0/ShoreAgentsAI-Setup-1.0.0.exe"

  const handleDownload = () => {
    if (typeof window !== 'undefined') {
      window.location.href = downloadUrl
    }
  }

  return (
    <div className="rounded-2xl bg-slate-900/90 backdrop-blur-xl p-6 ring-1 ring-white/10 shadow-xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 items-center justify-center mb-4">
          <Monitor className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Desktop App
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Track time automatically
        </p>
        
        {/* Download Button */}
        <Button
          onClick={handleDownload}
          size="lg"
          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-lg transition-all"
        >
          <Download className="h-5 w-5 mr-2" />
          Download for Windows
        </Button>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span className="text-slate-300">Auto Time Tracking</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <span className="text-slate-300">Live Performance Monitoring</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="h-5 w-5 text-purple-400 flex-shrink-0" />
          <span className="text-slate-300">Smart Break Reminders</span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-center gap-4 mb-6 text-xs text-slate-400">
        <span>v{appVersion}</span>
        <span>•</span>
        <span>{fileSize}</span>
        <span>•</span>
        <span>Windows 10/11</span>
      </div>

      {/* Installation Steps */}
      <div className="rounded-lg bg-slate-800/50 p-4 ring-1 ring-slate-700/50">
        <p className="text-xs font-semibold text-slate-300 mb-3">
          Quick Setup (2 minutes)
        </p>
        <div className="space-y-2">
          <div className="flex gap-2 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">
              1
            </div>
            <div>
              <p className="text-xs font-medium text-white">Download</p>
              <p className="text-xs text-slate-400">Click button above</p>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">
              2
            </div>
            <div>
              <p className="text-xs font-medium text-white">Install</p>
              <p className="text-xs text-slate-400">Double-click the .exe file</p>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">
              3
            </div>
            <div>
              <p className="text-xs font-medium text-white">Launch</p>
              <p className="text-xs text-slate-400">Login and start working</p>
            </div>
          </div>
        </div>
        
        {/* Pro Tip */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-400">Tip:</strong> If Windows shows a warning, click "More info" → "Run anyway"
          </p>
        </div>
      </div>
    </div>
  )
}
