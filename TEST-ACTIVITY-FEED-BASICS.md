# 🧪 ACTIVITY FEED - BASIC TESTING PLAN

## 📊 CURRENT STATUS (What We Need to Test)

### **1️⃣ STAFF PORTAL** (`/posts`)
**Routes:**
- `/posts` (Staff Social Feed)

**Filters Available:**
- 👥 All Staff
- 👨‍👩‍👧‍👦 My Team
- 🏢 My Client

**What Staff SHOULD See:**
- Posts with audience: `ALL_STAFF`, `ALL`, `EVERYONE`
- Posts from their team (same company)
- Posts from their client

**What Staff SHOULD NOT See:**
- `MANAGEMENT_ONLY` posts
- Other clients' posts
- Staff-only posts from other teams (unless `ALL_STAFF`)

---

### **2️⃣ CLIENT PORTAL** (`/client/posts`)
**Routes:**
- `/client/posts` (Client Team Feed)

**Filters Available:**
- None (just shows all posts they can see)

**What Clients SHOULD See:**
- Posts with audience: `MY_TEAM_AND_MANAGEMENT`, `ALL_CLIENTS`, `EVERYONE`, `ALL`
- Posts from their assigned staff
- Posts from management (if targeted)

**What Clients SHOULD NOT See:**
- `ALL_STAFF` posts (staff-only)
- `MANAGEMENT_ONLY` posts
- Posts from other clients' staff

---

### **3️⃣ ADMIN PORTAL** (`/admin/posts`)
**Routes:**
- `/admin/posts` (Management Social Feed)

**Filters Available:**
- 🌍 Everyone
- 🏢 All Clients
- 👥 All Staff
- 👔 Management

**What Management SHOULD See:**
- **EVERYTHING** (all posts across all audiences)

**What Management SHOULD NOT See:**
- Nothing - they see EVERYTHING

---

## 🎯 **TESTING CHECKLIST**

### **✅ STEP 1: Test Staff Portal** (`http://localhost:3000/posts`)

| Test | Expected Result | Status |
|------|----------------|--------|
| Login as staff | Redirects to `/posts` | [ ] |
| See "All Staff" posts | Shows posts with `ALL_STAFF`, `ALL`, `EVERYONE` | [ ] |
| Filter by "My Team" | Shows posts from same company/client | [ ] |
| Filter by "My Client" | Shows posts from assigned client | [ ] |
| Staff CANNOT see management posts | `MANAGEMENT_ONLY` posts hidden | [ ] |
| Staff CANNOT see other teams | Posts from other companies hidden | [ ] |
| Create new post | Post created successfully | [ ] |
| Select audience | Audience options: `ALL_STAFF`, `MY_TEAM`, `MY_CLIENT` | [ ] |

---

### **✅ STEP 2: Test Client Portal** (`http://localhost:3000/client/posts`)

| Test | Expected Result | Status |
|------|----------------|--------|
| Login as client | Redirects to `/client/posts` | [ ] |
| See team posts | Shows posts from assigned staff | [ ] |
| See management posts | Shows posts from management (if targeted) | [ ] |
| Client CANNOT see staff-only posts | `ALL_STAFF` posts hidden | [ ] |
| Client CANNOT see management-only | `MANAGEMENT_ONLY` posts hidden | [ ] |
| Client CANNOT see other clients | Posts from other clients hidden | [ ] |
| Create new post | Post created successfully | [ ] |
| Select audience | Audience options: `MY_TEAM_AND_MANAGEMENT`, `ALL_CLIENTS` | [ ] |

---

### **✅ STEP 3: Test Admin Portal** (`http://localhost:3000/admin/posts`)

| Test | Expected Result | Status |
|------|----------------|--------|
| Login as admin | Redirects to `/admin/posts` | [ ] |
| Filter "Everyone" | Shows `EVERYONE`, `ALL` posts | [ ] |
| Filter "All Clients" | Shows `ALL_CLIENTS`, `EVERYONE` posts | [ ] |
| Filter "All Staff" | Shows `ALL_STAFF_MGMT`, `ALL_STAFF`, `EVERYONE` posts | [ ] |
| Filter "Management" | Shows `MANAGEMENT_ONLY` posts | [ ] |
| Default view | Shows EVERYTHING (all audiences) | [ ] |
| Create new post | Post created successfully | [ ] |
| Select audience | All audience options available | [ ] |

---

## 🐛 **KNOWN ISSUES TO CHECK**

| Issue | Expected Behavior | Status |
|-------|-------------------|--------|
| Client using wrong API endpoint | Should use `/api/posts/feed` not `/api/posts` | [ ] |
| Staff not seeing team posts | Check if `companyId` relationship is correct | [ ] |
| Audience enum mismatch | Ensure all audience values match schema | [ ] |
| Reshare functionality | Can reshare posts and see original post | [ ] |
| Reactions work | Can react with emoji (👍, ❤️, 🎉, etc.) | [ ] |
| Comments work | Can comment on posts using universal comments | [ ] |

---

## 📋 **DATABASE SCHEMA TO VERIFY**

```prisma
enum PostAudience {
  ALL                      // Everyone can see
  EVERYONE                 // Everyone can see
  ALL_STAFF               // All staff (not clients)
  ALL_CLIENTS             // All clients
  ALL_STAFF_MGMT          // Staff + Management
  MY_TEAM                 // Staff's team only
  MY_CLIENT               // Staff's assigned client
  MY_TEAM_AND_MANAGEMENT  // Client's staff + Management
  MANAGEMENT_ONLY         // Management only
}
```

---

## 🚀 **TESTING STEPS**

1. **Clear browser cache** (hard refresh `Cmd+Shift+R`)
2. **Login as each role:**
   - Staff User
   - Client User
   - Management User
3. **Create test posts** with different audiences
4. **Switch between filters** to verify visibility
5. **Check console** for any errors
6. **Verify database** that posts are saved with correct audience

---

## 🎯 **SUCCESS CRITERIA**

✅ Staff ONLY sees staff-visible posts  
✅ Client ONLY sees client-visible posts  
✅ Management sees EVERYTHING  
✅ Filters work correctly for each role  
✅ Create post works for all roles  
✅ No console errors  
✅ No 401/403/404 errors  

---

**Ready to test? Let's go! 🚀**
