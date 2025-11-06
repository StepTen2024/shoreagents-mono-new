"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, Heart, Coffee, Music, Gamepad2, BookOpen, Camera, Plane, Utensils, Palette, GamepadIcon, Star, Users, Home, Building2, Mail, Briefcase, Calendar, Sparkles, Rocket } from "lucide-react"
import Image from "next/image"

interface ProfileData {
  name: string
  email: string
  avatar: string | null
  client: string
  companyLogo: string | null
  position: string
  startDate: string
}

interface WelcomeFormData {
  // Auto-filled fields
  name: string
  client: string
  startDate: string
  
  // Required field
  favoriteFastFood: string
  
  // Optional fields
  favoriteColor?: string
  favoriteMusic?: string
  favoriteMovie?: string
  favoriteBook?: string
  hobby?: string
  dreamDestination?: string
  favoriteSeason?: string
  petName?: string
  favoriteSport?: string
  favoriteGame?: string
  favoriteQuote?: string
  funFact?: string
  additionalInfo?: string
}

export default function WelcomePage() {
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState<WelcomeFormData>({
    name: "",
    client: "",
    startDate: "",
    favoriteFastFood: "",
    favoriteColor: "",
    favoriteMusic: "",
    favoriteMovie: "",
    favoriteBook: "",
    hobby: "",
    dreamDestination: "",
    favoriteSeason: "",
    petName: "",
    favoriteSport: "",
    favoriteGame: "",
    favoriteQuote: "",
    funFact: "",
    additionalInfo: ""
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  // Load staff profile data on mount
  useEffect(() => {
    const loadStaffProfile = async () => {
      try {
        const response = await fetch('/api/welcome')
        if (response.ok) {
          const data = await response.json()
          setProfileData(data)
          setFormData(prev => ({
            ...prev,
            name: data.name || "",
            client: data.client || "",
            startDate: data.startDate || ""
          }))
        }
      } catch (error) {
        console.error('Failed to load staff profile:', error)
      }
    }
    
    loadStaffProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.favoriteFastFood.trim()) {
      setError("Please tell us your favorite fast food!")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      const response = await fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setError(data.error || 'Failed to submit welcome form')
      }
    } catch (error) {
      setError('Failed to submit welcome form')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof WelcomeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Team! 🎉</h2>
            <p className="text-slate-300 mb-4">
              Thanks for sharing a bit about yourself! We're excited to have you on board.
            </p>
            <p className="text-slate-400 text-sm">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
            <h1 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Welcome to ShoreAgents!
            </h1>
            <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-6 w-6 text-pink-400 animate-pulse" />
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Let's get to know you better
            </p>
            <Heart className="h-6 w-6 text-pink-400 animate-pulse" />
          </div>
          <p className="text-slate-300 text-lg">
            Help us create a more personalized experience by sharing some fun facts about yourself ✨
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Card - We Already Know You */}
          {profileData && (
            <Card className="group bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 backdrop-blur-xl border-purple-400/30 ring-1 ring-purple-400/50 transition-all duration-500 hover:ring-2 hover:ring-purple-400 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Avatar & Company Logo */}
                  <div className="flex gap-4 items-center">
                    <div className="relative">
                      {profileData.avatar ? (
                        <Image
                          src={profileData.avatar}
                          alt={profileData.name}
                          width={80}
                          height={80}
                          className="rounded-full ring-4 ring-purple-400/50"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center ring-4 ring-purple-400/50">
                          <span className="text-2xl font-bold text-white">
                            {profileData.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    {profileData.companyLogo && (
                      <div className="relative">
                        <Image
                          src={profileData.companyLogo}
                          alt={profileData.client}
                          width={60}
                          height={60}
                          className="rounded-lg border-2 border-white/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Hi {profileData.name.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-lg text-slate-200 mb-3">
                      We already know you're <span className="font-semibold text-purple-300">{profileData.name}</span> joining <span className="font-semibold text-blue-300">{profileData.client}</span> as a <span className="font-semibold text-indigo-300">{profileData.position}</span>!
                    </p>
                    <p className="text-slate-300 mb-4">
                      Now we want to get to know more about <span className="italic">you</span> - the person behind the professional! 🌟
                    </p>
                    
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Mail className="h-4 w-4 text-purple-300" />
                        <span className="text-slate-200">{profileData.email}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Building2 className="h-4 w-4 text-blue-300" />
                        <span className="text-slate-200">{profileData.client}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <Calendar className="h-4 w-4 text-indigo-300" />
                        <span className="text-slate-200">Starts {profileData.startDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Field */}
          <Card className="group bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border-orange-500/30 ring-1 ring-orange-400/50 transition-all duration-500 hover:ring-2 hover:ring-orange-400 hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Utensils className="h-6 w-6 text-orange-400 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-2xl font-black">🎉 First Day Surprise!</span> 
                <span className="text-orange-400 text-xl">*</span>
              </CardTitle>
              <CardDescription className="text-orange-100 text-base">
                We're going to surprise you with a meal on your first day! Pick your favorite fast food place and we'll have it ready for you! 🍔✨
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="favoriteFastFood" className="text-orange-200 text-sm font-semibold">
                  What's your favorite fast food? 🎁
                </Label>
                <Select value={formData.favoriteFastFood} onValueChange={(value) => handleInputChange('favoriteFastFood', value)}>
                  <SelectTrigger className="bg-slate-800/50 border-orange-400/50 text-white mt-2">
                    <SelectValue placeholder="Choose your favorite..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-orange-400/30">
                    <SelectItem value="McDo">🍔 McDo (McDonald's)</SelectItem>
                    <SelectItem value="Jollibee">🍗 Jollibee</SelectItem>
                    <SelectItem value="Chowking">🍜 Chowking</SelectItem>
                    <SelectItem value="Burger King">👑 Burger King</SelectItem>
                    <SelectItem value="Wendys">🍔 Wendy's</SelectItem>
                    <SelectItem value="KFC">🍗 KFC</SelectItem>
                    <SelectItem value="Tokyo Tokyo">🍱 Tokyo Tokyo</SelectItem>
                    <SelectItem value="Banh Mi Kitchen">🥖 Banh Mi Kitchen</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-orange-200 mt-2 italic">
                  💡 We'll order from your choice and have it waiting for you on Day 1!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Optional Fields */}
          <Card className="group bg-gradient-to-br from-slate-900/80 via-indigo-900/20 to-slate-900/80 backdrop-blur-xl border-white/20 ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.01]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-2xl font-black">
                <Heart className="h-6 w-6 text-pink-400 animate-pulse group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-pink-300 transition-colors">Tell Us About Yourself</span>
                <Sparkles className="h-5 w-5 text-yellow-400 animate-spin" />
              </CardTitle>
              <CardDescription className="text-slate-300 text-base">
                All of these are optional - share as much or as little as you'd like! 💫
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Row 1 */}
                <div className="group/field">
                  <Label htmlFor="favoriteColor" className="text-slate-300 text-sm flex items-center gap-2 font-semibold group-hover/field:text-pink-300 transition-colors">
                    <Palette className="h-4 w-4 text-pink-400 group-hover/field:rotate-12 transition-transform" />
                    Favorite Color 🎨
                  </Label>
                  <Input
                    id="favoriteColor"
                    value={formData.favoriteColor}
                    onChange={(e) => handleInputChange('favoriteColor', e.target.value)}
                    placeholder="e.g., Ocean Blue, Forest Green..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 hover:bg-slate-800/70"
                  />
                </div>

                <div className="group/field">
                  <Label htmlFor="favoriteMusic" className="text-slate-300 text-sm flex items-center gap-2 font-semibold group-hover/field:text-purple-300 transition-colors">
                    <Music className="h-4 w-4 text-purple-400 group-hover/field:scale-110 transition-transform" />
                    Favorite Music Genre 🎵
                  </Label>
                  <Input
                    id="favoriteMusic"
                    value={formData.favoriteMusic}
                    onChange={(e) => handleInputChange('favoriteMusic', e.target.value)}
                    placeholder="e.g., Pop, Rock, Jazz, K-Pop..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 hover:bg-slate-800/70"
                  />
                </div>

                {/* Row 2 */}
                <div className="group/field">
                  <Label htmlFor="favoriteMovie" className="text-slate-300 text-sm flex items-center gap-2 font-semibold group-hover/field:text-yellow-300 transition-colors">
                    <Star className="h-4 w-4 text-yellow-400 group-hover/field:rotate-180 transition-transform duration-500" />
                    Favorite Movie 🎬
                  </Label>
                  <Input
                    id="favoriteMovie"
                    value={formData.favoriteMovie}
                    onChange={(e) => handleInputChange('favoriteMovie', e.target.value)}
                    placeholder="e.g., The Matrix, Inception..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 hover:bg-slate-800/70"
                  />
                </div>

                <div className="group/field">
                  <Label htmlFor="favoriteBook" className="text-slate-300 text-sm flex items-center gap-2 font-semibold group-hover/field:text-blue-300 transition-colors">
                    <BookOpen className="h-4 w-4 text-blue-400 group-hover/field:scale-110 transition-transform" />
                    Favorite Book 📚
                  </Label>
                  <Input
                    id="favoriteBook"
                    value={formData.favoriteBook}
                    onChange={(e) => handleInputChange('favoriteBook', e.target.value)}
                    placeholder="e.g., Harry Potter, The Great Gatsby..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 hover:bg-slate-800/70"
                  />
                </div>

                {/* Row 3 */}
                <div className="group/field">
                  <Label htmlFor="hobby" className="text-slate-300 text-sm flex items-center gap-2 font-semibold group-hover/field:text-cyan-300 transition-colors">
                    <Camera className="h-4 w-4 text-cyan-400 group-hover/field:-rotate-12 transition-transform" />
                    Hobby 📸
                  </Label>
                  <Input
                    id="hobby"
                    value={formData.hobby}
                    onChange={(e) => handleInputChange('hobby', e.target.value)}
                    placeholder="e.g., Photography, Cooking, Gaming..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 hover:bg-slate-800/70"
                  />
                </div>

                <div className="group/field">
                  <Label htmlFor="dreamDestination" className="text-slate-300 text-sm flex items-center gap-2 font-semibold group-hover/field:text-green-300 transition-colors">
                    <Plane className="h-4 w-4 text-green-400 group-hover/field:translate-x-2 transition-transform" />
                    Dream Destination ✈️
                  </Label>
                  <Input
                    id="dreamDestination"
                    value={formData.dreamDestination}
                    onChange={(e) => handleInputChange('dreamDestination', e.target.value)}
                    placeholder="e.g., Japan, Iceland, New Zealand..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-green-400 focus:ring-2 focus:ring-green-400/50 hover:bg-slate-800/70"
                  />
                </div>

                {/* Row 4 */}
                <div className="group/field">
                  <Label htmlFor="favoriteSeason" className="text-slate-300 text-sm font-semibold group-hover/field:text-amber-300 transition-colors">
                    Favorite Season 🌤️
                  </Label>
                  <Select value={formData.favoriteSeason} onValueChange={(value) => handleInputChange('favoriteSeason', value)}>
                    <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white transition-all duration-300 hover:bg-slate-800/70 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50">
                      <SelectValue placeholder="Select a season" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="spring">🌸 Spring</SelectItem>
                      <SelectItem value="summer">☀️ Summer</SelectItem>
                      <SelectItem value="autumn">🍂 Autumn</SelectItem>
                      <SelectItem value="winter">❄️ Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="group/field">
                  <Label htmlFor="petName" className="text-slate-300 text-sm font-semibold group-hover/field:text-rose-300 transition-colors">
                    Pet Name (if you have one) 🐾
                  </Label>
                  <Input
                    id="petName"
                    value={formData.petName}
                    onChange={(e) => handleInputChange('petName', e.target.value)}
                    placeholder="e.g., Buddy, Luna, Max..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/50 hover:bg-slate-800/70"
                  />
                </div>

                {/* Row 5 */}
                <div className="group/field">
                  <Label htmlFor="favoriteSport" className="text-slate-300 text-sm font-semibold group-hover/field:text-orange-300 transition-colors">
                    Favorite Sport ⚽
                  </Label>
                  <Input
                    id="favoriteSport"
                    value={formData.favoriteSport}
                    onChange={(e) => handleInputChange('favoriteSport', e.target.value)}
                    placeholder="e.g., Basketball, Soccer, Tennis..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/50 hover:bg-slate-800/70"
                  />
                </div>

                <div className="group/field">
                  <Label htmlFor="favoriteGame" className="text-slate-300 text-sm flex items-center gap-2 font-semibold group-hover/field:text-indigo-300 transition-colors">
                    <Gamepad2 className="h-4 w-4 text-indigo-400 group-hover/field:rotate-12 transition-transform" />
                    Favorite Game 🎮
                  </Label>
                  <Input
                    id="favoriteGame"
                    value={formData.favoriteGame}
                    onChange={(e) => handleInputChange('favoriteGame', e.target.value)}
                    placeholder="e.g., Minecraft, Valorant, Chess..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 hover:bg-slate-800/70"
                  />
                </div>
              </div>

              {/* Text Areas */}
              <div className="space-y-4">
                <div className="group/field">
                  <Label htmlFor="favoriteQuote" className="text-slate-300 text-sm font-semibold group-hover/field:text-purple-300 transition-colors flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-400 animate-pulse" />
                    Favorite Quote or Motto 💭
                  </Label>
                  <Textarea
                    id="favoriteQuote"
                    value={formData.favoriteQuote}
                    onChange={(e) => handleInputChange('favoriteQuote', e.target.value)}
                    placeholder="Share a quote that inspires you..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 hover:bg-slate-800/70"
                    rows={3}
                  />
                </div>

                <div className="group/field">
                  <Label htmlFor="funFact" className="text-slate-300 text-sm font-semibold group-hover/field:text-yellow-300 transition-colors flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-400 animate-spin" />
                    Fun Fact About Yourself ✨
                  </Label>
                  <Textarea
                    id="funFact"
                    value={formData.funFact}
                    onChange={(e) => handleInputChange('funFact', e.target.value)}
                    placeholder="Tell us something interesting about yourself..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 hover:bg-slate-800/70"
                    rows={3}
                  />
                </div>

                <div className="group/field">
                  <Label htmlFor="additionalInfo" className="text-slate-300 text-sm font-semibold group-hover/field:text-blue-300 transition-colors flex items-center gap-2">
                    <Heart className="h-4 w-4 text-blue-400 animate-pulse" />
                    Anything Else You'd Like to Share? 💬
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="Any other information you'd like your team to know about you..."
                    className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 hover:bg-slate-800/70"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.favoriteFastFood.trim()}
              className="group/btn bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white px-12 py-4 text-xl font-black rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  <span className="animate-pulse">Submitting...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-6 w-6 mr-3 group-hover/btn:animate-bounce" />
                  Submit Welcome Form
                  <Sparkles className="h-6 w-6 ml-3 group-hover/btn:animate-spin" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
