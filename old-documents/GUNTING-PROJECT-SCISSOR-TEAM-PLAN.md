# 🎯 GUNTING PROJECT SCISSOR - TEAM COORDINATION PLAN

**Branch:** `Gunting-Project-Scissor`  
**Project:** Enhanced Onboarding System (100% Backend Complete, UI Updates Needed)  
**Team Size:** 6 agents (5 remote + 1 lead)  
**Status:** READY TO EXECUTE 🔥

---

## 👥 TEAM ROSTER

| Agent | Human | Role | Branch Access |
|-------|-------|------|---------------|
| **StepTen (Nova 001)** | Stephen | Lead - Coordinator | `Gunting-Project-Scissor` (Pull & Push) |
| **Kira (Agent 004)** | Lovell | Remote Agent | `Gunting-Project-Scissor` (Pull & Push) |
| **Shadow (Agent 005)** | Kyle | Remote Agent | `Gunting-Project-Scissor` (Pull & Push) |
| **Echo (Agent 006)** | Emman | Remote Agent | `Gunting-Project-Scissor` (Pull & Push) |
| **Raze (Agent 003)** | James | Remote Agent | `Gunting-Project-Scissor` (Pull & Push) |
| **Cipher (Agent 002)** | Aaron | Remote Agent | `Gunting-Project-Scissor` (Pull & Push) |

**Tools:** Cursor + GitHub MCP + Slack MCP

---

## 🔄 GIT WORKFLOW

### **Phase 1: Initial Setup (StepTen)**
```bash
# StepTen (DONE ✅)
git checkout Gunting-Project-Scissor
git add -A
git commit -m "GUNTING: Initial setup with 100% backend complete"
git push origin Gunting-Project-Scissor
```

### **Phase 2: Team Pull (All Agents)**
```bash
# Each agent pulls the Scissors branch
git fetch origin
git checkout Gunting-Project-Scissor
git pull origin Gunting-Project-Scissor
```

### **Phase 3: Work & Push (All Agents)**
```bash
# Each agent works on assigned task
# Make changes, test locally

# Commit and push
git add -A
git commit -m "GUNTING-[AGENT-NAME]: [Description of work]"
git pull origin Gunting-Project-Scissor  # Pull latest first
git push origin Gunting-Project-Scissor
```

### **Phase 4: StepTen Pull Back**
```bash
# StepTen pulls all updates
git pull origin Gunting-Project-Scissor
# Review, test, merge conflicts if any
```

### **Phase 5: Repeat**
- Agents pull latest
- Make updates
- Push back
- StepTen pulls and coordinates

---

## ✅ THIS WORKFLOW WILL WORK BECAUSE:

1. ✅ **Single Branch** - Everyone works on `Gunting-Project-Scissor`
2. ✅ **Pull Before Push** - Agents always pull latest before pushing
3. ✅ **Clear Task Assignment** - Each agent has specific files to work on
4. ✅ **StepTen Coordinates** - You pull regularly and resolve conflicts
5. ✅ **Slack Integration** - Real-time communication via Slack MCP
6. ✅ **GitHub MCP** - All agents can push/pull via MCP tools

---

## 📋 TASK ASSIGNMENTS

### **PRIORITY 1: UI Updates (70% of work)**

#### **Agent Kira (004) - Onboarding Steps 2 & 4**
**Files:** `app/onboarding/page.tsx` (Lines 988-1858)
**Tasks:**
- ✅ Step 2 (Resume) - ALREADY DONE by StepTen
- ✅ Step 4 (Education) - ALREADY DONE by StepTen
- **Review and test these steps**
- **Add error handling if needed**
- **Test file uploads work**

**Status:** VERIFY & TEST ONLY

#### **Agent Shadow (005) - Onboarding Steps 5 & 6**
**Files:** `app/onboarding/page.tsx` (Lines 1860-2051)
**Tasks:**
- ✅ Step 5 (Medical Certificate + Clinic Finder) - ALREADY DONE by StepTen
- ✅ Step 6 (Data Privacy + Bank Details) - ALREADY DONE by StepTen
- **Review and test these steps**
- **Verify clinic geolocation works**
- **Test bank form validation**

**Status:** VERIFY & TEST ONLY

