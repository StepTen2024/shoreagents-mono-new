"use client"

import { useState } from "react"
import { Video } from "lucide-react"
import { StaffSelectionModal } from "./staff-selection-modal"

export default function FloatingCallButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 animate-pulse"
        title="Start video call"
      >
        <Video className="h-8 w-8 text-white" />
      </button>

      <StaffSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
