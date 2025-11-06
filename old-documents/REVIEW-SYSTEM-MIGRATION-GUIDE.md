# 🚀 REVIEW SYSTEM - MIGRATION & TESTING GUIDE

**Date:** October 16, 2025  
**System:** FILO Works Performance Review System  
**Status:** Ready for Migration

---

## 📋 PRE-MIGRATION CHECKLIST

Before running any commands, verify:

- [ ] You're in the correct directory: `gamified-dashboard (1)/`
- [ ] Node.js is installed: `node --version`
- [ ] npm is installed: `npm --version`
- [ ] Database is running (PostgreSQL/MySQL/SQLite)
- [ ] `.env` file has correct `DATABASE_URL`
- [ ] No uncommitted changes you want to keep

---

## 🔧 STEP 1: RUN PRISMA MIGRATION

### Option A: Create New Migration (Recommended)

```bash
cd "gamified-dashboard (1)"
npx prisma migrate dev --name add_performance_review_system
```

**What this does:**
- Creates a new migration file
- Updates your database schema
- Generates Prisma Client with new types
- Creates the `reviews` table
- Adds ReviewType and ReviewStatus enums

### Option B: Reset Database (Destructive - Use Only in Dev)

```bash
cd "gamified-dashboard (1)"
npx prisma migrate reset
```

⚠️ **WARNING:** This deletes ALL data and re-runs all migrations from scratch!

### Verify Migration

```bash
npx prisma studio
```

- Open Prisma Studio
- Check for `reviews` table
- Verify columns match schema

---

## 🧪 STEP 2: CREATE TEST DATA

### Method 1: Manual Trigger (Easiest)

1. Start your dev server:
```bash
npm run dev
```

2. Login as Admin

3. Navigate to: `http://localhost:3000/admin/reviews`

4. Click **"Trigger Review Creation"** button

5. This will:
   - Check all staff users
   - Calculate which reviews are due
   - Create reviews based on `startDate`
   - Return count of created reviews

### Method 2: API Call (For Testing)

```bash
curl -X POST http://localhost:3000/api/admin/reviews/trigger-creation \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie-here"
```

### Method 3: Seed File (Advanced)

Create test reviews in `prisma/seed.ts`:

```typescript
// Add to seed.ts
const testReviews = await prisma.review.createMany({
  data: [
    {
      staffUserId: "staff-user-id-here",
      type: "MONTH_1",
      status: "PENDING",
      client: "Test Client",
      reviewer: "client@example.com",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      evaluationPeriod: "First 30 days"
    }
    // Add more...
  ]
})

console.log("✅ Created", testReviews.count, "test reviews")
```

Then run:
```bash
npx prisma db seed
```

---

## 🧭 STEP 3: TEST ADMIN PORTAL

### Navigate to Admin Reviews
1. Login as admin
2. Go to: `/admin/reviews`

### Test Dashboard
- [ ] Stats cards show correct numbers
- [ ] Pending reviews count is accurate
- [ ] Overdue reviews highlighted in red
- [ ] Filter tabs work (all, pending, submitted, etc.)
- [ ] Review cards display correctly
- [ ] Badges show proper colors
- [ ] "Trigger Review Creation" button works

### Test Review Detail
1. Click "View Details" on any review
2. Verify:
   - [ ] Staff info displays
   - [ ] Review type badge correct
   - [ ] Status badge correct
   - [ ] All sections render
   - [ ] Management notes textarea works
   - [ ] "Mark as Reviewed" button appears for SUBMITTED reviews
   - [ ] Sidebar info is accurate

### Test Processing
1. Find a review with status SUBMITTED
2. Click "View Details"
3. Add management notes (optional)
4. Click "Mark as Reviewed"
5. Verify:
   - [ ] Status changes to UNDER_REVIEW
   - [ ] Success message appears
   - [ ] Redirects to review list
   - [ ] Review updated in dashboard

---

## 👤 STEP 4: TEST STAFF PORTAL

### Navigate to Staff Reviews
1. Login as staff user
2. Go to: `/reviews`

### Test Timeline View
- [ ] Header shows total review count
- [ ] Stats row displays (avg score, latest, trend, acknowledged)
- [ ] Reviews timeline renders
- [ ] Review cards show correct info
- [ ] "New Review" indicators for UNDER_REVIEW status
- [ ] Performance score badges with colors
- [ ] Feedback previews display
- [ ] 5-star ratings render

### Test Review Detail Modal
1. Click "View Full Review" on any review
2. Verify:
   - [ ] Modal opens
   - [ ] Full review details show
   - [ ] Score displays correctly
   - [ ] Strengths/improvements/comments visible
   - [ ] "Close" button works
   - [ ] "Acknowledge" button appears for new reviews

### Test Acknowledgment
1. Find a review with UNDER_REVIEW status
2. Click "Acknowledge Review"
3. Verify:
   - [ ] Success message appears
   - [ ] Status changes to COMPLETED
   - [ ] "Acknowledged" badge appears
   - [ ] Review refreshes

---

## 📊 STEP 5: TEST API ENDPOINTS

### Test Client Submit Review (No UI Yet)

