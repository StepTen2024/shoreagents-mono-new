# 🚨 URGENT: COMPLETE ENHANCED ONBOARDING - FINAL 30%

**STATUS:** 70% DONE - NEED TO FINISH NOW!  
**ALL BACKEND APIS:** ✅ COMPLETE  
**REMAINING:** Frontend UI updates only

---

## 📊 WHAT'S DONE (70%)

### ✅ COMPLETE
1. Database schema (all 4 new models)
2. Admin hire workflow (API + UI)
3. Staff signup auto-fill
4. Contract signing (full working)
5. Contract template generator
6. **ALL 5 NEW API ENDPOINTS:**
   - `/api/onboarding/resume` ✅
   - `/api/onboarding/education` ✅
   - `/api/onboarding/medical` ✅
   - `/api/onboarding/data-privacy` ✅
   - `/api/clinics/nearby` ✅

---

## 🔥 WHAT NEEDS DOING NOW (30%)

### Priority 1: Update Onboarding STEPS (5 min)
**File:** `app/onboarding/page.tsx` Line 14-27

**ADD NEW IMPORTS:**
```typescript
import { Briefcase, GraduationCap, Stethoscope, Shield } from "lucide-react"
```

**REPLACE STEPS array (Line 29-35):**
```typescript
const STEPS = [
  { id: 1, name: "Personal Info", icon: User, field: "personalInfoStatus" },
  { id: 2, name: "Resume", icon: Briefcase, field: "resumeStatus" },
  { id: 3, name: "Government IDs & Documents", icon: CreditCard, field: "govIdStatus" },
  { id: 4, name: "Education Documents", icon: GraduationCap, field: "educationStatus" },
  { id: 5, name: "Medical Certificate", icon: Stethoscope, field: "medicalStatus" },
  { id: 6, name: "Data Privacy & Bank", icon: Shield, field: "dataPrivacyStatus" },
  { id: 7, name: "Signature", icon: PenTool, field: "signatureStatus" },
  { id: 8, name: "Emergency Contact", icon: Users, field: "emergencyContactStatus" },
]
```

### Priority 2: Update OnboardingData Interface (2 min)
**File:** `app/onboarding/page.tsx` Line 37-87

**ADD these fields after line 72:**
```typescript
  // NEW: Resume, Medical, Education, Data Privacy
  resumeUrl?: string
  resumeStatus: string
  resumeFeedback?: string
  
  medicalCertUrl?: string
  medicalStatus: string
  medicalFeedback?: string
  
  diplomaTorUrl?: string
  educationStatus: string
  educationFeedback?: string
  
  dataPrivacyConsentUrl?: string
  bankAccountDetails?: string
  dataPrivacyStatus: string
  bankDetailsFeedback?: string
```

### Priority 3: CRITICAL - Renumber Existing Steps
**IMPORTANT:** The old steps 2-5 become 3, 7, 8

**Search and replace:**
- `currentStep === 2` → `currentStep === 3` (Gov IDs)
- `currentStep === 3` → ~~DELETE~~ (Additional Docs - merge with step 3)
- `currentStep === 4` → `currentStep === 7` (Signature)
- `currentStep === 5` → `currentStep === 8` (Emergency)

### Priority 4: Add New Step 2 - Resume (10 min)
**Location:** After Step 1, around line 500

```typescript
{/* STEP 2: Resume Upload */}
{currentStep === 2 && (
  <Card className="animate-in fade-in duration-500">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-purple-600/20">
          <Briefcase className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <CardTitle>Upload Your Resume</CardTitle>
          <CardDescription>PDF, DOC, or DOCX format (Max 5MB)</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {formData.resumeFeedback && (
        <Alert className="bg-red-900/30 border-red-600">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formData.resumeFeedback}</AlertDescription>
        </Alert>
      )}
      
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <Label htmlFor="resume-upload" className="cursor-pointer">
          <span className="text-lg font-semibold text-white">Click to upload resume</span>
          <p className="text-sm text-slate-400 mt-2">Supports PDF, DOC, DOCX</p>
        </Label>
        <Input
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleResumeUpload(e)}
          className="hidden"
          disabled={uploading.resume}
        />
        {uploading.resume && (
          <div className="mt-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-400" />
            <p className="text-sm text-slate-300 mt-2">Uploading...</p>
          </div>
        )}
      </div>

      {formData.resumeUrl && (
        <div className="p-4 bg-green-900/30 border border-green-600 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-green-100">Resume uploaded successfully</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(formData.resumeUrl, '_blank')}
            >
              View
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => setCurrentStep(3)}
          disabled={!formData.resumeUrl}
        >
          Continue
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

### Priority 5: Add Handler Function for Resume (3 min)
**Location:** Around line 200-300, add:

```typescript
async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return

  setUploading({ ...uploading, resume: true })
  setError("")

  try {
    const formData = new FormData()
    formData.append('resume', file)

    const response = await fetch('/api/onboarding/resume', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed')
    }

    setSuccess('Resume uploaded successfully!')
    await fetchOnboardingData()
  } catch (err: any) {
    setError(err.message || 'Failed to upload resume')
  } finally {
    setUploading({ ...uploading, resume: false })
  }
}
```

---

## 📝 IMPLEMENTATION SUMMARY

**For your 12 MCP agents to split:**

### Agent Group 1-2: STEPS & Interface Updates (Priority 1-2)
- Update STEPS array
- Update OnboardingData interface
- Takes 7 minutes

### Agent Group 3-4: Step Renumbering (Priority 3)
- Find/replace all step numbers
- Test navigation still works
- Takes 10 minutes

### Agent Group 5-6: Step 2 Resume (Priority 4-5)
- Add Step 2 UI
- Add handler function
- Takes 13 minutes

### Agent Group 7-8: Step 4 Education (Similar to Resume)
- Copy resume pattern
- Change to education file types
- Takes 10 minutes

### Agent Group 9-10: Step 5 Medical + Clinics
- Add clinic finder with geolocation
- Add medical upload
- Takes 20 minutes (most complex)

### Agent Group 11-12: Step 6 Data Privacy + Bank
- Add consent checkbox
- Add bank details form with PH banks
- Takes 15 minutes

---

## ⚡ SHORTCUTS FOR SPEED

**For Steps 4-6, copy this pattern and modify:**

1. Copy Step 2 Resume UI
2. Change icons, titles, descriptions
3. Change file types in accept
4. Change API endpoint path
5. Change state variables

**That's it! All APIs already exist and work!**

---

## 🎯 ESTIMATED TIME

- **Single dev:** 1.5 hours
- **12 agents parallel:** 20 minutes max

**ALL BACKEND IS DONE - JUST COPY/PASTE UI PATTERNS!** 🚀

---

## 📍 KEY FILES TO MODIFY

1. `app/onboarding/page.tsx` - Main work here
2. Test at `http://localhost:3000/onboarding`

**APIs are live and ready:**
- ✅ POST `/api/onboarding/resume`
- ✅ POST `/api/onboarding/education`
- ✅ POST `/api/onboarding/medical`
- ✅ POST `/api/onboarding/data-privacy`
- ✅ GET `/api/clinics/nearby?lat=X&lng=Y`

---

## 🔥 LET'S GOOOO!

The foundation is rock solid. Just plug in the UI and we're DONE! 💪

