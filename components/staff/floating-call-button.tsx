"use client"

import { useState } from "react"
import { Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import ClientSelectionModal from "./client-selection-modal"

export default function StaffFloatingCallButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 z-50"
        size="icon"
      >
        <Video className="h-6 w-6 text-white" />
      </Button>

      <ClientSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