```bash
curl -X POST http://localhost:3000/api/client/reviews \
  -H "Content-Type: application/json" \
  -H "Cookie: your-client-auth-cookie" \
  -d '{
    "reviewId": "your-review-id",
    "ratings": [4,5,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,3],
    "strengths": "Excellent communication and quality work!",
    "improvements": "Could improve time management",
    "additionalComments": "Overall very satisfied with performance"
  }'
```

Expected response:
```json
{
  "success": true,
  "review": { ... },
  "score": {
    "overallScore": 80,
    "performanceLevel": "good"
  }
}
```

### Test Staff Get Reviews

```bash
curl http://localhost:3000/api/reviews \
  -H "Cookie: your-staff-auth-cookie"
```

### Test Admin Get Stats

```bash
curl http://localhost:3000/api/admin/reviews/stats \
  -H "Cookie: your-admin-auth-cookie"
```

---

## ✅ COMPLETE WORKFLOW TEST

### Full End-to-End Test

#### Step 1: Create Review (Admin)
1. Login as admin
2. Go to `/admin/reviews`
3. Click "Trigger Review Creation"
4. Verify reviews created

#### Step 2: Submit Review (Client - API)
```bash
POST /api/client/reviews
{
  "reviewId": "...",
  "ratings": [4,5,3,4,5,3,4,5,3,4,5,3,4,5,3,4,5,3],
  "strengths": "Great work!",
  "improvements": "Room for growth"
}
```

#### Step 3: Process Review (Admin)
1. Login as admin
2. Go to `/admin/reviews`
3. Find SUBMITTED review
4. Click "View Details"
5. Add management notes
6. Click "Mark as Reviewed"

#### Step 4: View & Acknowledge (Staff)
1. Login as staff
2. Go to `/reviews`
3. See new review with purple "🆕 New Review" badge
4. Click "View Full Review"
5. Read feedback
6. Click "Acknowledge Review"

#### Step 5: Verify Completion (Admin)
1. Login as admin
2. Go to `/admin/reviews`
3. Filter by "Completed"
4. Verify review shows as COMPLETED

---

## 🐛 TROUBLESHOOTING

### Migration Fails

**Error:** `Cannot find module './Either.js'`  
**Fix:** Update Prisma:
```bash
npm install @prisma/client@latest prisma@latest
npx prisma generate
```

**Error:** `Database schema is not in sync`  
**Fix:**
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Review Creation Returns 0

**Cause:** No staff users have appropriate `startDate`  
**Fix:**
1. Check staff_users table has startDate values
2. Manually set startDate to 25 days ago for testing:
```sql
UPDATE staff_users 
SET startDate = DATE_SUB(NOW(), INTERVAL 25 DAY) 
WHERE id = 'your-test-user-id';
```

### UI Not Showing Reviews

**Cause:** Authentication/permission issue  
**Fix:**
1. Check you're logged in as correct role
2. Verify API routes return data
3. Check browser console for errors
4. Verify session/auth cookies

### Scores Not Calculating

**Cause:** Ratings array mismatch  
**Fix:**
1. Ensure ratings array matches question count
2. Month 1: 18 questions
3. Month 3: 27 questions
4. Month 5: 24 questions
5. Recurring: 18 questions

---

## 📝 COMMON TESTING SCENARIOS

### Scenario 1: Month 1 Review
- Staff startDate = 25 days ago
- Trigger creation → Creates MONTH_1 review
- Client submits with 18 ratings
- Admin processes
- Staff acknowledges

### Scenario 2: Overdue Review
- Create review with dueDate in past
- Verify red "Overdue" badge appears
- Test overdue count in admin stats

### Scenario 3: Critical Score
- Submit review with low ratings (all 1s and 2s)
- Verify red "Critical" badge
- Check critical count in admin stats

### Scenario 4: Performance Trend
- Create 3+ reviews for same staff
- Vary scores (e.g., 60%, 70%, 85%)
- Check staff portal shows "📈 improving"

---

## 🎯 SUCCESS CRITERIA

Migration is successful if:

- [ ] Database migration completes without errors
- [ ] Admin can create reviews via trigger
- [ ] Admin can view all reviews in dashboard
- [ ] Admin can process SUBMITTED reviews
- [ ] Staff can view UNDER_REVIEW reviews
- [ ] Staff can acknowledge reviews
- [ ] Scores calculate correctly
- [ ] Badges show proper colors
- [ ] No console errors
- [ ] All API endpoints respond correctly
- [ ] Performance trends display

---

## 🚀 READY FOR PRODUCTION

Once all tests pass:

1. **Commit your code:**
```bash
git add .
git commit -m "feat: Add performance review system"
```

2. **Push to repository:**
```bash
git push origin your-branch-name
```

3. **Deploy to production:**
- Run migration on production database
- Verify environment variables set
- Test with real users in staging first
- Monitor for errors after deployment

---

## 📞 SUPPORT

If you encounter issues:

1. Check REVIEW-SYSTEM-FINAL-STATUS.md for overview
2. Review API routes for correct authentication
3. Verify Prisma schema matches database
4. Check browser console for errors
5. Test API endpoints with curl/Postman

---

**Happy Testing! 🎉**

The performance review system is production-ready and waiting to transform your staff management process!

