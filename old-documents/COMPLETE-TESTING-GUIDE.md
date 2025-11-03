# 🧪 PERFORMANCE REVIEW SYSTEM - COMPLETE TESTING GUIDE

**Date:** October 16, 2025  
**System:** FILO Works Performance Review System  
**Purpose:** Full end-to-end testing with pre-configured accounts

---

## 👥 TEST ACCOUNTS

### Management Account
- **Email:** stephena@shoreagents.com
- **Role:** Management (Admin access)
- **Access:** `/admin/reviews` - Full control

### Client Account
- **Email:** stephen@stepten.ai
- **Role:** Client
- **Access:** `/client/reviews` - Submit reviews for their staff

### Staff Accounts (Created Below)
- **Staff 1:** john.month1@test.com - For Month 1 reviews
- **Staff 2:** jane.month3@test.com - For Month 3 reviews
- **Staff 3:** bob.month5@test.com - For Month 5 reviews
- **Staff 4:** alice.recurring@test.com - For Recurring reviews

---

## 🔧 SETUP: CREATE TEST STAFF ACCOUNTS

### Step 1: Create Staff Users with Specific Start Dates

Run this SQL script in your database to create 12 test staff (3 of each review type):

```sql
-- ============================================
-- MONTH 1 REVIEW STAFF (3 users)
-- Start Date: 25 days ago (triggers Month 1 review)
-- ============================================

-- Staff 1: John Doe (Month 1)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'john.month1@test.com',
  'John Doe',
  'auth_john_month1',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '25 days',
  NOW(),
  NOW()
);

-- Staff 2: Emma Wilson (Month 1)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'emma.month1@test.com',
  'Emma Wilson',
  'auth_emma_month1',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '25 days',
  NOW(),
  NOW()
);

-- Staff 3: Michael Chen (Month 1)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'michael.month1@test.com',
  'Michael Chen',
  'auth_michael_month1',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '25 days',
  NOW(),
  NOW()
);

-- ============================================
-- MONTH 3 REVIEW STAFF (3 users)
-- Start Date: 85 days ago (triggers Month 3 review)
-- ============================================

-- Staff 4: Jane Smith (Month 3)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'jane.month3@test.com',
  'Jane Smith',
  'auth_jane_month3',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '85 days',
  NOW(),
  NOW()
);

-- Staff 5: David Martinez (Month 3)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'david.month3@test.com',
  'David Martinez',
  'auth_david_month3',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '85 days',
  NOW(),
  NOW()
);

-- Staff 6: Sarah Johnson (Month 3)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'sarah.month3@test.com',
  'Sarah Johnson',
  'auth_sarah_month3',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '85 days',
  NOW(),
  NOW()
);

-- ============================================
-- MONTH 5 REVIEW STAFF (3 users)
-- Start Date: 145 days ago (triggers Month 5 review)
-- ============================================

-- Staff 7: Bob Anderson (Month 5)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'bob.month5@test.com',
  'Bob Anderson',
  'auth_bob_month5',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '145 days',
  NOW(),
  NOW()
);

-- Staff 8: Linda Taylor (Month 5)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'linda.month5@test.com',
  'Linda Taylor',
  'auth_linda_month5',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '145 days',
  NOW(),
  NOW()
);

-- Staff 9: James Brown (Month 5)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'james.month5@test.com',
  'James Brown',
  'auth_james_month5',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '145 days',
  NOW(),
  NOW()
);

-- ============================================
-- RECURRING REVIEW STAFF (3 users)
-- Start Date: 175 days ago (triggers Recurring review)
-- ============================================

-- Staff 10: Alice Garcia (Recurring)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'alice.recurring@test.com',
  'Alice Garcia',
  'auth_alice_recurring',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '175 days',
  NOW(),
  NOW()
);

-- Staff 11: Robert Lee (Recurring)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'robert.recurring@test.com',
  'Robert Lee',
  'auth_robert_recurring',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '175 days',
  NOW(),
  NOW()
);

-- Staff 12: Patricia White (Recurring)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'patricia.recurring@test.com',
  'Patricia White',
  'auth_patricia_recurring',
  (SELECT id FROM company LIMIT 1),
  'STAFF',
  NOW() - INTERVAL '175 days',
  NOW(),
  NOW()
);
```

