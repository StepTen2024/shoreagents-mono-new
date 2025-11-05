# 🔧 SCRIPTS FOLDER AUDIT

**Total Scripts:** 60 files  
**Last Updated:** October 30, 2025

---

## 📋 CATEGORIES

### 🔥 **1. SERVER MANAGEMENT & DEBUGGING** (7 scripts)

| Script | Purpose | Status |
|--------|---------|--------|
| `nuclear-rebuild.sh` | Complete project rebuild (kills Node, clears caches, reinstalls deps) | ✅ **KEEP** - Essential for corrupted server |
| `fix-server-start.sh` | Fixes server start issues | ✅ **KEEP** |
| `diagnose-server.sh` | Diagnoses server problems | ✅ **KEEP** |
| `clean-database.ts` | Cleans up database | ⚠️ **REVIEW** - May be outdated |
| `check-time-tracking-data.ts` | Checks time tracking data integrity | ⚠️ **REVIEW** |
| `trigger-monitoring-refresh.js` | Triggers monitoring refresh | ⚠️ **REVIEW** |
| `main.js` | Unknown purpose (16KB file) | ❓ **UNKNOWN** - Needs investigation |

---

### 👥 **2. TEST USER CREATION** (15 scripts)

| Script | Purpose | Status |
|--------|---------|--------|
| `create-vanessa.js` | Creates Vanessa (test staff user) | ✅ **KEEP** - Recently used |
| `complete-vanessa.js` | Completes Vanessa's profile setup | ✅ **KEEP** - Recently used |
| `add-vanessa-docs.js` | Adds documents for Vanessa | ✅ **KEEP** |
| `add-vanessa-schedules.js` | Adds work schedules for Vanessa | ✅ **KEEP** |
| `update-vanessa-shift-6am.js` | Updates Vanessa's shift to 6 AM | ✅ **KEEP** - Recently used |
| `create-department-managers.js` | Creates management users for all departments | ✅ **KEEP** - Recently used |
| `create-test-users.ts` | Creates various test users | ⚠️ **REVIEW** |
| `create-test-staff.ts` | Creates test staff users | ⚠️ **REVIEW** |
| `create-sarah-test.ts` | Creates Sarah test user | ⚠️ **REVIEW** |
| `create-jim-test-user.js` | Creates Jim test user | ⚠️ **REVIEW** |
| `create-client-user.ts` | Creates client user | ⚠️ **REVIEW** |
| `create-nora-hire-flow.js` | Creates Nora's complete hire flow | ⚠️ **REVIEW** |
| `assign-nora-to-stephen-via-prisma.js` | Assigns Nora to Stephen client | ⚠️ **REVIEW** |
| `assign-jineva-account-manager.js` | Assigns Jineva as account manager | ⚠️ **REVIEW** |
| `create-admin.ts` | Creates admin user | ⚠️ **REVIEW** |
| `create-system-admin.ts` | Creates system admin | ⚠️ **REVIEW** |
| `create-management-profiles.js` | Creates management profiles | ⚠️ **REVIEW** - Empty file? |

---

### 🔧 **3. DATA FIXES & UPDATES** (11 scripts)

| Script | Purpose | Status |
|--------|---------|--------|
| `set-aaron-shift.js` | Sets Aaron's shift time | ⚠️ **REVIEW** |
| `update-aaron-date.js` | Updates Aaron's date | ⚠️ **REVIEW** |
| `fix-stephen-contract.js` | Fixes Stephen's contract | ⚠️ **REVIEW** |
| `delete-stephen-contract.js` | Deletes Stephen's contract | ⚠️ **REVIEW** |
| `nuke-stephen-contract.js` | Nukes Stephen's contract | ⚠️ **REVIEW** |
| `fix-client-company.ts` | Fixes client company data | ⚠️ **REVIEW** |
| `fix-staff-company.ts` | Fixes staff company data | ⚠️ **REVIEW** |
| `update-job-acceptance-email.js` | Updates job acceptance email | ⚠️ **REVIEW** |
| `update-past-interviews.js` | Updates past interviews | ⚠️ **REVIEW** |
| `mark-interviews-completed.js` | Marks interviews as completed | ⚠️ **REVIEW** |
| `delete-supabase-user.js` | Deletes Supabase auth user | ⚠️ **REVIEW** |

---

### 📊 **4. DATA QUERIES & REPORTS** (3 scripts)

| Script | Purpose | Status |
|--------|---------|--------|
| `get-client-staff.js` | Gets client staff data | ⚠️ **REVIEW** |
| `get-client-staff-performance.js` | Gets client staff performance data | ⚠️ **REVIEW** |
| `check-client-user.ts` | Checks client user data | ⚠️ **REVIEW** |
| `create-reviews-for-client.ts` | Creates reviews for client | ⚠️ **REVIEW** |

---

### 🤖 **5. NOVA AI BOT (SLACK)** (10 scripts)

| Script | Purpose | Status |
|--------|---------|--------|
| `launch-nova.js` | Launches Nova bot | ❓ **UNKNOWN** - Is this still used? |
| `nova-autonomous-demo.js` | Demo of autonomous Nova | ❓ **UNKNOWN** |
| `nova-dm-responder.js` | Nova DM responder | ❓ **UNKNOWN** |
| `nova-dm-responder-fixed.js` | Fixed version of DM responder | ❓ **UNKNOWN** |
| `nova-dm-responder-active.js` | Active version of DM responder | ❓ **UNKNOWN** |
| `nova-manual-response.js` | Manual Nova responses | ❓ **UNKNOWN** |
| `nova-mention-responder.js` | Nova mention responder | ❓ **UNKNOWN** |
| `nova-multi-channel-responder.js` | Multi-channel Nova responder | ❓ **UNKNOWN** |
| `nova-ultra-conservative.js` | Ultra conservative Nova | ❓ **UNKNOWN** |
| `nova-ultra-conservative-universal.js` | Universal ultra conservative Nova | ❓ **UNKNOWN** |
| `nova-universal-responder.js` | Universal Nova responder | ❓ **UNKNOWN** |
| `get-channel-id.js` | Gets Slack channel ID | ⚠️ **REVIEW** |