#### **Agent Echo (006) - Admin Verification Page**
**Files:** `app/admin/staff/onboarding/[staffUserId]/page.tsx`
**Tasks:**
- Add 5 new section cards (Resume, Medical, Education, Data Privacy, Bank)
- Update completion % calculation (5 sections → 8 sections)
- Add employment contract display at top
- Add "View Contract" button
- Test approve/reject for all 8 sections

**Code Pattern:**
```typescript
{/* Resume Section */}
<Card>
  <CardHeader>
    <CardTitle>Resume</CardTitle>
    <StatusBadge status={onboarding.resumeStatus} />
  </CardHeader>
  <CardContent>
    {onboarding.resumeUrl && (
      <Button onClick={() => window.open(onboarding.resumeUrl, '_blank')}>
        View Resume
      </Button>
    )}
    <div className="mt-4 flex gap-2">
      <Button onClick={() => verifySection("resumeStatus", "APPROVED")}>
        Approve
      </Button>
      <Button variant="destructive" onClick={() => openFeedbackModal("resumeStatus")}>
        Reject
      </Button>
    </div>
  </CardContent>
</Card>
```

**Repeat for:** Medical, Education, Data Privacy, Bank

#### **Agent Raze (003) - Complete Onboarding API**
**Files:** `app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts`
**Tasks:**
- Update required sections from 5 to 8
- Add contract signature check
- Add welcome form creation
- Test completion logic

**Code Update:**
```typescript
// Check all 8 sections are approved (not 5)
const requiredSections = [
  'personalInfoStatus',
  'resumeStatus',
  'govIdStatus',
  'educationStatus',
  'medicalStatus',
  'dataPrivacyStatus',
  'signatureStatus',
  'emergencyContactStatus'
]

const allApproved = requiredSections.every(
  field => onboarding[field] === 'APPROVED'
)

if (!allApproved) {
  return NextResponse.json({ error: 'Not all sections approved' }, { status: 400 })
}

// Check contract is signed
const contract = await prisma.employmentContract.findUnique({
  where: { staffUserId: staffUser.id }
})

if (contract && !contract.signed) {
  return NextResponse.json({ error: 'Contract not signed yet' }, { status: 400 })
}

// Create empty welcome form record
await prisma.staffWelcomeForm.create({
  data: {
    staffUserId: staffUser.id,
    name: staffUser.name,
    clientCompany: company?.companyName || '',
    startDate: contract?.startDate || new Date(),
    favoriteFastFood: '',
    completed: false
  }
})
```

#### **Agent Cipher (002) - Contract Viewing Pages**
**Files:** 
- `app/admin/contracts/[contractId]/page.tsx` (NEW)
- `app/staff/contract/page.tsx` (NEW)

**Tasks:**
- Create admin contract view (read-only)
- Create staff contract view (read-only)
- Both show contract HTML + signature
- Add "Download PDF" button (optional)
- Add "Approve Contract" button for admin

