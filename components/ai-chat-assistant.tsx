"use client"

import type React from "react"

import { 
  Send, Bot, User, Sparkles, BookOpen, FileText, Users, HelpCircle,
  FolderOpen, Search, Upload, Clock, Database, Building2, GraduationCap,
  Settings, Briefcase, TrendingUp, FileCheck, ChevronRight, X, Trash2, Download, Loader2, RefreshCw, Pin, PinOff,
  Brain, History, Star, Lightbulb, Target, Workflow, UserCircle, Image as ImageIcon, XCircle
} from "lucide-react"
import { useRef, useEffect, useState } from "react"
import ReactMarkdown from 'react-markdown'
import DocumentUpload from "./document-upload"
import { DocumentSourceBadge } from "@/components/ui/document-source-badge"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

type Message = {
  id: string // Database ID from ai_conversations table
  role: "user" | "assistant"
  content: string
  sources?: string[] // Referenced documents
  isPinned?: boolean // Whether message is pinned
  createdAt?: string // When message was created
  image?: string // Base64 encoded image data
  imageType?: string // MIME type (e.g., "image/png")
}

type Document = {
  id: string
  title: string
  category: "CLIENT" | "TRAINING" | "PROCEDURE" | "CULTURE" | "SEO" | string  // Allow any string as fallback
  uploadedBy: string
  createdAt: string
  size: string
  fileUrl: string | null
  source?: string  // Add source field
}

type Task = {
  id: string
  title: string
  description: string | null
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "FOR_REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  deadline: string | null
  tags: string[]
  createdAt: string
  company?: {
    id: string
    companyName: string
  }
  clientUser?: {
    id: string
    name: string
    email: string
  }
}

type Memory = {
  id: string
  memory: string
  category: "PREFERENCE" | "FACT" | "GOAL" | "WORKFLOW" | "CLIENT_INFO"
  importance: number
  createdAt: string
  updatedAt: string
}

type SearchResult = {
  id: string
  message: string
  role: "user" | "assistant"
  isPinned: boolean | null
  createdAt: string | null
  similarity: number
}

