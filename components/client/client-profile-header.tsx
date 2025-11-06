"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ClientUserWithCompany = {
  id: string
  name: string
  email: string
  avatar: string | null
  coverPhoto: string | null
  role: string
  company: {
    id: string
    companyName: string
    organizationId: string
  }
}

export function ClientProfileHeader({ user }: { user: ClientUserWithCompany }) {
  const router = useRouter()
  const { toast } = useToast()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Avatar must be less than 5MB. Please choose a smaller image.",
        variant: "destructive",
      })
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/client/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      toast({
        title: "Success",
        description: "Avatar updated successfully!",
        variant: "success",
      })
      router.refresh()
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      if (coverInputRef.current) coverInputRef.current.value = ''
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Cover photo must be less than 5MB. Please choose a smaller image.",
        variant: "destructive",
      })
      if (coverInputRef.current) coverInputRef.current.value = ''
      return
    }

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/client/profile/cover', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      toast({
        title: "Success",
        description: "Cover photo updated successfully!",
        variant: "success",
      })
      router.refresh()
    } catch (error) {
      console.error('Cover upload error:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload cover photo",
        variant: "destructive",
      })
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Cover Photo */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600">
        {user.coverPhoto && (
          <img
            src={user.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Loading Overlay for Cover */}
        {uploadingCover && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
              <span className="text-sm text-white font-medium">Uploading cover...</span>
            </div>
          </div>
        )}
        
        {/* Upload Cover Button */}
        <label className="absolute top-4 right-4 cursor-pointer">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
            disabled={uploadingCover}
          />
          <Button
            size="sm"
            variant="secondary"
            className="gap-2"
            disabled={uploadingCover}
            asChild
          >
            <span>
              {uploadingCover ? (
                <>Uploading...</>
              ) : (
                <>
                  <Camera className="size-4" />
                  Change Cover
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Profile Section */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4 inline-block">
          <Avatar className="size-32 border-4 border-background">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-4xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Loading Overlay */}
          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <span className="text-xs text-white font-medium">Uploading...</span>
              </div>
            </div>
          )}
          
          {/* Upload Avatar Button */}
          <label className="absolute bottom-0 right-0 cursor-pointer">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
            <Button
              size="icon"
              className="size-8 rounded-full"
              disabled={uploadingAvatar}
              asChild
            >
              <span>
                  <Camera className="size-4" />
              </span>
            </Button>
          </label>
        </div>

        {/* User Info */}
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground text-lg">
            {user.role} - {user.company.companyName}
          </p>
        </div>
      </div>
    </Card>
  )
}
