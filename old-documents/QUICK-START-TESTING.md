# 🚀 QUICK START - TESTING IN 5 MINUTES

**Dev Server:** Starting on http://localhost:3000  
**Full Guide:** See COMPLETE-TESTING-GUIDE.md

---

## 📋 PRE-REQUISITES

### 1. Create Test Staff (Run SQL Script)

Open your database tool (Prisma Studio, pgAdmin, etc.) and run:

```sql
-- Create 12 test staff (3 of each review type)

-- MONTH 1 STAFF (3 users - 25 days ago)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'john.month1@test.com', 'John Doe', 'auth_john_month1', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '25 days', NOW(), NOW()),
  (gen_random_uuid(), 'emma.month1@test.com', 'Emma Wilson', 'auth_emma_month1', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '25 days', NOW(), NOW()),
  (gen_random_uuid(), 'michael.month1@test.com', 'Michael Chen', 'auth_michael_month1', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '25 days', NOW(), NOW());

-- MONTH 3 STAFF (3 users - 85 days ago)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'jane.month3@test.com', 'Jane Smith', 'auth_jane_month3', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '85 days', NOW(), NOW()),
  (gen_random_uuid(), 'david.month3@test.com', 'David Martinez', 'auth_david_month3', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '85 days', NOW(), NOW()),
  (gen_random_uuid(), 'sarah.month3@test.com', 'Sarah Johnson', 'auth_sarah_month3', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '85 days', NOW(), NOW());

-- MONTH 5 STAFF (3 users - 145 days ago)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'bob.month5@test.com', 'Bob Anderson', 'auth_bob_month5', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '145 days', NOW(), NOW()),
  (gen_random_uuid(), 'linda.month5@test.com', 'Linda Taylor', 'auth_linda_month5', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '145 days', NOW(), NOW()),
  (gen_random_uuid(), 'james.month5@test.com', 'James Brown', 'auth_james_month5', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '145 days', NOW(), NOW());

-- RECURRING STAFF (3 users - 175 days ago)
INSERT INTO staff_users (id, email, name, "authUserId", "companyId", role, "startDate", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'alice.recurring@test.com', 'Alice Garcia', 'auth_alice_recurring', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '175 days', NOW(), NOW()),
  (gen_random_uuid(), 'robert.recurring@test.com', 'Robert Lee', 'auth_robert_recurring', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '175 days', NOW(), NOW()),
  (gen_random_uuid(), 'patricia.recurring@test.com', 'Patricia White', 'auth_patricia_recurring', (SELECT id FROM company LIMIT 1), 'STAFF', NOW() - INTERVAL '175 days', NOW(), NOW());
```

---

## 👥 LOGIN CREDENTIALS

| Role | Email | Access |
|------|-------|--------|
| **Management** | stephena@shoreagents.com | `/admin/reviews` |
| **Client** | stephen@stepten.ai | API submissions |
| **Test Staff** | john.month1@test.com | `/reviews` |

---

## ✅ 5-MINUTE TEST

### 1. Login as Management (1 min)
```
URL: http://localhost:3000
Login: stephena@shoreagents.com
Navigate: /admin/reviews
```

### 2. Create Reviews (30 sec)
- Click **"Trigger Review Creation"** button
- Should see: "✅ Created 12 reviews"

### 3. View Dashboard (30 sec)
- Check stats: **Total: 12, Pending: 12**
- See 12 review cards
- Click "View Details" on any review

### 4. Submit Test Review via API (1 min)
```bash
# Get review ID from dashboard, then:
curl -X POST http://localhost:3000/api/client/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "reviewId": "YOUR_REVIEW_ID",
    "ratings": [5,4,5,4,5,4,5,4,5,4,5,4,5,4,5,4,5,4],
    "strengths": "Excellent work!",
    "improvements": "Keep it up!"
  }'
```

### 5. Process Review (1 min)
- Refresh admin dashboard
- Find SUBMITTED review (blue badge)
- Click "View Details"
- Click **"Mark as Reviewed"**

### 6. View as Staff (1 min)
```
Logout
Login: john.month1@test.com
Navigate: /reviews
```
- See new review with "🆕 New Review" badge
- Click **"Acknowledge Review"**
- Done! ✅

---

## 📊 WHAT TO TEST

### Essential Tests ✅
- [ ] Admin can create reviews
- [ ] Admin dashboard shows stats
- [ ] Submit review via API
- [ ] Score calculates correctly
- [ ] Admin can process review
- [ ] Staff can view review
- [ ] Staff can acknowledge review

### Performance Levels 🎯
Test these scores:
- **🔴 Critical (<50%):** Use ratings of 1s and 2s
- **🟡 Needs Improvement (50-69%):** Use ratings of 2s and 3s
- **🟢 Good (70-84%):** Use ratings of 3s and 4s
- **🔵 Excellent (85%+):** Use ratings of 4s and 5s

### Sample API Submissions

**Excellent Score (89%):**
```json
{
  "reviewId": "MONTH_1_ID",
  "ratings": [5,4,5,4,5,4,5,4,5,4,5,4,5,4,5,4,5,4],
  "strengths": "Excellent communication and quality work!",
  "improvements": "Minor time management improvements needed."
}
```

**Critical Score (45%):**
```json
{
  "reviewId": "MONTH_5_ID",
  "ratings": [2,2,2,2,3,2,2,2,2,3,2,2,2,2,3,2,2,2,2,3,2,2,2,2],
  "strengths": "Punctual and follows basic instructions.",
  "improvements": "Significant quality and initiative concerns."
}
```

---

## 🎯 SUCCESS CRITERIA

Your system works if:

✅ Management can access `/admin/reviews`  
✅ "Trigger" creates 12 reviews  
✅ API submissions work  
✅ Scores calculate correctly  
✅ Admin can process reviews  
✅ Staff can view their reviews  
✅ Staff can acknowledge reviews  
✅ All 4 statuses work (PENDING → SUBMITTED → UNDER_REVIEW → COMPLETED)

---

## 🔧 TROUBLESHOOTING

**No reviews created?**
→ Run SQL script to create test staff first

**Can't submit via API?**
→ Get session cookie from browser DevTools

**Wrong number of ratings error?**
→ Month 1: 18, Month 3: 27, Month 5: 24, Recurring: 18

**Staff can't see reviews?**
→ Must be UNDER_REVIEW status (admin needs to process first)

---

## 📚 FULL DOCUMENTATION

For complete testing guide see:
- **COMPLETE-TESTING-GUIDE.md** - Full workflow with all 12 staff
- **DEPLOYMENT-SUCCESS.md** - Testing instructions
- **REVIEW-SYSTEM-COMPLETE.md** - System overview

---

**Ready? Let's test! 🚀**

1. Run SQL script above
2. Login: stephena@shoreagents.com
3. Go to: http://localhost:3000/admin/reviews
4. Click "Trigger Review Creation"
5. You're testing! 🎉

