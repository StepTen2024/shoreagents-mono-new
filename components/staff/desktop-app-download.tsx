"use client"

import { Download, Monitor, CheckCircle, Zap, Rocket, Star, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DesktopAppDownload() {
  const appVersion = "1.0.0"
  const fileSize = "~250 MB"
  const downloadUrl = "/downloads/Shore-Agents-Setup-1.0.0.exe" // Update this path

  const handleDownload = () => {
    // Track download analytics if needed
    if (typeof window !== 'undefined') {
      window.location.href = downloadUrl
    }
  }

  return (
    <div className="group rounded-3xl bg-gradient-to-br from-slate-900/90 via-indigo-900/30 to-slate-900/90 p-8 backdrop-blur-xl ring-2 ring-indigo-400/30 transition-all duration-500 hover:ring-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.01]">
      {/* Header - Vertical Layout */}
      <div className="text-center mb-8">
        <div className="inline-flex h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 items-center justify-center ring-4 ring-indigo-400/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl group-hover:shadow-indigo-500/50 mb-6">
          <Monitor className="h-12 w-12 text-white animate-pulse" />
        </div>
        <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2 flex items-center justify-center gap-2">
          Desktop App 🖥️
          <Sparkles className="h-6 w-6 text-yellow-400 animate-spin" />
        </h3>
        <p className="text-slate-300 font-semibold flex items-center justify-center gap-2 mb-6">
          <Rocket className="h-4 w-4 text-indigo-400" />
          Supercharge your workflow!
        </p>
        
        {/* Download Button - BIG & FUN */}
        <Button
          onClick={handleDownload}
          size="lg"
          className="w-full h-16 text-xl font-black bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:via-green-400 hover:to-emerald-500 rounded-2xl ring-4 ring-emerald-400/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50 hover:ring-emerald-400/50 group/btn"
        >
          <Download className="h-6 w-6 mr-2 group-hover/btn:animate-bounce" />
          Download for Windows!
          <Zap className="h-5 w-5 ml-2 text-yellow-300 group-hover/btn:rotate-12 transition-transform" />
        </Button>
      </div>

      {/* Features - Vertical Stack */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="group/feature flex items-center gap-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-4 ring-1 ring-emerald-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30">
          <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 group-hover/feature:scale-125 transition-transform" />
          <span className="text-emerald-200 font-bold">Auto Time Tracking ⏰</span>
        </div>
        <div className="group/feature flex items-center gap-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 ring-1 ring-blue-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-blue-400 hover:shadow-lg hover:shadow-blue-500/30">
          <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 group-hover/feature:scale-125 transition-transform" />
          <span className="text-blue-200 font-bold">Live Monitoring 📊</span>
        </div>
        <div className="group/feature flex items-center gap-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 ring-1 ring-purple-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-purple-400 hover:shadow-lg hover:shadow-purple-500/30">
          <CheckCircle className="h-6 w-6 text-purple-400 flex-shrink-0 group-hover/feature:scale-125 transition-transform" />
          <span className="text-purple-200 font-bold">Smart Alerts 🔔</span>
        </div>
      </div>

      {/* Meta Info - FUN BADGES */}
      <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
        <div className="px-4 py-2 rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/50 flex items-center gap-2">
          <Star className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-bold text-indigo-200">v{appVersion}</span>
        </div>
        <div className="px-4 py-2 rounded-xl bg-purple-500/20 ring-1 ring-purple-400/50 flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-sm font-bold text-purple-200">{fileSize}</span>
        </div>
        <div className="px-4 py-2 rounded-xl bg-pink-500/20 ring-1 ring-pink-400/50 flex items-center gap-2">
          <Monitor className="h-4 w-4 text-pink-400" />
          <span className="text-sm font-bold text-pink-200">Windows 10/11</span>
        </div>
      </div>

      {/* Installation Steps - Compact Vertical */}
      <div className="rounded-2xl bg-slate-900/50 p-6 ring-1 ring-white/10">
        <p className="text-sm text-slate-300 mb-4 font-bold flex items-center gap-2">
          <Rocket className="h-4 w-4 text-indigo-400" />
          Quick Installation (2 minutes!) 🚀
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold ring-2 ring-indigo-400/50">1</div>
            <div>
              <p className="text-sm font-bold text-white">Download ⬇️</p>
              <p className="text-xs text-slate-400">Click button above</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold ring-2 ring-purple-400/50">2</div>
            <div>
              <p className="text-sm font-bold text-white">Install 📦</p>
              <p className="text-xs text-slate-400">Double-click .exe file</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold ring-2 ring-pink-400/50">3</div>
            <div>
              <p className="text-sm font-bold text-white">Launch 🎉</p>
              <p className="text-xs text-slate-400">Login & start working!</p>
            </div>
          </div>
        </div>
        
        {/* Pro Tip */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Star className="h-3 w-3 text-yellow-400" />
            <span><strong className="text-yellow-400">Pro Tip:</strong> If Windows shows a warning, click "More info" → "Run anyway"</span>
          </p>
        </div>
      </div>
    </div>
  )
}

