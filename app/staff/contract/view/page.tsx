"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Loader2, 
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  MapPin
} from "lucide-react"

interface ContractData {
  id: string
  staffUserId: string
  contractHtml: string
  signatureUrl: string
  contractSigned: boolean
  signedAt: string
  createdAt: string
  employeeName: string
  employeeAddress: string
  position: string
  startDate: string
  workSchedule: string
  basicSalary: number
  deMinimis: number
  totalMonthlyGross: number
  staffEmail?: string
  staffPhone?: string
  staffLocation?: string
  company: {
    companyName: string
  }
}

export default function StaffContractViewPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [contract, setContract] = useState<ContractData | null>(null)

  useEffect(() => {
    fetchContract()
  }, [])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contract`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch contract")
      }
      
      const data = await response.json()
      console.log('📋 [CONTRACT VIEW] Full contract data:', data.contract)
      console.log('📧 [CONTRACT VIEW] Email:', data.contract.staffEmail)
      console.log('📱 [CONTRACT VIEW] Phone:', data.contract.staffPhone)
      console.log('📍 [CONTRACT VIEW] Address:', data.contract.employeeAddress)
      setContract(data.contract)
    } catch (err) {
      setError("Failed to load contract details")
      console.error("Contract fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    alert("PDF download functionality will be implemented soon!")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <span className="text-slate-300">Loading contract...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Alert className="max-w-md">
              <AlertDescription className="text-red-600">
                {error || "Contract not found"}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">My Employment Contract</h1>
              <p className="text-slate-400">Contract ID: {contract.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Contact Details - HIGHLIGHTED */}
        <Card className="mb-6 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-xl">
              <User className="h-6 w-6 text-purple-400" />
              Your Contact Details
            </CardTitle>
            <CardDescription className="text-purple-200">
              Keep these details up to date for contract and payroll purposes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </p>
                <p className="text-white font-semibold">{contract.staffEmail || 'Not provided'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </p>
                <p className="text-white font-semibold">{contract.staffPhone || 'Not provided'}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </p>
                <p className="text-white font-semibold">{contract.employeeAddress || 'Not provided'}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                ℹ️ Need to update your contact details? Go to your <a href="/profile" className="underline font-semibold">Profile Settings</a> or contact HR.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400">Company</p>
                <p className="text-white flex items-center gap-2 font-semibold">
                  <Building className="h-4 w-4" />
                  {contract.company.companyName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Position</p>
                <p className="text-white font-semibold">{contract.position}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Start Date</p>
                <p className="text-white flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4" />
                  {new Date(contract.startDate).toLocaleDateString()}
                </p>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-slate-400">Work Schedule</p>
                <p className="text-white font-semibold">{contract.workSchedule}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Basic Salary</p>
                <p className="text-white font-semibold">₱{contract.basicSalary.toLocaleString()}/month</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">De Minimis</p>
                <p className="text-white font-semibold">₱{contract.deMinimis.toLocaleString()}/month</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Salary (Including De Minimis)</p>
                <p className="text-white font-semibold text-lg text-green-400">
                  ₱{contract.totalMonthlyGross.toLocaleString()}/month
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <Badge 
                  variant={contract.contractSigned ? "default" : "secondary"}
                  className={contract.contractSigned ? "bg-green-600" : "bg-yellow-600"}
                >
                  {contract.contractSigned ? "Signed" : "Pending Signature"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400">Signed Date</p>
                <p className="text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {contract.contractSigned ? new Date(contract.signedAt).toLocaleDateString() : "Not signed yet"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Created Date</p>
                <p className="text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(contract.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Content */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Contract Content</CardTitle>
            <CardDescription className="text-slate-400">
              Your employment contract details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 rounded-lg">
              <div 
                dangerouslySetInnerHTML={{ __html: contract.contractHtml }}
                className="prose max-w-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        {contract.contractSigned && contract.signatureUrl && (
          <Card className="mb-6 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your Digital Signature</CardTitle>
              <CardDescription className="text-slate-400">
                Your digital signature on this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={contract.signatureUrl} 
                  alt="Your Digital Signature"
                  className="max-w-md mx-auto border border-gray-300 rounded"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
