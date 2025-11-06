"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  MapPin, 
  Mail, 
  Phone,
  Briefcase,
  GraduationCap,
  Star,
  Zap,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  Target,
  Brain,
  Keyboard,
  Users,
  FileText,
  CheckCircle,
  Calendar
} from "lucide-react"

interface CandidateDetails {
  id: string
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  bio: string
  position: string
  location_city: string
  location_country: string
  location_province: string | null
  created_at: string
  resume_data: {
    skills: string[]
    experience: Array<{
      title: string
      company: string
      start_date: string
      end_date: string | null
      description: string
    }>
    education: Array<{
      degree: string
      school: string
      year: string
    }>
  }
  cultural_results: any
  cultural_summary: string | null
  latest_primary_type: string
  latest_secondary_type: string | null
  latest_ai_assessment: string | null
  d_score: number
  i_score: number
  s_score: number
  c_score: number
  typing_wpm: number | null
  typing_accuracy: number | null
  typing_best_wpm: number | null
  typing_best_accuracy: number | null
  leaderboard_score: number
  profile_completion_score: number | null
  resume_building_score: number | null
  application_activity_score: number | null
  ai_overall_score: number | null
  ai_key_strengths: string[] | null
  ai_strengths_analysis: string | null
  ai_improved_summary: string | null
  ai_salary_analysis: string | null
  ai_career_path: string | null
}

// Helper function to format dates nicely
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  } catch (e) {
    return dateString
  }
}

// Helper function to format full dates
function formatFullDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (e) {
    return dateString
  }
}

