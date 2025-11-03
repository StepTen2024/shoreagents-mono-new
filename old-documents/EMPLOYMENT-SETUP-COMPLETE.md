# 🎯 Complete Employment Setup on Onboarding

## ✅ WHAT WAS IMPLEMENTED:

Added **complete employment details form** that management fills when completing onboarding!

---

## 📋 THE CLEAN FLOW:

### **Step 1: Staff Signs Up**
Basic info only:
- Name
- Email
- Password

### **Step 2: Staff Completes Onboarding**
They fill out (5 steps):
- **Legal Name:** First, Middle, Last
- **Personal Info:** Gender, Civil Status, DOB
- **Contact:** Phone number
- **Government IDs:** SSS, TIN, PhilHealth, Pag-IBIG
- **Documents:** Valid ID, Birth Cert, NBI, Police Clearance, ID Photo
- **Signature:** E-signature upload
- **Emergency Contact:** Name, phone, relationship

### **Step 3: Admin Reviews & Approves**
- Reviews all documents
- Approves each section (5 sections)
- All docs verified ✅

### **Step 4: Admin Fills Employment Details** (NEW!)
Management enters:
- 🏢 **Company/Client** - Which client to assign
- 📊 **Employment Status** - Probation/Regular/Contract
- 📅 **Start Date** - When they begin
- ⏰ **Shift Time** - e.g., "9:00 AM - 6:00 PM"
- 💼 **Role Title** - e.g., "Virtual Assistant"
- 💵 **Monthly Salary** - In USD
- 🏥 **HMO Coverage** - Toggle true/false

### **Step 5: System Creates Everything**
Auto-populated from onboarding:
- ✅ Updates `StaffUser.name` with full legal name
- ✅ Sets `StaffProfile.phone` from onboarding contact
- ✅ Sets `StaffProfile.client` from company name
- ✅ Sets `StaffProfile.accountManager` from company relationship

Auto-calculated:
- ✅ **Days Employed** - Calculated from start date
- ✅ **Vacation Leave** - 0 for PROBATION, 12 for REGULAR
- ✅ **Work Schedule** - Mon-Fri with entered shift times

---

## 🆕 WHAT'S IN THE FORM:

### **Company Assignment**
```
Assign to Company/Client *
[Dropdown: Select a company...]
```

### **Employment Status**
```
Employment Status *
[Dropdown: Probation / Regular / Contract]
Default: Probation
```

### **Start Date & Shift**
```
Start Date *              Shift Time *
[Date Picker]             [Text: 9:00 AM - 6:00 PM]
```

### **Role & Salary**
```
Role Title *              Monthly Salary (USD) *
[Text: e.g., VA]          [Number: e.g., 800]
```

### **HMO Toggle**
```
HMO Coverage
Does this staff member have HMO coverage?
[Toggle Switch]
```

### **Auto-Calculated Notice**
```
ℹ️ Auto-calculated: Days Employed (from start date), Vacation Leave (0 until after probation)
```

---

## 📊 DATA MAPPING:

| Field | Source | Where It Goes |
|-------|--------|---------------|
| **Full Name** | `firstName + middleName + lastName` | `StaffUser.name` |
| **Company** | Management selects | `StaffUser.companyId` |
| **Phone** | `onboarding.contactNo` | `StaffProfile.phone` |
| **Location** | `onboarding.civilStatus` (temp) | `StaffProfile.location` |
| **Emp Status** | Management enters | `StaffProfile.employmentStatus` |
| **Start Date** | Management enters | `StaffProfile.startDate` |
| **Days Employed** | Calculated from start date | `StaffProfile.daysEmployed` |
| **Role** | Management enters | `StaffProfile.currentRole` |
| **Client** | From `Company.companyName` | `StaffProfile.client` |
| **Acct Manager** | From `Company.accountManagerId` | `StaffProfile.accountManager` |
| **Salary** | Management enters | `StaffProfile.salary` |
| **Vacation Leave** | 0 if PROBATION, 12 if REGULAR | `StaffProfile.totalLeave` |
| **HMO** | Management toggles | `StaffProfile.hmo` |
| **Shift Times** | Management enters | `WorkSchedule` (Mon-Fri) |

---

## 🔧 AUTO-CALCULATIONS:

### **Days Employed**
```typescript
const startDateTime = new Date(startDate)
const today = new Date()
const daysEmployed = Math.floor((today.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24))
```

### **Vacation Leave**
```typescript
const vacationLeave = employmentStatus === "PROBATION" ? 0 : 12
```

### **Full Legal Name**
```typescript
const fullName = `${firstName} ${middleName || ''} ${lastName}`.trim()
```

### **Shift Time Parsing**
```typescript
// Input: "9:00 AM - 6:00 PM"
const shiftParts = shiftTime.split('-').map(s => s.trim())
const startTime = shiftParts[0] || "9:00 AM"
const endTime = shiftParts[1] || "6:00 PM"
// Applied to Mon-Fri schedule
```

