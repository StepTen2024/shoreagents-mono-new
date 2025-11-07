"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Smile } from "lucide-react"

interface Reaction {
  id: string
  emoji: string
  authorType: string
  authorId: string
}

interface ReactionPickerProps {
  reactableType: string // "COMMENT" | "POST" | "TICKET" | "TIME_ENTRY" | etc.
  reactableId: string
  existingReactions?: Reaction[]
  onReactionChange?: () => void
  darkMode?: boolean
}

const AVAILABLE_EMOJIS = [
  "👍", // thumbs up
  "❤️", // heart
  "😂", // laughing
  "🎉", // party
  "🔥", // fire
  "👎", // thumbs down
  "😮", // surprised
  "😢", // sad
  "💯", // 100
  "🙏", // pray
  "👏", // clap
  "✅", // check
]

export function ReactionPicker({
  reactableType,
  reactableId,
  existingReactions = [],
  onReactionChange,
  darkMode = false,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // Group reactions by emoji and count
  const reactionCounts = existingReactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Check if current user has reacted (we'll need to pass current user info)
  // For now, we'll just show the reactions

  const handleReactionClick = async (emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      // (This is simplified - in production you'd check current user)
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reactableType,
          reactableId,
          emoji,
        }),
      })

      if (response.status === 400) {
        // Already reacted, remove it
        await fetch(
          `/api/reactions?type=${reactableType}&id=${reactableId}&emoji=${encodeURIComponent(emoji)}`,
          { method: "DELETE" }
        )
      } else if (!response.ok) {
        throw new Error("Failed to add reaction")
      }

      setIsOpen(false)
      onReactionChange?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to react. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExistingReactionClick = async (emoji: string) => {
    try {
      // Toggle reaction
      await fetch(
        `/api/reactions?type=${reactableType}&id=${reactableId}&emoji=${encodeURIComponent(emoji)}`,
        { method: "DELETE" }
      )
      onReactionChange?.()
    } catch (error) {
      // If delete fails, try adding
      try {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reactableType,
            reactableId,
            emoji,
          }),
        })
        onReactionChange?.()
      } catch {
        toast({
          title: "Error",
          description: "Failed to react. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Existing Reactions */}
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => handleExistingReactionClick(emoji)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all hover:scale-110 ${
            darkMode
              ? "bg-slate-700/50 hover:bg-slate-600/50"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <span>{emoji}</span>
          <span
            className={`text-xs font-semibold ${
              darkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            {count}
          </span>
        </button>
      ))}

      {/* Add Reaction Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${
              darkMode
                ? "hover:bg-slate-700/50 text-slate-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={`w-64 p-2 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white"}`}
          align="start"
        >
          <div className="grid grid-cols-6 gap-1">
            {AVAILABLE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={`p-2 text-2xl rounded hover:scale-125 transition-transform ${
                  darkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"
                }`}
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

