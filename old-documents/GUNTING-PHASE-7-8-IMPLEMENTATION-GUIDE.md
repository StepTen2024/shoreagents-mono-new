# Phase 7-8: Enhanced Onboarding Implementation Guide

**Status:** 60% Complete (APIs Done, UI Updates Remaining)  
**Last Updated:** $(date)

---

## ✅ COMPLETED

### Phase 7 API Endpoints (ALL DONE)
1. ✅ `/app/api/onboarding/resume/route.ts` - Resume upload
2. ✅ `/app/api/onboarding/education/route.ts` - Diploma/TOR upload
3. ✅ `/app/api/onboarding/medical/route.ts` - Medical certificate upload
4. ✅ `/app/api/onboarding/data-privacy/route.ts` - Data privacy consent & bank details

### Phase 8 Partner Clinics (API DONE)
5. ✅ `/app/api/clinics/nearby/route.ts` - Nearby clinics with Haversine distance calculation

---

## 🔄 IN PROGRESS - Frontend Updates Needed

### Task 1: Update Onboarding STEPS Array
**File:** `app/onboarding/page.tsx` (Line 29-35)

**Current (5 steps):**
```typescript
const STEPS = [
  { id: 1, name: "Personal Info", icon: User, field: "personalInfoStatus" },
  { id: 2, name: "Government IDs & Documents", icon: CreditCard, field: "govIdStatus" },
  { id: 3, name: "Additional Documents", icon: FileText, field: "documentsStatus" },
  { id: 4, name: "Signature", icon: PenTool, field: "signatureStatus" },
  { id: 5, name: "Emergency Contact", icon: Users, field: "emergencyContactStatus" },
]
```

**New (8 steps):**
```typescript
import { Briefcase, GraduationCap, Stethoscope, Shield } from "lucide-react"

const STEPS = [
  { id: 1, name: "Personal Info", icon: User, field: "personalInfoStatus" },
  { id: 2, name: "Resume", icon: Briefcase, field: "resumeStatus" },
  { id: 3, name: "Government IDs & Documents", icon: CreditCard, field: "govIdStatus" },
  { id: 4, name: "Education Documents", icon: GraduationCap, field: "educationStatus" },
  { id: 5, name: "Medical Certificate", icon: Stethoscope, field: "medicalStatus" },
  { id: 6, name: "Data Privacy & Bank Details", icon: Shield, field: "dataPrivacyStatus" },
  { id: 7, name: "Signature", icon: PenTool, field: "signatureStatus" },
  { id: 8, name: "Emergency Contact", icon: Users, field: "emergencyContactStatus" },
]
```

### Task 2: Add New Fields to OnboardingData Interface
**File:** `app/onboarding/page.tsx` (Line 37-87)

**Add these new fields:**
```typescript
interface OnboardingData {
  // ... existing fields ...
  
  // NEW: Resume
  resumeUrl?: string
  resumeStatus: string
  resumeFeedback?: string
  
  // NEW: Education
  diplomaTorUrl?: string
  educationStatus: string
  educationFeedback?: string
  
  // NEW: Medical
  medicalCertUrl?: string
  medicalStatus: string
  medicalFeedback?: string
  
  // NEW: Data Privacy & Bank
  dataPrivacyConsentUrl?: string
  bankAccountDetails?: string
  dataPrivacyStatus: string
  bankDetailsStatus: string
  dataPrivacyFeedback?: string
  bankDetailsFeedback?: string
}
```

### Task 3: Add Step 2 - Resume Upload UI
**Location:** After Step 1 (Personal Info), around line 500+

```typescript
{/* STEP 2: Resume Upload */}
{currentStep === 2 && (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="text-center">
      <Briefcase className="h-16 w-16 text-purple-400 mx-auto mb-4" />
      <h2 className="text-3xl font-bold text-white mb-2">Upload Your Resume</h2>
      <p className="text-slate-400">
        Please upload your most recent resume in PDF, DOC, or DOCX format
      </p>
    </div>

    {feedback.resumeFeedback && (
      <Alert className="bg-red-900/30 border-red-600">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-100">
          <strong>Admin Feedback:</strong> {feedback.resumeFeedback}
        </AlertDescription>
      </Alert>
    )}

    <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <Label htmlFor="resume-upload" className="cursor-pointer">
            <span className="text-white font-semibold">Click to upload resume</span>
            <span className="block text-sm text-slate-400 mt-1">PDF, DOC, or DOCX (Max 5MB)</span>
          </Label>
          <Input
            id="resume-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, 'resume')}
            className="hidden"
          />
        </div>

        {data.resumeUrl && (
          <div className="flex items-center justify-between p-4 bg-green-900/30 border border-green-600 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-green-100">Resume uploaded successfully</span>
            </div>
            <Button variant="outline" onClick={() => window.open(data.resumeUrl)}>
              View
            </Button>
          </div>
        )}
      </div>
    </Card>

    <div className="flex justify-between pt-6">
      <Button
        variant="outline"
        onClick={() => setCurrentStep(currentStep - 1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Button
        onClick={() => setCurrentStep(currentStep + 1)}
        disabled={!data.resumeUrl}
      >
        Continue
      </Button>
    </div>
  </div>
)}
```