---

### 📝 **6. LINEAR TASK MANAGEMENT** (4 scripts)

| Script | Purpose | Status |
|--------|---------|--------|
| `create-linear-task.js` | Creates Linear task from markdown | ⚠️ **REVIEW** - Do we still use Linear? |
| `create-linear-task.sh` | Shell wrapper for Linear task creation | ⚠️ **REVIEW** |
| `create-task-for-kyle.sh` | Creates task for Kyle | ⚠️ **REVIEW** |
| `create-knowledge-cascade-task.js` | Creates knowledge cascade task | ⚠️ **REVIEW** |

---

### 🚀 **7. DEPLOYMENT & GIT** (2 scripts)

| Script | Purpose | Status |
|--------|---------|--------|
| `push-to-github.sh` | Pushes changes to GitHub | ⚠️ **REVIEW** - Use git directly? |
| `post-completion-report.sh` | Posts completion report | ⚠️ **REVIEW** |

---

### 📚 **8. DOCUMENTATION** (1 file)

| File | Purpose | Status |
|------|---------|--------|
| `README.md` | Documentation for Linear task scripts | ⚠️ **OUTDATED** - Only covers Linear |

---

## 🎯 RECOMMENDATIONS

### ✅ **KEEP THESE (Core Testing Scripts)**
- `nuclear-rebuild.sh` - Essential for server issues
- `fix-server-start.sh` - Server debugging
- `diagnose-server.sh` - Server debugging
- `create-vanessa.js` - Test user creation
- `complete-vanessa.js` - Test user setup
- `add-vanessa-docs.js` - Test data
- `add-vanessa-schedules.js` - Test data
- `update-vanessa-shift-6am.js` - Test data
- `create-department-managers.js` - Management test users

---

### 🧹 **CLEAN UP CANDIDATES**

#### 1. **Duplicate/Old User Creation Scripts**
- Multiple scripts for creating test users (Nora, Jim, Sarah, Aaron, Stephen)
- **Action:** Archive or delete if no longer needed

#### 2. **Nova AI Bot Scripts (11 files!)**
- Do we still use Nova?
- Are these scripts still functional?
- **Action:** Archive or delete if Nova is deprecated

#### 3. **Linear Task Scripts**
- Do we still use Linear for task management?
- **Action:** Archive if not in use

#### 4. **Contract Fix Scripts**
- Multiple scripts fixing Stephen's contract
- Seem like one-off fixes
- **Action:** Delete or archive

#### 5. **Empty/Unknown Files**
- `create-management-profiles.js` (0 bytes)
- `create-admin.ts` (0 bytes)
- `create-system-admin.ts` (0 bytes)
- **Action:** Delete

---

## 📁 PROPOSED NEW STRUCTURE

```
scripts/
├── README.md                           # Updated documentation
│
├── 1-server-management/
│   ├── nuclear-rebuild.sh              ✅ KEEP
│   ├── fix-server-start.sh             ✅ KEEP
│   └── diagnose-server.sh              ✅ KEEP
│
├── 2-test-users/
│   ├── create-vanessa.js               ✅ KEEP
│   ├── complete-vanessa.js             ✅ KEEP
│   ├── add-vanessa-docs.js             ✅ KEEP
│   ├── add-vanessa-schedules.js        ✅ KEEP
│   ├── update-vanessa-shift-6am.js     ✅ KEEP
│   └── create-department-managers.js   ✅ KEEP
│
├── 3-database-utils/
│   ├── delete-supabase-user.js         ⚠️ REVIEW
│   └── check-time-tracking-data.ts     ⚠️ REVIEW
│
└── archived/
    ├── nova-bots/                      # Nova AI bot scripts
    ├── linear-tasks/                   # Linear integration
    ├── old-test-users/                 # Old user creation scripts
    └── one-off-fixes/                  # One-time fix scripts
```

---

## 🚨 IMMEDIATE ACTIONS NEEDED

1. **Investigate `main.js`** - 16KB file with unknown purpose
2. **Decide on Nova bots** - Archive or keep?
3. **Update README.md** - Currently only covers Linear tasks
4. **Delete empty files** - Remove 0-byte files
5. **Archive old scripts** - Move one-off fixes to archive folder
6. **Create new scripts** (if needed):
   - `create-test-staff.js` - Standardized staff user creation
   - `create-test-client.js` - Standardized client user creation
   - `reset-test-data.js` - Reset all test data

---

## ❓ QUESTIONS FOR USER

1. **Nova AI Bot** - Do we still use this? 11 scripts taking up space.
2. **Linear Integration** - Still using Linear for tasks?
3. **Old Test Users** - Keep scripts for Nora, Jim, Sarah, Aaron, Stephen?
4. **Contract Scripts** - Keep Stephen's contract fix scripts?
5. **What is `main.js`?** - 16KB script with no clear purpose.

---

## 📊 STATISTICS

- **Total Scripts:** 60
- **Essential (Keep):** 9 scripts
- **Review Needed:** 40 scripts
- **Unknown/Investigate:** 11 scripts
- **Disk Space:** ~328 KB total
- **Largest File:** `main.js` (16KB)

---

**Next Steps:**
1. User reviews this audit
2. Decision on what to archive/delete
3. Reorganize into clean folder structure
4. Update README.md with current scripts
5. Create any missing utility scripts

