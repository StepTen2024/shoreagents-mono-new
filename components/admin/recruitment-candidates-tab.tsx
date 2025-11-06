"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  MapPin,
  Briefcase,
  Star,
  X,
  Filter,
  Eye
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Candidate {
  id: string
  first_name: string
  avatar_url: string | null
  location_city: string
  location_country: string
  position: string
  bio: string
  resume_data: any
  latest_primary_type: string
  overall_score: number
}

interface RecruitmentCandidatesTabProps {
  // No props needed - we navigate directly
}

export function RecruitmentCandidatesTab({}: RecruitmentCandidatesTabProps) {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [discTypeFilter, setDiscTypeFilter] = useState<string>('all')
  
  // All available skills (extracted from candidates)
  const [availableSkills, setAvailableSkills] = useState<string[]>([])

  // Fetch candidates
  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/recruitment/candidates')
      const data = await res.json()
      
      if (data.success) {
        setCandidates(data.candidates)
        
        // Extract all unique skills
        const skillsSet = new Set<string>()
        data.candidates.forEach((c: Candidate) => {
          if (c.resume_data?.skills) {
            c.resume_data.skills.forEach((skill: string) => {
              if (skill) skillsSet.add(skill.trim())
            })
          }
        })
        setAvailableSkills(Array.from(skillsSet).sort())
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const searchableText = [
        c.first_name,
        c.position,
        c.location_city,
        c.location_country,
        c.bio,
        ...(c.resume_data?.skills || [])
      ].join(' ').toLowerCase()
      
      if (!searchableText.includes(query)) return false
    }

    // Skills filter
    if (selectedSkills.length > 0) {
      const candidateSkills = (c.resume_data?.skills || []).map((s: string) => s.toLowerCase())
      const hasAllSkills = selectedSkills.every(skill => 
        candidateSkills.some((cs: string) => cs.includes(skill.toLowerCase()))
      )
      if (!hasAllSkills) return false
    }

    // Location filter
    if (locationFilter !== 'all') {
      const location = `${c.location_city} ${c.location_country}`.toLowerCase()
      if (!location.includes(locationFilter.toLowerCase())) return false
    }

    // DISC Type filter
    if (discTypeFilter !== 'all' && c.latest_primary_type !== discTypeFilter) {
      return false
    }

    return true
  })

  // Add skill to filter
  const addSkillFilter = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  // Remove skill from filter
  const removeSkillFilter = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill))
  }

  // Get unique locations
  const uniqueLocations = Array.from(new Set(
    candidates.map(c => `${c.location_city}, ${c.location_country}`)
  )).sort()

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, role, skills, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Filters Row */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          {/* Location Filter */}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {uniqueLocations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* DISC Type Filter */}
          <Select value={discTypeFilter} onValueChange={setDiscTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All DISC Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All DISC Types</SelectItem>
              <SelectItem value="D">D - Dominance</SelectItem>
              <SelectItem value="I">I - Influence</SelectItem>
              <SelectItem value="S">S - Steadiness</SelectItem>
              <SelectItem value="C">C - Conscientiousness</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear All Button */}
          {(selectedSkills.length > 0 || locationFilter !== 'all' || discTypeFilter !== 'all' || searchQuery) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedSkills([])
                setLocationFilter('all')
                setDiscTypeFilter('all')
                setSearchQuery('')
              }}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Selected Skills */}
        {selectedSkills.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Skills:</span>
              {selectedSkills.map(skill => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => removeSkillFilter(skill)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${filteredCandidates.length} candidate${filteredCandidates.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Candidates Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          Loading candidates from BPOC database...
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No candidates match your filters</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery('')
              setSelectedSkills([])
              setLocationFilter('all')
              setDiscTypeFilter('all')
            }}
            className="mt-4"
          >
            Clear all filters
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="h-16 w-16 flex-shrink-0">
                  <AvatarImage src={candidate.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg">
                    {candidate.first_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Candidate Info */}
                <div className="flex-1 min-w-0">
                  {/* Name + Position + Location */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">{candidate.first_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{candidate.position || 'No position'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{candidate.location_city}, {candidate.location_country}</span>
                        </div>
                      </div>
                      
                      {/* Badges on second line */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {candidate.overall_score > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {candidate.overall_score}
                          </Badge>
                        )}
                        {candidate.latest_primary_type && (
                          <Badge variant="outline">
                            DISC: {candidate.latest_primary_type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* View Button - Fixed Width */}
                    <Button 
                      onClick={() => router.push(`/admin/recruitment/candidate/${candidate.id}`)}
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>

                  {/* Bio */}
                  {candidate.bio && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {candidate.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {candidate.resume_data?.skills && candidate.resume_data.skills.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {candidate.resume_data.skills.slice(0, 6).map((skill: string, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-secondary/80 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            addSkillFilter(skill)
                          }}
                        >
                          {skill}
                        </Badge>
                      ))}
                      {candidate.resume_data.skills.length > 6 && (
                        <span className="text-xs text-muted-foreground">
                          +{candidate.resume_data.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

