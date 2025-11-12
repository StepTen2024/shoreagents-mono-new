"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Briefcase, Phone, Clock, Edit2, Save, X, Building2, Camera, Loader2, TrendingUp, Calendar } from "lucide-react"
import { uploadClientFile, deleteClientFile } from "@/lib/supabase-upload"
import { useToast } from "@/hooks/use-toast"

type ClientProfile = {
  id: string
  position: string | null
  department: string | null
  directPhone: string | null
  mobilePhone: string | null
  timezone: string | null
  bio: string | null
  tasksCreated: number
  reviewsSubmitted: number
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

type Company = {
  id: string
  companyName: string
  logo: string | null
  location: string | null
}

type ClientUser = {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  coverPhoto: string | null
  company: Company
}

type ProfileData = {
  client_users: ClientUser
  profile: ClientProfile | null
}

export default function ClientProfilePage() {
  const { toast } = useToast()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<ClientProfile>>({})
  const [editedClientUser, setEditedClientUser] = useState<Partial<ClientUser>>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/client/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const profileData = await response.json()
      setData(profileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    setEditedProfile({
      position: data?.profile?.position || '',
      department: data?.profile?.department || '',
      directPhone: data?.profile?.directPhone || '',
      mobilePhone: data?.profile?.mobilePhone || '',
      timezone: data?.profile?.timezone || '',
      bio: data?.profile?.bio || ''
    })
    setEditedClientUser({
      name: data?.client_users?.name || '',
      role: data?.client_users?.role || ''
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditedProfile({})
    setEditedClientUser({})
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    
    // Show saving toast
    toast({
      title: "Saving Profile",
      description: "Please wait while your profile is being updated...",
      duration: 3000
    })

    try {
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editedProfile,
          ...editedClientUser
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }
      
      await fetchProfile()
      setEditing(false)
      setEditedProfile({})
      setEditedClientUser({})
      
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        duration: 3000
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setSavingProfile(false)
    }
  }


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !data) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG, PNG, or WebP image file.",
        variant: "destructive",
        duration: 5000
      })
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
        duration: 5000
      })
      return
    }

    setUploadingAvatar(true)
    
    // Show uploading toast
    toast({
      title: "Uploading Avatar",
      description: "Please wait while your avatar is being uploaded...",
      duration: 3000
    })

    try {
      // Delete old avatar if exists using server-side API
      if (data.client_users.avatar) {
        try {
          console.log('Deleting old avatar:', data.client_users.avatar)
          const deleteResponse = await fetch('/api/client/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: data.client_users.avatar }),
          })
          
          if (deleteResponse.ok) {
            console.log('Old avatar deleted successfully')
          } else {
            console.warn('Failed to delete old avatar, proceeding with upload')
          }
        } catch (deleteError) {
          console.warn('Failed to delete old avatar, proceeding with upload:', deleteError)
          // Continue with upload even if delete fails
        }
      }

      // Upload new avatar using server-side API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')

      const response = await fetch('/api/client/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload avatar')
      }

      const result = await response.json()
      console.log('Avatar uploaded successfully:', result.url)
      
      // Show success toast
      toast({
        title: "Avatar Updated",
        description: "Your avatar has been successfully updated.",
        duration: 3000
      })

      // Refresh profile immediately - the server already updated the database
      console.log('Refreshing profile after avatar upload...')
      await fetchProfile()
      console.log('Profile refreshed successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !data) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG, PNG, or WebP image file.",
        variant: "destructive",
        duration: 5000
      })
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
        duration: 5000
      })
      return
    }

    setUploadingCover(true)
    
    // Show uploading toast
    toast({
      title: "Uploading Cover Photo",
      description: "Please wait while your cover photo is being uploaded...",
      duration: 3000
    })

    try {
      // Delete old cover if exists using server-side API
      if (data.client_users.coverPhoto) {
        try {
          console.log('Deleting old cover photo:', data.client_users.coverPhoto)
          const deleteResponse = await fetch('/api/client/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: data.client_users.coverPhoto }),
          })
          
          if (deleteResponse.ok) {
            console.log('Old cover photo deleted successfully')
          } else {
            console.warn('Failed to delete old cover photo, proceeding with upload')
          }
        } catch (deleteError) {
          console.warn('Failed to delete old cover photo, proceeding with upload:', deleteError)
          // Continue with upload even if delete fails
        }
      }

      // Upload new cover photo using server-side API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'cover')

      const response = await fetch('/api/client/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload cover photo')
      }

      const result = await response.json()
      console.log('Cover photo uploaded successfully:', result.url)
      
      // Show success toast
      toast({
        title: "Cover Photo Updated",
        description: "Your cover photo has been successfully updated.",
        duration: 3000
      })

      // Refresh profile immediately - the server already updated the database
      console.log('Refreshing profile after cover upload...')
      await fetchProfile()
      console.log('Profile refreshed successfully')
    } catch (error) {
      console.error('Error uploading cover photo:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload cover photo. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setUploadingCover(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Profile Header Card Skeleton */}
        <div className="overflow-hidden border-blue-200 rounded-lg">
          {/* Cover Photo Skeleton */}
          <div className="h-80 bg-gray-200 animate-pulse"></div>
          
          {/* Profile Content Skeleton */}
          <div className="p-6 bg-white">
            <div className="flex items-start gap-6">
              {/* Avatar Skeleton */}
              <div className="flex-shrink-0 -mt-16">
                <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse"></div>
              </div>
              
              {/* User Info Skeleton */}
              <div className="flex-1 pt-4 space-y-3">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
                
                <div className="flex items-center gap-4 mt-4">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information Skeleton */}
        <div className="p-6 border-l-4 border-l-indigo-500 bg-white shadow-sm rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg mt-1">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg mt-1">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-56 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg mt-1">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Professional Information Skeleton */}
          <div className="p-6 border-l-4 border-l-blue-500 bg-white shadow-sm rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Skeleton */}
          <div className="p-6 border-l-4 border-l-green-500 bg-white shadow-sm rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-5 w-56 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Statistics Skeleton */}
        <div className="p-6 bg-white shadow-sm border-l-4 border-l-purple-500 rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gray-300 rounded-lg">
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load profile</p>
      </div>
    )
  }

  const { client_users: clientUser, profile } = data
  const initials = clientUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
        </div>
        {!editing ? (
          <Button onClick={startEditing} className="bg-blue-600 hover:bg-blue-700">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={saveProfile} 
              disabled={savingProfile}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
                </>
              )}
            </Button>
            <Button 
              onClick={cancelEditing} 
              disabled={savingProfile}
              variant="outline"
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Header Card with Cover Photo and Avatar */}
      <Card className="overflow-hidden border-blue-200 bg-white py-0 gap-0">
        {/* Cover Photo Banner */}
        <div className="relative h-80 bg-gradient-to-br from-blue-500 to-cyan-500 group">
          {clientUser.coverPhoto ? (
            <img src={clientUser.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500" />
          )}
          {/* Cover Upload Overlay */}
          <label 
            htmlFor="cover-upload" 
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity cursor-pointer ${
              uploadingCover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {uploadingCover ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <span className="text-white text-sm font-medium">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-8 w-8 text-white" />
                <span className="text-white text-sm font-medium">Change Cover Photo</span>
              </div>
            )}
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
            disabled={uploadingCover}
          />
        </div>

        {/* Profile Content */}
        <div className="p-6 bg-white">
          <div className="flex items-start gap-6">
            {/* Avatar with Upload */}
            <div className="flex-shrink-0 -mt-16">
              <div className="relative w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden group">
                {clientUser.avatar ? (
                  <img src={clientUser.avatar} alt={clientUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-3xl font-semibold">
                    {initials}
                  </div>
                )}
                {/* Upload Button Overlay */}
                <label 
                  htmlFor="avatar-upload" 
                  className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity cursor-pointer ${
                    uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {uploadingAvatar ? (
                    <div className="flex flex-col items-center gap-1">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                      <span className="text-white text-xs font-medium">Uploading...</span>
                    </div>
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 pt-4">
              <h2 className="text-3xl font-bold text-gray-900">{clientUser.name}</h2>
              <p className="text-gray-600 mt-1 text-lg">{profile?.position || clientUser.role}</p>
              {profile?.department && (
                <p className="text-sm text-gray-600">{profile.department}</p>
              )}
              {profile?.bio && (
                <p className="text-gray-700 mt-3">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  {clientUser.company.companyName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-blue-600" />
                  {clientUser.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="p-6 border-l-4 border-l-indigo-500 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <User className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Account Information</h3>
        </div>
        
        {editing ? (
          <div className="space-y-6">
            <div>
              <Label className="text-gray-900 font-medium mb-2 block">Full Name</Label>
              <Input
                value={editedClientUser.name || ''}
                onChange={(e) => setEditedClientUser({...editedClientUser, name: e.target.value})}
                disabled={savingProfile}
                className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label className="text-gray-900 font-medium mb-2 block">Role</Label>
              <select
                value={editedClientUser.role || ''}
                onChange={(e) => setEditedClientUser({...editedClientUser, role: e.target.value})}
                disabled={savingProfile}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900"
              >
                <option value="">Select your role</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg mt-1">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="text-gray-900 font-medium">{clientUser.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg mt-1">
                <Mail className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Email Address</p>
                <p className="text-gray-900 font-medium">{clientUser.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg mt-1">
                <Briefcase className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Role</p>
                <p className="text-gray-900 font-medium">{clientUser.role}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Information */}
        <Card className="p-6 border-l-4 border-l-blue-500 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Professional Information</h3>
          </div>
          
          {editing ? (
            <div className="space-y-6">
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Position / Job Title</Label>
                <Input
                  value={editedProfile.position || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, position: e.target.value})}
                  disabled={savingProfile}
                  className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., CEO, Operations Manager"
                />
              </div>
              
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Department</Label>
                <Input
                  value={editedProfile.department || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, department: e.target.value})}
                  disabled={savingProfile}
                  className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Operations, Marketing"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Timezone</Label>
                <Select
                  value={editedProfile.timezone || ''}
                  onValueChange={(value) => setEditedProfile({...editedProfile, timezone: value})}
                  disabled={savingProfile}
                >
                  <SelectTrigger className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* USA Timezones */}
                    <SelectItem value="America/New_York">🇺🇸 USA - Eastern Time (NY, FL, GA, NC, VA)</SelectItem>
                    <SelectItem value="America/Chicago">🇺🇸 USA - Central Time (TX, IL, WI, TN, MO)</SelectItem>
                    <SelectItem value="America/Denver">🇺🇸 USA - Mountain Time (CO, AZ, UT, NM)</SelectItem>
                    <SelectItem value="America/Los_Angeles">🇺🇸 USA - Pacific Time (CA, WA, OR, NV)</SelectItem>
                    <SelectItem value="America/Anchorage">🇺🇸 USA - Alaska Time</SelectItem>
                    <SelectItem value="Pacific/Honolulu">🇺🇸 USA - Hawaii Time</SelectItem>
                    
                    {/* Australia Timezones */}
                    <SelectItem value="Australia/Sydney">🇦🇺 Australia - Sydney / NSW</SelectItem>
                    <SelectItem value="Australia/Melbourne">🇦🇺 Australia - Melbourne / Victoria</SelectItem>
                    <SelectItem value="Australia/Brisbane">🇦🇺 Australia - Brisbane / Queensland</SelectItem>
                    <SelectItem value="Australia/Adelaide">🇦🇺 Australia - Adelaide / South Australia</SelectItem>
                    <SelectItem value="Australia/Perth">🇦🇺 Australia - Perth / Western Australia</SelectItem>
                    <SelectItem value="Australia/Darwin">🇦🇺 Australia - Darwin / Northern Territory</SelectItem>
                    <SelectItem value="Australia/Hobart">🇦🇺 Australia - Hobart / Tasmania</SelectItem>
                    
                    {/* New Zealand Timezones */}
                    <SelectItem value="Pacific/Auckland">🇳🇿 New Zealand</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Start typing to search for your timezone</p>
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Bio</Label>
                <Textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                  disabled={savingProfile}
                  className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Tell us about yourself, your experience, and what you do..."
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <Briefcase className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Position</p>
                  <p className="text-gray-900 font-medium">{profile?.position || clientUser.role || 'Not specified'}</p>
                </div>
              </div>

              {profile?.department && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Building2 className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <p className="text-gray-900 font-medium">{profile.department}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Timezone</p>
                  <p className="text-gray-900 font-medium">{profile?.timezone || 'Not set'}</p>
                </div>
              </div>

              {profile?.bio && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Bio</p>
                    <p className="text-gray-900 leading-relaxed">{profile.bio}</p>
                  </div>
                </div>
              )}

              {!profile?.position && !profile?.department && !profile?.timezone && !profile?.bio && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No professional information added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Edit Profile" to add details</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Contact Information */}
        <Card className="p-6 border-l-4 border-l-green-500 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
          </div>
          
          {editing ? (
            <div className="space-y-6">
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Direct Phone</Label>
                <Input
                  value={editedProfile.directPhone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, directPhone: e.target.value})}
                  disabled={savingProfile}
                  className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="+1 234 567 8900"
                />
              </div>
              
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Mobile Phone</Label>
                <Input
                  value={editedProfile.mobilePhone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, mobilePhone: e.target.value})}
                  disabled={savingProfile}
                  className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Email Address</p>
                  <p className="text-gray-900 font-medium">{clientUser.email}</p>
                </div>
              </div>

              {profile?.directPhone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Direct Phone</p>
                    <p className="text-gray-900 font-medium">{profile.directPhone}</p>
                  </div>
                </div>
              )}

              {profile?.mobilePhone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Mobile Phone</p>
                    <p className="text-gray-900 font-medium">{profile.mobilePhone}</p>
                  </div>
                </div>
              )}

              {!profile?.directPhone && !profile?.mobilePhone && (
                <div className="text-center py-8 text-gray-500">
                  <Phone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No additional contact information</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Edit Profile" to add phone numbers</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Activity Statistics */}
      <Card className="p-6 bg-white shadow-sm border-l-4 border-l-purple-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Activity Statistics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tasks Created */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{profile?.tasksCreated || 0}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-blue-800">Tasks Created</p>
            <p className="text-xs text-blue-600 mt-1">Total tasks assigned</p>
          </div>

          {/* Reviews Submitted */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{profile?.reviewsSubmitted || 0}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-green-800">Reviews Submitted</p>
            <p className="text-xs text-green-600 mt-1">Feedback provided</p>
          </div>

          {/* Last Login */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-600">
                  {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-orange-800">Last Login</p>
            <p className="text-xs text-orange-600 mt-1">Most recent activity</p>
          </div>

          {/* Member Since */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-purple-800">Member Since</p>
            <p className="text-xs text-purple-600 mt-1">Account creation date</p>
          </div>
        </div>
      </Card>

    </div>
  )
}
