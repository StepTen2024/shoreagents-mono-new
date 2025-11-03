# 🧪 TEST STAFF: SARAH TEST - COMPLETE SETUP

## ✅ STEP 1: CREATE SUPABASE AUTH USER

1. **Open Supabase Dashboard:**
   https://supabase.com/dashboard/project/hdztsymxdgpcqtorjgou/auth/users

2. **Click:** "Add User" → "Create new user"

3. **Enter Details:**
   - Email: `sarah.test@test.com`
   - Password: `password123`
   - Auto Confirm User: ✅ YES (check this box!)

4. **Click:** "Create User"

5. **COPY THE USER ID** - It will look like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## ✅ STEP 2: RUN SQL SCRIPT

1. **Open your PostgreSQL client** (or Supabase SQL Editor)

2. **Replace `YOUR_SUPABASE_USER_ID_HERE`** in `CREATE-TEST-STAFF-SARAH.sql` with the ID you copied

3. **Run the complete SQL script**

4. **You should see:**
   ```
   ✅ SUCCESS! Created:
      Staff: Sarah Test (sarah.test@test.com)
      Password: password123
      Company: StepTen
      Review: PENDING for stephen@stepten.io
   ```

---

## 🎯 TEST CREDENTIALS

### **STAFF (Sarah):**
- URL: http://localhost:3000/login/staff
- Email: `sarah.test@test.com`
- Password: `password123`

### **CLIENT (Stephen):**
- URL: http://localhost:3000/login/client
- Email: `stephen@stepten.io`
- Password: `qwerty12345`

### **ADMIN:**
- URL: http://localhost:3000/login/admin
- Email: `stephena@shoreagents.com`
- Password: `qwerty12345`

---

## 🔄 COMPLETE TESTING FLOW

### **1. CLIENT SUBMISSION (stephen@stepten.io)**
1. Login as client
2. Go to: http://localhost:3000/client/reviews
3. Click "Submit Review" for Sarah Test
4. Complete 7-step wizard
5. Submit review (status: PENDING → SUBMITTED)

### **2. ADMIN PROCESSING (stephena@shoreagents.com)**
1. Login as admin
2. Go to: http://localhost:3000/admin/reviews
3. Click "Process Review" for Sarah Test
4. Add management notes
5. Mark as reviewed (status: SUBMITTED → UNDER_REVIEW)

### **3. STAFF ACKNOWLEDGMENT (sarah.test@test.com)** ⭐
1. Login as staff
2. Go to: http://localhost:3000/reviews
3. View the review
4. Read feedback
5. Acknowledge review (status: UNDER_REVIEW → COMPLETED)

---

## 📝 WHAT WE'LL TEST

- ✅ **Client submission** (already tested with John Doe)
- ✅ **Admin processing** (already tested with John Doe)
- ⏳ **Staff acknowledgment** (NEW - will test with Sarah Test)

---

## 🚀 READY TO TEST!

Once you create Sarah in Supabase and run the SQL script, she will be:
- ✅ Assigned to StepTen (your company)
- ✅ Has a PENDING Month 1 review
- ✅ Review assigned to stephen@stepten.io
- ✅ Can login with password123
- ✅ Ready for complete flow testing

---

**SAVE THESE CREDENTIALS!**

