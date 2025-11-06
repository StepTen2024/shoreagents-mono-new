"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ClipboardCheck, CheckCircle, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ContractSigningPage from "@/app/contract/page"
import OnboardingForm from "./onboarding-form"

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState("contract")
  const [contractSigned, setContractSigned] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkContractStatus()
  }, [])

  async function checkContractStatus() {
    try {
      const response = await fetch('/api/contract')
      const data = await response.json()

      if (data.contract?.signed) {
        setContractSigned(true)
        setActiveTab("onboarding") // Auto-switch to onboarding if contract is signed
      }
    } catch (error) {
      console.error('Error checking contract status:', error)
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

