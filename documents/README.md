# 📚 Shore Agents Documentation

**Complete technical documentation for the Shore Agents BPO Platform**

---

## 📖 **Documentation Index:**

### **🗂️ Project Status & Truth**
- **[StepTenClusterFuck.md](./StepTenClusterFuck.md)** - The living truth document
  - Current project status
  - What's working vs broken
  - Recent changes & fixes
  - Known issues
  - Testing notes
  - **Start here!**

---

### **🗄️ Database & Schema**
- **[DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md)** - Complete database documentation
  - All 36 tables explained
  - Relationships & enums
  - Design patterns
  - Security considerations
  - Migration history
  - Quick reference queries

---

### **🎨 UI & Design**
- **[UI-STYLE-GUIDE.md](./UI-STYLE-GUIDE.md)** - Complete UI style guide (Latest)
  - Staff Portal styling (Fun, Engaging, Gamified)
  - Client Portal styling (Sleek, Professional, Trustworthy)
  - Management Portal styling (Dark, Techy, Futuristic)
  - Color palettes, typography, components
  - Animations, shadows, responsive design
  - Implementation checklist

- **[UI-STYLE-GUIDE-v1.md](./UI-STYLE-GUIDE-v1.md)** - Earlier version (archived)

---

### **🚀 Business Flow**
- **[BUSINESS-FLOW.md](./BUSINESS-FLOW.md)** - How the entire system works
  - Recruitment → Onboarding → Daily operations
  - 10-phase workflow explained
  - Role of Electron app
  - AI Assistant functionality
  - Time tracking & accountability
  - Task management & support tickets
  - Performance reviews & social feed
  - Universal comments & reactions

---

### **☁️ Storage & Assets**
- **[SUPABASE-STORAGE-STRATEGY.md](./SUPABASE-STORAGE-STRATEGY.md)** - Storage architecture
  - 3 main buckets (staff, client, management)
  - Folder structure strategy
  - File naming conventions
  - RLS policies
  - Migration plan
  - Developer quick reference

---

### **🔧 Scripts & Tools**
- **[SCRIPTS-AUDIT.md](./SCRIPTS-AUDIT.md)** - Complete scripts folder audit
  - 60 scripts categorized by purpose
  - Server management & debugging tools
  - Test user creation scripts
  - Data fixes & utilities
  - Recommendations for cleanup
  - Proposed reorganization

---

## 🎯 **Quick Start for New Developers:**

### **Day 1: Understand the System**
1. Read [BUSINESS-FLOW.md](./BUSINESS-FLOW.md) - Understand WHAT we're building
2. Read [StepTenClusterFuck.md](./StepTenClusterFuck.md) - See current status
3. Read [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Understand data structure

### **Day 2: Start Building**
4. Read [UI-STYLE-GUIDE.md](./UI-STYLE-GUIDE.md) - Learn portal styling
5. Read [SUPABASE-STORAGE-STRATEGY.md](./SUPABASE-STORAGE-STRATEGY.md) - File uploads
6. Check [StepTenClusterFuck.md](./StepTenClusterFuck.md) for next priorities

---

## 🏗️ **Project Architecture:**

### **Portals (3 Separate UIs):**
```
👤 Staff Portal    - /app/(staff)/
🏢 Client Portal   - /app/(client)/
👔 Management      - /app/(management)/
```

### **Components:**
```
🎯 /staff/         - Staff-only components
🏢 /client/        - Client-only components
👔 /management/    - Management-only components
🔄 /shared/        - Reusable across portals
🌍 /universal/     - Works everywhere (comments, reactions, share)
🎨 /custom/        - One-off specialized components
```

### **APIs:**
```
🌐 /api/social/        - Universal (comments, reactions, shared-activities)
👤 /api/staff/         - Staff-specific
🏢 /api/client/        - Client-specific
👔 /api/management/    - Management-specific
```

---

## 🔥 **Key Features:**

### **Universal Social Layer:**
- ✅ **Comments** - Work on ANY entity (tickets, tasks, documents, posts, etc.)
- ✅ **Reactions** - 10 reaction types on anything
- ✅ **Share Activity** - User-controlled achievement sharing

### **Staff Features:**
- ✅ Time Tracking (clock in/out, early/late detection, full shift calculation)
- ✅ Performance Analytics (Electron app tracking)
- ✅ Task Management
- ✅ Support Tickets
- ✅ Gamification & Leaderboard
- ✅ AI Assistant

### **Client Features:**
- ✅ View staff performance
- ✅ Assign tasks
- ✅ Performance reviews
- ✅ Recruitment (browse/hire talent)
- ✅ Knowledge base management

### **Management Features:**
- ✅ Staff management (onboarding, offboarding, reviews)
- ✅ Client management
- ✅ Ticket auto-assignment by department
- ✅ Company-wide analytics
- ✅ Recruitment pipeline

---

## 📊 **Database Stats:**

- **36 Tables Total**
  - 21 Staff tables (`staff_*`)
  - 7 Client tables (`client_*`)
  - 4 Management tables (`management_*`)
  - 4 Universal tables (comments, reactions, posts, shared_activities)
  
- **40+ Enums**
- **Clean Schema** (no redundancy, clear ownership)
- **Universal Patterns** (comments & reactions work everywhere)

---

## 🎨 **UI Styling:**

### **Staff Portal:** 🟦
- Dark background (slate 950)
- Vibrant gradients (indigo → purple)
- Fun animations (bounce, pulse, confetti)
- Gamified feel

### **Client Portal:** 🟢
- White background
- Professional blue/cyan
- Sleek & trustworthy
- Minimal animations

### **Management Portal:** 🟣
- Dark background (slate 950)
- Neon purple/indigo accents
- Futuristic glow effects
- Command center aesthetic

---

## 📝 **Documentation Maintenance:**

**Always update [StepTenClusterFuck.md](./StepTenClusterFuck.md) when:**
- ✅ Fixing bugs
- ✅ Adding features
- ✅ Changing architecture
- ✅ Discovering issues
- ✅ Testing flows

**This keeps the truth document ACCURATE!**

---

## 🤝 **Contributing:**

1. Read the docs (start with BUSINESS-FLOW.md)
2. Check StepTenClusterFuck.md for current priorities
3. Follow UI-STYLE-GUIDE.md for styling
4. Use DATABASE-SCHEMA.md for queries
5. Update StepTenClusterFuck.md after changes

---

**Last Updated:** October 30, 2025  
**Status:** ✅ Clean, organized, production-ready architecture