const categoryConfig: Record<string, { label: string; color: string; icon: any }> = {
  CLIENT: { label: "Client Docs", color: "bg-blue-500/20 text-blue-400 ring-blue-500/30", icon: Building2 },
  TRAINING: { label: "Training", color: "bg-purple-500/20 text-purple-400 ring-purple-500/30", icon: GraduationCap },
  PROCEDURE: { label: "Procedures", color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30", icon: FileCheck },
  PROCEDURES: { label: "Procedures", color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30", icon: FileCheck },  // Alias
  CULTURE: { label: "Culture", color: "bg-pink-500/20 text-pink-400 ring-pink-500/30", icon: Users },
  SEO: { label: "SEO", color: "bg-amber-500/20 text-amber-400 ring-amber-500/30", icon: TrendingUp },
  OTHER: { label: "Other", color: "bg-gray-500/20 text-gray-400 ring-gray-500/30", icon: FileText },
  // Default fallback
  DEFAULT: { label: "Document", color: "bg-blue-500/20 text-blue-400 ring-blue-500/30", icon: FileText },
}

export default function AIChatAssistant() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [input, setInput] = useState("")
  const [showDocs, setShowDocs] = useState(true)
  const [searchDocs, setSearchDocs] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [documents, setDocuments] = useState<Document[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageType, setSelectedImageType] = useState<string | null>(null)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  
  // Memory & Search States
  const [memories, setMemories] = useState<Memory[]>([])
  const [showMemories, setShowMemories] = useState(false)
  const [loadingMemories, setLoadingMemories] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionStartPos, setMentionStartPos] = useState(0)
  const [pinningId, setPinningId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle input changes and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)

    const cursorPos = e.target.selectionStart || 0
    
    // Check if user just typed @ or is in the middle of a mention
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Only show mentions if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setShowMentions(true)
        setMentionQuery(textAfterAt.toLowerCase())
        setMentionStartPos(lastAtIndex)
        return
      }
    }
    
    // Hide mentions if no active @ mention
    setShowMentions(false)
    setMentionQuery("")
  }

  // Insert document or task mention
  const insertMention = (item: Document | Task) => {
    const beforeMention = input.substring(0, mentionStartPos)
    const afterMention = input.substring(inputRef.current?.selectionStart || input.length)
    const newValue = `${beforeMention}@${item.title} ${afterMention}`
    setInput(newValue)
    setShowMentions(false)
    setMentionQuery("")
    inputRef.current?.focus()
  }

  // Special "All Tasks" trigger
  const allTasksTrigger = {
    id: '__all_tasks__',
    title: 'All My Tasks',
    isSpecial: true,
  }
  
  // Filter documents and tasks based on mention query
  const documentSuggestions = showMentions
    ? documents.filter(doc => 
        doc.title.toLowerCase().includes(mentionQuery) ||
        doc.category.toLowerCase().includes(mentionQuery)
      ).slice(0, 3)
    : []
  
  const taskSuggestions = showMentions
    ? tasks.filter(task => 
        task.title.toLowerCase().includes(mentionQuery) ||
        task.status.toLowerCase().includes(mentionQuery) ||
        task.tags.some(tag => tag.toLowerCase().includes(mentionQuery))
      ).slice(0, 3)
    : []
  
  // Show "All Tasks" option if query matches "all", "tasks", or is empty
  const showAllTasksOption = showMentions && (
    mentionQuery === '' || 
    'all'.includes(mentionQuery) || 
    'tasks'.includes(mentionQuery) ||
    'my'.includes(mentionQuery)
  )
  
  const mentionSuggestions = [
    ...(showAllTasksOption ? [allTasksTrigger] : []),
    ...documentSuggestions,
    ...taskSuggestions
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch documents, tasks, conversation history, and memories on mount
  useEffect(() => {
    fetchDocuments()
    fetchTasks()
    fetchConversationHistory()
    fetchMemories()
  }, [])

  const fetchDocuments = async () => {
    setLoadingDocs(true)
    try {
      // Determine which endpoint to use based on current route/portal
      // Staff users: /api/documents (already includes admin+client shared docs)
      // Client users: /api/client/documents
      // Admin users: /api/admin/documents
      
      // For now, assume staff portal since the component is at /ai-assistant
      // TODO: Make this more dynamic if needed for client/admin portals
      const response = await fetch('/api/documents')
      
      if (!response.ok) {
        console.error(`Failed to fetch documents: ${response.status}`)
        setDocuments([])
        return
      }
      
      const data = await response.json()
      const fetchedDocs = (data.documents || []).map((doc: any) => ({
        ...doc,
        source: doc.source || 'STAFF'  // Ensure source field exists
      }))
      
      // Sort: Admin docs FIRST, then Staff docs, then Client docs
      const sortedDocs = fetchedDocs.sort((a: any, b: any) => {
        if (a.source === b.source) {
          // If same type, sort by date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        // Priority: ADMIN > STAFF > CLIENT
        const sourcePriority: Record<string, number> = { ADMIN: 0, STAFF: 1, CLIENT: 2 }
        return (sourcePriority[a.source] || 99) - (sourcePriority[b.source] || 99)
      })
      
      console.log(`✅ Fetched ${sortedDocs.length} documents from /api/documents (includes admin+client shared)`)
      setDocuments(sortedDocs)
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoadingDocs(false)
    }
  }

  const fetchTasks = async () => {
    setLoadingTasks(true)
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        const fetchedTasks = data.tasks || []
        console.log(`✅ Fetched ${fetchedTasks.length} tasks for staff user`)
        setTasks(fetchedTasks)
      } else {
        console.error('Failed to fetch tasks:', response.status)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  const fetchConversationHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        const history: Message[] = (data.conversations || []).map((conv: any) => ({
          id: conv.id,
          role: conv.role,
          content: conv.message,
          sources: conv.contextUsed?.sources || [],
          isPinned: conv.isPinned || false,
          createdAt: conv.createdAt
        }))
        console.log(`💬 Loaded ${history.length} messages from conversation history`)
        setMessages(history)
      } else {
        console.error('Failed to fetch conversation history:', response.status)
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Fetch memories
  const fetchMemories = async () => {
    setLoadingMemories(true)
    try {
      const response = await fetch('/api/memories')
      if (response.ok) {
        const data = await response.json()
        console.log(`🧠 Loaded ${data.memories.length} memories`)
        setMemories(data.memories || [])
      } else {
        console.error('Failed to fetch memories:', response.status)
      }
    } catch (error) {
      console.error('Error fetching memories:', error)
    } finally {
      setLoadingMemories(false)
    }
  }

  // Search conversations
  const searchConversations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearching(true)
    try {
      const response = await fetch('/api/conversations/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`🔍 Found ${data.results.length} matching conversations`)
        setSearchResults(data.results || [])
        setShowSearchResults(true)
      } else {
        console.error('Failed to search conversations:', response.status)
      }
    } catch (error) {
      console.error('Error searching conversations:', error)
    } finally {
      setSearching(false)
    }
  }

  // Save memory
  const saveMemory = async (memory: string, category: string = 'FACT', importance: number = 5) => {
    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory, category, importance }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`🧠 Memory saved: ${data.memory.id}`)
        setMemories(prev => [data.memory, ...prev])
        toast({
          title: "🧠 Memory Saved!",
          description: `I'll remember: "${memory.substring(0, 50)}${memory.length > 50 ? '...' : ''}"`,
          variant: "default",
        })
        return true
      } else {
        toast({
          title: "Error",
          description: "Failed to save memory. Please try again.",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('Error saving memory:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
      return false
    }
  }

  // Delete memory
  const deleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log(`🗑️ Memory deleted: ${memoryId}`)
        setMemories(prev => prev.filter(m => m.id !== memoryId))
        toast({
          title: "Memory Forgotten",
          description: "I've removed this from my memory.",
          variant: "default",
        })
        return true
      } else {
        toast({
          title: "Error",
          description: "Failed to delete memory. Please try again.",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error('Error deleting memory:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
        })
      return false
    }
  }

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id))
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePinMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    setPinningId(messageId)
    try {
      const method = message.isPinned ? 'DELETE' : 'POST'
      const response = await fetch(`/api/conversations/${messageId}/pin`, {
        method,
      })

      if (response.ok) {
        const wasPinned = message.isPinned
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
          )
        )
        
        // Show success toast
        if (wasPinned) {
          toast({
            title: "Message Unpinned",
            description: "Message removed from pinned section. It will be deleted after 30 days.",
            duration: 3000,
          })
        } else {
          toast({
            title: "📌 Message Pinned!",
            description: "This message is now saved forever and will appear at the top of your chat.",
            duration: 4000,
          })
        }
        
        console.log(`📌 ${wasPinned ? 'Unpinned' : 'Pinned'} message: ${messageId}`)
      } else {
        toast({
          title: "Error",
          description: "Failed to pin/unpin message. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error pinning message:', error)
      toast({
        title: "Error",
        description: "Failed to pin/unpin message. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setPinningId(null)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    // Check for special commands FIRST
    const trimmedText = text.trim()
    
    // @remember command
    if (trimmedText.toLowerCase().startsWith('@remember ')) {
      const memoryText = trimmedText.substring(10).trim()
      if (memoryText) {
        const success = await saveMemory(memoryText, 'PREFERENCE', 7)
        if (success) {
          // Add a user message showing what they asked
          const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
          }
          // Add AI confirmation
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `✅ Got it! I'll remember that: **"${memoryText}"**\n\nYou can see all my memories by typing \`@memories\`, or forget this later with \`@forget\`.`,
            isPinned: false,
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, userMsg, aiMsg])
        }
        setInput("")
        return
      }
    }
    
    // @memories command (show all memories)
    if (trimmedText.toLowerCase() === '@memories' || trimmedText.toLowerCase() === '@memory') {
      setShowMemories(true)
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      }
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `🧠 **My Memories About You (${memories.length} total):**\n\n${
          memories.length === 0
            ? "I don't have any memories saved yet. Use `@remember [something]` to teach me about your preferences!"
            : memories
                .sort((a, b) => b.importance - a.importance)
                .map((mem, i) => {
                  const stars = '⭐'.repeat(Math.min(mem.importance, 5))
                  const categoryEmoji = {
                    PREFERENCE: '⚙️',
                    FACT: '📝',
                    GOAL: '🎯',
                    WORKFLOW: '🔄',
                    CLIENT_INFO: '👔',
                  }[mem.category] || '📌'
                  return `${i + 1}. ${stars} ${categoryEmoji} ${mem.memory}\n   *${mem.category} • ID: \`${mem.id.substring(0, 8)}\`*`
                })
                .join('\n\n')
        }\n\n💡 Use \`@forget [memory-id]\` to remove a memory.`,
        isPinned: false,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg, aiMsg])
      setInput("")
      return
    }
    
    // @forget command (delete memory)
    if (trimmedText.toLowerCase().startsWith('@forget ')) {
      const memoryId = trimmedText.substring(8).trim()
      if (memoryId) {
        const memoryToDelete = memories.find(m => m.id.startsWith(memoryId))
        if (memoryToDelete) {
          const success = await deleteMemory(memoryToDelete.id)
          if (success) {
            const userMsg: Message = {
              id: Date.now().toString(),
              role: "user",
              content: text,
            }
            const aiMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `🗑️ **Memory Forgotten!**\n\nI've removed: *"${memoryToDelete.memory}"*\n\nI now have ${memories.length - 1} memories about you.`,
              isPinned: false,
              createdAt: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, userMsg, aiMsg])
          }
        } else {
          const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
          }
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `❌ I couldn't find a memory with ID \`${memoryId}\`. Use \`@memories\` to see all available memory IDs.`,
            isPinned: false,
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, userMsg, aiMsg])
        }
        setInput("")
        return
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      image: selectedImage || undefined,
      imageType: selectedImageType || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setInput("")
    
    // Show analyzing state if there's an image
    if (selectedImage) {
      setAnalyzingImage(true)
    }

    try {
      // Extract document and task references from @mentions
      const documentIds: string[] = []
      const taskIds: string[] = []
      const mentionPattern = /@(\S+)/g
      const mentions = text.match(mentionPattern)
      
      console.log('🔍 Message text:', text)
      console.log('🔍 Mentions found:', mentions)
      console.log('🔍 Total tasks available:', tasks.length)
      
      // Check if "All My Tasks" was mentioned (multiple variations)
      const lowerText = text.toLowerCase()
      const hasAllTasksMention = (
        (lowerText.includes('@all') && lowerText.includes('tasks')) ||
        lowerText.includes('@all my tasks') ||
        lowerText.includes('all my tasks') ||
        lowerText.includes('all tasks')
      )
      
      console.log('🔍 Has all tasks mention?', hasAllTasksMention)
      
      if (hasAllTasksMention) {
        // Add ALL task IDs
        tasks.forEach(task => {
          if (!taskIds.includes(task.id)) {
            taskIds.push(task.id)
          }
        })
        console.log(`📋✅ Referencing ALL ${tasks.length} tasks for AI context`)
        console.log(`📋 Task IDs being sent:`, taskIds.slice(0, 3), '...')
      } else if (mentions) {
        mentions.forEach(mention => {
          const searchTerm = mention.slice(1).toLowerCase()
          
          // Find documents that match the mention
          const matchedDocs = documents.filter(doc => 
            doc.title.toLowerCase().includes(searchTerm) ||
            doc.category.toLowerCase() === searchTerm
          )
          matchedDocs.forEach(doc => {
            if (!documentIds.includes(doc.id)) {
              documentIds.push(doc.id)
            }
          })
          
          // Find tasks that match the mention
          const matchedTasks = tasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            task.status.toLowerCase() === searchTerm
          )
          matchedTasks.forEach(task => {
            if (!taskIds.includes(task.id)) {
              taskIds.push(task.id)
            }
          })
        })
      }

      // Call AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
            image: m.image,
            imageType: m.imageType,
          })),
          documentIds: documentIds.length > 0 ? documentIds : undefined,
          taskIds: taskIds.length > 0 ? taskIds : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [AI CHAT] API Error:', response.status, errorData)
        throw new Error(errorData.details || errorData.error || `Failed to get AI response (${response.status})`)
      }

      const data = await response.json()
      
      // Update user message with database ID if returned
      if (data.conversationIds?.userId) {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === userMessage.id 
              ? { ...msg, id: data.conversationIds.userId }
              : msg
          )
        )
      }
      
      const assistantMessage: Message = {
        id: data.conversationIds?.assistantId || (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        sources: data.sources,
        isPinned: false,
        createdAt: new Date().toISOString(),
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please make sure the Claude API key is configured in your .env file.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setAnalyzingImage(false)
      setSelectedImage(null)
      setSelectedImageType(null)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, WEBP, etc.)",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    // Check file size (max 5MB for base64 encoding)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Extract just the base64 data (remove data:image/png;base64, prefix)
      const base64Data = base64.split(',')[1]
      setSelectedImage(base64Data)
      setSelectedImageType(file.type)
      toast({
        title: "✅ Image Uploaded",
        description: "Image ready to send. Type a message or send as-is!",
        duration: 3000,
      })
    }
    reader.onerror = () => {
      toast({
        title: "Upload Failed",
        description: "Failed to read image file",
        variant: "destructive",
        duration: 3000,
      })
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setSelectedImageType(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if ((!input.trim() && !selectedImage) || isLoading) return
    sendMessage(input || "Analyze this image")
    setInput("")
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchDocs.toLowerCase())
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const docsByCategory = Object.entries(categoryConfig).map(([key, config]) => ({
    key,
    ...config,
    count: documents.filter(d => d.category === key).length
  }))

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col space-y-6">
          
        {/* Header */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-indigo-900/50 p-6 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-1 ring-indigo-400/50">
              <Bot className="h-7 w-7 text-indigo-300" />
            </div>
            <div>
                  <h1 className="text-2xl font-bold text-white">AI Training Assistant 🤖</h1>
                  <p className="text-slate-300">Ask me anything about clients, procedures, or training</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocs(!showDocs)}
                className="rounded-lg bg-slate-800/50 p-2 text-slate-400 ring-1 ring-white/10 transition-all hover:bg-slate-700/50 hover:text-white lg:hidden"
              >
                {showDocs ? <X className="h-5 w-5" /> : <FolderOpen className="h-5 w-5" />}
              </button>
            </div>

            {/* Client Sync Indicator */}
            <div className="mt-4 rounded-lg bg-blue-500/10 p-3 ring-1 ring-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full bg-blue-500/20 p-2">
                  <RefreshCw className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-400">Document Sync Active</span>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400"></div>
                  </div>
                  <p className="text-xs text-blue-300/80">
                    All documents you upload are automatically shared with your client's knowledge base
                  </p>
                </div>
              </div>
            </div>
            
            {/* Conversation Search Bar */}
            <div className="mt-4 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="🔍 Search past conversations... (e.g., 'SEO titles', 'VAULTRE')"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.trim()) {
                      searchConversations(e.target.value)
                    } else {
                      setSearchResults([])
                      setShowSearchResults(false)
                    }
                  }}
                  className="w-full rounded-lg bg-slate-800/50 py-3 pl-11 pr-4 text-white placeholder-slate-500 ring-1 ring-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-indigo-400" />
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg bg-slate-800/90 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-indigo-300">
                      🔍 Found {searchResults.length} conversations
                    </h3>
                    <button
                      onClick={() => {
                        setShowSearchResults(false)
                        setSearchQuery("")
                        setSearchResults([])
                      }}
                      className="text-slate-400 transition-colors hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {searchResults.map((result, idx) => (
                    <div
                      key={result.id}
                      className="cursor-pointer rounded-lg bg-slate-900/50 p-3 ring-1 ring-white/5 transition-all hover:bg-slate-900 hover:ring-indigo-500/30"
                      onClick={() => {
                        // Scroll to message in chat if it exists
                        const messageElement = document.getElementById(`message-${result.id}`)
                        if (messageElement) {
                          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          messageElement.classList.add('ring-2', 'ring-indigo-500', 'animate-pulse')
                          setTimeout(() => {
                            messageElement.classList.remove('ring-2', 'ring-indigo-500', 'animate-pulse')
                          }, 2000)
                        }
                        setShowSearchResults(false)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {result.role === 'user' ? (
                            <User className="h-5 w-5 text-blue-400" />
                          ) : (
                            <Bot className="h-5 w-5 text-indigo-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-400">
                              {result.role === 'user' ? 'You' : 'AI'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : ''}
                            </span>
                            <span className="ml-auto rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
                              {(result.similarity * 100).toFixed(0)}% match
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-white">
                            {result.message.substring(0, 200)}
                            {result.message.length > 200 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showSearchResults && searchResults.length === 0 && !searching && searchQuery.trim() && (
                <div className="rounded-lg bg-slate-800/50 p-4 text-center ring-1 ring-white/10">
                  <p className="text-sm text-slate-400">
                    No conversations found for "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
            
            {/* Knowledge Base Stats */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <div className="text-xl font-bold text-white">{loadingDocs ? '...' : documents.length}</div>
                <div className="text-xs text-slate-400">Documents</div>
              </div>
              <div className="rounded-xl bg-indigo-500/10 p-3 text-center ring-1 ring-indigo-500/30">
                <div className="text-xl font-bold text-indigo-400">
                  {loadingDocs ? '...' : documents.filter(d => d.category === "CLIENT").length}
                </div>
                <div className="text-xs text-indigo-300">Client Docs</div>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3 text-center ring-1 ring-purple-500/30">
                <div className="text-xl font-bold text-purple-400">
                  {loadingDocs ? '...' : documents.filter(d => d.category === "TRAINING" || d.category === "SEO").length}
                </div>
                <div className="text-xs text-purple-300">Training</div>
              </div>
              <button
                onClick={() => setShowMemories(!showMemories)}
                className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-3 text-center ring-1 ring-amber-500/30 transition-all hover:ring-2 hover:ring-amber-500/50"
              >
                <div className="text-xl font-bold text-amber-400">
                  {loadingMemories ? '...' : memories.length}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-amber-300">
                  <Brain className="h-3 w-3" />
                  Memories
                </div>
              </button>
          </div>
          
          {/* Memory Panel */}
          {showMemories && (
            <div className="mt-4 rounded-xl bg-gradient-to-br from-amber-900/30 to-orange-900/30 p-6 ring-1 ring-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/50">
                    <Brain className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-300">My Memories ({memories.length})</h3>
                    <p className="text-xs text-amber-400/70">Things I remember about you</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMemories(false)}
                  className="text-amber-400 transition-colors hover:text-amber-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {memories.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-amber-300">No memories yet!</p>
                  <p className="text-sm text-amber-400/70">
                    Use <code className="px-2 py-1 bg-slate-800/50 rounded">@remember [something]</code> to teach me about your preferences!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {memories
                    .sort((a, b) => b.importance - a.importance)
                    .map((mem) => {
                      const stars = '⭐'.repeat(Math.min(mem.importance, 5))
                      const categoryConfig = {
                        PREFERENCE: { icon: Settings, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                        FACT: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                        GOAL: { icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
                        WORKFLOW: { icon: Workflow, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
                        CLIENT_INFO: { icon: UserCircle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                      }
                      const config = categoryConfig[mem.category] || categoryConfig.FACT
                      const Icon = config.icon
                      
                      return (
                        <div
                          key={mem.id}
                          className="rounded-lg bg-slate-900/50 p-4 ring-1 ring-amber-500/20 transition-all hover:ring-amber-500/40"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}>
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white mb-2">{mem.memory}</p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-amber-400">{stars}</span>
                                <span className={`px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
                                  {mem.category.replace('_', ' ')}
                                </span>
                                <span className="text-slate-500">
                                  {new Date(mem.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteMemory(mem.id)}
                              className="flex-shrink-0 rounded p-1.5 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                              title="Forget this memory"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}

              {/* Memory Commands Help */}
              <div className="mt-4 rounded-lg bg-slate-900/50 p-3 space-y-1">
                <p className="text-xs font-semibold text-amber-300 mb-2">📝 Memory Commands:</p>
                <code className="block text-xs text-amber-400/80">@remember [text] - Save a new memory</code>
                <code className="block text-xs text-amber-400/80">@memories - Show all memories</code>
                <code className="block text-xs text-amber-400/80">@forget [id] - Delete a memory</code>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-slate-900/50 p-6 ring-1 ring-white/10 backdrop-blur-sm">
          {loadingHistory ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm text-slate-400">Loading conversation history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-1 ring-indigo-400/50">
                  <Bot className="h-10 w-10 text-indigo-300" />
              </div>
              <div>
                  <h3 className="text-xl font-semibold text-white">Ready to help you learn! 📚</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {documents.length > 0 
                      ? `I have access to ${documents.length} document${documents.length !== 1 ? 's' : ''} in your library.`
                      : 'Upload your first training document to get started!'
                    }<br />
                    {documents.length > 0 && (
                      <>
                        💡 <strong>Tip:</strong> Use @mentions to reference specific documents (e.g., "What does @SEO say about keywords?")
                        <br />
                      </>
                    )}
                    Ask me anything about BPO work, training, or your documents!
                  </p>
                </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pinned Messages Section */}
              {messages.some(m => m.isPinned) && (
                <div className="rounded-xl bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-indigo-900/40 p-4 ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/20 animate-pulse-slow">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-indigo-200">
                    <Pin className="h-5 w-5 text-indigo-300" />
                    <span>📌 PINNED MESSAGES (Saved Forever)</span>
                  </div>
                  <div className="space-y-3">
                    {messages.filter(m => m.isPinned && m.role === 'assistant').map((message) => (
                      <div key={`pinned-${message.id}`} className="rounded-lg bg-slate-800/50 p-3 ring-1 ring-white/10">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 text-xs leading-relaxed text-slate-200">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                              ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 text-xs text-slate-200">{children}</ul>,
                              li: ({ children }) => <li className="text-xs leading-relaxed">{children}</li>,
                            }}
                          >
                            {message.content.length > 200 ? `${message.content.substring(0, 200)}...` : message.content}
                          </ReactMarkdown>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {message.createdAt ? new Date(message.createdAt).toLocaleDateString() : ''}
                          </span>
                          <button
                            onClick={() => handlePinMessage(message.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            Unpin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regular Messages */}
              {messages.map((message) => (
                  <div key={message.id} id={`message-${message.id}`}>
                    <div className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-1 ring-indigo-400/50">
                      <Bot className="h-5 w-5 text-indigo-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] space-y-2 rounded-xl p-4 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-white ring-1 ring-indigo-400/50"
                        : "bg-slate-800/50 text-white ring-1 ring-white/10"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-slate-100">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
                            ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-slate-100">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-slate-100">{children}</ol>,
                            li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                            h1: ({ children }) => <h1 className="mb-2 text-lg font-bold text-white">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-2 text-base font-semibold text-white">{children}</h2>,
                            h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold text-white">{children}</h3>,
                            code: ({ children }) => <code className="rounded bg-slate-700/50 px-1.5 py-0.5 text-xs text-indigo-300">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-400/50 pl-3 italic text-slate-300">{children}</blockquote>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <>
                        {/* User Message Image */}
                        {message.image && (
                          <img 
                            src={`data:${message.imageType};base64,${message.image}`}
                            alt="Uploaded" 
                            className="mb-2 max-h-64 w-full rounded-lg object-contain bg-slate-900/50 ring-1 ring-white/10"
                          />
                        )}
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                      </>
                    )}
                    
                    {/* Pin button for assistant messages */}
                    {message.role === "assistant" && (
                      <div className="mt-3 flex items-center justify-end">
                        <button
                          onClick={() => handlePinMessage(message.id)}
                          disabled={pinningId === message.id}
                          title={message.isPinned ? "Unpin this message" : "Pin this message to save it forever"}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            message.isPinned
                              ? 'bg-indigo-500/30 text-indigo-200 ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/20 hover:bg-indigo-500/40 hover:scale-105'
                              : 'bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/50 hover:bg-slate-600/50 hover:text-white hover:ring-indigo-400/30 hover:scale-105'
                          } ${pinningId === message.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {message.isPinned ? (
                            <>
                              <PinOff className="h-4 w-4" />
                              <span>Unpin</span>
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4" />
                              <span>📌 Save Forever</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 ring-1 ring-amber-400/50">
                      <User className="h-5 w-5 text-amber-300" />
                        </div>
                      )}
                    </div>
                    
                    {/* Referenced Documents */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="ml-11 mt-2">
                        <div className="rounded-lg bg-slate-800/30 p-3 ring-1 ring-white/5">
                          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                            <Database className="h-3 w-3" />
                            <span>Sources referenced:</span>
                          </div>
                          <div className="space-y-1">
                            {message.sources.map((source, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-indigo-400">
                                <ChevronRight className="h-3 w-3" />
                                <span>{source}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-1 ring-indigo-400/50">
                    <Bot className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-4 py-3 ring-1 ring-white/10">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                      </div>
                      <span className="text-xs text-slate-400">Searching knowledge base...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="relative rounded-2xl bg-slate-900/50 p-4 ring-1 ring-white/10 backdrop-blur-sm">
          {/* @ Mention Autocomplete Dropdown */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 rounded-xl bg-slate-800 p-2 shadow-xl ring-1 ring-white/20">
              <div className="mb-2 px-3 py-1 text-xs text-slate-400">
                Select document or task to mention:
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {mentionSuggestions.map((item) => {
                  // Check if it's the special "All Tasks" trigger
                  const isSpecial = 'isSpecial' in item && item.isSpecial
                  // Check if it's a task or document
                  const isTask = 'status' in item && 'priority' in item
                  const isDoc = 'category' in item && 'size' in item
                  
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => insertMention(item)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${
                        isSpecial 
                          ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 ring-1 ring-emerald-500/30 hover:from-emerald-500/20 hover:to-blue-500/20' 
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      {isSpecial ? (
                        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                          <Briefcase className="h-4 w-4 text-emerald-400" />
                        </div>
                      ) : isTask ? (
                        <Briefcase className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                      ) : (
                        <FileText className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                      )}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="truncate text-sm font-medium text-white">
                            {isSpecial ? '📋 ' : ''}{item.title}
                          </div>
                          {isSpecial ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300">
                              {tasks.length} tasks
                            </span>
                          ) : isTask ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              (item as Task).status === 'DONE' ? 'bg-emerald-500/20 text-emerald-300' :
                              (item as Task).status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300' :
                              (item as Task).status === 'FOR_REVIEW' ? 'bg-purple-500/20 text-purple-300' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>
                              {(item as Task).status.replace('_', ' ')}
                            </span>
                          ) : (
                            <DocumentSourceBadge source={(item as Document).source as 'ADMIN' | 'STAFF' | 'CLIENT'} />
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {isSpecial ? (
                            'Get a report of all your tasks'
                          ) : isTask ? (
                            <>
                              Priority: {(item as Task).priority} • {(item as Task).tags.join(', ') || 'No tags'}
                            </>
                          ) : (
                            <>
                              {(item as Document).category} • {(item as Document).size}
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Image Preview */}
          {selectedImage && (
            <div className="mb-3 relative rounded-lg overflow-hidden ring-1 ring-indigo-500/50">
              <img 
                src={`data:${selectedImageType};base64,${selectedImage}`}
                alt="Selected" 
                className="max-h-48 w-full object-contain bg-slate-800/50"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 rounded-full bg-red-500/80 p-1.5 text-white ring-2 ring-white/50 transition-all hover:bg-red-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
              {analyzingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm text-white font-medium">🔍 Analyzing image...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={selectedImage ? "Describe what you need help with..." : "Ask about clients, procedures, training... Use @ to mention documents or tasks"}
                disabled={isLoading}
                className="w-full rounded-lg bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50 disabled:opacity-50"
              />
            </div>
            
            {/* Image Upload Button */}
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-3 font-medium text-slate-300 ring-1 ring-white/10 transition-all hover:bg-slate-700/50 hover:text-white hover:ring-indigo-400/30">
              <ImageIcon className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isLoading}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500/30 to-purple-500/30 px-6 py-3 font-medium text-white ring-1 ring-indigo-400/50 transition-all hover:from-indigo-500/40 hover:to-purple-500/40 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span className="hidden md:inline">Send</span>
            </button>
          </div>
        </form>
        </div>

        {/* Document Library Sidebar */}
        <div className={`w-80 flex-shrink-0 space-y-4 ${showDocs ? "" : "hidden lg:block"}`}>
          
          {/* Knowledge Base Header */}
          <div className="rounded-2xl bg-slate-900/50 p-5 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Knowledge Base</h2>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchDocs}
                onChange={(e) => setSearchDocs(e.target.value)}
                placeholder="Search documents..."
                className="w-full rounded-lg bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-indigo-400/50"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                  selectedCategory === "all"
                    ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30"
                    : "text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>All Documents</span>
                  <span className="text-xs">{documents.length}</span>
                </div>
              </button>
              {docsByCategory.map(({ key, label, icon: Icon, color, count }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                    selectedCategory === key
                      ? color.replace("/20", "/10") + " ring-1"
                      : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                    <span className="text-xs">{count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Document List */}
          <div className="rounded-2xl bg-slate-900/50 p-5 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {selectedCategory === "all" ? "All Documents" : categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label}
              </h3>
              <span className="text-xs text-slate-400">{filteredDocs.length} docs</span>
            </div>
            
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {loadingDocs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400">
                        {searchDocs ? 'No documents match your search' : 'No documents yet. Upload your first one!'}
                      </p>
                    </div>
                  ) : (
                    filteredDocs.map((doc) => {
                      const config = categoryConfig[doc.category] || categoryConfig.DEFAULT
                      const Icon = config.icon
                      const isDeleting = deletingId === doc.id
                      
                      return (
                        <div
                          key={doc.id}
                          className="group rounded-lg bg-slate-800/30 p-3 ring-1 ring-white/5 transition-all hover:bg-slate-800/50 hover:ring-white/10"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 rounded-lg p-2 ring-1 ${config.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-indigo-400 flex-1 min-w-0">
                                  {doc.title}
                                </h4>
                                <DocumentSourceBadge source={doc.source as 'ADMIN' | 'STAFF' | 'CLIENT'} />
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span className="truncate">{doc.uploadedBy}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-indigo-400"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={isDeleting}
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-red-400 disabled:opacity-50"
                                title="Delete"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
          </div>

          {/* My Tasks Section */}
          <div className="rounded-2xl bg-slate-900/50 p-5 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">My Tasks</h3>
              </div>
              <span className="text-xs text-slate-400">{tasks.length} tasks</span>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {loadingTasks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400">No tasks assigned yet</p>
                </div>
              ) : (
                tasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="group rounded-lg bg-slate-800/30 p-3 ring-1 ring-white/5 transition-all hover:bg-slate-800/50 hover:ring-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 rounded-lg p-2 ring-1 ${
                        task.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' :
                        task.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400 ring-amber-500/30' :
                        task.status === 'FOR_REVIEW' ? 'bg-purple-500/20 text-purple-400 ring-purple-500/30' :
                        'bg-slate-500/20 text-slate-400 ring-slate-500/30'
                      }`}>
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-emerald-400 flex-1 min-w-0">
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-300' :
                            task.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300' :
                            task.status === 'FOR_REVIEW' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-slate-500/20 text-slate-300'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.priority === 'URGENT' ? 'bg-red-500/20 text-red-300' :
                            task.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                            task.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.deadline && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upload Button */}
          <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white ring-1 ring-indigo-500/50 transition-all hover:from-indigo-700 hover:to-purple-700 active:scale-95"
          >
            <Upload className="inline h-4 w-4 mr-2" />
            Upload Document
          </button>
        </div>

      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUpload
          onSuccess={fetchDocuments}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}



