# 🧪 Testing Guide - 3-Way Data Isolation Flow

## Test Sequence

### ✅ Test 1: Maria Santos - Staff Portal

**URL:** http://localhost:3000/login/staff

**Login Credentials:**
- Email: `maria.santos@shoreagents.com`
- Password: `Maria2024!`

**What to Check:**

1. **Dashboard (/)** - After login
   - ✅ Should see YOUR stats only
   - ✅ Should NOT see other staff members' data

2. **Time Tracking (/time-tracking)**
   - ✅ Should see ONLY Maria's time entries
   - ✅ Should NOT see time entries from other staff

3. **Team (/team)**
   - ✅ Header should say "TechCorp Team" (not just "Team Overview")
   - ✅ Should see ONLY staff assigned to TechCorp
   - ✅ Should NOT see staff from other clients

4. **Reviews (/reviews)**
   - ✅ Should see ONLY "FINALIZED" reviews
   - ✅ Filter tabs: "All", "New", "Acknowledged", "Archived"
   - ✅ Should NOT see "PENDING_APPROVAL" or "APPROVED" reviews
   - ✅ "New" tab = FINALIZED reviews needing acknowledgment

5. **Tasks (/tasks)**
   - ✅ Should see ONLY Maria's tasks
   - ✅ Tasks marked as "CLIENT" source = from TechCorp

6. **Breaks (/breaks)**
   - ✅ Should see ONLY Maria's breaks

---

### ✅ Test 2: Wendy (TechCorp CEO) - Client Portal

**URL:** http://localhost:3000/login/client

**Login Credentials:**
- Email: `wendy@techcorp.com`
- Password: `Wendy2024!`

**What to Check:**

1. **Dashboard (/client)**
   - ✅ Should see overview of ALL TechCorp staff
   - ✅ Should NOT see staff from other clients

2. **Staff (/client/staff)**
   - ✅ Should see Maria Santos + other TechCorp staff
   - ✅ Should see their performance metrics
   - ✅ Should NOT see unassigned staff

3. **Time Tracking (/client/time-tracking)**
   - ✅ Should see time entries for ALL TechCorp staff
   - ✅ Summary statistics across all staff
   - ✅ Can filter by specific staff member

4. **Monitoring (/client/monitoring)**
   - ✅ Should see performance metrics for ALL TechCorp staff
   - ✅ Productivity scores, activity levels
   - ✅ Should NOT see staff from other clients

5. **Tasks (/client/tasks)**
   - ✅ Should see ALL tasks for TechCorp staff
   - ✅ Can CREATE new tasks
   - ✅ When creating: Can only assign to TechCorp staff

6. **Reviews (/client/reviews)**
   - ✅ Can submit new review for TechCorp staff
   - ✅ Review created with "PENDING_APPROVAL" status
   - ✅ Can see history of submitted reviews

7. **Knowledge Base (/client/knowledge-base)**
   - ✅ Should see documents from TechCorp staff
   - ✅ Can upload documents

---

### ✅ Test 3: System Admin - Admin Portal

**URL:** http://localhost:3000/login/admin

**Login Credentials:**
- Email: `admin@shoreagents.com`
- Password: `Admin2024!`

**What to Check:**

1. **Dashboard (/admin)**
   - ✅ Should see stats for ALL staff across ALL clients
   - ✅ Can see global overview

2. **Staff (/admin/staff)**
   - ✅ Should see ALL staff members
   - ✅ Can filter by client
   - ✅ Includes unassigned staff

3. **Reviews (/admin/reviews)**
   - ✅ Should see ALL reviews regardless of status
   - ✅ Can see "PENDING_APPROVAL" reviews from clients
   - ✅ Can APPROVE review (PENDING_APPROVAL → APPROVED)
   - ✅ Can FINALIZE review (APPROVED → FINALIZED)
   - ✅ Once FINALIZED, staff member can now see it

4. **Time Tracking (/admin/time-tracking)**
   - ✅ Should see time entries from ALL staff
   - ✅ Can filter by staff ID or client ID
   - ✅ Can filter by date range

5. **Tasks (/admin/tasks)**
   - ✅ Should see ALL tasks across all staff
   - ✅ Can filter by source (SELF, CLIENT, MANAGER)
   - ✅ Can filter by status

6. **Clients (/admin/clients)**
   - ✅ Should see all client companies
   - ✅ Can manage client users

7. **Assignments (/admin/assignments)**
   - ✅ Should see all staff-client assignments
   - ✅ Can activate/deactivate assignments

---

## 🔒 Data Isolation Tests

### Test A: Staff Can't See Other Staff's Data
1. Log in as Maria Santos
2. Go to Time Tracking
3. ✅ VERIFY: Should ONLY see Maria's entries
4. ✅ VERIFY: Should NOT see entries from other staff

