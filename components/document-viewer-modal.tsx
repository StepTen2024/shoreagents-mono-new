"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface Document {
  name: string
  url: string
  type: 'image' | 'pdf'
}

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  documents: Document[]
  initialIndex: number
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  documents,
  initialIndex
}: DocumentViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Arrow key navigation
  useEffect(() => {
    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleArrowKeys)
      return () => window.removeEventListener('keydown', handleArrowKeys)
    }
  }, [isOpen, currentIndex])

  if (!isOpen || documents.length === 0) return null

  const currentDoc = documents[currentIndex]
  const isFirstDoc = currentIndex === 0
  const isLastDoc = currentIndex === documents.length - 1

  const handlePrevious = () => {
    if (!isFirstDoc) setCurrentIndex(currentIndex - 1)
  }

  const handleNext = () => {
    if (!isLastDoc) setCurrentIndex(currentIndex + 1)
  }

  const handleDownload = () => {
    window.open(currentDoc.url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-slate-800/80 p-2 text-white hover:bg-slate-700 transition-all hover:scale-110"
        aria-label="Close viewer"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Document counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
        {currentIndex + 1} / {documents.length}
      </div>

      {/* Document info & actions */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <div className="rounded-full bg-slate-800/80 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
          {currentDoc.name}
        </div>
        <Button
          onClick={handleDownload}
          size="sm"
          className="rounded-full bg-indigo-600 hover:bg-indigo-500"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open
        </Button>
      </div>

      {/* Previous button */}
      {!isFirstDoc && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 z-10 rounded-full bg-slate-800/80 p-3 text-white hover:bg-slate-700 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous document"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next button */}
      {!isLastDoc && (
        <button
          onClick={handleNext}
          className="absolute right-4 z-10 rounded-full bg-slate-800/80 p-3 text-white hover:bg-slate-700 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next document"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Document display */}
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] p-20 flex items-center justify-center">
        {currentDoc.type === 'image' ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-slate-900/50 backdrop-blur-sm ring-1 ring-white/10">
            <Image
              src={currentDoc.url}
              alt={currentDoc.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          // PDF viewer
          <iframe
            src={currentDoc.url}
            className="w-full h-full rounded-lg bg-white"
            title={currentDoc.name}
          />
        )}
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <kbd className="px-2 py-1 rounded bg-slate-800/80 text-white font-mono">←</kbd>
          <kbd className="px-2 py-1 rounded bg-slate-800/80 text-white font-mono">→</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-2 py-1 rounded bg-slate-800/80 text-white font-mono">ESC</kbd>
          Close
        </span>
      </div>
    </div>
  )
}