### Step 2: Verify Staff Created

```sql
-- Check all test staff users
SELECT 
  id, 
  name, 
  email, 
  "startDate",
  AGE(NOW(), "startDate") as tenure
FROM staff_users
WHERE email LIKE '%@test.com'
ORDER BY "startDate" DESC;
```

Expected result: 12 staff users with varying start dates

---

## 🧪 COMPLETE TESTING WORKFLOW

### PHASE 1: ADMIN SETUP (Management Login)

#### Step 1: Login as Management
1. Open: `http://localhost:3000`
2. Login with: **stephena@shoreagents.com**
3. Navigate to: `/admin/reviews`

#### Step 2: Trigger Review Creation
1. Click **"Trigger Review Creation"** button
2. System should create **12 reviews** (3 of each type)
3. Alert message: "✅ Created 12 reviews, skipped 0"

#### Step 3: Verify Reviews Dashboard
Check that dashboard shows:
- [ ] **Total Reviews:** 12
- [ ] **Pending:** 12
- [ ] **By Type:**
  - Month 1: 3 reviews
  - Month 3: 3 reviews
  - Month 5: 3 reviews
  - Recurring: 3 reviews

#### Step 4: Inspect Review Cards
For each review, verify:
- [ ] Staff name displays
- [ ] Client name shows (stephen@stepten.ai)
- [ ] Review type badge (🔵 Month 1, 🟢 Month 3, 🟣 Month 5, 🔄 Recurring)
- [ ] Status badge (🟡 Pending)
- [ ] Due date displayed
- [ ] "View Details" button present

---

### PHASE 2: CLIENT SUBMISSION (API Testing)

Since Client UI isn't built, submit reviews via API:

#### Submit Month 1 Review (18 Questions)

```bash
# Get review ID from admin dashboard first
# Then submit:

curl -X POST http://localhost:3000/api/client/reviews \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "reviewId": "MONTH_1_REVIEW_ID_HERE",
    "ratings": [5,4,5,4,5,4,5,4,5,4,5,4,5,4,5,4,5,4],
    "strengths": "John demonstrates excellent communication skills and consistently delivers high-quality work. He is proactive in seeking clarification and has adapted well to company processes.",
    "improvements": "Could improve time management during peak workload periods. Sometimes requires reminders for status updates.",
    "additionalComments": "Overall very satisfied with performance. Shows great potential for long-term success."
  }'
```

**Expected Score:** ~89% (🔵 Excellent)

#### Submit Month 3 Review (27 Questions)

```bash
curl -X POST http://localhost:3000/api/client/reviews \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "reviewId": "MONTH_3_REVIEW_ID_HERE",
    "ratings": [4,4,3,4,4,3,4,4,3,4,4,3,4,4,3,4,4,3,4,4,3,4,4,3,4,4,3],
    "strengths": "Jane has shown significant improvement since Month 1. Her work quality is consistently good and she now requires minimal supervision. Great team player.",
    "improvements": "Could take more initiative on new tasks. Sometimes waits for direction rather than proactively identifying opportunities.",
    "additionalComments": "On track for successful completion of probation. Recommend continuing to Month 5 review."
  }'
```

**Expected Score:** ~76% (🟢 Good)

#### Submit Month 5 Review (24 Questions) - CRITICAL SCORE

```bash
curl -X POST http://localhost:3000/api/client/reviews \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "reviewId": "MONTH_5_REVIEW_ID_HERE",
    "ratings": [2,2,2,2,3,2,2,2,2,3,2,2,2,2,3,2,2,2,2,3,2,2,2,2],
    "strengths": "Bob is punctual and follows instructions when given clear direction.",
    "improvements": "Significant concerns about work quality and consistency. Multiple errors requiring rework. Does not take initiative. Communication needs improvement.",
    "additionalComments": "CONCERN: Not meeting expectations for regularization. Recommend extending probation period for additional evaluation."
  }'
```

**Expected Score:** ~45% (🔴 Critical)

#### Submit Recurring Review (18 Questions)