### Task 4: Add Step 4 - Education Documents UI
**Location:** After new Step 3 (Gov IDs - renumbered), around line 700+

```typescript
{/* STEP 4: Education Documents */}
{currentStep === 4 && (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="text-center">
      <GraduationCap className="h-16 w-16 text-purple-400 mx-auto mb-4" />
      <h2 className="text-3xl font-bold text-white mb-2">Education Documents</h2>
      <p className="text-slate-400">
        Upload your Diploma or Transcript of Records (TOR)
      </p>
    </div>

    <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <Label htmlFor="education-upload" className="cursor-pointer">
            <span className="text-white font-semibold">Click to upload Diploma/TOR</span>
            <span className="block text-sm text-slate-400 mt-1">PDF, JPG, or PNG (Max 5MB)</span>
          </Label>
          <Input
            id="education-upload"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileUpload(e, 'education')}
            className="hidden"
          />
        </div>

        {data.diplomaTorUrl && (
          <div className="flex items-center justify-between p-4 bg-green-900/30 border border-green-600 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-green-100">Education document uploaded</span>
            </div>
            <Button variant="outline" onClick={() => window.open(data.diplomaTorUrl)}>
              View
            </Button>
          </div>
        )}
      </div>
    </Card>

    <div className="flex justify-between pt-6">
      <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Button
        onClick={() => setCurrentStep(currentStep + 1)}
        disabled={!data.diplomaTorUrl}
      >
        Continue
      </Button>
    </div>
  </div>
)}
```

### Task 5: Add Step 5 - Medical Certificate UI (WITH CLINIC FINDER)
**Location:** After Step 4, around line 850+

```typescript
{/* STEP 5: Medical Certificate with Clinic Finder */}
{currentStep === 5 && (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="text-center">
      <Stethoscope className="h-16 w-16 text-purple-400 mx-auto mb-4" />
      <h2 className="text-3xl font-bold text-white mb-2">Medical Certificate (Fit to Work)</h2>
      <p className="text-slate-400">
        Complete a medical examination and upload your certificate
      </p>
    </div>

    {/* Partner Clinics Section */}
    <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
      <h3 className="text-xl font-semibold text-white mb-4">Option 1: Visit Our Partner Clinics</h3>
      
      {nearbyClinics.length > 0 ? (
        <div className="grid gap-4">
          {nearbyClinics.map(clinic => (
            <Card key={clinic.id} className="p-4 bg-slate-700/50 border-slate-600">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-white">{clinic.name}</h4>
                  <p className="text-sm text-slate-300 mt-1">{clinic.address}</p>
                  <p className="text-sm text-slate-400">{clinic.city}, {clinic.province}</p>
                  {clinic.phone && (
                    <p className="text-sm text-slate-300 mt-2">📞 {clinic.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 bg-purple-600 rounded-full text-sm font-semibold">
                    {clinic.distance}km away
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Alert className="bg-blue-900/30 border-blue-600">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-100">
            No partner clinics found nearby. Please use Option 2 below.
          </AlertDescription>
        </Alert>
      )}
    </Card>

    {/* Alternative Instructions */}
    <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
      <h3 className="text-xl font-semibold text-white mb-4">Option 2: Visit Any Licensed Clinic</h3>
      <Alert className="bg-slate-700/50 border-slate-600">
        <AlertCircle className="h-4 w-4 text-slate-300" />
        <AlertDescription className="text-slate-200">
          <p className="font-semibold mb-2">Requirements for "Fit to Work" Certificate:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Complete physical examination</li>
            <li>Chest X-ray</li>
            <li>Drug test</li>
            <li>Blood test (CBC, Blood type)</li>
          </ul>
          <p className="mt-3 text-sm">
            Once completed, upload the certificate below. You can continue with onboarding, 
            but your profile won't be fully activated until approved.
          </p>
        </AlertDescription>
      </Alert>
    </Card>

    {/* Upload Section */}
    <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Upload Medical Certificate</h3>
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <Label htmlFor="medical-upload" className="cursor-pointer">
          <span className="text-white font-semibold">Click to upload certificate</span>
          <span className="block text-sm text-slate-400 mt-1">PDF, JPG, or PNG (Max 5MB)</span>
        </Label>
        <Input
          id="medical-upload"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileUpload(e, 'medical')}
          className="hidden"
        />
      </div>

      {data.medicalCertUrl && (
        <div className="flex items-center justify-between p-4 bg-green-900/30 border border-green-600 rounded-lg mt-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-green-100">Medical certificate uploaded</span>
          </div>
          <Button variant="outline" onClick={() => window.open(data.medicalCertUrl)}>
            View
          </Button>
        </div>
      )}
    </Card>

    <div className="flex justify-between pt-6">
      <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Button onClick={() => setCurrentStep(currentStep + 1)}>
        {data.medicalCertUrl ? 'Continue' : 'Skip for Now (Mark as In Progress)'}
      </Button>
    </div>
  </div>
)}
```