**Admin View Pattern:**
```typescript
export default async function AdminContractView({ params }: { params: { contractId: string } }) {
  const contract = await prisma.employmentContract.findUnique({
    where: { id: params.contractId },
    include: { staffUser: true, company: true }
  })

  if (!contract) return <div>Contract not found</div>

  const contractHTML = generateContractHTML(contract)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Employment Contract</CardTitle>
          <Badge variant={contract.signed ? "success" : "warning"}>
            {contract.signed ? "Signed" : "Pending"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div dangerouslySetInnerHTML={{ __html: contractHTML }} />
          {contract.finalSignatureUrl && (
            <div className="mt-4">
              <img src={contract.finalSignatureUrl} alt="Signature" className="border" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### **PRIORITY 2: Testing & Verification (30% of work)**

#### **All Agents - End-to-End Testing**
**After your assigned task:**
1. Test your changes locally
2. Run through complete flow
3. Document any bugs in Slack
4. Push fixes to Scissors branch

---

## 📊 WHAT'S ALREADY DONE (100% Backend)

✅ **Database Schema** - All 4 new models  
✅ **8 API Endpoints** - All working  
✅ **Admin Hire Workflow** - Complete  
✅ **Staff Signup Auto-fill** - Complete  
✅ **Contract Signing Interface** - Complete  
✅ **Contract Template Generator** - Complete  
✅ **Onboarding Steps 1-8 UI** - **ALL DONE!** ✅  
✅ **Welcome Form** - Complete  
✅ **All Handler Functions** - Complete  
✅ **Geolocation Clinics** - Complete  

---

## 📝 WHAT NEEDS TO BE DONE (Agents)

### **Agent Echo (006):**
- Admin verification page updates (5 new sections)

### **Agent Raze (003):**
- Complete onboarding API updates (8 section check)

### **Agent Cipher (002):**
- Contract viewing pages (admin + staff)

### **Agent Kira (004) & Shadow (005):**
- Test and verify existing onboarding steps
- Report any bugs

---

## 🎯 ESTIMATED TIME

| Task | Agent | Time | Status |
|------|-------|------|--------|
| Admin Verification Page | Echo (006) | 2-3 hours | Pending |
| Complete API Update | Raze (003) | 1 hour | Pending |
| Contract View Pages | Cipher (002) | 2 hours | Pending |
| Testing & Verification | Kira (004) + Shadow (005) | 2 hours | Pending |

**Total Time:** 5-8 hours across 6 agents = **~1-2 hours real time!** 🚀

---

## 📚 DOCUMENTATION TO READ

**ALL docs are renamed with `GUNTING-` prefix:**

1. **GUNTING-MISSION-COMPLETE-100-PERCENT.md** - Final status (what's done)
2. **GUNTING-URGENT-COMPLETE-NOW.md** - Quick start guide
3. **GUNTING-PHASE-7-8-IMPLEMENTATION-GUIDE.md** - Detailed implementation
4. **GUNTING-COMPLETE-ONBOARDING-SYSTEM-DOCUMENTATION.md** - Full system overview
5. **admin-portal-cleanup.plan.md** - Original plan (has all code patterns)

---

## 🔧 SETUP COMMANDS

### **For Each Agent:**

```bash
# 1. Clone repo (if not already)
git clone https://github.com/shoreagents/shoreagents-ai-monorepo.git
cd shoreagents-ai-monorepo

# 2. Checkout Scissors branch
git fetch origin
git checkout Gunting-Project-Scissor
git pull origin Gunting-Project-Scissor

# 3. Install dependencies (if needed)
npm install

# 4. Start dev server
npm run dev

# 5. Work on your assigned files

# 6. Test locally

# 7. Commit and push
git add -A
git commit -m "GUNTING-[YOUR-AGENT-NAME]: [What you did]"
git pull origin Gunting-Project-Scissor
git push origin Gunting-Project-Scissor

# 8. Message in Slack when done
```

---

## 💬 SLACK COORDINATION

**Use Slack MCP to:**
- Announce when you start a task
- Ask questions if stuck
- Report bugs or issues
- Notify when task complete
- Coordinate merge conflicts

**Message Format:**
```
[AGENT-NAME]: Starting work on [TASK]
[AGENT-NAME]: Question about [ISSUE]
[AGENT-NAME]: ✅ Completed [TASK], pushed to Scissors
[AGENT-NAME]: 🐛 Found bug in [FILE], fixing now
```

---

## ⚠️ IMPORTANT RULES

1. **Always pull before push** - `git pull origin Gunting-Project-Scissor`
2. **Test locally first** - Make sure it works before pushing
3. **Clear commit messages** - Use `GUNTING-[AGENT]: [Description]`
4. **Communicate in Slack** - Keep team updated
5. **Don't edit other agent's files** - Stick to your assigned tasks
6. **If stuck, ask StepTen** - Don't waste time, ask for help

---

## 🚀 LET'S GO!

**Current Status:**
- Branch: `Gunting-Project-Scissor` ✅ CREATED
- Docs: All renamed with `GUNTING-` prefix ✅ DONE
- Backend: 100% complete ✅ DONE
- UI: Steps 2, 4, 5, 6 ALREADY DONE by StepTen ✅

**Remaining Work:**
- Admin verification page (Echo)
- Complete API update (Raze)
- Contract viewing pages (Cipher)
- Testing (Kira + Shadow)

**Estimated Total Time:** 1-2 hours with full team! 🔥

---

## 📞 NEED HELP?

**StepTen (Nova 001) is your coordinator!**
- Slack: Message Stephen
- GitHub: @stephenatcheler
- Branch Lead: `Gunting-Project-Scissor`

**LET'S SMASH THIS! 💪🔥🚀**

