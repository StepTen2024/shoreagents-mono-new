"use client"

/**
 * Client Candidate Profile Page - AI-FIRST DESIGN
 * 
 * Tab 1: PROFILE (Traditional Resume) - DEFAULT
 * Tab 2: AI ANALYSIS (Premium Value)
 * Tab 3: DISC PERSONALITY (AI-Powered Assessment)
 * Tab 4: PERFORMANCE (Typing & Metrics)
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, MapPin, Calendar, Briefcase, Award, Book, Languages,
  Brain, Zap, Target, TrendingUp, Video, CheckCircle, X, Plus, FileText, Clock, UserCheck, Mail, XCircle, CalendarCheck
} from 'lucide-react'
import { CommentSection } from '@/components/engagement/comment-section'

interface CandidateProfile {
  id: string
  firstName: string
  avatar: string | null
  position: string
  location: string
  bio: string
  memberSince: string
  resume: {
    summary: string
    skills: string[]
    experience: any[]
    education: any[]
    certifications: any[]
    languages: any[]
  }
  assessments: {
    disc: {
      primaryType: string
      secondaryType: string
      description: string
      scores: {
        dominance: number
        influence: number
        steadiness: number
        conscientiousness: number
      }
    }
    typing: {
      wpm: number | null
      accuracy: number | null
      bestWpm: number | null
      bestAccuracy: number | null
    }
  }
  aiAnalysis: {
    overallScore: number | null
    keyStrengths: string[]
    strengthsAnalysis: string | {
      coreStrengths?: string[]
      technicalStrengths?: string[]
      softSkills?: string[]
      uniqueValue?: string
      marketAdvantage?: string
      topStrengths?: string[]
      achievements?: string[]
      areasToHighlight?: string[]
    } | null
  }
}

type TabType = 'profile' | 'ai' | 'disc' | 'performance'

export default function CandidateProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const candidateId = params.id as string

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [existingInterview, setExistingInterview] = useState<any>(null)
  const [checkingInterview, setCheckingInterview] = useState(true)
  
  // Get return navigation info from URL params
  const returnTo = searchParams.get('returnTo')
  const returnTab = searchParams.get('tab')
  
  const handleBackNavigation = () => {
    if (returnTo === 'recruitment') {
      router.push(`/client/recruitment${returnTab ? `?tab=${returnTab}` : ''}`)
    } else {
      router.push('/client/talent-pool')
    }
  }
  
  const getBackButtonText = () => {
    if (returnTo === 'recruitment') {
      if (returnTab === 'interviews') {
        return 'Back to Interviews'
      } else if (returnTab === 'job-requests') {
        return 'Back to Job Requests'
      }
      return 'Back to Talent Pool'
    }
    return 'Back to Talent Pool'
  }

  useEffect(() => {
    fetchCandidate()
    checkExistingInterview()
  }, [candidateId])

  async function fetchCandidate() {
    try {
      setLoading(true)
      const response = await fetch(`/api/client/candidates/${candidateId}`)
      const data = await response.json()

      if (data.success) {
        setCandidate(data.candidate)
      } else {
        console.error('Failed to fetch candidate:', data.error)
      }
    } catch (error) {
      console.error('Error fetching candidate:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkExistingInterview() {
    try {
      setCheckingInterview(true)
      const response = await fetch('/api/client/interviews')
      const data = await response.json()

      if (data.success && data.interviews) {
        // Check if there's already an interview for this candidate
        const interview = data.interviews.find(
          (interview: any) => interview.bpocCandidateId === candidateId
        )
        setExistingInterview(interview || null)
      }
    } catch (error) {
      console.error('Error checking existing interviews:', error)
    } finally {
      setCheckingInterview(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="w-full py-4 px-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Hero Section Skeleton */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
          <div className="w-full py-12 px-6">
            <div className="flex items-center gap-6">
              {/* Avatar Skeleton */}
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl bg-white/20 animate-pulse" />
              
              {/* Info Skeleton */}
              <div className="flex-1 space-y-3">
                <div className="h-10 w-64 bg-white/20 rounded animate-pulse" />
                <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
                <div className="flex items-center gap-6">
                  <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                  <div className="h-5 w-40 bg-white/20 rounded animate-pulse" />
                  <div className="h-5 w-28 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation Skeleton */}
        <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10 shadow-sm">
          <div className="w-full px-6">
            <div className="flex gap-4 py-2">
              <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 w-40 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="w-full px-6 py-8 space-y-6">
          {/* Action Button Skeleton */}
          <div className="flex justify-end">
            <div className="h-12 w-48 bg-blue-200 rounded-xl animate-pulse" />
          </div>

          {/* Cards Skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
                <div className="h-4 w-4/6 bg-gray-200 rounded" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded" />
              <div className="flex flex-wrap gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                <div className="h-8 w-28 bg-gray-200 rounded-lg" />
                <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                <div className="h-8 w-32 bg-gray-200 rounded-lg" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="space-y-3">
                <div className="h-20 w-full bg-gray-200 rounded-lg" />
                <div className="h-20 w-full bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-900 font-semibold mb-2">Candidate not found</p>
          <button
            onClick={handleBackNavigation}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← {getBackButtonText()}
          </button>
        </div>
      </div>
    )
  }

  // Calculate years of experience
  const yearsOfExperience = candidate.resume.experience.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="w-full py-4 px-6">
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {getBackButtonText()}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="w-full py-12 px-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            {candidate.avatar ? (
              <img
                src={candidate.avatar}
                alt={candidate.firstName}
                className="w-28 h-28 rounded-full border-4 border-white shadow-2xl object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl bg-white/20 flex items-center justify-center text-4xl font-bold">
                {candidate.firstName[0]}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{candidate.firstName}</h1>
              <p className="text-xl text-white/90 mb-3">{candidate.position}</p>
              
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{candidate.location}</span>
                </div>
                {yearsOfExperience > 0 && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{yearsOfExperience}+ years experience</span>
                  </div>
                )}
                {candidate.assessments.typing.wpm && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>{candidate.assessments.typing.wpm} WPM</span>
                  </div>
                )}
                {candidate.assessments.disc.primaryType && (
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>DISC: {candidate.assessments.disc.primaryType}{candidate.assessments.disc.secondaryType ? `-${candidate.assessments.disc.secondaryType}` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10 shadow-sm">
        <div className="w-full px-6">
          <div className="flex overflow-x-auto">
            <TabButton
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              icon={Briefcase}
              label="Profile"
            />
            <TabButton
              active={activeTab === 'ai'}
              onClick={() => setActiveTab('ai')}
              icon={Brain}
              label="AI Analysis"
            />
            <TabButton
              active={activeTab === 'disc'}
              onClick={() => setActiveTab('disc')}
              icon={Zap}
              label="DISC Personality"
            />
            <TabButton
              active={activeTab === 'performance'}
              onClick={() => setActiveTab('performance')}
              icon={Target}
              label="Performance"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full py-8 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Tab Content */}
          <div className="lg:col-span-2">
            <div className="animate-fadeIn">
              {activeTab === 'profile' && <ProfileTab candidate={candidate} />}
              {activeTab === 'ai' && <AIAnalysisTab candidate={candidate} />}
              {activeTab === 'disc' && <DISCTab candidate={candidate} />}
              {activeTab === 'performance' && <PerformanceTab candidate={candidate} />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-36">
              {/* Request Interview Button or Status */}
              {!existingInterview ? (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={checkingInterview}
                >
                  {checkingInterview ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Request Interview
                    </>
                  )}
                </button>
              ) : (
                <InterviewStatusCard interview={existingInterview} />
              )}

              {/* Quick Snapshot */}
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Quick Snapshot
                </h3>
                <div className="space-y-3">
                  {yearsOfExperience > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Experience</span>
                      <span className="font-semibold text-gray-900">{yearsOfExperience}+ years</span>
                    </div>
                  )}
                  {candidate.assessments.disc.primaryType && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">DISC Type</span>
                      <span className="font-bold text-blue-600">
                        {candidate.assessments.disc.primaryType}{candidate.assessments.disc.secondaryType ? `-${candidate.assessments.disc.secondaryType}` : ''}
                      </span>
                    </div>
                  )}
                  {candidate.assessments.typing.wpm && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Typing Speed</span>
                      <span className="font-semibold text-gray-900">{candidate.assessments.typing.wpm} WPM</span>
                    </div>
                  )}
                  {candidate.aiAnalysis.overallScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">AI Score</span>
                      <span className="font-bold text-lg text-purple-600">{candidate.aiAnalysis.overallScore}/100</span>
                    </div>
                  )}
                  {candidate.resume.skills.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Skills</span>
                      <span className="font-semibold text-gray-900">{candidate.resume.skills.length} skills</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Skills */}
              {candidate.resume.skills.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Top Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.resume.skills.slice(0, 8).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-xs font-medium shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {candidate.resume.languages.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-blue-600" />
                    Languages
                  </h3>
                  <div className="space-y-2">
                    {candidate.resume.languages.map((lang, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{typeof lang === 'string' ? lang : lang.language}</span>
                        {typeof lang === 'object' && lang.proficiency && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{lang.proficiency}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🎯 UNIFIED COMMENT SYSTEM */}
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">💬 Internal Notes & Comments</h3>
            <p className="text-sm text-gray-600 mb-6">
              Share insights and notes about this candidate with your team. These comments are only visible to your organization.
            </p>
            <CommentSection
              commentableType="CANDIDATE"
              commentableId={candidate.id}
              darkMode={false}
            />
          </div>
        </div>
      </div>

      {/* Request Interview Modal */}
      {showRequestModal && (
        <RequestInterviewModal
          candidate={candidate}
          onClose={() => setShowRequestModal(false)}
          onSuccess={checkExistingInterview}
        />
      )}
    </div>
  )
}

// ============================================================================
// TAB BUTTON COMPONENT
// ============================================================================

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative
        ${active
          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
      )}
    </button>
  )
}