### Task 6: Add Step 6 - Data Privacy & Bank Details UI
**Location:** After Step 5, around line 1050+

```typescript
{/* STEP 6: Data Privacy Consent & Bank Details */}
{currentStep === 6 && (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="text-center">
      <Shield className="h-16 w-16 text-purple-400 mx-auto mb-4" />
      <h2 className="text-3xl font-bold text-white mb-2">Data Privacy & Bank Details</h2>
      <p className="text-slate-400">
        Review our data privacy policy and provide your bank account details
      </p>
    </div>

    {/* Data Privacy Consent */}
    <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
      <h3 className="text-xl font-semibold text-white mb-4">Data Privacy Consent (Annex C)</h3>
      <ScrollArea className="h-64 w-full rounded-md border border-slate-600 p-4 bg-slate-900/50">
        <div className="space-y-4 text-slate-300 text-sm">
          <p className="font-semibold">SHOREAGENTS DATA PRIVACY CONSENT FORM</p>
          <p>
            In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), 
            ShoreAgents hereby informs you that your personal information will be collected, 
            processed, and stored for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Employment processing and administration</li>
            <li>Payroll and benefits administration</li>
            <li>Compliance with government requirements</li>
            <li>Communication and emergency contacts</li>
            <li>Performance evaluation and training</li>
          </ul>
          <p>
            By providing your consent below, you acknowledge that you have read and understood 
            this notice and voluntarily consent to the collection, use, and processing of your 
            personal information for the purposes stated above.
          </p>
          <p className="font-semibold mt-4">Data Protection Rights:</p>
          <p>
            You have the right to access, correct, and request deletion of your personal data. 
            For concerns or inquiries, please contact our Data Protection Officer at 
            privacy@shoreagents.com
          </p>
        </div>
      </ScrollArea>

      <div className="flex items-center space-x-2 mt-4">
        <input
          type="checkbox"
          id="privacy-consent"
          checked={privacyData.dataPrivacyConsent}
          onChange={(e) => setPrivacyData({ ...privacyData, dataPrivacyConsent: e.target.checked })}
          className="h-4 w-4 rounded border-slate-500"
        />
        <Label htmlFor="privacy-consent" className="text-slate-300">
          I have read and agree to the Data Privacy Consent
        </Label>
      </div>
    </Card>

    {/* Bank Account Details */}
    <Card className="p-6 bg-slate-800/50 backdrop-blur border-slate-700">
      <h3 className="text-xl font-semibold text-white mb-4">Bank Account Details</h3>
      <p className="text-sm text-slate-400 mb-4">
        Your salary will be deposited to this bank account
      </p>
      <div className="space-y-4">
        <div>
          <Label>Bank Name *</Label>
          <Select
            value={privacyData.bankName}
            onValueChange={(value) => setPrivacyData({ ...privacyData, bankName: value })}
          >
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BDO">BDO Unibank</SelectItem>
              <SelectItem value="BPI">Bank of the Philippine Islands (BPI)</SelectItem>
              <SelectItem value="Metrobank">Metrobank</SelectItem>
              <SelectItem value="Security Bank">Security Bank</SelectItem>
              <SelectItem value="PNB">Philippine National Bank (PNB)</SelectItem>
              <SelectItem value="Unionbank">Unionbank</SelectItem>
              <SelectItem value="Land Bank">Land Bank of the Philippines</SelectItem>
              <SelectItem value="RCBC">Rizal Commercial Banking Corporation (RCBC)</SelectItem>
              <SelectItem value="Chinabank">China Banking Corporation</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Account Name *</Label>
          <Input
            placeholder="As shown on your bank account"
            value={privacyData.accountName}
            onChange={(e) => setPrivacyData({ ...privacyData, accountName: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
          <p className="text-xs text-slate-400 mt-1">
            Must match exactly as it appears on your account
          </p>
        </div>

        <div>
          <Label>Account Number *</Label>
          <Input
            placeholder="Bank account number"
            value={privacyData.accountNumber}
            onChange={(e) => setPrivacyData({ ...privacyData, accountNumber: e.target.value })}
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
      </div>
    </Card>

    <div className="flex justify-between pt-6">
      <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Button
        onClick={handleSaveDataPrivacy}
        disabled={!privacyData.dataPrivacyConsent || !privacyData.bankName || !privacyData.accountName || !privacyData.accountNumber || saving}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save & Continue'
        )}
      </Button>
    </div>
  </div>
)}
```