```bash
curl -X POST http://localhost:3000/api/client/reviews \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "reviewId": "RECURRING_REVIEW_ID_HERE",
    "ratings": [5,5,4,5,5,4,5,5,4,5,5,4,5,5,4,5,5,4],
    "strengths": "Alice is an exceptional employee. Consistently exceeds expectations and has become a key team member. Takes initiative and mentors newer staff.",
    "improvements": "No significant areas for improvement. Could potentially take on more complex projects or leadership responsibilities.",
    "additionalComments": "Highly recommend for continued employment and potential advancement opportunities."
  }'
```

**Expected Score:** ~93% (🔵 Excellent)

---

### PHASE 3: ADMIN REVIEW PROCESSING

#### Step 1: Refresh Admin Dashboard
- [ ] See updated stats:
  - **Submitted:** 4
  - **Pending:** 8
  - **Critical:** 1 (Bob's Month 5 review)

#### Step 2: Process John's Review (Month 1 - Excellent)
1. Click "View Details" on John Doe's review
2. Verify:
   - [ ] Overall Score: **~89%**
   - [ ] Performance Badge: **🔵 Excellent**
   - [ ] Strengths text displays
   - [ ] Improvements text displays
   - [ ] Ratings breakdown shows 18 questions with stars
3. Add Management Notes:
   ```
   Excellent first month performance. Continue current trajectory. Schedule check-in for Month 2.
   ```
4. Click **"Mark as Reviewed"**
5. Verify redirect to dashboard
6. Check John's review now shows **UNDER_REVIEW** status

#### Step 3: Process Jane's Review (Month 3 - Good)
1. Click "View Details" on Jane Smith's review
2. Verify:
   - [ ] Overall Score: **~76%**
   - [ ] Performance Badge: **🟢 Good**
   - [ ] 27 questions displayed
3. Add Management Notes:
   ```
   Solid performance. On track for successful probation completion. Encourage more proactive behavior.
   ```
4. Click **"Mark as Reviewed"**

#### Step 4: Process Bob's Review (Month 5 - CRITICAL)
1. Click "View Details" on Bob Anderson's review
2. Verify:
   - [ ] Overall Score: **~45%**
   - [ ] Performance Badge: **🔴 CRITICAL**
   - [ ] Critical alert in admin stats
3. Add Management Notes:
   ```
   URGENT: Schedule immediate meeting with client and staff. Discuss performance improvement plan or consider termination. Document all issues.
   ```
4. Click **"Mark as Reviewed"**
5. Verify **Critical** count updates

#### Step 5: Process Alice's Review (Recurring - Excellent)
1. Click "View Details" on Alice Garcia's review
2. Verify:
   - [ ] Overall Score: **~93%**
   - [ ] Performance Badge: **🔵 Excellent**
   - [ ] 18 questions displayed
3. Add Management Notes:
   ```
   Outstanding performance. Recommend for potential promotion or increased responsibilities. Valuable team asset.
   ```
4. Click **"Mark as Reviewed"**

#### Step 6: Verify Admin Dashboard
Check updated stats:
- [ ] **Under Review:** 4
- [ ] **Pending:** 8
- [ ] **Submitted:** 0
- [ ] **Critical:** 1

---

### PHASE 4: STAFF VIEW & ACKNOWLEDGMENT

#### Test Staff 1: John Doe (Excellent Performance)

1. **Login as John:**
   - Email: john.month1@test.com
   - Navigate to: `/reviews`

2. **Verify Timeline View:**
   - [ ] Header shows "1 Total Review"
   - [ ] Stats row displays:
     - Latest Score: 89%
     - Trend: (N/A for first review)
   - [ ] Review card shows:
     - **🆕 New Review** badge (animated pulse)
     - **🔵 Month 1** badge
     - Performance score: **89%**
     - **🔵 Excellent** badge
     - Feedback preview visible

3. **View Full Review:**
   - Click "View Full Review"
   - Modal opens with:
     - [ ] Full score display (89%)
     - [ ] Strengths text
     - [ ] Improvements text
     - [ ] Additional comments
     - [ ] 5-star rating display

4. **Acknowledge Review:**
   - Click **"Acknowledge Review"** button
   - [ ] Success message: "✅ Review acknowledged successfully!"
   - [ ] Modal closes
   - [ ] Page refreshes
   - [ ] Review card now shows:
     - **✅ Acknowledged** badge
     - No "New Review" badge
     - "Acknowledged on [date]" text

---

#### Test Staff 2: Jane Smith (Good Performance)

1. **Login as Jane:**
   - Email: jane.month3@test.com
   - Navigate to: `/reviews`

2. **Verify Display:**
   - [ ] Shows Month 3 review
   - [ ] Score: 76%
   - [ ] **🟢 Good** badge
   - [ ] Feedback preview

3. **Acknowledge:**
   - View and acknowledge review
   - Verify acknowledgment successful

---

#### Test Staff 3: Bob Anderson (Critical Performance)

1. **Login as Bob:**
   - Email: bob.month5@test.com
   - Navigate to: `/reviews`

2. **Verify Critical Display:**
   - [ ] Shows Month 5 review
   - [ ] Score: **45%**
   - [ ] **🔴 CRITICAL** badge (red)
   - [ ] Serious feedback visible

3. **View Feedback:**
   - Read critical feedback
   - Management notes about performance improvement plan
   - Acknowledge when ready

---

#### Test Staff 4: Alice Garcia (Excellent - Recurring)

1. **Login as Alice:**
   - Email: alice.recurring@test.com
   - Navigate to: `/reviews`

2. **Verify Excellent Display:**
   - [ ] Shows Recurring review
   - [ ] Score: **93%**
   - [ ] **🔵 Excellent** badge
   - [ ] Positive feedback

3. **Acknowledge:**
   - View outstanding feedback
   - Acknowledge review

---

### PHASE 5: FINAL VERIFICATION (Management)

#### Step 1: Check Completed Reviews
1. Login as Management
2. Go to `/admin/reviews`
3. Click **"Completed"** filter tab
4. Verify:
   - [ ] 4 reviews show COMPLETED status
   - [ ] All have **✅ Acknowledged** indicators
   - [ ] Acknowledged dates displayed

#### Step 2: Verify Stats
Check final dashboard stats:
- [ ] **Total:** 12
- [ ] **Pending:** 8 (not yet submitted)
- [ ] **Submitted:** 0
- [ ] **Under Review:** 0
- [ ] **Completed:** 4
- [ ] **Critical:** 0 (Bob's acknowledged)

#### Step 3: Test Filters
- [ ] "All" - Shows all 12 reviews
- [ ] "Pending" - Shows 8 pending reviews
- [ ] "Submitted" - Shows 0 (all processed)
- [ ] "Under Review" - Shows 0 (all acknowledged)
- [ ] "Completed" - Shows 4 completed reviews

---

## 📊 EXPECTED TEST RESULTS SUMMARY

### Reviews Created: 12
- **Month 1:** 3 reviews (John, Emma, Michael)
- **Month 3:** 3 reviews (Jane, David, Sarah)
- **Month 5:** 3 reviews (Bob, Linda, James)
- **Recurring:** 3 reviews (Alice, Robert, Patricia)

### Reviews Submitted: 4 (for full testing)
1. **John Doe (Month 1):** 89% - 🔵 Excellent
2. **Jane Smith (Month 3):** 76% - 🟢 Good
3. **Bob Anderson (Month 5):** 45% - 🔴 Critical
4. **Alice Garcia (Recurring):** 93% - 🔵 Excellent

### Performance Levels Tested:
- ✅ **Critical (< 50%):** Bob's review
- ✅ **Good (70-84%):** Jane's review
- ✅ **Excellent (85%+):** John's & Alice's reviews
- ⏳ **Needs Improvement (50-69%):** Not tested (create manually if needed)

### Status Flow Verified:
```
PENDING → SUBMITTED → UNDER_REVIEW → COMPLETED
   12         4             0             4
```

---

## 🎯 TESTING CHECKLIST

### Admin Portal ✅
- [ ] Dashboard loads without errors
- [ ] Stats cards show correct numbers
- [ ] "Trigger Review Creation" creates reviews
- [ ] Filter tabs work correctly
- [ ] Review cards display properly
- [ ] "View Details" opens detail page
- [ ] Review detail shows all information
- [ ] Ratings breakdown displays correctly
- [ ] Management notes can be added
- [ ] "Mark as Reviewed" processes successfully
- [ ] Critical reviews highlighted in red
- [ ] Overdue badges appear (if applicable)

### Staff Portal ✅
- [ ] Timeline view displays correctly
- [ ] Stats row shows accurate data
- [ ] Review cards show correct badges
- [ ] "New Review" indicators animate
- [ ] Performance scores display with colors
- [ ] Feedback previews visible
- [ ] "View Full Review" modal works
- [ ] Modal shows complete review details
- [ ] "Acknowledge Review" button functions
- [ ] Acknowledgment updates status
- [ ] Acknowledged badge appears
- [ ] 5-star ratings display correctly

### API Endpoints ✅
- [ ] POST /api/client/reviews - Submits successfully
- [ ] GET /api/client/reviews - Returns pending reviews
- [ ] GET /api/admin/reviews - Returns all reviews
- [ ] GET /api/admin/reviews/stats - Returns stats
- [ ] POST /api/admin/reviews/trigger-creation - Creates reviews
- [ ] PUT /api/admin/reviews - Processes reviews
- [ ] GET /api/reviews - Staff sees their reviews
- [ ] POST /api/reviews/[id]/acknowledge - Acknowledges successfully

### Scoring System ✅
- [ ] Ratings calculate correct percentages
- [ ] Performance levels assign correctly
- [ ] Critical scores (< 50%) show red badges
- [ ] Needs Improvement (50-69%) show yellow badges
- [ ] Good scores (70-84%) show green badges
- [ ] Excellent scores (85%+) show blue badges

### Complete Workflow ✅
- [ ] Admin creates reviews
- [ ] Client submits reviews (via API)
- [ ] Scores calculate automatically
- [ ] Admin processes submitted reviews
- [ ] Staff views new reviews
- [ ] Staff acknowledges reviews
- [ ] Status changes to COMPLETED
- [ ] All 4 status stages functional

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Trigger Review Creation" returns 0

**Cause:** Test staff not created yet

**Fix:** Run the SQL script in Step 1 above

---

### Issue: Can't submit review via API

**Cause:** Missing session cookie or wrong review ID

**Fix:**
1. Login as client in browser
2. Open DevTools → Application → Cookies
3. Copy session cookie value
4. Use in curl: `-H "Cookie: session=YOUR_COOKIE_VALUE"`

---

### Issue: Wrong number of ratings in submission

**Cause:** Review type mismatch

**Fix:** 
- Month 1: 18 ratings
- Month 3: 27 ratings
- Month 5: 24 ratings
- Recurring: 18 ratings

---

### Issue: Staff can't see their reviews

**Cause:** Review not yet in UNDER_REVIEW status

**Fix:**
1. Submit review as client (changes to SUBMITTED)
2. Process as admin (changes to UNDER_REVIEW)
3. Now staff can see it

---

## 🚀 QUICK START COMMAND SUMMARY

```bash
# 1. Kill any existing server on port 3000
lsof -ti:3000 | xargs kill -9

# 2. Start dev server
cd "gamified-dashboard (1)"
npm run dev

# 3. Run SQL script to create test staff (use database tool)
# See "Step 1: Create Staff Users" above

# 4. Test in browser
# Management: stephena@shoreagents.com → http://localhost:3000/admin/reviews
# Staff: john.month1@test.com → http://localhost:3000/reviews
```

---

## 📝 NOTES FOR TESTING

### Test Data Characteristics:
- **12 staff users** with varied start dates
- **4 review types** represented (3 of each)
- **4 performance levels** can be tested
- **Complete workflow** from creation to acknowledgment

### Realistic Scenarios:
- ✅ Excellent new hire (John - Month 1)
- ✅ Good mid-probation (Jane - Month 3)
- ✅ Critical pre-regularization (Bob - Month 5)
- ✅ Outstanding regular employee (Alice - Recurring)

### Time Savings:
- Pre-configured accounts (no manual creation)
- SQL script for instant setup
- API commands ready to use
- Complete test scenarios provided

---

## ✅ COMPLETION CRITERIA

Testing is complete when:

- [ ] All 12 test staff created
- [ ] All 12 reviews auto-created
- [ ] 4 reviews submitted (one of each type)
- [ ] All 4 performance levels displayed
- [ ] All 4 reviews processed by admin
- [ ] All 4 reviews acknowledged by staff
- [ ] All 4 status stages verified
- [ ] Admin dashboard shows correct stats
- [ ] Staff timeline displays correctly
- [ ] No console errors
- [ ] All API endpoints working

---

**Happy Testing! 🎉**

This comprehensive test will verify your complete Performance Review System is production-ready!

