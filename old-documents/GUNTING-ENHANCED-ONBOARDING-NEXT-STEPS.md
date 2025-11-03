# Enhanced Onboarding System - Next Steps

**Date:** October 23, 2025  
**Current Progress:** Phase 1-2 Complete (Database + Hire API)

---

## ✅ Completed So Far

### Phase 1: Database Schema (COMPLETE)
- All 4 new models added and deployed to database
- JobAcceptance, EmploymentContract, PartnerClinic, StaffWelcomeForm
- StaffOnboarding extended with 5 new document fields
- All relations properly configured

### Phase 2: Admin Hire API (COMPLETE)
- `/app/api/admin/recruitment/interviews/hire/route.ts` created
- Endpoint fully functional and tested
- Creates job acceptance records
- Updates interview status to 'hired'

---

## 🔄 Implementation Scope

This is a **LARGE multi-phase implementation** with 19 new/modified files across 13 phases.

**Total estimated work:** 4-6 hours of development time

**Files remaining:** 17+ files to create/modify

---

## 📋 Remaining Phases (In Priority Order)

### HIGH PRIORITY - Core Hiring Flow
1. **Phase 2.5: Admin UI for Hire Button** (30 min)
   - Update admin recruitment page with Hire modal
   - Form to capture position, company, email, phone

2. **Phase 3: Staff Signup Auto-fill** (45 min)
   - Update signup page to detect jobAcceptanceId
   - Pre-fill form from BPOC candidate data
   - Link new staff to job acceptance

3. **Phase 4: Contract Signing** (1 hour)
   - Create contract signing page
   - Section checkboxes + signature canvas
   - Save signature API

4. **Phase 5: Contract Template** (30 min)
   - HTML generation from contract data
   - All fields from employment contract image

### MEDIUM PRIORITY - Enhanced Onboarding
5. **Phase 7: Onboarding Restructure** (2 hours)
   - Update wizard from 5 to 8 steps
   - Add Resume upload (Step 2)
   - Add Education docs (Step 4)
   - Add Medical cert (Step 5)
   - Add Data Privacy + Bank (Step 6)
   - Create 4 new API endpoints

6. **Phase 8: Partner Clinics** (30 min)
   - Create clinics API with distance calculation
   - Seed initial clinic data

7. **Phase 9: Admin Onboarding Updates** (1 hour)
   - Add 5 new verification sections
   - Update completion calculation (5 → 10 sections)

### LOW PRIORITY - Polish & Support
8. **Phase 6: Contract Viewing** (45 min)
   - Admin contract view page
   - Staff contract view page
   - Download as PDF functionality

9. **Phase 10: Staff Handbook** (30 min)
   - Online handbook viewer
   - PDF.js or HTML version

10. **Phase 11: Complete Onboarding Updates** (30 min)
    - Require contract signed before completion
    - Verify all 10 sections

11. **Phase 12: Email Notifications** (1 hour)
    - Send signup link to candidate
    - Send notifications to admin
    - Email service integration

12. **Phase 13: Welcome Form** (1 hour)
    - Post-onboarding questionnaire
    - Admin view of responses
    - Banner integration

---

## 🎯 Recommended Approach

### Option A: Complete Minimum Viable Product (MVP)
**Time:** 3-4 hours  
**Phases:** 2.5, 3, 4, 5, 7 (partial - just resume/medical)

**Result:** End-to-end flow works:
- Admin can hire from interview
- Candidate gets signup link
- Candidate signs contract
- Candidate completes enhanced onboarding
- Admin verifies and creates profile

### Option B: Full Implementation
**Time:** 6-8 hours  
**All phases completed**

**Result:** Complete system with all features

### Option C: Phased Rollout (RECOMMENDED)
**Week 1:** Phases 2.5, 3, 4, 5 (hiring + contracts)  
**Week 2:** Phase 7 (enhanced onboarding)  
**Week 3:** Phases 6, 8, 9, 10 (polish)  
**Week 4:** Phases 11, 12, 13 (final features)

---

## 🚀 Quick Start for Next Session

### To Continue Implementation:

1. **Start with Phase 2.5 (Admin UI)**
   ```bash
   # Open: app/admin/recruitment/page.tsx
   # Add: Hire button to Interview Requests tab
   # Add: HireCandidateModal component
   ```

2. **Then Phase 3 (Signup Auto-fill)**
   ```bash
   # Update: app/login/staff/signup/page.tsx
   # Update: app/api/auth/signup/staff/route.ts
   ```

3. **Then Phase 4 (Contract Signing)**
   ```bash
   # Create: app/contract/page.tsx
   # Create: app/api/contract/sign/route.ts
   ```

### Database is Ready
- No additional schema changes needed until Phase 7
- All relations are live
- Hire API is functional

### Testing Current State
```bash
# Test hire API directly:
curl -X POST http://localhost:3000/api/admin/recruitment/interviews/hire \
  -H "Content-Type: application/json" \
  -d '{
    "interviewRequestId": "uuid-here",
    "position": "Customer Service Rep",
    "companyId": "company-uuid",
    "candidateEmail": "candidate@example.com",
    "bpocCandidateId": "bpoc-uuid"
  }'
```

---

## 📝 Implementation Notes

### Design Decisions Made
- Contract has checkboxes per section (not page-by-page initials)
- Medical cert can be marked "in progress" (non-blocking)
- Bank details stored as JSON for flexibility
- Welcome form is post-onboarding (not blocking)

### Technical Stack Confirmed
- Prisma for database ORM
- Supabase for file storage
- NextAuth for authentication
- Next.js App Router for routing
- Tailwind + shadcn/ui for styling

### Files Already Created
1. `prisma/schema.prisma` - ✅ Updated
2. `app/api/admin/recruitment/interviews/hire/route.ts` - ✅ Created
3. `ENHANCED-ONBOARDING-IMPLEMENTATION-STATUS.md` - ✅ Created
4. `ENHANCED-ONBOARDING-NEXT-STEPS.md` - ✅ This file

---

## 💡 Key Points for Next Developer

1. **Database is live** - All tables exist, relations work
2. **Hire API works** - Returns signup link with jobAcceptanceId
3. **No breaking changes** - Existing onboarding still functional
4. **Incremental approach** - Can deploy phases independently
5. **Well documented** - Plan file has complete implementation details

---

## 🎯 Success Criteria

### Phase 1-2 (Current State)
- [x] Database schema deployed
- [x] Hire API functional
- [x] No errors in existing system

### MVP Complete
- [ ] Admin can hire from interview
- [ ] Staff can sign contract
- [ ] Staff completes enhanced onboarding
- [ ] Profile created successfully

### Full System Complete
- [ ] All 13 phases implemented
- [ ] End-to-end testing passing
- [ ] Documentation updated
- [ ] No linter errors

---

**Status:** Ready for Phase 2.5 implementation  
**Next File:** `app/admin/recruitment/page.tsx`  
**Estimated Time to MVP:** 3-4 hours