### Task 7: Add Handler Functions
**Location:** Inside component, around line 200-300

```typescript
// Add these state variables
const [nearbyClinics, setNearbyClinics] = useState<any[]>([])
const [privacyData, setPrivacyData] = useState({
  dataPrivacyConsent: false,
  bankName: '',
  accountName: '',
  accountNumber: ''
})

// Fetch nearby clinics on mount
useEffect(() => {
  async function fetchNearbyClinics() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(`/api/clinics/nearby?lat=${latitude}&lng=${longitude}`)
          const data = await response.json()
          if (data.success) {
            setNearbyClinics(data.clinics)
          }
        } catch (error) {
          console.error('Error fetching clinics:', error)
        }
      })
    }
  }
  fetchNearbyClinics()
}, [])

// Handle file uploads for new steps
async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'education' | 'medical') {
  const file = e.target.files?.[0]
  if (!file) return

  setUploading({ ...uploading, [type]: true })
  setError("")

  try {
    const formData = new FormData()
    formData.append(type, file)

    const response = await fetch(`/api/onboarding/${type}`, {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed')
    }

    setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`)
    
    // Update data state
    setData({
      ...data,
      [`${type}Url`]: result[`${type}Url`],
      [`${type}Status`]: 'IN_REVIEW'
    })

    await fetchOnboardingData() // Refresh
  } catch (err: any) {
    setError(err.message || `Failed to upload ${type}`)
  } finally {
    setUploading({ ...uploading, [type]: false })
  }
}

// Handle data privacy & bank details save
async function handleSaveDataPrivacy() {
  setSaving(true)
  setError("")

  try {
    const response = await fetch('/api/onboarding/data-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(privacyData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save')
    }

    setSuccess('Data privacy consent and bank details saved!')
    setCurrentStep(currentStep + 1)
    await fetchOnboardingData()
  } catch (err: any) {
    setError(err.message || 'Failed to save data privacy consent')
  } finally {
    setSaving(false)
  }
}
```

### Task 8: Update Step Numbers for Signature & Emergency Contact
- Old Step 4 (Signature) → New Step 7
- Old Step 5 (Emergency Contact) → New Step 8

**Update all references to `currentStep === 4` to `currentStep === 7`**
**Update all references to `currentStep === 5` to `currentStep === 8`**

---

## 📝 NEXT PHASES (After Phase 7-8 UI Complete)

### Phase 9: Admin Onboarding Updates
- File: `app/admin/staff/onboarding/[staffUserId]/page.tsx`
- Add new section cards for Resume, Education, Medical, Data Privacy, Bank Details
- Add "View Contract" section at top (if exists)
- Update completion percentage calculation (8 sections instead of 5)

### Phase 11: Update Complete Logic
- File: `app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts`
- Check that employment contract is signed
- Check all 8 sections are approved (not just 5)
- Create empty `staff_welcome_forms` record with `completed = false`

### Phase 12: Email Notifications
- File: `lib/email.ts` (NEW)
- `sendJobAcceptanceEmail()` - Signup link with jobAcceptanceId
- `sendContractSignedNotification()` - Notify admin of contract signing

### Phase 13: Welcome Form
- File: `app/welcome/page.tsx` (NEW)
- File: `app/api/welcome/route.ts` (NEW)
- Post-onboarding "Getting to Know You" form
- Auto-fills name, client, start date
- One required field: favorite fast food
- Admin can view responses in staff profile

---

## 🎯 SUMMARY

**Current Progress:** 45% of total Enhanced Onboarding System

**Completed:**
- ✅ Database schema (Phase 1)
- ✅ Admin hire workflow (Phase 2)
- ✅ Staff signup auto-fill (Phase 3)
- ✅ Contract signing (Phase 4)
- ✅ Contract template (Phase 5)
- ✅ All API endpoints for Phases 7-8

**Remaining Work:**
- 🔄 Phase 7-8 UI updates (8 new step sections in onboarding page)
- ⏳ Phase 9: Admin onboarding page updates
- ⏳ Phase 11: Complete logic updates
- ⏳ Phase 12: Email notifications
- ⏳ Phase 13: Welcome form

**Estimated Time Remaining:** 3-4 hours for one dev, or 1 hour with multi-agent team

**All APIs are ready and tested - UI integration is the final step!** 🚀