// ============================================================================
// TAB 1: PROFILE (TRADITIONAL RESUME) - DEFAULT
// ============================================================================

function ProfileTab({ candidate }: { candidate: CandidateProfile }) {
  return (
    <div className="space-y-6">
      {/* Bio */}
      {candidate.bio && (
        <Section title="About" icon={Briefcase}>
          <p className="text-gray-700 leading-relaxed text-lg">{candidate.bio}</p>
        </Section>
      )}

      {/* Professional Summary */}
      {candidate.resume.summary && (
        <Section title="Professional Summary" icon={FileText}>
          <p className="text-gray-700 leading-relaxed">{candidate.resume.summary}</p>
        </Section>
      )}

      {/* Skills */}
      {candidate.resume.skills.length > 0 && (
        <Section title="Skills & Expertise" icon={Award}>
          <div className="flex flex-wrap gap-3">
            {candidate.resume.skills.map((skill, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium shadow-md transition-all"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Work Experience */}
      {candidate.resume.experience.length > 0 && (
        <Section title="Work Experience" icon={Briefcase}>
          <div className="space-y-6">
            {candidate.resume.experience.map((exp, i) => (
              <div key={i} className="relative pl-6 pb-6 border-l-4 border-blue-500 last:pb-0">
                <div className="absolute left-[-10px] top-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg" />
                <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-gray-900 text-lg">{exp.position}</h4>
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {exp.company} • {exp.duration}
                  </p>
                  {exp.description && (
                    <p className="text-gray-700 mt-3 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {candidate.resume.education.length > 0 && (
        <Section title="Education" icon={Book}>
          <div className="space-y-4">
            {candidate.resume.education.map((edu, i) => (
              <div key={i} className="p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200">
                <h4 className="font-bold text-gray-900 text-lg">{edu.degree}</h4>
                <p className="text-sm text-purple-600 font-medium mt-1">
                  {edu.institution} • {edu.year}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {candidate.resume.certifications.length > 0 && (
        <Section title="Certifications & Credentials" icon={Award}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidate.resume.certifications.map((cert, i) => (
              <div key={i} className="p-3 bg-gradient-to-br from-yellow-50 to-white rounded-lg border border-yellow-200 flex items-center gap-3">
                <div className="text-2xl">🏆</div>
                <span className="text-sm text-gray-700 font-medium">
                  {typeof cert === 'string' ? cert : cert.name}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {candidate.resume.languages.length > 0 && (
        <Section title="Languages" icon={Languages}>
          <div className="grid grid-cols-2 gap-3">
            {candidate.resume.languages.map((lang, i) => (
              <div key={i} className="p-3 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
                <div className="font-semibold text-gray-900">
                  {typeof lang === 'string' ? lang : lang.language}
                </div>
                {typeof lang === 'object' && lang.proficiency && (
                  <div className="text-sm text-green-600 mt-1">{lang.proficiency}</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ============================================================================
// TAB 2: AI ANALYSIS (PREMIUM VALUE)
// ============================================================================

function AIAnalysisTab({ candidate }: { candidate: CandidateProfile }) {
  // Check if strengthsAnalysis is an object with detailed breakdown
  const strengthsAnalysis = candidate.aiAnalysis.strengthsAnalysis
  const isDetailedAnalysis = strengthsAnalysis && typeof strengthsAnalysis === 'object' && !Array.isArray(strengthsAnalysis)

  return (
    <div className="space-y-6">
      {/* AI Overall Score */}
      {candidate.aiAnalysis.overallScore && (
        <Section title="AI Professional Analysis Score" icon={Brain}>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl border-2 border-purple-200 text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl mb-4">
              <span className="text-5xl font-bold text-white">{candidate.aiAnalysis.overallScore}</span>
            </div>
            <div className="text-lg font-semibold text-gray-700">Overall AI Assessment Score</div>
            <p className="text-sm text-gray-600 mt-2">Based on comprehensive AI analysis of skills, experience, and professional profile</p>
          </div>
        </Section>
      )}

      {/* Key Strengths */}
      {candidate.aiAnalysis.keyStrengths.length > 0 && (
        <Section title="AI-Identified Key Strengths" icon={Award}>
          <div className="space-y-3">
            {candidate.aiAnalysis.keyStrengths.map((strength, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="text-gray-800 font-medium">{strength}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Detailed Strengths Analysis - Object Format */}
      {isDetailedAnalysis && (
        <>
          {(strengthsAnalysis as any).coreStrengths && Array.isArray((strengthsAnalysis as any).coreStrengths) && (strengthsAnalysis as any).coreStrengths.length > 0 && (
            <Section title="Core Strengths" icon={Award}>
              <div className="space-y-3">
                {(strengthsAnalysis as any).coreStrengths.map((strength: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">★</span>
                    </div>
                    <span className="text-gray-800 font-medium">{strength}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(strengthsAnalysis as any).technicalStrengths && Array.isArray((strengthsAnalysis as any).technicalStrengths) && (strengthsAnalysis as any).technicalStrengths.length > 0 && (
            <Section title="Technical Strengths" icon={Target}>
              <div className="space-y-3">
                {(strengthsAnalysis as any).technicalStrengths.map((strength: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm font-bold">⚡</span>
                    </div>
                    <span className="text-gray-800 font-medium">{strength}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(strengthsAnalysis as any).softSkills && Array.isArray((strengthsAnalysis as any).softSkills) && (strengthsAnalysis as any).softSkills.length > 0 && (
            <Section title="Soft Skills" icon={Brain}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(strengthsAnalysis as any).softSkills.map((skill: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700 font-medium text-sm">{skill}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(strengthsAnalysis as any).uniqueValue && (
            <Section title="Unique Value Proposition" icon={TrendingUp}>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                <p className="text-gray-800 leading-relaxed text-lg">{(strengthsAnalysis as any).uniqueValue}</p>
              </div>
            </Section>
          )}

          {(strengthsAnalysis as any).marketAdvantage && (
            <Section title="Market Advantage" icon={Award}>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                <p className="text-gray-800 leading-relaxed text-lg">{(strengthsAnalysis as any).marketAdvantage}</p>
              </div>
            </Section>
          )}
        </>
      )}

      {/* Detailed Strengths Analysis - String Format */}
      {!isDetailedAnalysis && strengthsAnalysis && typeof strengthsAnalysis === 'string' && (
        <Section title="Detailed AI Strengths Analysis" icon={Brain}>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
            <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">
              {strengthsAnalysis}
            </p>
          </div>
        </Section>
      )}

      {/* Empty State */}
      {!candidate.aiAnalysis.overallScore && candidate.aiAnalysis.keyStrengths.length === 0 && !candidate.aiAnalysis.strengthsAnalysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No AI Analysis Available</h3>
          <p className="text-gray-600">AI analysis data is not yet available for this candidate.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// TAB 3: DISC PERSONALITY (AI-POWERED ASSESSMENT)
// ============================================================================

function DISCTab({ candidate }: { candidate: CandidateProfile }) {
  const disc = candidate.assessments.disc

  return (
    <div className="space-y-6">
      {disc.primaryType && (
        <>
          {/* DISC Type Badges */}
          <Section title="DISC Personality Profile" icon={Zap}>
            <div className="space-y-6">
              {/* Primary & Secondary Types */}
              <div className="flex items-center gap-3">
                <div className="px-8 py-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold text-4xl shadow-lg">
                  {disc.primaryType}
                </div>
                {disc.secondaryType && (
                  <div className="px-6 py-3 bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl font-bold text-2xl shadow-lg">
                    {disc.secondaryType}
                  </div>
                )}
              </div>

              {/* DISC Scores Visual */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 text-lg">Personality Breakdown</h4>
                <div className="space-y-4">
                  <DISCBar label="Dominance" score={disc.scores.dominance} color="red" />
                  <DISCBar label="Influence" score={disc.scores.influence} color="yellow" />
                  <DISCBar label="Steadiness" score={disc.scores.steadiness} color="green" />
                  <DISCBar label="Conscientiousness" score={disc.scores.conscientiousness} color="blue" />
                </div>
              </div>

              {/* What This Means */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">What This Means</h4>
                <div className="space-y-3 text-gray-700">
                  <p><strong className="text-red-600">Dominance (D):</strong> Direct, decisive, problem-solving focused</p>
                  <p><strong className="text-yellow-600">Influence (I):</strong> Enthusiastic, optimistic, people-oriented</p>
                  <p><strong className="text-green-600">Steadiness (S):</strong> Patient, supportive, team player</p>
                  <p><strong className="text-blue-600">Conscientiousness (C):</strong> Analytical, detail-oriented, quality-focused</p>
                </div>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Empty State */}
      {!disc.primaryType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No DISC Assessment Available</h3>
          <p className="text-gray-600">DISC personality assessment data is not yet available for this candidate.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// TAB 4: PERFORMANCE (TYPING & METRICS)
// ============================================================================

function PerformanceTab({ candidate }: { candidate: CandidateProfile }) {
  const typing = candidate.assessments.typing

  return (
    <div className="space-y-6">
      {typing.wpm && (
        <Section title="Typing Performance" icon={TrendingUp}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current WPM */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{typing.wpm}</div>
              <div className="text-sm text-gray-600 font-medium">Current Words Per Minute</div>
            </div>

            {/* Current Accuracy */}
            {typing.accuracy && (
              <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">{typing.accuracy}%</div>
                <div className="text-sm text-gray-600 font-medium">Current Accuracy</div>
              </div>
            )}

            {/* Best WPM */}
            {typing.bestWpm && (
              <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">{typing.bestWpm}</div>
                <div className="text-sm text-gray-600 font-medium">Best WPM Ever</div>
              </div>
            )}

            {/* Best Accuracy */}
            {typing.bestAccuracy && (
              <div className="p-6 bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-200 text-center">
                <div className="text-5xl font-bold text-yellow-600 mb-2">{typing.bestAccuracy}%</div>
                <div className="text-sm text-gray-600 font-medium">Best Accuracy Ever</div>
              </div>
            )}
          </div>

          {/* Performance Rating */}
          <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-3 text-lg">Performance Rating</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {typing.wpm >= 80 ? '🔥 Excellent' : typing.wpm >= 60 ? '✅ Very Good' : typing.wpm >= 40 ? '👍 Good' : '📈 Developing'}
                </span>
                <span className="font-semibold text-gray-900">{typing.wpm} WPM</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((typing.wpm / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Empty State */}
      {!typing.wpm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Performance Data Available</h3>
          <p className="text-gray-600">Performance metrics are not yet available for this candidate.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-6 h-6 text-blue-600" />}
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function DISCBar({ label, score, color }: { label: string; score: number; color: string }) {
  const colors = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${colors[color as keyof typeof colors]} h-3 rounded-full transition-all shadow-inner`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// INTERVIEW STATUS CARD
// ============================================================================

function InterviewStatusCard({ interview }: { interview: any }) {
  const getStatusConfig = (status: string) => {
    const statusUpper = status.toUpperCase()
    
    switch (statusUpper) {
      case 'PENDING':
        return {
          label: 'Waiting for Coordination',
          description: 'Our team is coordinating to schedule your interview. You\'ll be notified once confirmed.',
          icon: Clock,
          bgColor: 'from-yellow-50 to-yellow-100',
          borderColor: 'border-l-yellow-500',
          titleColor: 'text-yellow-900',
          descColor: 'text-yellow-800',
          iconColor: 'text-yellow-700',
          iconBgColor: 'bg-yellow-200'
        }
      case 'SCHEDULED':
        return {
          label: 'Interview Scheduled',
          description: 'Your interview has been confirmed.',
          icon: CalendarCheck,
          bgColor: 'from-blue-50 to-blue-100',
          borderColor: 'border-l-blue-500',
          titleColor: 'text-blue-900',
          descColor: 'text-blue-800',
          iconColor: 'text-blue-700',
          iconBgColor: 'bg-blue-200'
        }
      case 'RESCHEDULE_REQUESTED':
      case 'RESCHEDULE-REQUESTED':
        return {
          label: 'Reschedule Requested',
          description: 'Your reschedule request has been submitted. We\'re coordinating a new time.',
          icon: Calendar,
          bgColor: 'from-yellow-50 to-yellow-100',
          borderColor: 'border-l-yellow-500',
          titleColor: 'text-amber-900',
          descColor: 'text-amber-800',
          iconColor: 'text-amber-700',
          iconBgColor: 'bg-amber-200'
        }
      case 'COMPLETED':
        return {
          label: 'Interview Complete',
          description: 'Great work! You can now request to hire this candidate.',
          icon: CheckCircle,
          bgColor: 'from-green-50 to-green-100',
          borderColor: 'border-l-green-500',
          titleColor: 'text-green-900',
          descColor: 'text-green-800',
          iconColor: 'text-green-700',
          iconBgColor: 'bg-green-200'
        }
      case 'CANCELLED':
        return {
          label: 'Interview Cancelled',
          description: 'This interview request has been closed.',
          icon: XCircle,
          bgColor: 'from-gray-50 to-gray-100',
          borderColor: 'border-l-gray-500',
          titleColor: 'text-gray-900',
          descColor: 'text-gray-800',
          iconColor: 'text-gray-700',
          iconBgColor: 'bg-gray-200'
        }
      case 'HIRE_REQUESTED':
      case 'HIRE-REQUESTED':
        return {
          label: 'Hire Request Submitted',
          description: 'Your hire request has been submitted. Admin will send a formal job offer.',
          icon: UserCheck,
          bgColor: 'from-orange-50 to-orange-100',
          borderColor: 'border-l-orange-500',
          titleColor: 'text-orange-900',
          descColor: 'text-orange-800',
          iconColor: 'text-orange-700',
          iconBgColor: 'bg-orange-200'
        }
      case 'OFFER_SENT':
      case 'OFFER-SENT':
        return {
          label: 'Job Offer Sent 📧',
          description: 'A formal job offer has been sent. Waiting for response.',
          icon: Mail,
          bgColor: 'from-indigo-50 to-indigo-100',
          borderColor: 'border-l-indigo-500',
          titleColor: 'text-indigo-900',
          descColor: 'text-indigo-800',
          iconColor: 'text-indigo-700',
          iconBgColor: 'bg-indigo-200'
        }
      case 'OFFER_ACCEPTED':
      case 'OFFER-ACCEPTED':
        return {
          label: 'Offer Accepted! 🎉',
          description: 'Great news! The candidate accepted and is completing onboarding.',
          icon: CheckCircle,
          bgColor: 'from-emerald-50 to-emerald-100',
          borderColor: 'border-l-emerald-500',
          titleColor: 'text-emerald-900',
          descColor: 'text-emerald-800',
          iconColor: 'text-emerald-700',
          iconBgColor: 'bg-emerald-200'
        }
      case 'OFFER_DECLINED':
      case 'OFFER-DECLINED':
        return {
          label: 'Offer Declined',
          description: 'Unfortunately, the candidate declined the job offer.',
          icon: XCircle,
          bgColor: 'from-red-50 to-red-100',
          borderColor: 'border-l-red-500',
          titleColor: 'text-red-900',
          descColor: 'text-red-800',
          iconColor: 'text-red-700',
          iconBgColor: 'bg-red-200'
        }
      case 'HIRED':
        return {
          label: 'Candidate Hired! 🎉',
          description: 'Congratulations! The candidate has been hired and is moving forward with onboarding.',
          icon: UserCheck,
          bgColor: 'from-purple-50 to-purple-100',
          borderColor: 'border-l-purple-500',
          titleColor: 'text-purple-900',
          descColor: 'text-purple-800',
          iconColor: 'text-purple-700',
          iconBgColor: 'bg-purple-200'
        }
      case 'REJECTED':
        return {
          label: 'Candidate Rejected',
          description: 'You have declined to move forward with this candidate.',
          icon: XCircle,
          bgColor: 'from-red-50 to-red-100',
          borderColor: 'border-l-red-500',
          titleColor: 'text-red-900',
          descColor: 'text-red-800',
          iconColor: 'text-red-700',
          iconBgColor: 'bg-red-200'
        }
      default:
        return {
          label: status,
          description: '',
          icon: Calendar,
          bgColor: 'from-gray-50 to-gray-100',
          borderColor: 'border-l-gray-500',
          titleColor: 'text-gray-900',
          descColor: 'text-gray-800',
          iconColor: 'text-gray-700',
          iconBgColor: 'bg-gray-200'
        }
    }
  }
  
  const config = getStatusConfig(interview.status)
  const StatusIcon = config.icon
  
  // Format scheduled time if available
  const formatScheduledTime = (time: string) => {
    if (!time) return null
    try {
      const date = new Date(time)
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return null
    }
  }
  
  // Format preferred times
  const formatPreferredTime = (time: string | any) => {
    if (!time) return ''
    
    // If time is an object with datetime property
    if (typeof time === 'object' && time.datetime) {
      time = time.datetime
    }
    
    try {
      const date = new Date(time)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return String(time)
    }
  }
  
  const scheduledTimeFormatted = interview.scheduledTime 
    ? formatScheduledTime(interview.scheduledTime) 
    : null
  
  const shouldShowPreferredTimes = interview.status !== 'COMPLETED' && 
                                   interview.status !== 'HIRE_REQUESTED' && 
                                   interview.status !== 'HIRE-REQUESTED' && 
                                   interview.status !== 'HIRED' &&
                                   interview.status !== 'OFFER_SENT' &&
                                   interview.status !== 'OFFER-SENT' &&
                                   interview.status !== 'OFFER_DECLINED' &&
                                   interview.status !== 'OFFER-DECLINED'
  
  return (
    <div 
      className={`w-full bg-gradient-to-br ${config.bgColor} ${config.borderColor} border-l-4 rounded-lg shadow-sm overflow-hidden`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-full ${config.iconBgColor} flex items-center justify-center shrink-0`}>
            <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${config.titleColor} mb-2`}>
              {config.label}
            </h3>
            {config.description && (
              <p className={`text-sm ${config.descColor} leading-relaxed`}>
                {config.description}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Details */}
      <div className="px-6 pb-6 space-y-3">
        {interview.status === 'SCHEDULED' && scheduledTimeFormatted && (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Scheduled Time</div>
              <div className="text-sm font-semibold text-gray-900">{scheduledTimeFormatted}</div>
            </div>
          </div>
        )}
        
        {interview.status === 'SCHEDULED' && interview.meetingLink && (
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Video className="w-4 h-4" />
            Join Meeting
          </a>
        )}
        
        {shouldShowPreferredTimes && interview.preferredTimes && interview.preferredTimes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Your Preferred Times:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {interview.preferredTimes.map((time: any, idx: number) => (
                <span key={idx} className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                  <Clock className="h-3 w-3" />
                  {formatPreferredTime(time)}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Combined Notes (Client + Admin) */}
        {(() => {
          const clientNotes = interview.clientNotes || '';
          const adminNotes = interview.adminNotes || '';
          
          if (!clientNotes && !adminNotes) return null;

          // Parse notes and combine them
          const parseNotes = (notesText: string, type: 'client' | 'admin') => {
            if (!notesText) return [];
            
            // Split by timestamp pattern - supports both () and [] and plain timestamps
            const entries = notesText.split(/\n\n(?=[\(\[]|\d)/);
            
            return entries.map(entry => {
              // NEW FORMAT WITH STATUS: (Status Label) timestamp - content
              const newFormatMatch = entry.match(/^\(([^\)]+)\)\s+([^-]+)\s+-\s+([\s\S]*)$/);
              if (newFormatMatch) {
                const [, statusLabel, timestamp, content] = newFormatMatch;
                try {
                  const date = new Date(timestamp.trim());
                  return { 
                    timestamp: `(${statusLabel}) ${timestamp.trim()}`, 
                    content: content.trim(), 
                    type, 
                    date, 
                    rawText: entry 
                  };
                } catch {
                  return { 
                    timestamp: `(${statusLabel}) ${timestamp.trim()}`, 
                    content: content.trim(), 
                    type, 
                    date: new Date(0), 
                    rawText: entry 
                  };
                }
              }
              
              // PLAIN FORMAT: timestamp - content (no status label)
              const plainFormatMatch = entry.match(/^([^-\(\[]+)\s+-\s+([\s\S]*)$/);
              if (plainFormatMatch) {
                const [, timestamp, content] = plainFormatMatch;
                try {
                  const date = new Date(timestamp.trim());
                  return { 
                    timestamp: timestamp.trim(), 
                    content: content.trim(), 
                    type, 
                    date, 
                    rawText: entry 
                  };
                } catch {
                  return { 
                    timestamp: timestamp.trim(), 
                    content: content.trim(), 
                    type, 
                    date: new Date(0), 
                    rawText: entry 
                  };
                }
              }
              
              // OLD FORMAT WITH BRACKETS: [Status Label] timestamp - content
              const oldNewFormatMatch = entry.match(/^\[([^\]]+)\]\s+([^-]+)\s+-\s+([\s\S]*)$/);
              if (oldNewFormatMatch) {
                const [, statusLabel, timestamp, content] = oldNewFormatMatch;
                try {
                  const date = new Date(timestamp.trim());
                  return { 
                    timestamp: `[${statusLabel}] ${timestamp.trim()}`, 
                    content: content.trim(), 
                    type, 
                    date, 
                    rawText: entry 
                  };
                } catch {
                  return { 
                    timestamp: `[${statusLabel}] ${timestamp.trim()}`, 
                    content: content.trim(), 
                    type, 
                    date: new Date(0), 
                    rawText: entry 
                  };
                }
              }
              
              // OLDEST FORMAT: [timestamp] content
              const oldFormatMatch = entry.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
              if (oldFormatMatch) {
                const [, timestamp, content] = oldFormatMatch;
                try {
                  const date = new Date(timestamp);
                  return { timestamp, content: content.trim(), type, date, rawText: entry };
                } catch {
                  return { timestamp, content: content.trim(), type, date: new Date(0), rawText: entry };
                }
              }
              return { timestamp: '', content: entry.trim(), type, date: new Date(0), rawText: entry };
            }).filter(e => e.content);
          };

          const clientEntries = parseNotes(clientNotes, 'client');
          const adminEntries = parseNotes(adminNotes, 'admin');
          const allEntries = [...clientEntries, ...adminEntries].sort((a, b) => a.date.getTime() - b.date.getTime());

          if (allEntries.length === 0) return null;

          return (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Notes</span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {allEntries.map((entry, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded border ${
                      entry.type === 'client' 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-purple-50 border-purple-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 ${
                          entry.type === 'client'
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-purple-100 text-purple-700 border-purple-300'
                        }`}
                      >
                        {entry.type === 'client' ? 'Client' : 'Admin'}
                      </span>
                      {entry.timestamp && (
                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        
        {/* Preferred Start Date - Show for hire requested and later */}
        {interview.clientPreferredStart && (interview.status === 'HIRE_REQUESTED' || interview.status === 'HIRE-REQUESTED' || interview.status === 'OFFER_SENT' || interview.status === 'OFFER-SENT' || interview.status === 'OFFER_ACCEPTED' || interview.status === 'OFFER-ACCEPTED' || interview.status === 'HIRED') && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-gray-900">Your Preferred Start Date</span>
            </div>
            <p className="text-sm font-medium text-blue-700">
              {new Date(interview.clientPreferredStart).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
        
        {/* Work Schedule - Show for hire requested and later */}
        {interview.workSchedule && (interview.status === 'HIRE_REQUESTED' || interview.status === 'HIRE-REQUESTED' || interview.status === 'OFFER_SENT' || interview.status === 'OFFER-SENT' || interview.status === 'OFFER_ACCEPTED' || interview.status === 'OFFER-ACCEPTED' || interview.status === 'HIRED') && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs font-semibold text-gray-900">Work Schedule</span>
              </div>
              {interview.workSchedule.isMonToFri && (
                <p className="text-xs text-gray-500">(Mon-Fri)</p>
              )}
            </div>
            {interview.workSchedule.hasCustomHours && interview.workSchedule.customHours ? (
              <div>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(interview.workSchedule.customHours).map(([day, time]: [string, any]) => {
                    const [hours, minutes] = time.split(':').map(Number)
                    const endHour = (hours + 9) % 24
                    const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    const convertTo12Hour = (time24: string): string => {
                      const [h, m] = time24.split(':').map(Number)
                      const period = h >= 12 ? 'PM' : 'AM'
                      const hours12 = h % 12 || 12
                      return `${hours12}:${String(m).padStart(2, '0')} ${period}`
                    }
                    return (
                      <div key={day} className="flex flex-col items-center text-xs bg-white px-2 py-2 rounded border border-purple-200">
                        <span className="text-gray-900 font-medium mb-0.5">{day.substring(0, 3)}</span>
                        <span className="text-gray-600 text-xs">{convertTo12Hour(time)} - {convertTo12Hour(endTime24)}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">(9 hrs/day, incl. break)</p>
              </div>
            ) : interview.workSchedule.workStartTime && interview.workSchedule.workDays ? (
              <div>
                <div className="grid grid-cols-2 gap-1.5">
                  {interview.workSchedule.workDays.map((day: string) => {
                    const workStartTime = interview.workSchedule?.workStartTime || '09:00'
                    const [hours, minutes] = workStartTime.split(':').map(Number)
                    const endHour = (hours + 9) % 24
                    const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    const convertTo12Hour = (time24: string): string => {
                      const [h, m] = time24.split(':').map(Number)
                      const period = h >= 12 ? 'PM' : 'AM'
                      const hours12 = h % 12 || 12
                      return `${hours12}:${String(m).padStart(2, '0')} ${period}`
                    }
                    return (
                      <div key={day} className="flex flex-col items-center text-xs bg-white px-2 py-2 rounded border border-purple-200">
                        <span className="text-gray-900 font-medium mb-0.5">{day.substring(0, 3)}</span>
                        <span className="text-gray-600 text-xs">{convertTo12Hour(workStartTime)} - {convertTo12Hour(endTime24)}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">(9 hrs/day, incl. break)</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Not specified</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// REQUEST INTERVIEW MODAL
// ============================================================================

function RequestInterviewModal({ candidate, onClose, onSuccess }: { candidate: CandidateProfile; onClose: () => void; onSuccess: () => void }) {
  const router = useRouter()
  const [preferredTimes, setPreferredTimes] = useState<string[]>(['', ''])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [clientTimezone, setClientTimezone] = useState<string>('Australia/Brisbane')
  const [loadingTimezone, setLoadingTimezone] = useState(true)

  // Fetch client's timezone from their profile
  useEffect(() => {
    async function fetchClientTimezone() {
      try {
        setLoadingTimezone(true)
        const response = await fetch('/api/client/profile')
        const data = await response.json()
        if (data.profile?.timezone) {
          setClientTimezone(data.profile.timezone)
        }
      } catch (error) {
        console.error('Failed to fetch client timezone:', error)
      } finally {
        setLoadingTimezone(false)
      }
    }
    fetchClientTimezone()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Filter out empty times
    const times = preferredTimes.filter(t => t.trim() !== '')
    if (times.length === 0) {
      alert('Please provide at least one preferred time')
      return
    }

    try {
      setSubmitting(true)

      // Format times with timezone information
      const timesWithTimezone = times.map(time => ({
        datetime: time,
        timezone: clientTimezone,
        timezoneDisplay: getTimezoneDisplay()
      }))

      const response = await fetch('/api/client/interviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bpoc_candidate_id: candidate.id,
          preferred_times: timesWithTimezone,
          client_notes: notes,
          client_timezone: clientTimezone, // Send timezone separately too
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // Refresh interview status to show the newly created interview
        onSuccess()
        setTimeout(() => {
          router.push('/client/recruitment?tab=interviews')
        }, 2000)
      } else {
        alert('Failed to submit request: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper functions for time slot parsing and building
  function parseTimeSlot(time: string) {
    if (!time) return { date: '', hour: 9, minute: 0, ampm: 'AM' }
    const [datePart, timePart] = time.split('T')
    const [hourStr, minuteStr] = timePart.split(':')
    const hour24 = parseInt(hourStr)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    return { date: datePart, hour: hour12, minute: parseInt(minuteStr), ampm }
  }
  
  function buildTimeSlot(date: string, hour: number, minute: number, ampm: string) {
    let hour24 = hour
    if (ampm === 'PM' && hour !== 12) hour24 = hour + 12
    if (ampm === 'AM' && hour === 12) hour24 = 0
    
    const hourStr = hour24.toString().padStart(2, '0')
    const minStr = minute.toString().padStart(2, '0')
    return `${date}T${hourStr}:${minStr}`
  }

  function addTimeSlot() {
    setPreferredTimes([...preferredTimes, ''])
  }

  function removeTimeSlot(index: number) {
    setPreferredTimes(preferredTimes.filter((_, i) => i !== index))
  }

  function updateTimeSlot(index: number, value: string) {
    const updated = [...preferredTimes]
    updated[index] = value
    setPreferredTimes(updated)
  }

  // Get timezone display name
  function getTimezoneDisplay() {
    const tzMap: Record<string, string> = {
      'Australia/Sydney': 'Sydney Time (AEDT)',
      'Australia/Melbourne': 'Melbourne Time (AEDT)',
      'Australia/Brisbane': 'Brisbane Time (AEST)',
      'Australia/Adelaide': 'Adelaide Time (ACDT)',
      'Australia/Perth': 'Perth Time (AWST)',
      'America/New_York': 'Eastern Time (ET)',
      'America/Chicago': 'Central Time (CT)',
      'America/Denver': 'Mountain Time (MT)',
      'America/Los_Angeles': 'Pacific Time (PT)',
      'Pacific/Auckland': 'New Zealand Time (NZDT)',
    }
    return tzMap[clientTimezone] || clientTimezone
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            We'll review your interview request for {candidate.firstName} and get back to you shortly.
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Redirecting to your interviews...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {candidate.avatar ? (
              <img
                src={candidate.avatar}
                alt={candidate.firstName}
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center text-2xl font-bold">
                {candidate.firstName[0]}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-1">Request Interview</h2>
              <p className="text-white/90">with {candidate.firstName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-900 font-medium mb-1">Video Interview via Daily.co</p>
                <p className="text-blue-700">
                  Once approved, you'll receive a video call link. The interview will be recorded for quality assurance.
                </p>
              </div>
            </div>
          </div>

          {/* Preferred Times */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Preferred Interview Times
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Provide 2-3 time options that work for you. We'll check availability and confirm.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
              <p className="text-xs text-blue-900 font-medium flex items-center gap-2">
                🌍 Times in your timezone: 
                {loadingTimezone ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
                    <span className="text-blue-700">Loading timezone...</span>
                  </span>
                ) : (
                  <span className="font-bold">{getTimezoneDisplay()}</span>
                )}
              </p>
            </div>
            <div className="space-y-3">
              {preferredTimes.map((time, index) => {
                const parsed = parseTimeSlot(time)
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2">
                      {/* Date */}
                      <input
                        type="date"
                        value={parsed.date}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(e.target.value, parsed.hour, parsed.minute, parsed.ampm)
                          updateTimeSlot(index, newTime)
                        }}
                        className="flex-1 px-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      
                      {/* Hour */}
                      <select
                        value={parsed.hour}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parseInt(e.target.value), parsed.minute, parsed.ampm)
                          updateTimeSlot(index, newTime)
                        }}
                        className="w-20 px-2 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      
                      {/* Minute - 15 minute intervals */}
                      <select
                        value={parsed.minute}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parsed.hour, parseInt(e.target.value), parsed.ampm)
                          updateTimeSlot(index, newTime)
                        }}
                        className="w-20 px-2 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                      >
                        <option value="0">:00</option>
                        <option value="15">:15</option>
                        <option value="30">:30</option>
                        <option value="45">:45</option>
                      </select>
                      
                      {/* AM/PM */}
                      <select
                        value={parsed.ampm}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parsed.hour, parsed.minute, e.target.value)
                          updateTimeSlot(index, newTime)
                        }}
                        className="w-20 px-2 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>

                      {preferredTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {preferredTimes.length < 5 && (
              <button
                type="button"
                onClick={addTimeSlot}
                className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another time option
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Any specific requirements, questions, or focus areas for the interview..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-gray-900 bg-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 mt-2">
              This will be shared with our recruitment team to help prepare for the interview.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}





