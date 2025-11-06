"use client"

/**
 * Client Talent Pool - Candidate List Page
 * 
 * Beautiful card grid showing anonymized candidate profiles
 * with advanced filtering options
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, MapPin, Star, Zap, Award, TrendingUp, X } from 'lucide-react'

interface Candidate {
  id: string
  firstName: string
  avatar: string | null
  position: string
  location: string
  bio: string | null
  skills: string[]
  experienceYears: number
  culturalFitScore: number | null
  discType: string | null
  typingWpm: number | null
  leaderboardScore: number | null
}

export default function TalentPoolPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filters
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [minExperience, setMinExperience] = useState(0)
  const [selectedDiscTypes, setSelectedDiscTypes] = useState<string[]>([])
  const [minCulturalFit, setMinCulturalFit] = useState(0)

  // Available skills for filter (will be populated from candidates)
  const [availableSkills, setAvailableSkills] = useState<string[]>([])

  useEffect(() => {
    fetchCandidates()
  }, [searchQuery, selectedSkills, location, minExperience, selectedDiscTypes, minCulturalFit])

  async function fetchCandidates() {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedSkills.length > 0) params.append('skills', selectedSkills.join(','))
      if (location) params.append('location', location)
      if (minExperience > 0) params.append('minExperience', minExperience.toString())
      if (selectedDiscTypes.length > 0) params.append('discType', selectedDiscTypes[0]) // API supports one
      if (minCulturalFit > 0) params.append('culturalFitMin', minCulturalFit.toString())

      const response = await fetch(`/api/client/candidates?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setCandidates(data.candidates)
        
        // Extract all unique skills for filter dropdown
        const allSkills = new Set<string>()
        data.candidates.forEach((c: Candidate) => {
          c.skills?.forEach((skill: string) => allSkills.add(skill))
        })
        setAvailableSkills(Array.from(allSkills).sort())
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setSearchQuery('')
    setSelectedSkills([])
    setLocation('')
    setMinExperience(0)
    setSelectedDiscTypes([])
    setMinCulturalFit(0)
  }

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function toggleDiscType(type: string) {
    setSelectedDiscTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Talent Pool</h1>
              <p className="mt-1 text-sm text-gray-500">
                Discover top Filipino professionals ready to join your team
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {candidates.length} candidates available
              </span>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by skills, role, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {(selectedSkills.length > 0 || minExperience > 0 || minCulturalFit > 0) && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedSkills.length + (minExperience > 0 ? 1 : 0) + (minCulturalFit > 0 ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Skills Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                    {availableSkills.slice(0, 20).map(skill => (
                      <label key={skill} className="flex items-center gap-2 py-1 hover:bg-gray-50 px-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill)}
                          onChange={() => toggleSkill(skill)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City or Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Experience Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min. Experience: {minExperience} years
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={minExperience}
                    onChange={(e) => setMinExperience(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Cultural Fit Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min. Cultural Fit: {minCulturalFit}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={minCulturalFit}
                    onChange={(e) => setMinCulturalFit(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* DISC Type Filter */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personality Type (DISC)
                </label>
                <div className="flex gap-2">
                  {['D', 'I', 'S', 'C'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleDiscType(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedDiscTypes.includes(type)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No candidates found matching your criteria</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => router.push(`/client/talent-pool/${candidate.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CandidateCard({ candidate, onClick }: { candidate: Candidate; onClick: () => void }) {
  // Dynamic gradient based on cultural fit score
  const getGradient = () => {
    if (!candidate.culturalFitScore) return 'from-blue-500 via-indigo-500 to-purple-600'
    if (candidate.culturalFitScore >= 80) return 'from-emerald-500 via-teal-500 to-cyan-600'
    if (candidate.culturalFitScore >= 70) return 'from-blue-500 via-indigo-500 to-purple-600'
    return 'from-indigo-500 via-purple-500 to-pink-600'
  }

  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 hover:border-transparent hover:-translate-y-2 overflow-hidden group"
    >
      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-sm -z-10"></div>
      
      {/* Top accent bar with shimmer effect */}
      <div className={`h-1.5 bg-gradient-to-r ${getGradient()} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
      </div>

      {/* Header with avatar - enhanced with glass effect */}
      <div className={`relative bg-gradient-to-br ${getGradient()} p-6 text-white overflow-hidden`}>
        {/* Floating orbs in background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-4">
              {candidate.avatar ? (
                <div className="relative">
                  <img
                    src={candidate.avatar}
                    alt={candidate.firstName}
                    className="w-20 h-20 rounded-2xl border-3 border-white/30 shadow-2xl backdrop-blur-sm ring-4 ring-white/20 group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                </div>
              ) : (
                <div className="relative w-20 h-20 rounded-2xl border-3 border-white/30 shadow-2xl backdrop-blur-sm bg-white/20 flex items-center justify-center text-3xl font-bold ring-4 ring-white/20 group-hover:scale-105 transition-transform duration-300">
                  {candidate.firstName[0]}
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                </div>
              )}
              <div>
                <h3 className="font-bold text-2xl tracking-tight mb-1 drop-shadow-sm">
                  {candidate.firstName}
                </h3>
                <p className="text-sm text-white/90 font-medium">{candidate.position}</p>
              </div>
            </div>
            
            {/* Leaderboard score badge */}
            {candidate.leaderboardScore && candidate.leaderboardScore > 50 && (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold">{candidate.leaderboardScore}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/95 backdrop-blur-sm bg-white/10 rounded-lg px-3 py-1.5 w-fit">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{candidate.location}</span>
          </div>
        </div>
      </div>

      {/* Content - enhanced spacing and styling */}
      <div className="p-6">
        {/* Bio with better typography */}
        {candidate.bio && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-5">
            {candidate.bio}
          </p>
        )}

        {/* Badges with improved visual hierarchy */}
        <div className="flex flex-wrap gap-2 mb-5">
          {candidate.culturalFitScore && candidate.culturalFitScore >= 60 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{candidate.culturalFitScore}% Match</span>
            </div>
          )}
          {candidate.discType && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              <span>DISC: {candidate.discType}</span>
            </div>
          )}
          {candidate.typingWpm && candidate.typingWpm >= 40 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{candidate.typingWpm} WPM</span>
            </div>
          )}
        </div>

        {/* Skills with gradient tags */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-blue-400 to-transparent"></span>
            Top Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 5 && (
              <span className="px-3 py-1.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 rounded-lg text-xs font-semibold border border-gray-200">
                +{candidate.skills.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Experience with icon */}
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-5">
          <Award className="w-4 h-4 text-blue-500" />
          <span className="font-semibold">{candidate.experienceYears}</span>
          <span>years of experience</span>
        </div>

        {/* CTA with enhanced gradient and animation */}
        <button className="relative w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold rounded-xl overflow-hidden group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          <span className="relative flex items-center justify-center gap-2">
            View Full Profile
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </span>
        </button>
      </div>
    </div>
  )
}





