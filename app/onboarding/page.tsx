"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ClipboardCheck, CheckCircle, Lock, PartyPopper, Calendar, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import ContractSigningPage from "@/app/contract/page"
import OnboardingForm from "./onboarding-form"

export default function OnboardingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("contract")
  const [contractSigned, setContractSigned] = useState(false)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    checkStatuses()
  }, [])

  async function checkStatuses() {
    try {
      const [contractRes, onboardingRes] = await Promise.all([
        fetch('/api/contract'),
        fetch('/api/onboarding/status')
      ])
      
      const contractData = await contractRes.json()
      const onboardingData = await onboardingRes.json()

      if (contractData.contract?.signed) {
        setContractSigned(true)
      }

      // Check if onboarding is complete
      if (onboardingData.isComplete) {
        setOnboardingComplete(true)
        setStartDate(contractData.contract?.startDate || null)
        setCompanyName(contractData.contract?.company?.companyName || contractData.contract?.companyName || null)
      } else if (contractData.contract?.signed) {
        setActiveTab("onboarding")
      }
    } catch (error) {
      console.error('Error checking statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContractSigned = () => {
    setContractSigned(true)
    setActiveTab("onboarding")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Show completion screen if onboarding is complete
  if (onboardingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="max-w-4xl mx-auto w-full">
          <Card className="bg-gradient-to-br from-emerald-900/40 via-slate-800/40 to-blue-900/40 border-emerald-500/30 backdrop-blur-xl shadow-2xl shadow-emerald-500/20">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <PartyPopper className="h-24 w-24 text-emerald-400 animate-bounce" />
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle className="h-12 w-12 text-green-400 animate-pulse" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400">
                  Onboarding Complete! 🎉
                </h1>
                <p className="text-2xl text-slate-300 font-semibold">
                  All Set & Verified!
                </p>
              </div>

              <div className="bg-slate-900/60 rounded-xl p-6 border border-emerald-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 text-left">
                    <Shield className="h-8 w-8 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-400">Status</p>
                      <p className="text-lg font-bold text-emerald-400">✅ Verified & Approved</p>
                    </div>
                  </div>
                  
                  {startDate && (
                    <div className="flex items-center gap-3 text-left">
                      <Calendar className="h-8 w-8 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-400">Start Date</p>
                        <p className="text-lg font-bold text-blue-400">{new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                  )}

                  {companyName && (
                    <div className="flex items-center gap-3 text-left md:col-span-2">
                      <FileText className="h-8 w-8 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-400">Joining</p>
                        <p className="text-lg font-bold text-purple-400">{companyName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-slate-300 text-lg">
                  Your onboarding is complete! We'll notify you closer to your start date with next steps.
                </p>
                <p className="text-slate-400 text-sm">
                  In the meantime, feel free to explore your dashboard and get familiar with the platform.
                </p>
              </div>

              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 text-lg font-bold rounded-xl shadow-lg shadow-emerald-500/30"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3 text-lg font-bold rounded-xl"
                >
                  View My Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center mb-8 mt-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to ShoreAgents! <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h1>
          <p className="text-slate-300 mb-4">
            {contractSigned 
              ? "Complete your onboarding to get started" 
              : "Review and sign your employment contract to begin"}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-slate-800 border border-slate-700">
            <TabsTrigger 
              value="contract" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              1. Contract
              {contractSigned && <CheckCircle className="h-4 w-4 ml-2 text-green-400" />}
            </TabsTrigger>
            <TabsTrigger 
              value="onboarding"
              disabled={!contractSigned}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {contractSigned ? (
                <>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  2. Onboarding
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  2. Onboarding
                </>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Contract Tab */}
          <TabsContent value="contract" className="mt-6">
            {!contractSigned && (
              <Alert className="mb-6 bg-blue-900/30 border-blue-700 text-blue-200">
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Step 1 of 2:</strong> Please review and sign your employment contract below. 
                  Once signed, you'll be able to proceed to the onboarding form.
                </AlertDescription>
              </Alert>
            )}
            <ContractSigningPage onContractSigned={handleContractSigned} />
          </TabsContent>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="mt-6">
            {contractSigned ? (
              <OnboardingForm />
            ) : (
              <Alert className="bg-slate-800 border-slate-700 text-slate-300">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Complete the contract signing first to unlock the onboarding form.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
