"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Mail, Phone, MapPin, Globe, Briefcase, Edit2, Save, X, User, Calendar, Upload, Camera, MessageCircle } from "lucide-react"
import { uploadCompanyFile, deleteCompanyFile } from "@/lib/supabase-upload"
import { useToast } from "@/hooks/use-toast"

type StaffMember = {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  profile: {
    currentRole: string
    location: string | null
    employmentStatus: string
    startDate: string
  } | null
}

type AccountManager = {
  id: string
  name: string
  email: string
  avatar: string | null
}

type Company = {
  id: string
  companyName: string
  tradingName: string | null
  industry: string | null
  location: string | null
  billingEmail: string | null
  bio: string | null
  website: string | null
  phone: string | null
  logo: string | null
  coverPhoto: string | null
  contractStart: string | null
  isActive: boolean
  staffUsers: StaffMember[]
  accountManager: AccountManager | null
}

export default function CompanyPage() {
  const { toast } = useToast()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedCompany, setEditedCompany] = useState<Partial<Company>>({})
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)

  useEffect(() => {
    fetchCompany()
  }, [])

  const fetchCompany = async () => {
    try {
      const response = await fetch('/api/client/company')
      if (!response.ok) throw new Error('Failed to fetch company')
      const data = await response.json()
      setCompany(data.company)
    } catch (error) {
      console.error('Error fetching company:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    setEditedCompany({
      companyName: company?.companyName || '',
      tradingName: company?.tradingName || '',
      industry: company?.industry || '',
      location: company?.location || '',
      billingEmail: company?.billingEmail || '',
      bio: company?.bio || '',
      website: company?.website || '',
      phone: company?.phone || '',
      contractStart: company?.contractStart || ''
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditedCompany({})
  }

  const saveCompany = async () => {
    setSavingCompany(true)
    
    // Show saving toast
    toast({
      title: "Saving Company",
      description: "Please wait while your company information is being updated...",
      duration: 3000
    })

    try {
      const response = await fetch('/api/client/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedCompany),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update company')
      }
      
      await fetchCompany()
      setEditing(false)
      setEditedCompany({})
      
      // Show success toast
      toast({
        title: "Company Updated",
        description: "Your company information has been successfully updated.",
        duration: 3000
      })
    } catch (error) {
      console.error('Error updating company:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update company. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setSavingCompany(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !company) return

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

    setUploadingLogo(true)
    
    // Show uploading toast
    toast({
      title: "Uploading Logo",
      description: "Please wait while your logo is being uploaded...",
      duration: 3000
    })

    try {
      // Delete old logo if exists using server-side API
      if (company.logo) {
        try {
          console.log('Deleting old logo:', company.logo)
          const deleteResponse = await fetch('/api/client/company/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: company.logo }),
          })
          
          if (deleteResponse.ok) {
            console.log('Old logo deleted successfully')
          } else {
            console.warn('Failed to delete old logo, proceeding with upload')
          }
        } catch (deleteError) {
          console.warn('Failed to delete old logo, proceeding with upload:', deleteError)
          // Continue with upload even if delete fails
        }
      }

      // Upload new logo using server-side API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const response = await fetch('/api/client/company/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload logo')
      }

      const result = await response.json()
      console.log('Logo uploaded successfully:', result.url)
      
      // Show success toast
      toast({
        title: "Logo Updated",
        description: "Your company logo has been successfully updated.",
        duration: 3000
      })

      // Refresh company data immediately
      console.log('Refreshing company data after logo upload...')
      await fetchCompany()
      console.log('Company data refreshed successfully')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload logo. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !company) return

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
      if (company.coverPhoto) {
        try {
          console.log('Deleting old cover photo:', company.coverPhoto)
          const deleteResponse = await fetch('/api/client/company/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: company.coverPhoto }),
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

      const response = await fetch('/api/client/company/upload', {
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
        description: "Your company cover photo has been successfully updated.",
        duration: 3000
      })

      // Refresh company data immediately
      console.log('Refreshing company data after cover upload...')
      await fetchCompany()
      console.log('Company data refreshed successfully')
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
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-80 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Company Overview Card Skeleton */}
        <div className="overflow-hidden border-blue-200 rounded-lg bg-white py-0 gap-0">
          {/* Cover Photo Skeleton */}
          <div className="relative h-48 bg-gradient-to-br from-blue-500 to-cyan-500">
            <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
          </div>

          {/* Profile Content Skeleton */}
          <div className="p-6 pt-8 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-start gap-6">
              {/* Company Logo Skeleton */}
              <div className="flex-shrink-0 -mt-16 relative z-10">
                <div className="w-32 h-32 rounded-lg bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  <div className="h-16 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Company Details Skeleton */}
              <div className="flex-1 pt-4 space-y-3">
                <div className="h-8 w-80 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information Skeleton */}
          <div className="p-6 border-l-4 border-l-blue-500 bg-white shadow-sm rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {/* Company Name */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Trading Name */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Industry */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Contract Start Date */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Account Status */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
              {/* Company Bio */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mt-1"></div>
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
              {/* Website */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Billing Email */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Staff Skeleton */}
        <div className="p-6 border-l-4 border-l-purple-500 bg-white shadow-sm rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
          {/* Empty State Skeleton */}
          <div className="text-center py-12 text-gray-500">
            <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
            <div className="h-4 w-80 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load company information</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-600 mt-1">Manage your company information and view your team</p>
        </div>
        {!editing ? (
          <Button onClick={startEditing} className="bg-blue-600 hover:bg-blue-700">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={saveCompany} 
              disabled={savingCompany}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingCompany ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
              disabled={savingCompany}
              variant="outline"
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Company Overview Card */}
      <Card className="overflow-hidden border-blue-200  bg-white py-0 gap-0  ">
        {/* Cover Photo Banner */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-cyan-500 group">
          {company.coverPhoto ? (
            <img src={company.coverPhoto} alt="Company cover" className="w-full h-full object-cover" />
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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="flex items-start gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0 -mt-16">
              <div className="relative w-32 h-32 rounded-lg bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden group">
                {company.logo ? (
                  <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-16 w-16 text-blue-600" />
                )}
                {/* Upload Button Overlay */}
                <label 
                  htmlFor="logo-upload" 
                  className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity cursor-pointer ${
                    uploadingLogo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {uploadingLogo ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span className="text-white text-xs font-medium">Uploading...</span>
                    </div>
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </div>
            </div>

            {/* Company Details */}
            <div className="flex-1 pt-4">
              <h2 className="text-3xl font-bold text-gray-900">{company.companyName}</h2>
              {company.tradingName && (
                <p className="text-sm text-gray-600 mt-1">Trading as: {company.tradingName}</p>
              )}
              {company.bio && (
                <p className="text-gray-700 mt-3">{company.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                {company.industry && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    {company.industry}
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {company.location}
                  </div>
                )}
                {company.contractStart && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Client since {new Date(company.contractStart).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card className="p-6 border-l-4 border-l-blue-500 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Company Information</h3>
          </div>
          
          {editing ? (
             <div className="space-y-6">
               <div>
                 <Label className="text-gray-900 font-medium mb-2 block">Company Name</Label>
                 <Input
                   value={editedCompany.companyName || ''}
                   onChange={(e) => setEditedCompany({...editedCompany, companyName: e.target.value})}
                   disabled={savingCompany}
                   className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                   placeholder="Your company name"
                 />
               </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Trading Name</Label>
                <Input
                  value={editedCompany.tradingName || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, tradingName: e.target.value})}
                   disabled={savingCompany}
                   className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Trading name (if different)"
                />
              </div>
              
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Industry</Label>
                <Input
                  value={editedCompany.industry || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, industry: e.target.value})}
                   disabled={savingCompany}
                   className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Location</Label>
                <Input
                  value={editedCompany.location || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, location: e.target.value})}
                   disabled={savingCompany}
                   className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="City, Country"
                />
              </div>

               <div>
                 <Label className="text-gray-900 font-medium mb-2 block">Contract Start Date</Label>
                 <Input
                   type="date"
                   value={editedCompany.contractStart ? new Date(editedCompany.contractStart).toISOString().split('T')[0] : ''}
                   onChange={(e) => setEditedCompany({...editedCompany, contractStart: e.target.value})}
                   disabled={savingCompany}
                   className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                 />
               </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Company Bio</Label>
                <Textarea
                  value={editedCompany.bio || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, bio: e.target.value})}
                   disabled={savingCompany}
                   className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Brief description of your company"
                  rows={4}
                />
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg mt-1">
                  <Building2 className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Company Name</p>
                  <p className="text-gray-900 font-medium">{company.companyName}</p>
                </div>
              </div>

              {company.tradingName && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Building2 className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Trading Name</p>
                  <p className="text-gray-900 font-medium">{company.tradingName}</p>
                  </div>
                </div>
              )}
              
              {company.industry && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Industry</p>
                  <p className="text-gray-900 font-medium">{company.industry}</p>
                  </div>
                </div>
              )}

              {company.location && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <MapPin className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="text-gray-900 font-medium">{company.location}</p>
                  </div>
                </div>
              )}

              {company.contractStart && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Contract Start Date</p>
                    <p className="text-gray-900 font-medium">{new Date(company.contractStart).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              

              {company.bio && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Company Bio</p>
                    <p className="text-gray-900 leading-relaxed">{company.bio}</p>
                  </div>
                </div>
              )}

              {!company.tradingName && !company.industry && !company.location && !company.bio && (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No company information added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Edit Company" to add details</p>
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
                <Label className="text-gray-900 font-medium mb-2 block">Website</Label>
                <Input
                  value={editedCompany.website || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, website: e.target.value})}
                  disabled={savingCompany}
                  className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Phone</Label>
                <Input
                  value={editedCompany.phone || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, phone: e.target.value})}
                  disabled={savingCompany}
                  className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Billing Email</Label>
                <Input
                  type="email"
                  value={editedCompany.billingEmail || ''}
                  onChange={(e) => setEditedCompany({...editedCompany, billingEmail: e.target.value})}
                  disabled={savingCompany}
                  className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="billing@example.com"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {company.website && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Globe className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Website</p>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                      {company.website}
                    </a>
                  </div>
                </div>
              )}
              
              {company.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="text-gray-900 font-medium">{company.phone}</p>
                  </div>
                </div>
              )}

              {company.billingEmail && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg mt-1">
                    <Mail className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Billing Email</p>
                    <p className="text-gray-900 font-medium">{company.billingEmail}</p>
                  </div>
                </div>
              )}

              {!company.website && !company.phone && !company.billingEmail && (
                <div className="text-center py-8 text-gray-500">
                  <Phone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No contact information added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Edit Company" to add contact details</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Account Manager */}
      {company.accountManager && (
        <Card className="p-6 border-l-4 border-l-blue-500 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Your Account Manager</h3>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg mt-1">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Account Manager</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                  <AvatarImage src={company.accountManager.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-sm font-semibold">
                    {company.accountManager.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900 font-medium">{company.accountManager.name}</p>
                  <p className="text-sm text-gray-600">{company.accountManager.email}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Assigned Staff */}
       <Card className="p-6 border-l-4 border-l-purple-500 bg-white shadow-sm">
         <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-purple-100 rounded-lg">
             <User className="h-6 w-6 text-purple-600" />
           </div>
           <h3 className="text-xl font-semibold text-gray-900">
          Assigned Staff ({company.staffUsers.length})
        </h3>
         </div>
        
        {company.staffUsers.length === 0 ? (
           <div className="text-center py-12 text-gray-500">
             <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
             <p className="text-lg font-medium text-gray-900 mb-2">No staff members assigned yet</p>
             <p className="text-sm text-gray-500">Your assigned staff will appear here once they're added to your account</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {company.staffUsers.map((staff) => (
               <Card key={staff.id} className="p-4 hover:shadow-md transition-all duration-200 border border-gray-200 bg-white">
                 <div className="flex flex-col items-center text-center space-y-3">
                   {/* Avatar */}
                   <div className="relative">
                     <Avatar className="h-14 w-14 ring-2 ring-purple-100">
                    <AvatarImage src={staff.avatar || undefined} />
                       <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                     <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                       <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                     </div>
                   </div>

                   {/* Staff Information */}
                   <div className="space-y-1.5 w-full">
                     <h4 className="text-sm font-semibold text-gray-900 truncate">{staff.name}</h4>
                     <p className="text-xs text-gray-600 truncate">{staff.email}</p>
                     
                     {/* Professional Information */}
                     <div className="space-y-1 pt-1.5 border-t border-gray-100">
                       <div className="flex items-center justify-center gap-1.5 text-xs text-gray-700">
                         <Briefcase className="h-3 w-3 text-purple-600" />
                         <span className="font-medium truncate">{staff.profile?.currentRole || staff.role}</span>
                       </div>
                       
                       {staff.profile?.location && (
                         <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                           <MapPin className="h-3 w-3 text-gray-500" />
                           <span className="truncate">{staff.profile.location}</span>
                         </div>
                       )}
                       
                       {staff.profile?.employmentStatus && (
                         <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                           <Calendar className="h-3 w-3 text-gray-500" />
                           <span className="capitalize truncate">{staff.profile.employmentStatus.replace('_', ' ')}</span>
                         </div>
                       )}
                       
                       {staff.profile?.startDate && (
                         <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                           <Calendar className="h-3 w-3 text-gray-500" />
                           <span className="truncate">Since {new Date(staff.profile.startDate).toLocaleDateString()}</span>
                         </div>
                       )}
                     </div>

                     {/* Status Badge */}
                     <div className="pt-1">
                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1.5"></div>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