export default function CandidateProfilePage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string
  
  const [candidate, setCandidate] = useState<CandidateDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchCandidateDetails()
  }, [candidateId])

  const fetchCandidateDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/recruitment/candidates/${candidateId}`)
      const data = await res.json()
      
      if (data.success) {
        // Parse JSON fields from BPOC
        const candidate = data.candidate
        
        // Parse resume_data if it's a string
        if (typeof candidate.resume_data === 'string') {
          try {
            candidate.resume_data = JSON.parse(candidate.resume_data)
          } catch (e) {
            console.error('Failed to parse resume_data:', e)
            candidate.resume_data = null
          }
        }
        
        // Ensure resume_data has proper structure
        if (candidate.resume_data && typeof candidate.resume_data === 'object') {
          // Ensure arrays exist
          if (!Array.isArray(candidate.resume_data.skills)) {
            candidate.resume_data.skills = []
          }
          if (!Array.isArray(candidate.resume_data.experience)) {
            candidate.resume_data.experience = []
          }
          if (!Array.isArray(candidate.resume_data.education)) {
            candidate.resume_data.education = []
          }
          if (!Array.isArray(candidate.resume_data.certifications)) {
            candidate.resume_data.certifications = []
          }
          if (!Array.isArray(candidate.resume_data.languages)) {
            candidate.resume_data.languages = []
          }
        } else {
          // No resume data at all
          candidate.resume_data = {
            skills: [],
            experience: [],
            education: [],
            certifications: [],
            languages: [],
            summary: null
          }
        }
        
        // Parse cultural_results if it's a string
        if (typeof candidate.cultural_results === 'string') {
          try {
            candidate.cultural_results = JSON.parse(candidate.cultural_results)
          } catch (e) {
            console.error('Failed to parse cultural_results:', e)
            candidate.cultural_results = null
          }
        }
        
        // Parse ai_key_strengths if it's a string
        if (typeof candidate.ai_key_strengths === 'string') {
          try {
            candidate.ai_key_strengths = JSON.parse(candidate.ai_key_strengths)
          } catch (e) {
            console.error('Failed to parse ai_key_strengths:', e)
            candidate.ai_key_strengths = []
          }
        }
        
        // Parse ai_strengths_analysis if it's a string (could be JSON object)
        if (typeof candidate.ai_strengths_analysis === 'string') {
          try {
            candidate.ai_strengths_analysis = JSON.parse(candidate.ai_strengths_analysis)
          } catch (e) {
            // It's just a plain string, leave it as is
            console.log('ai_strengths_analysis is a plain string')
          }
        }
        
        // Parse ai_career_path if it's a string (could be JSON object)
        if (typeof candidate.ai_career_path === 'string') {
          try {
            candidate.ai_career_path = JSON.parse(candidate.ai_career_path)
          } catch (e) {
            // It's just a plain string, leave it as is
            console.log('ai_career_path is a plain string')
          }
        }
        
        // Parse ai_salary_analysis if it's a string (could be JSON object)
        if (typeof candidate.ai_salary_analysis === 'string') {
          try {
            candidate.ai_salary_analysis = JSON.parse(candidate.ai_salary_analysis)
          } catch (e) {
            // It's just a plain string, leave it as is
            console.log('ai_salary_analysis is a plain string')
          }
        }
        
        // Ensure arrays are arrays
        if (!Array.isArray(candidate.ai_key_strengths)) {
          candidate.ai_key_strengths = []
        }
        
        // Round DISC scores to whole numbers
        if (candidate.d_score) candidate.d_score = Math.round(candidate.d_score)
        if (candidate.i_score) candidate.i_score = Math.round(candidate.i_score)
        if (candidate.s_score) candidate.s_score = Math.round(candidate.s_score)
        if (candidate.c_score) candidate.c_score = Math.round(candidate.c_score)
        
        // Round typing scores
        if (candidate.typing_wpm) candidate.typing_wpm = Math.round(candidate.typing_wpm)
        if (candidate.typing_accuracy) candidate.typing_accuracy = Math.round(candidate.typing_accuracy)
        if (candidate.typing_best_wpm) candidate.typing_best_wpm = Math.round(candidate.typing_best_wpm)
        if (candidate.typing_best_accuracy) candidate.typing_best_accuracy = Math.round(candidate.typing_best_accuracy)
        
        // Round profile scores
        if (candidate.profile_completion_score) candidate.profile_completion_score = Math.round(candidate.profile_completion_score)
        if (candidate.resume_building_score) candidate.resume_building_score = Math.round(candidate.resume_building_score)
        if (candidate.application_activity_score) candidate.application_activity_score = Math.round(candidate.application_activity_score)
        if (candidate.ai_overall_score) candidate.ai_overall_score = Math.round(candidate.ai_overall_score)
        if (candidate.leaderboard_score) candidate.leaderboard_score = Math.round(candidate.leaderboard_score)
        
        setCandidate(candidate)
      }
    } catch (error) {
      console.error('Failed to fetch candidate:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading candidate profile...</p>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Candidate not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Candidate Profile</h1>
          <p className="text-sm text-muted-foreground">Full details from BPOC database</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={candidate.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
              {candidate.first_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="text-3xl font-bold">
              {candidate.first_name} {candidate.last_name || ''}
            </h2>
            <p className="text-lg text-muted-foreground mt-1">{candidate.position}</p>
            
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{candidate.location_city}, {candidate.location_country}</span>
              </div>
              {candidate.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{candidate.email}</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{candidate.phone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {candidate.leaderboard_score > 0 && (
                <Badge className="gap-1 bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Star className="h-3 w-3 fill-white" />
                  Overall Score: {candidate.leaderboard_score}
                </Badge>
              )}
              {candidate.latest_primary_type && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  DISC: {candidate.latest_primary_type}
                  {candidate.latest_secondary_type && `/${candidate.latest_secondary_type}`}
                </Badge>
              )}
              {candidate.typing_wpm && (
                <Badge variant="outline" className="gap-1">
                  <Keyboard className="h-3 w-3" />
                  {candidate.typing_wpm} WPM
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="resume">
            <Briefcase className="h-4 w-4 mr-2" />
            Resume
          </TabsTrigger>
          <TabsTrigger value="assessments">
            <Target className="h-4 w-4 mr-2" />
            Assessments
          </TabsTrigger>
          <TabsTrigger value="ai-insights">
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Mail className="h-4 w-4 mr-2" />
            Contact
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {candidate.bio && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">About</h3>
              <p className="text-foreground leading-relaxed">{candidate.bio}</p>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Skills Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Skills {candidate.resume_data?.skills && candidate.resume_data.skills.length > 0 && `(${candidate.resume_data.skills.length})`}
              </h3>
              {candidate.resume_data?.skills && candidate.resume_data.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.resume_data.skills.map((skill: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {typeof skill === 'string' ? skill : skill?.name || skill?.skill || JSON.stringify(skill)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No skills listed
                </p>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                {candidate.profile_completion_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Profile Completion</span>
                    <span className="font-medium">{candidate.profile_completion_score}%</span>
                  </div>
                )}
                {candidate.resume_building_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Resume Quality</span>
                    <span className="font-medium">{candidate.resume_building_score}%</span>
                  </div>
                )}
                {candidate.application_activity_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Application Activity</span>
                    <span className="font-medium">{candidate.application_activity_score}%</span>
                  </div>
                )}
                {candidate.created_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="font-medium">
                      {formatDate(candidate.created_at)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Resume Tab */}
        <TabsContent value="resume" className="space-y-4">
          {/* Experience */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </h3>
            {candidate.resume_data?.experience && candidate.resume_data.experience.length > 0 ? (
              <div className="space-y-6">
                {candidate.resume_data.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold text-foreground">
                      {exp?.title || exp?.position || exp?.role || 'Untitled Position'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {exp?.company || exp?.organization || 'Company not specified'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(exp?.start_date || exp?.startDate)} - {formatDate(exp?.end_date || exp?.endDate)}
                    </p>
                    {exp?.description && (
                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No work experience listed
              </p>
            )}
          </Card>

          {/* Education */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </h3>
            {candidate.resume_data?.education && candidate.resume_data.education.length > 0 ? (
              <div className="space-y-4">
                {candidate.resume_data.education.map((edu: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-indigo-500 pl-4">
                    <h4 className="font-semibold text-foreground">
                      {edu?.degree || edu?.qualification || edu?.field || 'Degree not specified'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {edu?.school || edu?.institution || edu?.university || 'School not specified'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {edu?.year || edu?.graduation_year || edu?.endDate || 'Year not specified'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No education history listed
              </p>
            )}
          </Card>

          {/* Certifications & Languages */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Certifications */}
            {candidate.resume_data?.certifications && candidate.resume_data.certifications.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </h3>
                <div className="space-y-2">
                  {candidate.resume_data.certifications.map((cert: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">
                        {typeof cert === 'string' ? cert : cert?.name || JSON.stringify(cert)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Languages */}
            {candidate.resume_data?.languages && candidate.resume_data.languages.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.resume_data.languages.map((lang: any, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {typeof lang === 'string' ? lang : lang?.name || lang?.language || JSON.stringify(lang)}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Summary */}
          {candidate.resume_data?.summary && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">Professional Summary</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {candidate.resume_data.summary}
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          {!candidate.latest_primary_type && !candidate.typing_wpm && !candidate.cultural_summary && (
            <Card className="p-6">
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">No Assessment Data</h3>
                <p className="text-sm text-muted-foreground">
                  This candidate hasn't completed any assessments yet.
                </p>
              </div>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* DISC Personality */}
            {candidate.latest_primary_type && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  DISC Personality
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Primary Type</span>
                    <Badge>{candidate.latest_primary_type}</Badge>
                  </div>
                  {candidate.latest_secondary_type && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Secondary Type</span>
                      <Badge variant="outline">{candidate.latest_secondary_type}</Badge>
                    </div>
                  )}
                  
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dominance (D)</span>
                      <span className="font-medium">{candidate.d_score}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Influence (I)</span>
                      <span className="font-medium">{candidate.i_score}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Steadiness (S)</span>
                      <span className="font-medium">{candidate.s_score}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conscientiousness (C)</span>
                      <span className="font-medium">{candidate.c_score}%</span>
                    </div>
                  </div>

                  {candidate.latest_ai_assessment && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">AI Assessment:</p>
                      <p className="text-sm mt-1">{candidate.latest_ai_assessment}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Typing Test */}
            {candidate.typing_wpm && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  Typing Test
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Latest Speed</span>
                    <Badge>{candidate.typing_wpm} WPM</Badge>
                  </div>
                  {candidate.typing_accuracy && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Latest Accuracy</span>
                      <Badge variant="outline">{candidate.typing_accuracy}%</Badge>
                    </div>
                  )}
                  
                  {(candidate.typing_best_wpm || candidate.typing_best_accuracy) && (
                    <div className="space-y-2 pt-3 border-t">
                      {candidate.typing_best_wpm && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Best Speed</span>
                          <span className="font-medium text-green-600">{candidate.typing_best_wpm} WPM</span>
                        </div>
                      )}
                      {candidate.typing_best_accuracy && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Best Accuracy</span>
                          <span className="font-medium text-green-600">{candidate.typing_best_accuracy}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Cultural Fit */}
            {(candidate.cultural_summary || candidate.cultural_results) && (
              <Card className="p-6 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Cultural Fit Assessment
                </h3>
                {candidate.cultural_summary ? (
                  <p className="text-sm text-foreground leading-relaxed">
                    {candidate.cultural_summary}
                  </p>
                ) : candidate.cultural_results && typeof candidate.cultural_results === 'object' ? (
                  <div className="space-y-3">
                    {Object.entries(candidate.cultural_results).map(([key, value]) => {
                      if (key === 'overallScore' || key === 'score') {
                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm font-medium">Overall Score</span>
                            <Badge className="text-lg">{value as number}%</Badge>
                          </div>
                        )
                      }
                      return (
                        <div key={key} className="border-t pt-2">
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No cultural fit data available
                  </p>
                )}
              </Card>
            )}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-4">
          {!candidate.ai_improved_summary && 
           !candidate.ai_key_strengths?.length && 
           !candidate.ai_overall_score &&
           !candidate.ai_strengths_analysis &&
           !candidate.ai_career_path &&
           !candidate.ai_salary_analysis && (
            <Card className="p-6">
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">No AI Insights Available</h3>
                <p className="text-sm text-muted-foreground">
                  This candidate hasn't completed AI analysis yet.
                </p>
              </div>
            </Card>
          )}

          {candidate.ai_improved_summary && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Improved Summary
              </h3>
              <p className="text-foreground leading-relaxed">
                {candidate.ai_improved_summary}
              </p>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Key Strengths */}
            {candidate.ai_key_strengths && candidate.ai_key_strengths.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Key Strengths
                </h3>
                <div className="space-y-2">
                  {candidate.ai_key_strengths.map((strength: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        {typeof strength === 'string' ? (
                          <span className="text-sm">{strength}</span>
                        ) : typeof strength === 'object' ? (
                          <>
                            {strength.title && (
                              <span className="text-sm font-semibold text-foreground">{strength.title}</span>
                            )}
                            {strength.description && (
                              <p className="text-sm text-muted-foreground mt-1">{strength.description}</p>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Overall Score */}
            {candidate.ai_overall_score !== null && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  AI Overall Score
                </h3>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">
                    {candidate.ai_overall_score}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">out of 100</p>
                </div>
              </Card>
            )}
          </div>

          {/* Strengths Analysis */}
          {candidate.ai_strengths_analysis && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Strengths Analysis
              </h3>
              {typeof candidate.ai_strengths_analysis === 'string' ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {candidate.ai_strengths_analysis}
                </p>
              ) : typeof candidate.ai_strengths_analysis === 'object' ? (
                <div className="space-y-4">
                  {Object.entries(candidate.ai_strengths_analysis).map(([key, value]) => (
                    <div key={key} className="border-l-2 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-foreground capitalize mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      {Array.isArray(value) ? (
                        <div className="space-y-1">
                          {value.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                            </div>
                          ))}
                        </div>
                      ) : typeof value === 'object' && value !== null ? (
                        <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm text-foreground">{String(value)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          )}

          {/* Career Path */}
          {candidate.ai_career_path && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Career Path Recommendation
              </h3>
              {typeof candidate.ai_career_path === 'string' ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {candidate.ai_career_path}
                </p>
              ) : typeof candidate.ai_career_path === 'object' ? (
                <div className="space-y-4">
                  {candidate.ai_career_path.currentRole && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Current Role</h4>
                      <p className="text-sm text-foreground">{candidate.ai_career_path.currentRole}</p>
                    </div>
                  )}
                  {candidate.ai_career_path.currentPosition && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Current Position</h4>
                      <p className="text-sm text-foreground">{candidate.ai_career_path.currentPosition}</p>
                    </div>
                  )}
                  {candidate.ai_career_path.targetRole && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Target Role</h4>
                      <p className="text-sm text-foreground">{candidate.ai_career_path.targetRole}</p>
                    </div>
                  )}
                  {candidate.ai_career_path.timeline && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Timeline</h4>
                      <p className="text-sm text-foreground">{candidate.ai_career_path.timeline}</p>
                    </div>
                  )}
                  {candidate.ai_career_path.nextCareerSteps && Array.isArray(candidate.ai_career_path.nextCareerSteps) && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-2">Next Career Steps</h4>
                      <div className="space-y-3">
                        {candidate.ai_career_path.nextCareerSteps.map((step: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              {typeof step === 'string' ? (
                                <span className="text-sm text-foreground">{step}</span>
                              ) : typeof step === 'object' ? (
                                <>
                                  {step.step && (
                                    <span className="text-sm font-semibold text-primary">Step {step.step}: </span>
                                  )}
                                  {step.title && (
                                    <span className="text-sm font-semibold text-foreground">{step.title}</span>
                                  )}
                                  {step.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                  )}
                                </>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {candidate.ai_career_path.skillGaps && Array.isArray(candidate.ai_career_path.skillGaps) && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-2">Skill Gaps to Address</h4>
                      <div className="space-y-2">
                        {candidate.ai_career_path.skillGaps.map((gap: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-1">⚠</span>
                            <div className="flex-1">
                              {typeof gap === 'string' ? (
                                <span className="text-sm text-foreground">{gap}</span>
                              ) : typeof gap === 'object' ? (
                                <>
                                  {gap.skill && (
                                    <span className="text-sm font-semibold text-foreground">{gap.skill}</span>
                                  )}
                                  {gap.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{gap.description}</p>
                                  )}
                                  {gap.priority && (
                                    <Badge variant="outline" className="mt-1">{gap.priority}</Badge>
                                  )}
                                </>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {candidate.ai_career_path.timelineDetails && (
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-1">Timeline Details</h4>
                      <p className="text-sm text-foreground">{candidate.ai_career_path.timelineDetails}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </Card>
          )}

          {/* Salary Analysis */}
          {candidate.ai_salary_analysis && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Salary Analysis
              </h3>
              {typeof candidate.ai_salary_analysis === 'string' ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {candidate.ai_salary_analysis}
                </p>
              ) : typeof candidate.ai_salary_analysis === 'object' ? (
                <div className="space-y-4">
                  {Object.entries(candidate.ai_salary_analysis).map(([key, value]) => (
                    <div key={key} className="border-l-2 border-green-500 pl-4">
                      <h4 className="text-sm font-semibold text-primary capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      {Array.isArray(value) ? (
                        <div className="space-y-1">
                          {value.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                            </div>
                          ))}
                        </div>
                      ) : typeof value === 'object' && value !== null ? (
                        <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm text-foreground">{String(value)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          )}
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="space-y-4">
              {candidate.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a 
                      href={`mailto:${candidate.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {candidate.email}
                    </a>
                  </div>
                </div>
              )}

              {candidate.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a 
                      href={`tel:${candidate.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {candidate.phone}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {candidate.location_city}, {candidate.location_province && `${candidate.location_province}, `}{candidate.location_country}
                  </p>
                </div>
              </div>

              {candidate.created_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFullDate(candidate.created_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-muted/50">
            <h3 className="text-lg font-semibold mb-3">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Interview
              </Button>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Download Resume
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

