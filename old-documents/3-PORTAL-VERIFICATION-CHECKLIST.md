# ✅ 3-Portal System: Verification & Testing Checklist

**Created:** October 13, 2025  
**Purpose:** Ensure proper data isolation and access control across Admin, Staff, and Client portals

---

## 🎯 Critical Security Checks

### Authentication & Authorization

- [ ] **Admin Portal** - Only users with `role: ADMIN` can access `/admin/*`
- [ ] **Staff Portal** - Only users with `role: STAFF/TEAM_LEAD/MANAGER` can access staff features
- [ ] **Client Portal** - Only users with `clientUser` record can access `/client/*`
- [ ] Logout works properly in all 3 portals
- [ ] Session tokens expire correctly
- [ ] No cross-portal data leakage

### API Route Protection

#### Admin APIs (`/api/admin/*`)
- [ ] `/api/admin/staff` - Requires ADMIN role
- [ ] `/api/admin/clients` - Requires ADMIN role
- [ ] `/api/admin/client-users` - Requires ADMIN role
- [ ] `/api/admin/assignments` - Requires ADMIN role
- [ ] `/api/admin/reviews` - Requires ADMIN role
- [ ] `/api/admin/stats` - Requires ADMIN role

#### Staff APIs
- [ ] Staff can only access their own data
- [ ] Staff cannot see other staff members' private info
- [ ] Staff cannot modify system settings

#### Client APIs
- [ ] Client users can only see their organization's data
- [ ] Client users can only review assigned staff
- [ ] Client users cannot access other clients' data

---

## 🧪 Feature-by-Feature Testing

### 1. Staff Management

#### Test as ADMIN
- [ ] Can view all staff across all clients
- [ ] Can create new staff member
- [ ] Can edit any staff member
- [ ] Can deactivate staff
- [ ] Can change staff roles
- [ ] Can assign staff to clients

#### Test as STAFF
- [ ] Can view own profile
- [ ] Can update avatar/bio
- [ ] **CANNOT** see other staff members (except in leaderboard)
- [ ] **CANNOT** edit role or department

#### Test as CLIENT_USER
- [ ] Can view assigned staff only
- [ ] Can see staff performance metrics
- [ ] **CANNOT** edit staff details
- [ ] **CANNOT** see unassigned staff

---

### 2. Client Organizations

#### Test as ADMIN
- [ ] Can view all clients
- [ ] Can create new client
- [ ] Can edit client details
- [ ] Can deactivate clients
- [ ] Can assign staff to clients

#### Test as STAFF
- [ ] Can view clients they're assigned to
- [ ] **CANNOT** edit client details
- [ ] **CANNOT** see unassigned clients

#### Test as CLIENT_USER
- [ ] Can view own organization
- [ ] **CANNOT** edit organization (unless CLIENT_ADMIN)
- [ ] **CANNOT** see other organizations

---

### 3. Client Users

#### Test as ADMIN
- [ ] Can view all client users
- [ ] Can create client user accounts
- [ ] Can assign users to organizations
- [ ] Can deactivate users

#### Test as STAFF
- [ ] Can view client users they work with
- [ ] **CANNOT** create/edit client users

#### Test as CLIENT_USER
- [ ] Can view users in own organization
- [ ] Can update own profile
- [ ] **CANNOT** see users from other orgs

---

### 4. Assignments

#### Test as ADMIN
- [ ] Can view all assignments
- [ ] Can create assignments
- [ ] Can modify assignments
- [ ] Can delete assignments
- [ ] Can set review schedules

#### Test as STAFF
- [ ] Can view own assignments only
- [ ] Can see assignment details
- [ ] **CANNOT** create assignments
- [ ] **CANNOT** see other staff assignments

#### Test as CLIENT_USER
- [ ] Can view staff assigned to their org
- [ ] Can see assignment details
- [ ] **CANNOT** create/modify assignments

---

### 5. Reviews & Performance

#### Test as ADMIN
- [ ] Can view all reviews
- [ ] Can see pending reviews
- [ ] Can send review requests
- [ ] Can view review analytics
- [ ] Can export review data

#### Test as STAFF
- [ ] Can view reviews about themselves
- [ ] Can see review history
- [ ] **CANNOT** see other staff reviews
- [ ] **CANNOT** edit reviews

#### Test as CLIENT_USER
- [ ] Can submit reviews for assigned staff
- [ ] Can edit draft reviews
- [ ] Can view review history they submitted
- [ ] **CANNOT** review unassigned staff
- [ ] **CANNOT** see reviews from other clients

**Critical Test:** Client A should NOT see reviews submitted by Client B

---

### 6. Tasks

#### Test as ADMIN
- [ ] Can view all tasks
- [ ] Can create tasks for any staff
- [ ] Can modify/delete any task
- [ ] Can view task analytics

#### Test as STAFF
- [ ] Can view own tasks only
- [ ] Can create personal tasks
- [ ] Can mark tasks complete
- [ ] **CANNOT** see other staff tasks

#### Test as CLIENT_USER
- [ ] **CANNOT** see staff tasks (internal only)

---

### 7. Time Tracking

#### Test as ADMIN
- [ ] Can view all time entries
- [ ] Can export timesheet data
- [ ] Can edit time entries
- [ ] Can view time by client

#### Test as STAFF
- [ ] Can clock in/out
- [ ] Can view own time logs
- [ ] **CANNOT** see other staff time logs

#### Test as CLIENT_USER
- [ ] Can view hours logged by assigned staff
- [ ] Can see time breakdown
- [ ] **CANNOT** edit time entries

**Critical Test:** Client should only see hours for staff assigned to them

---

### 8. Gamification

