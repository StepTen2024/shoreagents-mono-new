# Staff Onboarding System - Testing Guide

## Pre-Test Setup

Before testing, ensure:

1. ✅ Database schema has been applied (`npx prisma db push`)
2. ✅ Supabase `staff` bucket exists and is public
3. ✅ RLS policies have been applied (see SUPABASE-ONBOARDING-STORAGE-SETUP.md)
4. ✅ Environment variables are set correctly

---

## Test Scenario 1: Complete Staff Onboarding (Happy Path)

### Step 1: Staff Signup
1. Navigate to `/login/staff/signup`
2. Fill in:
   - Name: "Rochelle Samson"
   - Email: "rochelle.test@example.com"
   - Password: "Test123!"
3. Click "Sign Up"
4. Verify redirected to login or auto-logged in

### Step 2: First Login & Onboarding Banner
1. Login as the staff member
2. Verify dashboard shows **onboarding banner** at 0%
3. Click banner or navigate to `/onboarding`
4. Verify wizard shows 5 steps with progress bar

### Step 3: Personal Information
1. Fill in all fields:
   - First Name: "Rochelle"
   - Middle Name: "Bacani"
   - Last Name: "Samson"
   - Gender: "Female"
   - Civil Status: "Single"
   - Date of Birth: "1993-08-02"
   - Contact Number: "09487091146"
   - Email: "rochelle.test@example.com" (pre-filled)
2. Click "Save & Continue"
3. Verify success message
4. Verify progress bar updates
5. Verify redirected to Step 2

### Step 4: Government IDs
1. Fill in:
   - SSS: "02-3731640-2"
   - TIN: "474-887-785-000"
   - PhilHealth: "07-025676881-8"
   - Pag-IBIG: "1211-5400-1513"
2. Click "Save & Continue"
3. Verify success message
4. Verify redirected to Step 3

### Step 5: Documents Upload
1. Upload **Valid ID**:
   - Select a PDF or image file
   - Verify loading spinner appears
   - Verify green checkmark ✓ appears when done
2. Upload **Birth Certificate**:
   - Repeat process
3. Upload **NBI Clearance**
4. Upload **Police Clearance**
5. Upload **ID Photo** (2x2)
6. Click "Continue"
7. Verify redirected to Step 4

### Step 6: Signature Upload
1. Upload signature image (PNG or JPG)
2. Verify preview appears below upload button
3. Click "Continue"
4. Verify redirected to Step 5

### Step 7: Emergency Contact
1. Fill in:
   - Name: "Reynaldo T. Samson"
   - Relationship: "Father"
   - Contact Number: "09267834844"
2. Click "Save & Finish"
3. Verify success message
4. Verify can navigate back to dashboard

### Step 8: Check Dashboard
1. Go to dashboard (`/`)
2. Verify onboarding banner shows updated percentage
3. Verify banner says "Complete your onboarding to unlock all features"

---

## Test Scenario 2: Admin Verification (Happy Path)

### Step 1: Admin Login
1. Navigate to `/login/admin`
2. Login with admin credentials
3. Go to `/admin/staff/onboarding`

### Step 2: View Staff List
1. Verify "Rochelle Samson" appears in list
2. Check completion percentage (should be 60-75%)
3. Check "Pending Review" badge (should show 5 sections)
4. Click "View" button

### Step 3: Verify Personal Information
1. Review all personal data
2. Verify all fields populated correctly
3. Click "Approve"
4. Verify section status changes to "Approved"
5. Verify green checkmark appears

### Step 4: Verify Government IDs
1. Review all ID numbers
2. Verify formats are correct
3. Click "Approve"
4. Verify section locked (no edit buttons)

### Step 5: Verify Documents
1. Click "View Document" links for each uploaded file
2. Verify files open in new tab
3. Verify ID Photo thumbnail appears
4. Click "Approve"
5. Verify all documents marked as verified