---

## ✅ VALIDATION:

The system validates:
1. ✅ Company selected
2. ✅ Role title entered
3. ✅ Salary > 0
4. ✅ Start date provided
5. ✅ Shift time entered
6. ✅ All 5 onboarding sections approved

**Error Messages:**
- "Please select a company to assign this staff member to."
- "Please enter the staff member's role title."
- "Please enter a valid salary amount."

---

## 📁 FILES CHANGED:

### 1. **Admin Detail Page UI**
**File:** `app/admin/staff/onboarding/[staffUserId]/page.tsx`

**Added:**
- Employment Status dropdown
- Start Date picker
- Shift Time input
- Role Title input
- Monthly Salary input
- HMO toggle switch
- Auto-calc info notice
- Validation logic

### 2. **Complete API Route**
**File:** `app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts`

**Added:**
- Accepts all employment fields
- Updates `StaffUser.name` with full legal name
- Calculates days employed
- Sets vacation leave based on employment status
- Creates work schedule with custom shift times
- Validates all required fields

---

## 🧪 TESTING THE FLOW:

### Step 1: Prepare
1. Login as admin
2. Go to "Staff Onboarding"
3. John Smith should be at 100% with all sections SUBMITTED

### Step 2: Approve All
4. Click "View" on John Smith
5. Approve all 5 sections:
   - Personal Information ✅
   - Government IDs ✅
   - Documents ✅
   - Signature ✅
   - Emergency Contact ✅

### Step 3: Fill Employment Details
6. Green card appears: "✅ Complete Onboarding & Setup Employment"
7. Fill the form:
   - **Company:** Select "Acme Corp"
   - **Employment Status:** Probation (default)
   - **Start Date:** Today's date (default)
   - **Shift Time:** "9:00 AM - 6:00 PM" (default)
   - **Role Title:** "Virtual Assistant"
   - **Salary:** "800"
   - **HMO:** ON (default)

### Step 4: Submit
8. Click "Complete Onboarding & Create Profile"
9. Confirm popup
10. Success! Staff profile created

### Step 5: Verify
11. Go to "Staff Management"
12. Click on John Smith
13. **Profile should show:**
    - Full Name: John Middle Smith (updated!)
    - Company: Acme Corp
    - Role: Virtual Assistant
    - Salary: $800
    - Employment Status: Probation
    - Start Date: Today
    - Days Employed: 0
    - Vacation Leave: 0 (probation)
    - HMO: Yes
    - Work Schedule: Mon-Fri 9AM-6PM

---

## 💡 SMART DEFAULTS:

The form comes pre-filled with smart defaults:
- **Employment Status:** PROBATION
- **Start Date:** Today
- **Shift Time:** "9:00 AM - 6:00 PM"
- **HMO:** ON (true)

Admin just needs to enter:
- Company
- Role Title
- Salary

Everything else can use defaults or be adjusted!

---

## 📚 BENEFITS:

### **For Staff:**
- Sign up quickly (just name, email, password)
- Fill detailed info during onboarding
- Legal name automatically used in system
- Don't need to know employment details

### **For Management:**
- Review docs first, THEN decide employment details
- All in one place (no separate profile setup)
- Auto-calculations save time
- Smart defaults speed up process
- Clear validation prevents mistakes

### **For System:**
- Clean data flow (onboarding → profile)
- No duplicate data entry
- Relationships set up correctly (staff ↔ company)
- Work schedule created automatically
- Days employed calculated from start date

---

## 🎯 WHAT GETS AUTO-POPULATED:

From **Onboarding Data:**
- Full legal name (with middle name!)
- Phone number
- Gender (future: can add to profile)
- Civil Status (future: can add to profile)
- Emergency contact (already saved)

From **Company Relationship:**
- Client name
- Account Manager

From **Calculations:**
- Days employed (from start date)
- Vacation leave (based on employment status)

---

## 🚀 READY TO TEST!

Server is running: **http://localhost:3000**

**Admin Login:** http://localhost:3000/login/admin

**Test Checklist:**
- [ ] Approve all 5 sections for a staff member
- [ ] See employment setup form appear
- [ ] Fill company, role, salary
- [ ] Submit form
- [ ] Verify profile created with ALL data
- [ ] Check legal name updated
- [ ] Check work schedule created with shift times
- [ ] Check vacation leave = 0 for probation
- [ ] Check days employed calculated correctly

---

## 🎉 COMPLETE!

The onboarding flow now includes:
1. ✅ Staff submits all personal/legal info
2. ✅ Admin reviews & approves documents
3. ✅ Admin enters employment details
4. ✅ System creates complete profile with:
   - Legal name from onboarding
   - Contact info from onboarding
   - Company assignment
   - Employment terms
   - Work schedule
   - Auto-calculated fields

**Everything in one clean flow!** 🔥

