"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { FileText, CheckCircle, AlertCircle, Pen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { generateContractHTML, contractSections } from "@/lib/contract-template"

interface ContractData {
  id: string
  employeeName: string
  employeeAddress: string
  contactType: string
  position: string
  assignedClient: string
  startDate: string
  work_schedules: string
  basicSalary: number
  deMinimis: number
  totalMonthlyGross: number
  hmoOffer: string
  paidLeave: string
  probationaryPeriod: string
  signed: boolean
  company?: {
    companyName: string
  }
}

interface ContractSigningPageProps {
  onContractSigned?: () => void
}

export default function ContractSigningPage({ onContractSigned }: ContractSigningPageProps = {}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sectionsChecked, setSectionsChecked] = useState<boolean[]>(
    new Array(contractSections.length).fill(false)
  )
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState("")
  const [contractHTML, setContractHTML] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [])

  async function fetchContract() {
    try {
      const response = await fetch('/api/contract')
      const data = await response.json()

      if (data.error) {
        // No contract needed or already signed - redirect to onboarding
        if (data.error === 'No contract found' || data.error === 'Contract already signed') {
          router.push('/onboarding')
        } else {
          setError(data.error)
        }
        return
      }

      setContract(data.contract)
      // Generate HTML for contract
      const html = generateContractHTML(data.contract)
      setContractHTML(html)
    } catch (error) {
      console.error('Error fetching contract:', error)
      setError('Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (index: number) => {
    const newChecked = [...sectionsChecked]
    newChecked[index] = !newChecked[index]
    setSectionsChecked(newChecked)
  }

  const allSectionsChecked = sectionsChecked.every(checked => checked)
  const checkedCount = sectionsChecked.filter(c => c).length
  const progress = (checkedCount / contractSections.length) * 100

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()

    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSubmitSignature = async () => {
    if (!hasSignature) {
      setError("Please provide your signature")
      return
    }

    setSigning(true)
    setError("")

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas not found")

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png')
      })

      // Create form data
      const formData = new FormData()
      formData.append('signature', blob, 'signature.png')

      const response = await fetch('/api/contract/sign', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit signature')
      }

      // Success - call callback if provided or redirect to onboarding
      if (onContractSigned) {
        onContractSigned()
      } else {
        router.push('/onboarding')
      }
    } catch (err: any) {
      console.error('Error submitting signature:', err)
      setError(err.message || 'Failed to submit signature')
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900">
        <div className="text-white text-lg">Loading your employment contract...</div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 p-4">
        <Card className="max-w-md p-6 bg-slate-800/50 backdrop-blur border-slate-700">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white text-center mb-2">Error Loading Contract</h2>
          <p className="text-slate-300 text-center mb-4">{error}</p>
          <Button onClick={() => router.push('/staff')} className="w-full">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (!contract) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Employment Contract</h1>
              <p className="text-slate-300">Please review and sign your employment contract</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">
                Progress: {checkedCount} of {contractSections.length} sections reviewed
              </span>
              <span className="text-sm text-slate-300">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>

        {/* Contract Content - Scrollable HTML */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
          <div 
            className="max-h-[60vh] overflow-y-auto pr-2"
            dangerouslySetInnerHTML={{ __html: contractHTML }}
          />
          
          {/* Section Checkboxes */}
          <div className="mt-8 space-y-4 border-t border-slate-600 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Your Understanding</h3>
            {contractSections.map((section, index) => (
              <div key={section.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-700/30">
                <Checkbox 
                  id={`section-${index}`}
                  checked={sectionsChecked[index]}
                  onCheckedChange={() => toggleSection(index)}
                  className="mt-1"
                />
                <Label 
                  htmlFor={`section-${index}`}
                  className="text-slate-300 cursor-pointer flex-1"
                >
                  <div className="font-semibold text-white mb-1">Section {section.id}: {section.title}</div>
                  <div className="text-sm text-slate-400">{section.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </Card>

        {/* Signature Section */}
        {allSectionsChecked && (
          <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Pen className="h-6 w-6 text-indigo-400" />
                <div>
                  <h3 className="text-xl font-semibold text-white">Your Signature</h3>
                  <p className="text-slate-300 text-sm">Draw your signature in the box below</p>
                </div>
              </div>

              <div className="border-2 border-slate-600 rounded-lg bg-white">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={200}
                  className="w-full h-[200px] cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>

              {error && (
                <Alert className="bg-red-900/30 border-red-600">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-100">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  disabled={signing}
                  className="flex-1"
                >
                  Clear Signature
                </Button>
                <Button
                  onClick={handleSubmitSignature}
                  disabled={!hasSignature || signing}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {signing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Sign Contract & Continue
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                By signing this contract, you confirm that you have read, understood, and agree 
                to all terms and conditions outlined above.
              </p>
            </div>
          </Card>
        )}

        {!allSectionsChecked && (
          <Card className="p-4 bg-blue-900/30 border-blue-600">
            <Alert>
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                Please review and check all {contractSections.length} sections before you can sign the contract.
              </AlertDescription>
            </Alert>
          </Card>
        )}
      </div>
    </div>
  )
}