### Step 6: Verify Signature
1. Verify signature preview displays
2. Click "View Full Size" to open in new tab
3. Click "Approve"

### Step 7: Verify Emergency Contact
1. Review emergency contact info
2. Click "Approve"

### Step 8: Complete Onboarding
1. Verify completion percentage is now **100%**
2. Verify "Complete Onboarding" button appears at top
3. Click "Complete Onboarding"
4. Confirm the dialog
5. Verify success message appears
6. Verify status changes to "✅ Complete"

### Step 9: Verify Profile Created
1. Go back to admin dashboard
2. Check that `StaffProfile` was created for Rochelle
3. Check that `WorkSchedule` was created (Mon-Fri 9-6)

---

## Test Scenario 3: Staff After Completion

### Step 1: Login as Staff
1. Login as Rochelle
2. Go to dashboard

### Step 2: Verify Dashboard Changes
1. Verify onboarding banner **disappears** or shows 100%
2. Navigate to `/profile`
3. Verify profile page shows all data
4. Verify work schedule shows Mon-Fri 9-6

### Step 3: Try to Edit Approved Sections
1. Go to `/onboarding`
2. Try to edit Personal Info (Step 1)
3. Verify fields are **disabled** (locked)
4. Verify all approved sections are locked

---

## Test Scenario 4: Rejection & Revision (Sad Path)

### Step 1: Admin Rejects Section
1. Login as admin
2. Go to staff verification page
3. On "Personal Information" section:
   - Add feedback: "Please use your legal name from birth certificate"
   - Click "Reject"
4. Verify status changes to "Rejected"
5. Verify feedback appears

### Step 2: Staff Sees Rejection
1. Login as staff
2. Go to `/onboarding`
3. Navigate to Step 1 (Personal Info)
4. Verify feedback appears in yellow alert
5. Verify fields are **editable** (unlocked)
6. Update information
7. Click "Save & Continue"
8. Verify status changes to "Submitted"

### Step 3: Admin Re-Reviews
1. Admin goes back to verification page
2. Reviews updated information
3. Clicks "Approve"
4. Verify section now locked

---

## Test Scenario 5: Partial Completion

### Step 1: Staff Completes Only 2 Steps
1. New staff signs up
2. Completes Personal Info (Step 1)
3. Completes Government IDs (Step 2)
4. Skips to dashboard (via "Return to Dashboard" button)

### Step 2: Verify Dashboard Shows Progress
1. Verify banner shows ~40% completion
2. Verify "🟡 Halfway There" or similar badge
3. Click banner to return to onboarding
4. Verify can continue from where they left off

### Step 3: Admin Views Partial Submission
1. Admin goes to onboarding list
2. Filters by "Incomplete"
3. Finds staff member
4. Views their onboarding
5. Verifies can approve sections 1 & 2
6. Verifies sections 3, 4, 5 still pending

---

## Test Scenario 6: Document Upload Edge Cases

### Test 6A: File Too Large
1. Try uploading a 10MB PDF
2. Verify error: "File too large. Maximum size is 5MB"

### Test 6B: Wrong File Type
1. Try uploading a .txt or .docx file
2. Verify error: "Invalid file type. Only PDF, JPG, and PNG are allowed"

### Test 6C: No File Selected
1. Click "Continue" without uploading any documents
2. Verify wizard proceeds (documents optional)
3. Verify status remains "PENDING"

### Test 6D: Replace Document
1. Upload a document
2. Upload a different file for the same document type
3. Verify new file replaces old file
4. Verify only one file exists in Supabase (upsert worked)

---

## Test Scenario 7: Multiple Staff Members

### Step 1: Create 3 Staff Members
1. Sign up as "Staff A" - complete 100%
2. Sign up as "Staff B" - complete 60%
3. Sign up as "Staff C" - complete 20%