#### Test as ADMIN
- [ ] Can view all gamification data
- [ ] Can award bonus points
- [ ] Can view leaderboards
- [ ] Can reset points

#### Test as STAFF
- [ ] Can view own points/level
- [ ] Can see leaderboard
- [ ] Can view achievements

#### Test as CLIENT_USER
- [ ] **CANNOT** see gamification (internal only)

---

### 9. Documents

#### Test as ADMIN
- [ ] Can view all documents
- [ ] Can upload documents
- [ ] Can delete documents
- [ ] Can assign documents to users/clients

#### Test as STAFF
- [ ] Can view documents assigned to them
- [ ] Can upload documents
- [ ] **CANNOT** see all documents
- [ ] **CANNOT** delete documents

#### Test as CLIENT_USER
- [ ] Can view their organization's documents
- [ ] Can upload documents
- [ ] **CANNOT** see other client documents

**Critical Test:** Client A should NOT see Client B's documents

---

### 10. Support Tickets

#### Test as ADMIN
- [ ] Can view all tickets
- [ ] Can assign tickets
- [ ] Can close tickets
- [ ] Can view analytics

#### Test as STAFF
- [ ] Can create tickets
- [ ] Can view own tickets
- [ ] **CANNOT** see other staff tickets

#### Test as CLIENT_USER
- [ ] Can create tickets
- [ ] Can view own org's tickets
- [ ] **CANNOT** see other client tickets

---

## 🚨 Known Issues to Fix

### High Priority
- [ ] **Documents page** - Schema mismatch (`uploadedAt` vs `createdAt`) - FIXED LOCALLY, NEEDS COMMIT
- [ ] **Client Users API** - Returns 403, needs auth fix
- [ ] **Review submission** - Test full flow from Admin → Client → Staff
- [ ] **Email notifications** - Not implemented yet

### Medium Priority
- [ ] **Analytics page** - Needs real data integration
- [ ] **Gamification page** - Needs completion
- [ ] **Activity logs** - Needs implementation
- [ ] **Settings page** - Needs real data

### Low Priority
- [ ] **Client self-service** - Allow clients to request staff changes
- [ ] **Bulk operations** - Import/export staff/clients
- [ ] **Advanced filtering** - Better search across all pages
- [ ] **Mobile responsiveness** - Optimize for mobile

---

## 🔄 Data Isolation Tests

### Test Scenario 1: Staff Assignment
```
1. Admin assigns Staff Member A to Client X
2. Login as Staff Member A → Should see Client X
3. Login as Staff Member B → Should NOT see Client X (unless also assigned)
4. Login as Client X Admin → Should see Staff Member A
5. Login as Client Y Admin → Should NOT see Staff Member A
```

### Test Scenario 2: Review Submission
```
1. Admin sends review request to Client X for Staff Member A
2. Login as Client X → Submit review for Staff Member A
3. Login as Staff Member A → Should see review from Client X
4. Login as Staff Member B → Should NOT see that review
5. Login as Client Y → Should NOT see that review request
```

### Test Scenario 3: Document Sharing
```
1. Admin uploads document and assigns to Client X
2. Login as Client X Admin → Should see document
3. Login as Staff Member (assigned to Client X) → Should see document
4. Login as Client Y → Should NOT see document
5. Login as Staff Member (not assigned) → Should NOT see document
```

### Test Scenario 4: Time Tracking
```
1. Staff Member A logs time for Client X
2. Login as Admin → Should see all time entries including A's
3. Login as Client X → Should see Staff Member A's time
4. Login as Client Y → Should NOT see Staff Member A's time
5. Login as Staff Member B → Should NOT see Staff Member A's time
```

---

## 🛡️ Security Checklist

### API Security
- [ ] All `/api/admin/*` routes check for ADMIN role
- [ ] All API routes validate session token
- [ ] No sensitive data in API responses (passwords, tokens)
- [ ] Input validation on all POST/PUT requests
- [ ] SQL injection protection (Prisma handles this)
- [ ] Rate limiting on sensitive endpoints

### Frontend Security
- [ ] No API keys or secrets in client-side code
- [ ] HTTPS only in production
- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] CSRF protection enabled (NextAuth handles this)

### Database Security
- [ ] Foreign key constraints properly set
- [ ] Soft deletes where appropriate
- [ ] Audit logs for sensitive operations
- [ ] Encrypted sensitive fields
- [ ] Regular backups configured

---

## 📋 Testing Accounts

### Admin Portal
```
Email: sysadmin@shoreagents.com
Password: admin123
Access: Full system access
```

### Staff Portal
```
Email: maria@shoreagents.com
Password: password123
Access: STAFF role
```

### Client Portal
```
Email: sarah@techcorp.com
Password: client123
Access: CLIENT_ADMIN for Tech Corp
```

---

## ✅ Testing Process

### Manual Testing Steps
1. **Clear browser cache** before each test
2. **Use incognito/private windows** for different roles
3. **Check browser console** for errors
4. **Check server logs** for unauthorized access attempts
5. **Test both success and failure cases**

### Automated Testing (Future)
- [ ] Set up Jest for unit tests
- [ ] Add Playwright for E2E tests
- [ ] Set up CI/CD pipeline
- [ ] Add test coverage reporting

---

## 🎯 Completion Criteria

Before marking the 3-portal system as "complete," ensure:

- [ ] All checkboxes above are marked ✅
- [ ] No data leakage between portals
- [ ] All known issues are resolved
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] User training materials created

---

## 📞 Support

**Issues Found?**
- Document in GitHub Issues
- Tag with `security` for security concerns
- Tag with `bug` for functionality issues
- Tag with `enhancement` for new features

**Contact:**
- Email: admin@shoreagents.com
- Slack: #shoreagents-dev

