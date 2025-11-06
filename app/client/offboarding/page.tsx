"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, AlertCircle, CheckCircle2, UserMinus } from "lucide-react"
import Link from "next/link"

export default function ClientOffboardingPage() {
  const [loading, setLoading] = useState(true)
  const [offboardings, setOffboardings] = useState<any[]>([])

  useEffect(() => {
    fetchOffboardings()
  }, [])

  async function fetchOffboardings() {
    try {
      const response = await fetch("/api/client/offboarding")
      const data = await response.json()
      setOffboardings(data.offboardings || [])
      setLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      INITIATED: { variant: "secondary", label: "Initiated" },
      PENDING_EXIT: { variant: "warning", label: "Pending Exit Form" },
      PROCESSING: { variant: "default", label: "Processing" },
      COMPLETED: { variant: "success", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" }
    }
    const config = variants[status] || variants.INITIATED
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-10 w-64 bg-linear-to-r from-blue-200 to-purple-200 rounded-lg animate-pulse" />
            <div className="h-6 w-96 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-linear-to-br from-slate-200 to-slate-300 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-7 w-48 bg-linear-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
                        <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="h-20 rounded-xl bg-slate-200 animate-pulse" />
                      <div className="h-20 rounded-xl bg-slate-200 animate-pulse" />
                      <div className="h-20 rounded-xl bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2 ml-6 shrink-0">
                    <div className="h-8 w-36 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="h-8 w-36 rounded-xl bg-slate-200 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Staff Offboarding
          </h1>
          <p className="text-slate-600">View offboarding processes for your company staff</p>
        </div>
      </div>

      {offboardings.length === 0 ? (
        <Card className="border-2 border-dashed bg-white/80 backdrop-blur-sm border-purple-200">
          <CardContent className="p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <UserMinus className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Offboarding Records</h3>
            <p className="text-slate-600">
              No staff members are currently in the offboarding process
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {offboardings.map((offboarding) => (
            <Card 
              key={offboarding.id}
              className="group hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-none shadow-lg hover:shadow-blue-500/10"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-white/50 shadow-lg">
                        <AvatarImage src={offboarding.staffUser.avatar || undefined} alt={offboarding.staffUser.name} />
                        <AvatarFallback className="bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-bold text-lg">
                          {offboarding.staffUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {offboarding.staffUser.name}
                        </h3>
                        {getStatusBadge(offboarding.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-br from-blue-500/10 to-blue-600/20 border border-blue-200/30 backdrop-blur-sm">
                        <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Reason</p>
                          <p className="text-sm font-bold text-slate-800">{offboarding.reason.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-br from-purple-500/10 to-purple-600/20 border border-purple-200/30 backdrop-blur-sm">
                        <div className="h-10 w-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Last Working Day</p>
                          <p className="text-sm font-bold text-slate-800">
                            {new Date(offboarding.lastWorkingDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-br from-amber-500/10 to-orange-600/20 border border-amber-200/30 backdrop-blur-sm">
                        <div className="h-10 w-10 rounded-full bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-md">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Exit Form</p>
                          <p className={`text-sm font-bold ${offboarding.exitInterviewCompleted ? 'text-green-700' : 'text-amber-700'}`}>
                            {offboarding.exitInterviewCompleted ? '✅ Completed' : '⏳ Pending'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {offboarding.equipmentReturned || offboarding.accessRevoked || offboarding.finalPaymentProcessed ? (
                      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-slate-200 bg-linear-to-r from-blue-50/40 via-purple-50/40 to-pink-50/40 -mx-6 px-6 pb-2">
                        {offboarding.equipmentReturned && (
                          <Badge className="bg-linear-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md px-4 py-1.5 font-semibold">
                            Equipment Returned
                          </Badge>
                        )}
                        {offboarding.accessRevoked && (
                          <Badge className="bg-linear-to-r from-red-500 to-rose-600 text-white border-0 shadow-md px-4 py-1.5 font-semibold">
                            Access Revoked
                          </Badge>
                        )}
                        {offboarding.finalPaymentProcessed && (
                          <Badge className="bg-linear-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md px-4 py-1.5 font-semibold">
                            Payment Processed
                          </Badge>
                        )}
                      </div>
                    ) : null}
                  </div>
                  
                  <div className="text-right text-sm space-y-2 ml-6 shrink-0">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-300/30 text-slate-700 font-semibold shadow-sm backdrop-blur-sm">
                      <span className="text-xs">Initiated:</span>
                      <span>{new Date(offboarding.createdAt).toLocaleDateString()}</span>
                    </div>
                    {offboarding.completedAt && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-300/30 text-green-700 font-semibold shadow-sm backdrop-blur-sm">
                        <span className="text-xs">Completed:</span>
                        <span>{new Date(offboarding.completedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