### Step 2: Admin List View
1. Admin goes to `/admin/staff/onboarding`
2. Verify all 3 appear in list
3. Test filters:
   - **All Staff**: Shows all 3
   - **Pending Review**: Shows A & B (with submitted sections)
   - **Incomplete**: Shows B & C
   - **Complete**: Shows A (if approved by admin)

### Step 3: Verify Sorting
1. Check "Last Updated" column
2. Most recently updated should be at top

---

## Test Scenario 8: Mobile Upload

### Step 1: Staff Uses Mobile Phone
1. Open onboarding page on mobile
2. Navigate to Documents step
3. Click file input
4. Verify camera option appears (mobile)
5. Take photo of ID
6. Verify upload works
7. Verify image compresses if needed

---

## Expected Results Summary

### Database Records Created
- ✅ `staff_users` record
- ✅ `staff_onboarding` record
- ✅ `staff_profiles` record (after completion)
- ✅ `work_schedules` records (7 days, after completion)

### Supabase Storage Files
- ✅ Files uploaded to correct folders
- ✅ Files use staff `authUserId` in path
- ✅ Public URLs work
- ✅ Files accessible by admin

### Status Flow
```
PENDING → Staff fills → SUBMITTED → Admin reviews → APPROVED/REJECTED
                                                    ↓
                                             If REJECTED → Staff edits → SUBMITTED again
```

### Completion Percentage Calculation
```javascript
Each section = 20%
- Personal Info APPROVED = 20%
- Gov IDs APPROVED = 20%
- Documents APPROVED = 20%
- Signature APPROVED = 20%
- Emergency Contact APPROVED = 20%
Total = 100%
```

---

## Known Issues to Check

### Issue 1: File Upload Takes Too Long
- Expected: 1-3 seconds for 2MB file
- If slower: Check network, Supabase region

### Issue 2: Preview Not Showing
- Check if URL is valid
- Check if image is not corrupted
- Check browser console for errors

### Issue 3: Admin Can't See Documents
- Verify RLS SELECT policy exists
- Verify files actually uploaded to Supabase
- Check database `validIdUrl` field is populated

### Issue 4: Completion Percent Stuck
- Check API route updates `completionPercent` field
- Verify `updateCompletionPercent()` function is called
- Check database for actual values

---

## Performance Benchmarks

### Expected Load Times
- Onboarding wizard load: < 1s
- Document upload (2MB): < 3s
- Admin list view: < 2s
- Admin detail view: < 1.5s

### File Upload Size Recommendations
- **Documents**: Compress PDFs to under 2MB
- **Images**: Resize to max 1920x1080 before upload
- **Signature**: Should be under 500KB

---

## Accessibility Testing

### Screen Reader Test
1. Use VoiceOver (Mac) or NVDA (Windows)
2. Navigate through onboarding wizard
3. Verify all form labels are read
4. Verify error messages are announced

### Keyboard Navigation
1. Use Tab key to navigate
2. Verify all inputs accessible
3. Verify file upload accessible
4. Verify buttons have focus states

---

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

---

## Security Testing

### Test 1: Staff Can't Access Other Staff's Documents
1. Login as Staff A
2. Try to access Staff B's document URL directly
3. Should work (public bucket) - this is intentional for profile pics

### Test 2: Staff Can't Upload to Other Folders
1. Login as Staff A
2. Try to manually upload to Staff B's folder via API
3. Should fail with 403 (RLS policy blocks it)

### Test 3: Unauthenticated Access
1. Logout
2. Try to access `/onboarding`
3. Should redirect to login

---

## Rollback Plan

If critical issues found:
1. Keep existing data in database
2. Disable onboarding wizard (show maintenance message)
3. Admin can manually approve all sections
4. Fix issues in development
5. Re-enable wizard

---

**Status:** Ready for testing  
**Estimated Testing Time:** 2-3 hours for complete suite  
**Priority Tests:** Scenarios 1, 2, and 3


