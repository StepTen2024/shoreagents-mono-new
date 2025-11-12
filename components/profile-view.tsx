"use client"

import { useState, useEffect, useRef } from "react"
import { Building2, Calendar, DollarSign, Mail, MapPin, Phone, User, Briefcase, Clock, TrendingUp, Shield, Umbrella, Heart, Camera, Upload, FileText, IdCard, Sparkles, Award, Zap, Star, Coffee, Rocket, Palette, Edit2, Save, X } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DocumentViewerModal from "@/components/document-viewer-modal"

interface ProfileData {
  user: {
    id: string
    email: string
    name: string
    role: string
    avatar: string | null
    coverPhoto: string | null
  }
  company: {
    name: string
    accountManager: string | null
  } | null
  profile: {
    phone: string | null
    location: string | null
    gender: string | null
    civilStatus: string | null
    dateOfBirth: string | null
    employmentStatus: string
    startDate: string
    daysEmployed: number
    currentRole: string
    salary: number
    lastPayIncrease: string | null
    lastIncreaseAmount: number | null
    totalLeave: number
    usedLeave: number
    vacationUsed: number
    sickUsed: number
    hmo: boolean
  } | null
  personalRecords: {
    sss: string | null
    tin: string | null
    philhealthNo: string | null
    pagibigNo: string | null
    emergencyContactName: string | null
    emergencyContactNo: string | null
    emergencyRelationship: string | null
  } | null
  workSchedules: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    isWorkday: boolean
  }>
  onboarding: {
    isComplete: boolean
    completionPercent: number
  } | null
}