### Test B: Staff Only See Same-Client Teammates
1. Stay logged in as Maria
2. Go to Team page
3. ✅ VERIFY: Header says "TechCorp Team"
4. ✅ VERIFY: Only shows staff assigned to TechCorp
5. ✅ VERIFY: If there are staff assigned to other clients, they should NOT appear

### Test C: Staff Only See Finalized Reviews
1. Stay logged in as Maria
2. Go to Reviews page
3. ✅ VERIFY: Filter shows "New" (FINALIZED), NOT "Pending"
4. ✅ VERIFY: No PENDING_APPROVAL or APPROVED reviews visible

### Test D: Client Can Only See Their Assigned Staff
1. Log in as Wendy (TechCorp CEO)
2. Go to Staff page
3. ✅ VERIFY: Only shows TechCorp-assigned staff
4. Go to Time Tracking
5. ✅ VERIFY: Only shows time entries for TechCorp staff

### Test E: Client Can't Assign Tasks to Unassigned Staff
1. Stay logged in as Wendy
2. Go to Tasks page
3. Try to create a new task
4. ✅ VERIFY: Dropdown should ONLY show TechCorp staff
5. ✅ VERIFY: Cannot assign to staff from other clients

### Test F: Client Reviews Need Admin Approval
1. Stay logged in as Wendy
2. Go to Reviews page
3. Submit a new review for Maria Santos
4. ✅ VERIFY: Review created with "PENDING_APPROVAL"
5. Log out and log in as Maria
6. Go to Reviews page
7. ✅ VERIFY: New review NOT visible yet (needs admin to finalize)

### Test G: Admin Review Approval Flow
1. Log in as Admin
2. Go to Reviews page
3. ✅ VERIFY: Can see ALL reviews including PENDING_APPROVAL
4. Find the review Wendy just submitted
5. Approve it (PENDING_APPROVAL → APPROVED)
6. ✅ VERIFY: Status changes to APPROVED
7. Finalize it (APPROVED → FINALIZED)
8. ✅ VERIFY: Status changes to FINALIZED
9. Log out and log in as Maria
10. Go to Reviews page
11. ✅ VERIFY: Review NOW appears in "New" tab!

### Test H: Admin Can See Everything
1. Log in as Admin
2. Go to Time Tracking
3. ✅ VERIFY: See time entries from ALL staff
4. Apply filter by client (TechCorp)
5. ✅ VERIFY: Filtered to only TechCorp staff entries
6. Clear filter
7. ✅ VERIFY: Back to seeing ALL entries

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" error
- **Solution:** Clear browser cookies and re-login
- Make sure you're using the correct portal URL

### Issue: Not seeing sidebar
- **Solution:** Check that you're on the right portal:
  - Staff: `http://localhost:3000/` (after login at `/login/staff`)
  - Client: `http://localhost:3000/client/` (after login at `/login/client`)
  - Admin: `http://localhost:3000/admin/` (after login at `/login/admin`)

### Issue: Database schema errors
- **Solution:** Run migration:
  ```bash
  cd "/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)"
  pnpm prisma db push
  ```

### Issue: Server not responding
- **Solution:** Restart dev server:
  ```bash
  lsof -ti:3000 | xargs kill -9
  pnpm dev
  ```

---

## ✅ Success Criteria

All these should be TRUE:

- ✅ Maria sees ONLY her own data
- ✅ Maria sees ONLY TechCorp teammates
- ✅ Maria sees ONLY FINALIZED reviews
- ✅ Wendy sees ALL TechCorp staff data
- ✅ Wendy can ONLY create tasks for TechCorp staff
- ✅ Wendy's reviews need admin approval before staff sees them
- ✅ Admin sees EVERYTHING
- ✅ Admin can approve/finalize reviews
- ✅ Each portal has its own sidebar and layout

---

## 📊 Test Results Template

Copy this and fill it out as you test:

```
## Test Results - [Date]

### Maria Santos (Staff):
- [ ] Dashboard shows only her stats
- [ ] Time Tracking shows only her entries
- [ ] Team shows "TechCorp Team"
- [ ] Team shows only TechCorp staff
- [ ] Reviews shows only FINALIZED
- [ ] Tasks shows only her tasks

### Wendy (Client):
- [ ] Dashboard shows all TechCorp staff
- [ ] Staff page shows only TechCorp staff
- [ ] Time Tracking shows all TechCorp entries
- [ ] Can create tasks for TechCorp staff only
- [ ] Can submit reviews (PENDING_APPROVAL)
- [ ] Can view documents

### Admin:
- [ ] Can see ALL staff across all clients
- [ ] Can see ALL reviews (any status)
- [ ] Can approve reviews
- [ ] Can finalize reviews
- [ ] Can filter by client/staff
- [ ] Has full visibility

### Data Isolation:
- [ ] Staff can't see other staff's personal data
- [ ] Staff can't see unapproved reviews
- [ ] Clients can't see staff from other clients
- [ ] Review approval flow works correctly

## Issues Found:
[List any issues here]

## Notes:
[Any additional observations]
```

