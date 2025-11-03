# 🔥 REAL LOGINS - TEST THE 3-WAY FLOW

**Password for ALL users:** `password123`

---

## 1️⃣ LOGIN AS MARIA SANTOS (Staff)

**URL:** http://localhost:3000/login/staff

```
Email: maria.santos@techcorp.com
Password: password123
```

**What you'll see:**
- Staff dashboard (dark theme, gamified)
- Tasks, time tracking, performance
- AI assistant, social feed
- Her data from working at TechCorp Inc.

---

## 2️⃣ LOGIN AS HER CLIENT (TechCorp Inc.)

**URL:** http://localhost:3000/login/client

**OPTION A - CEO:**
```
Email: ceo@techcorp.com
Password: password123
Name: John Smith
```

**OPTION B - Manager:**
```
Email: wendy@techcorp.com
Password: password123
Name: Wendy Chen
```

**What you'll see:**
- Client portal (light blue theme, professional)
- Maria Santos in staff list
- Monitor her tasks, time, performance
- Knowledge base, reviews

---

## 3️⃣ LOGIN AS ADMIN

**URL:** http://localhost:3000/login/admin

**OPTION A - Shore Agents Admin:**
```
Email: sysadmin@shoreagents.com
Password: password123
```

**OPTION B - TechCorp Admin:**
```
Email: admin@techcorp.com
Password: password123
```

**What you'll see:**
- Admin dashboard (purple theme)
- Manage ALL staff, clients, assignments
- See Maria's assignment to TechCorp
- System-wide stats and reports

---

## 🔄 THE 3-WAY FLOW TO TEST:

### Test 1: Task Flow
1. **Client creates task** for Maria
2. **Maria sees task** in her staff portal (with blue "CLIENT" badge)
3. **Maria updates task** status
4. **Client sees update** in their portal
5. **Admin sees everything** in admin portal

### Test 2: Time Tracking Flow
1. **Maria clocks in** at staff portal
2. **Client sees** Maria is active
3. **Client views** Maria's time logs
4. **Admin sees** all time data

### Test 3: Document Flow
1. **Maria uploads** document in staff portal
2. **Client sees** document (purple "Staff Upload" badge)
3. **Client uploads** their own document
4. **Maria sees** client document (blue badge)
5. **Admin sees** all documents

### Test 4: Review Flow
1. **Admin sends** review request to client
2. **Client submits** review for Maria
3. **Maria views** her review
4. **Admin sees** completed review

---

## 🚀 QUICK START

**Dev server is already running on http://localhost:3000**

1. Open **3 browser windows** (or use incognito for each)
2. Login to each portal with credentials above
3. Test the flows to see data sync between portals

---

## 📊 STAFF ASSIGNMENT:

```
Maria Santos (maria.santos@techcorp.com)
    ↓
Assigned to TechCorp Inc.
    ↓
Managed by: John Smith (CEO) or Wendy Chen (Manager)
```

This is the REAL data connection in your database!

---

**All passwords:** `password123`
**All logins ready to test NOW!**