export default function ProfileView() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'personal' | 'documents'>('profile')
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [editingInterests, setEditingInterests] = useState(false)
  const [interests, setInterests] = useState<any>(null)
  const [interestsForm, setInterestsForm] = useState<any>({})
  const [interestsFetched, setInterestsFetched] = useState(false)
  
  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerDocIndex, setViewerDocIndex] = useState(0)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    fetchProfileData()
    // Only fetch interests once
    if (!interestsFetched) {
      fetchInterests()
    }
  }, [interestsFetched])

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }
      const data = await response.json()
      setProfileData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

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
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload avatar')
      }

      // Refresh profile data
      await fetchProfileData()
      
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
        variant: "success",
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
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
    const formData = new FormData()
    formData.append('cover', file)

    try {
      const response = await fetch('/api/profile/cover', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload cover photo')
      }

      // Refresh profile data
      await fetchProfileData()
      
      toast({
        title: "Success",
        description: "Cover photo updated successfully!",
        variant: "success",
      })
    } catch (error) {
      console.error('Error uploading cover:', error)
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

  const fetchInterests = async () => {
    // Don't fetch if already fetched
    if (interestsFetched) return
    
    try {
      const response = await fetch('/api/welcome')
      
      // Parse response
      const data = await response.json()
      
      // 400 status means form already submitted - this is expected!
      if (response.status === 400 && data.alreadySubmitted && data.interests) {
        console.log('📊 [INTERESTS] Loaded interests:', data.interests)
        setInterests(data.interests)
        setInterestsForm(data.interests)
      } else if (response.ok) {
        // Form not submitted yet, no interests to load
        console.log('📊 [INTERESTS] No interests found yet')
      }
    } catch (error) {
      console.error('❌ [INTERESTS] Error fetching interests:', error)
    } finally {
      // Mark as fetched so we don't fetch again
      setInterestsFetched(true)
    }
  }

  const handleEditInterests = () => {
    setEditingInterests(true)
    setInterestsForm({ ...interests })
  }

  const handleCancelEdit = () => {
    setEditingInterests(false)
    setInterestsForm({ ...interests })
  }

  const handleSaveInterests = async () => {
    try {
      const response = await fetch('/api/profile/interests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interestsForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update interests')
      }

      setInterests(interestsForm)
      setEditingInterests(false)
      
      toast({
        title: "Success",
        description: "Your interests have been updated!",
        variant: "success",
      })
    } catch (error) {
      console.error('Error saving interests:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update interests. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`
  }

  // Build documents array for viewer
  const buildDocumentsArray = () => {
    if (!profileData?.personalRecords) return []
    
    const docs: Array<{ name: string; url: string; type: 'image' | 'pdf' }> = []
    const pr = profileData.personalRecords
    
    // Government Documents
    if (pr.sssDocUrl) docs.push({ name: 'SSS Document', url: pr.sssDocUrl, type: 'image' })
    if (pr.tinDocUrl) docs.push({ name: 'TIN Document', url: pr.tinDocUrl, type: 'image' })
    if (pr.philhealthDocUrl) docs.push({ name: 'PhilHealth Document', url: pr.philhealthDocUrl, type: 'image' })
    if (pr.pagibigDocUrl) docs.push({ name: 'Pag-IBIG Document', url: pr.pagibigDocUrl, type: 'image' })
    
    // Personal Documents
    if (pr.validIdUrl) docs.push({ name: 'Valid ID', url: pr.validIdUrl, type: 'image' })
    if (pr.birthCertUrl) docs.push({ name: 'Birth Certificate', url: pr.birthCertUrl, type: 'image' })
    
    // Clearance Documents
    if (pr.nbiClearanceUrl) docs.push({ name: 'NBI Clearance', url: pr.nbiClearanceUrl, type: 'image' })
    if (pr.policeClearanceUrl) docs.push({ name: 'Police Clearance', url: pr.policeClearanceUrl, type: 'image' })
    if (pr.medicalCertUrl) docs.push({ name: 'Medical Certificate', url: pr.medicalCertUrl, type: 'image' })
    
    // Employment Records
    if (pr.resumeUrl) docs.push({ name: 'Resume / CV', url: pr.resumeUrl, type: 'pdf' })
    if (pr.certificateEmpUrl) docs.push({ name: 'Certificate of Employment', url: pr.certificateEmpUrl, type: 'image' })
    if (pr.employmentContractUrl) docs.push({ name: 'Employment Contract', url: pr.employmentContractUrl, type: 'pdf' })
    if (pr.birForm2316Url) docs.push({ name: 'BIR Form 2316', url: pr.birForm2316Url, type: 'image' })
    
    // Staff ID & Signature
    if (pr.idPhotoUrl) docs.push({ name: 'ID Photo', url: pr.idPhotoUrl, type: 'image' })
    if (pr.signatureUrl) docs.push({ name: 'Digital Signature', url: pr.signatureUrl, type: 'image' })
    
    return docs
  }

  const openDocumentViewer = (docName: string) => {
    const docs = buildDocumentsArray()
    const index = docs.findIndex(d => d.name === docName)
    if (index !== -1) {
      setViewerDocIndex(index)
      setViewerOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-80 rounded-2xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 rounded-xl bg-slate-800/50 animate-pulse" />
            <div className="h-96 rounded-xl bg-slate-800/50 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Profile</h2>
            <p className="mt-2 text-red-300">{error || "No profile data found"}</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle case where profile is null but onboarding is complete (shouldn't happen)
  if (!profileData.profile && (!profileData.onboarding || profileData.onboarding.isComplete)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Profile</h2>
            <p className="mt-2 text-red-300">No profile data found</p>
          </div>
        </div>
      </div>
    )
  }

  const { user, company, profile, workSchedules, onboarding } = profileData
  const remainingLeave = profile ? profile.totalLeave - profile.usedLeave : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-700">
        
        
        {/* Tab Navigation */}
        <div className="flex gap-2 rounded-2xl bg-slate-900/50 p-2 backdrop-blur-xl ring-1 ring-white/10">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white '
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <User className="h-5 w-5" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
              activeTab === 'personal'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white '
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <IdCard className="h-5 w-5" />
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
              activeTab === 'documents'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <FileText className="h-5 w-5" />
            Documents
          </button>
        </div>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <>
      {/* Cover Photo & Avatar Section */}
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-indigo-900/30 to-slate-900/90  ring-1 ring-white/10 backdrop-blur-xl transition-all duration-500 hover:ring-white/20 hover:shadow-indigo-500/30 hover:">
          {/* Cover Photo */}
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            {/* Animated overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            
            {user.coverPhoto ? (
              <Image
                src={user.coverPhoto}
                alt="Cover"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-white/30">
                  <Camera className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-sm">Add cover photo</p>
                </div>
              </div>
            )}
            
            {/* Loading Overlay for Cover */}
            {uploadingCover && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
                  <span className="text-sm text-white font-medium">Uploading cover...</span>
                </div>
              </div>
            )}
            
            {/* Cover Upload Button */}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-black/70 disabled:opacity-50"
            >
              {uploadingCover ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Change Cover
                </>
              )}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-20 mb-4">
              <div className="group relative inline-block">
                {/* Glowing ring effect */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-lg transition-all duration-500 group-hover:opacity-100 group-hover:blur-xl" />
                <div className="relative h-44 w-44 overflow-hidden rounded-3xl ring-4 ring-slate-900 transition-all duration-300 group-hover:ring-indigo-500/50">
                  <Image
                    src={user.avatar || "/placeholder-user.jpg"}
                    alt={user.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                {/* Loading Overlay */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                      <span className="text-xs text-white font-medium">Uploading...</span>
                    </div>
                  </div>
                )}
                
                {/* Avatar Upload Button */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white  transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name & Info */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-5xl font-black text-transparent animate-in fade-in slide-in-from-left-5 duration-700">{user.name}</h1>
                  <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Rocket className="h-5 w-5 text-purple-400 animate-bounce" />
                  <p className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-2xl font-semibold text-transparent animate-in fade-in slide-in-from-left-5 delay-150 duration-700">{profile?.currentRole || "Role not assigned"}</p>
                </div>
                <p className="mt-2 flex items-center gap-2 text-slate-300 animate-in fade-in slide-in-from-left-5 delay-300 duration-700 hover:text-indigo-300 transition-colors">
                  <Building2 className="h-5 w-5 text-indigo-400" />
                  {company?.name || "No company assigned"}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="group cursor-pointer rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 px-6 py-3 ring-1 ring-emerald-400/30 transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-400 group-hover:animate-spin" />
                    <div className="text-xs text-emerald-300">Status</div>
                  </div>
                  <div className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300">{profile?.employmentStatus || "Pending"}</div>
                </div>
                <div className="group cursor-pointer rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 px-6 py-3 ring-1 ring-indigo-400/30 transition-all duration-300 hover:scale-110 hover:ring-2 hover:ring-indigo-400 hover:shadow-lg hover:shadow-indigo-500/50">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-400 group-hover:animate-pulse" />
                    <div className="text-xs text-indigo-300">Days</div>
                  </div>
                  <div className="text-lg font-bold text-indigo-400 group-hover:text-indigo-300">{profile?.daysEmployed || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="group space-y-6 rounded-3xl bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-2xl hover:shadow-purple-500/30">
          <h2 className="flex items-center gap-3 text-2xl font-black text-white">
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 group-hover:-rotate-12 transition-transform duration-300">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="group-hover:text-purple-300 transition-colors">Employment Details</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-800/30 p-4 ring-1 ring-white/5 transition-all duration-300 hover:bg-slate-800/50 hover:scale-105 hover:ring-purple-400/50">
                <Building2 className="h-5 w-5 text-purple-400" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400">Company/Client 🏢</div>
                  <div className="font-semibold text-white">{company?.name || "No company assigned"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-800/30 p-4 ring-1 ring-white/5 transition-all duration-300 hover:bg-slate-800/50 hover:scale-105 hover:ring-pink-400/50">
                <User className="h-5 w-5 text-pink-400" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400">Account Manager ☕</div>
                  <div className="font-semibold text-white">{company?.accountManager || "Not assigned"}</div>
                </div>
              </div>
              {profile?.startDate && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-800/30 p-4 ring-1 ring-white/5 transition-all duration-300 hover:bg-slate-800/50 hover:scale-105 hover:ring-indigo-400/50">
                  <Calendar className="h-5 w-5 text-indigo-400" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-400">Start Date 🎉</div>
                    <div className="font-semibold text-white">
                      {mounted ? formatDate(profile.startDate) : profile.startDate}
                    </div>
                  </div>
                </div>
              )}
              {profile?.daysEmployed !== undefined && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-800/30 p-4 ring-1 ring-white/5 transition-all duration-300 hover:bg-slate-800/50 hover:scale-105 hover:ring-purple-400/50">
                  <Clock className="h-5 w-5 text-purple-400" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-400">Days Employed 💪</div>
                    <div className="font-semibold text-white">{profile.daysEmployed} days</div>
                  </div>
                </div>
              )}
              {profile?.salary && (
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-4 ring-1 ring-emerald-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50">
                  <DollarSign className="h-5 w-5 text-emerald-400 animate-pulse" />
                  <div className="flex-1">
                    <div className="text-sm text-emerald-300">Salary 💰</div>
                    <div className="font-bold text-emerald-400 text-lg">{formatCurrency(profile.salary)}/month</div>
                  </div>
                </div>
              )}
              {profile?.lastPayIncrease && profile?.lastIncreaseAmount && (
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-500/20 to-teal-500/20 p-4 ring-1 ring-green-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-green-400">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <div className="flex-1">
                    <div className="text-sm text-green-300">Last Pay Increase 📈</div>
                    <div className="font-semibold text-green-400">
                      {formatCurrency(profile.lastIncreaseAmount)} on {mounted ? formatDate(profile.lastPayIncrease) : profile.lastPayIncrease}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Work Schedule */}
        {workSchedules && workSchedules.length > 0 && (
          <div className="group rounded-3xl bg-gradient-to-br from-slate-900/80 via-amber-900/10 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-2xl hover:shadow-amber-500/30">
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-white">
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="group-hover:text-amber-300 transition-colors">Work Schedule 📅</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {workSchedules.map((schedule, index) => (
              <div
                key={schedule.id}
                className={`group/day rounded-xl p-4 ring-1 transition-all duration-300 hover:scale-110 hover:rotate-2 hover:z-10 ${
                  schedule.isWorkday
                    ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20 ring-emerald-500/30 hover:ring-2 hover:ring-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50"
                    : "bg-gradient-to-br from-slate-800/50 to-slate-700/50 ring-white/10 hover:ring-2 hover:ring-blue-400 hover:shadow-lg hover:shadow-blue-500/50"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-center">
                  <div className="font-bold text-white text-lg group-hover/day:scale-110 transition-transform">{schedule.dayOfWeek}</div>
                  <div className="mt-2 text-sm">
                    {schedule.isWorkday ? (
                      <>
                        <div className="text-emerald-300 font-semibold">💼 {schedule.startTime}</div>
                        <div className="text-slate-400">-</div>
                        <div className="text-emerald-300 font-semibold">{schedule.endTime}</div>
                      </>
                    ) : (
                      <div className="text-blue-300 font-semibold text-lg">🎉 Off</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Leave Credits & Benefits */}
        {profile && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="group rounded-3xl bg-gradient-to-br from-slate-900/80 via-cyan-900/10 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-2xl hover:shadow-cyan-500/30 hover:scale-[1.02]">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-white">
                <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-2.5 group-hover:rotate-12 transition-transform duration-300">
                  <Umbrella className="h-6 w-6 text-white" />
                </div>
                <span className="group-hover:text-cyan-300 transition-colors">Leave Credits 🌴</span>
              </h2>
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 ring-1 ring-blue-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-cyan-400 hover:shadow-xl hover:shadow-cyan-500/50">
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-cyan-400/10 to-blue-400/0 animate-shimmer" />
                  <div className="relative text-center">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 animate-pulse">{remainingLeave}</div>
                    <div className="mt-2 text-sm text-cyan-300 font-semibold">Days Remaining 🎉</div>
                    <div className="mt-1 text-xs text-slate-400">Out of {profile.totalLeave} total days</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="group/bar">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-400 group-hover/bar:text-blue-300 transition-colors">🏖️ Vacation Leave Used</span>
                      <span className="font-bold text-blue-400 group-hover/bar:scale-110 transition-transform inline-block">{profile.vacationUsed} days</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 transition-all duration-1000 ease-out bg-[length:200%_100%] animate-shimmer-slow"
                        style={{ width: `${(profile.vacationUsed / profile.totalLeave) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="group/bar">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-400 group-hover/bar:text-pink-300 transition-colors">🤧 Sick Leave Used</span>
                      <span className="font-bold text-pink-400 group-hover/bar:scale-110 transition-transform inline-block">{profile.sickUsed} days</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-1000 ease-out bg-[length:200%_100%] animate-shimmer-slow"
                        style={{ width: `${(profile.sickUsed / profile.totalLeave) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <div className="group rounded-3xl bg-gradient-to-br from-slate-900/80 via-pink-900/10 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-2xl hover:shadow-pink-500/30 hover:scale-[1.02]">
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-white">
              <div className="rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 p-2.5 group-hover:-rotate-12 transition-transform duration-300">
                <Heart className="h-6 w-6 text-white animate-pulse" />
              </div>
              <span className="group-hover:text-pink-300 transition-colors">Benefits 💖</span>
            </h2>
            <div className="space-y-3">
              <div className={`group/benefit rounded-xl p-4 ring-1 transition-all duration-300 hover:scale-105 ${profile?.hmo ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 ring-emerald-500/30 hover:ring-2 hover:ring-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50" : "bg-slate-800/50 ring-white/10 hover:ring-slate-400"}`}>
                <div className="flex items-center gap-3">
                  <Shield className={`h-6 w-6 transition-transform group-hover/benefit:scale-110 ${profile?.hmo ? "text-emerald-400" : "text-slate-400"}`} />
                  <div className="flex-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      HMO Benefits {profile?.hmo && "🏥"}
                    </div>
                    <div className="text-sm text-slate-400">{profile?.hmo ? "Active" : "Not enrolled"}</div>
                  </div>
                  {profile?.hmo && (
                    <div className="rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/50 animate-pulse">
                      ✓ Active
                    </div>
                  )}
                </div>
              </div>
              {profile?.totalLeave && (
                <div className="group/benefit rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-4 ring-1 ring-blue-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-blue-400 hover:shadow-lg hover:shadow-blue-500/50">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-blue-400 transition-transform group-hover/benefit:rotate-12" />
                    <div className="flex-1">
                      <div className="font-bold text-white">Leave Credits 🌊</div>
                      <div className="text-sm text-blue-300 font-semibold">{profile.totalLeave} days annual leave</div>
                    </div>
                    <Star className="h-5 w-5 text-yellow-400 animate-spin group-hover/benefit:animate-ping" />
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 p-4 ring-1 ring-purple-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-purple-400 hover:shadow-lg hover:shadow-purple-500/50">
                <div className="flex items-center gap-3">
                  <Coffee className="h-6 w-6 text-purple-400 animate-bounce" />
                  <div className="flex-1">
                    <div className="font-bold text-white">Work Culture ✨</div>
                    <div className="text-sm text-purple-300">Flexible & Fun!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* My Interests Section */}
          {interests && (
            <div className="group rounded-3xl bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-purple-400/30 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 transition-transform group-hover:rotate-12 group-hover:scale-110">
                    <Palette className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors">My Interests</h2>
                </div>
                {!editingInterests ? (
                  <Button
                    onClick={handleEditInterests}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveInterests}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Favorite Fast Food */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">🍔 Favorite Fast Food</Label>
                  {editingInterests ? (
                    <Select
                      value={interestsForm.favoriteFastFood || ''}
                      onValueChange={(value) => setInterestsForm({ ...interestsForm, favoriteFastFood: value })}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="Select your favorite" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="McDo">🍔 McDo</SelectItem>
                        <SelectItem value="Jollibee">🍗 Jollibee</SelectItem>
                        <SelectItem value="Chowking">🍜 Chowking</SelectItem>
                        <SelectItem value="Burger King">👑 Burger King</SelectItem>
                        <SelectItem value="Wendy's">🍔 Wendy's</SelectItem>
                        <SelectItem value="KFC">🍗 KFC</SelectItem>
                        <SelectItem value="Tokyo Tokyo">🍱 Tokyo Tokyo</SelectItem>
                        <SelectItem value="Banh Mi Kitchen">🥖 Banh Mi Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteFastFood || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Favorite Color */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">🎨 Favorite Color</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.favoriteColor || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, favoriteColor: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Blue"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteColor || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Favorite Music */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">🎵 Favorite Music</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.favoriteMusic || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, favoriteMusic: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Rock, Pop, Jazz"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteMusic || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Favorite Movie */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">🎬 Favorite Movie</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.favoriteMovie || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, favoriteMovie: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., The Matrix"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteMovie || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Hobby */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">🎯 Hobby</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.hobby || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, hobby: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Photography"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.hobby || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Dream Destination */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">✈️ Dream Destination</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.dreamDestination || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, dreamDestination: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Japan"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.dreamDestination || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Favorite Book */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">📚 Favorite Book</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.favoriteBook || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, favoriteBook: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Harry Potter"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteBook || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Favorite Season */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">🍂 Favorite Season</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.favoriteSeason || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, favoriteSeason: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Summer"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteSeason || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Pet Name */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">🐾 Pet Name</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.petName || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, petName: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Fluffy"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.petName || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Favorite Sport */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">⚽ Favorite Sport</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.favoriteSport || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, favoriteSport: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Basketball"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteSport || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Favorite Game */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">🎮 Favorite Game</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.favoriteGame || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, favoriteGame: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Mobile Legends"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteGame || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Favorite Quote */}
                <div className="group/field md:col-span-2">
                  <Label className="text-sm text-slate-400 mb-2 block">💬 Favorite Quote</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.favoriteQuote || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, favoriteQuote: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., Be yourself; everyone else is already taken"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.favoriteQuote || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Fun Fact */}
                <div className="group/field">
                  <Label className="text-sm text-slate-400 mb-2 block">⭐ Fun Fact</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.funFact || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, funFact: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="e.g., I can speak 3 languages"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.funFact || 'Not specified'}
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="group/field md:col-span-3">
                  <Label className="text-sm text-slate-400 mb-2 block">📝 Additional Info</Label>
                  {editingInterests ? (
                    <Input
                      value={interestsForm.additionalInfo || ''}
                      onChange={(e) => setInterestsForm({ ...interestsForm, additionalInfo: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white focus:border-purple-500"
                      placeholder="Anything else you'd like to share..."
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-white">
                      {interests.additionalInfo || 'Not specified'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        )}
        </>
      )}

      {/* Personal Info Tab Content */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          {/* Personal Details Section */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-blue-900/20 to-slate-900/80 p-8  backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 ">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 ">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Personal Details</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <div className="text-lg font-semibold text-white">{user.email}</div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </div>
                <div className="text-lg font-semibold text-white">{profile?.phone || 'Not provided'}</div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1">Date of Birth</div>
                <div className="text-lg font-semibold text-white">
                  {profile?.dateOfBirth ? (mounted ? formatDate(profile.dateOfBirth) : profile.dateOfBirth) : 'Not provided'}
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1">Gender</div>
                <div className="text-lg font-semibold text-white">{profile?.gender || 'Not provided'}</div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1">Civil Status</div>
                <div className="text-lg font-semibold text-white">{profile?.civilStatus || 'Not provided'}</div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1">Address</div>
                <div className="text-lg font-semibold text-white">{profile?.location || 'Not provided'}</div>
              </div>
            </div>
          </div>

          {/* Government IDs Section */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-indigo-900/20 to-slate-900/80 p-8  backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-indigo-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 ">
                <IdCard className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Government IDs</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1">SSS Number</div>
                <div className="text-lg font-mono font-semibold text-white">
                  {profileData.personalRecords?.sss || 'Not provided'}
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1">TIN Number</div>
                <div className="text-lg font-mono font-semibold text-white">
                  {profileData.personalRecords?.tin || 'Not provided'}
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1">PhilHealth Number</div>
                <div className="text-lg font-mono font-semibold text-white">
                  {profileData.personalRecords?.philhealthNo || 'Not provided'}
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                <div className="text-sm text-slate-400 mb-1">Pag-IBIG Number</div>
                <div className="text-lg font-mono font-semibold text-white">
                  {profileData.personalRecords?.pagibigNo || 'Not provided'}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-red-900/20 to-slate-900/80 p-8  backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-red-500 to-orange-500 p-2.5 ">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Emergency Contact</h2>
            </div>
            {profileData.personalRecords && (
              profileData.personalRecords.emergencyContactName ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <div className="text-sm text-slate-400 mb-1">Name</div>
                    <div className="text-lg font-semibold text-white">
                      {profileData.personalRecords.emergencyContactName}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <div className="text-sm text-slate-400 mb-1">Relationship</div>
                    <div className="text-lg font-semibold text-white">
                      {profileData.personalRecords.emergencyRelationship || 'Not provided'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 md:col-span-2">
                    <div className="text-sm text-slate-400 mb-1">Phone Number</div>
                    <div className="text-lg font-semibold text-white">
                      {profileData.personalRecords.emergencyContactNo || 'Not provided'}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No emergency contact information provided</p>
              )
            )}
          </div>
        </div>
      )}

      {/* Documents Tab Content */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Government Documents */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-purple-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2.5">
              <FileText className="h-6 w-6 text-white" />
            </div>
              <h2 className="text-2xl font-black text-white">Government Documents</h2>
          </div>
            {profileData.personalRecords ? (
              <div className="grid gap-4 md:grid-cols-2">
                {profileData.personalRecords.sssDocUrl && (
                  <button
                    onClick={() => openDocumentViewer('SSS Document')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-purple-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-orange-500 to-red-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">SSS Document</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-purple-400" />
                  </button>
                )}
                {profileData.personalRecords.tinDocUrl && (
                  <button
                    onClick={() => openDocumentViewer('TIN Document')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-pink-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">TIN Document</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-pink-400" />
                  </button>
                )}
                {profileData.personalRecords.philhealthDocUrl && (
                  <button
                    onClick={() => openDocumentViewer('PhilHealth Document')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-indigo-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">PhilHealth Document</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-indigo-400" />
                  </button>
                )}
                {profileData.personalRecords.pagibigDocUrl && (
                  <button
                    onClick={() => openDocumentViewer('Pag-IBIG Document')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-cyan-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Pag-IBIG Document</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-cyan-400" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No government documents available</p>
            )}
          </div>

          {/* Personal Documents */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-blue-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-blue-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5">
                <IdCard className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Personal Documents</h2>
            </div>
            {profileData.personalRecords ? (
              <div className="grid gap-4 md:grid-cols-2">
                {profileData.personalRecords.validIdUrl && (
                  <button
                    onClick={() => openDocumentViewer('Valid ID')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-blue-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 p-3">
                      <IdCard className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Valid ID</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-blue-400" />
                  </button>
                )}
                {profileData.personalRecords.birthCertUrl && (
                  <button
                    onClick={() => openDocumentViewer('Birth Certificate')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-purple-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Birth Certificate</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-purple-400" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No personal documents available</p>
            )}
          </div>

          {/* Clearance Documents */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-emerald-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-emerald-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 p-2.5">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Clearance Documents</h2>
            </div>
            {profileData.personalRecords ? (
              <div className="grid gap-4 md:grid-cols-2">
                {profileData.personalRecords.nbiClearanceUrl && (
                  <button
                    onClick={() => openDocumentViewer('NBI Clearance')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-emerald-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 p-3">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">NBI Clearance</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-emerald-400" />
                  </button>
                )}
                {profileData.personalRecords.policeClearanceUrl && (
                  <button
                    onClick={() => openDocumentViewer('Police Clearance')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-green-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-green-500 to-lime-500 p-3">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Police Clearance</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-green-400" />
                  </button>
                )}
                {profileData.personalRecords.medicalCertUrl && (
                  <button
                    onClick={() => openDocumentViewer('Medical Certificate')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-teal-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 p-3">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Medical Certificate</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-teal-400" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No clearance documents available</p>
            )}
          </div>

          {/* Employment Records */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-amber-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-amber-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-2.5">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Employment Records</h2>
            </div>
            {profileData.personalRecords ? (
              <div className="grid gap-4 md:grid-cols-2">
                {profileData.personalRecords.resumeUrl && (
                  <button
                    onClick={() => openDocumentViewer('Resume / CV')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-amber-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Resume / CV</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-amber-400" />
                  </button>
                )}
                {profileData.personalRecords.certificateEmpUrl && (
                  <button
                    onClick={() => openDocumentViewer('Certificate of Employment')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-orange-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-orange-500 to-red-500 p-3">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Certificate of Employment</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-orange-400" />
                  </button>
                )}
                {profileData.personalRecords.employmentContractUrl && (
                  <button
                    onClick={() => openDocumentViewer('Employment Contract')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-rose-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Employment Contract</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-rose-400" />
                  </button>
                )}
                {profileData.personalRecords.birForm2316Url && (
                  <button
                    onClick={() => openDocumentViewer('BIR Form 2316')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-violet-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">BIR Form 2316</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-violet-400" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No employment records available</p>
            )}
          </div>

          {/* Staff ID & Signature */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-indigo-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-indigo-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Staff ID & Signature</h2>
            </div>
            {profileData.personalRecords ? (
              <div className="grid gap-4 md:grid-cols-2">
                {profileData.personalRecords.idPhotoUrl && (
                  <button
                    onClick={() => openDocumentViewer('ID Photo')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-indigo-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 p-3">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">ID Photo</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-indigo-400" />
                  </button>
                )}
                {profileData.personalRecords.signatureUrl && (
                  <button
                    onClick={() => openDocumentViewer('Digital Signature')}
                    className="group flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-purple-500/50 hover:scale-[1.02] cursor-pointer text-left w-full"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">Digital Signature</div>
                      <div className="text-sm text-slate-400">Click to view</div>
                    </div>
                    <Upload className="h-5 w-5 text-slate-400 transition-transform group-hover:scale-110 group-hover:text-purple-400" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No ID or signature documents available</p>
            )}
          </div>
        </div>
      )}

      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documents={buildDocumentsArray()}
        initialIndex={viewerDocIndex}
      />
    </div>
  )
}
