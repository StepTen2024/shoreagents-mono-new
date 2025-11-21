# 🤖 AI ASSISTANT SYSTEM - DEEP DIVE RESEARCH

**Date:** November 21, 2025  
**Research By:** AI Assistant  
**Location:** `http://localhost:3000/ai-assistant` (Staff Only)  
**Status:** ✅ FULLY FUNCTIONAL - Production Ready

---

## 📊 EXECUTIVE SUMMARY

### **Current Setup:**
- **URL:** `/ai-assistant` - **STAFF ONLY** (redirects based on role)
- **For Clients:** `/client/knowledge-base` - Document management (NO AI CHAT)
- **For Admin:** `/admin/knowledge-base` - Document management (NO AI CHAT)
- **Component:** `components/ai-chat-assistant.tsx` (912 lines)
- **API:** `app/api/chat/route.ts` (385 lines)
- **Model:** Claude 3.5 Sonnet (Anthropic)

---

## 🎯 THREE DIFFERENT SYSTEMS

### **1. 🟣 STAFF: AI ASSISTANT** (`/ai-assistant`)
**What It Is:**
- Full AI chat interface with Claude 3.5 Sonnet
- **@mention documents and tasks** for context
- Upload documents (requires approval)
- Personalized AI that knows staff interests, hobbies, personality
- Task planning and daily reports
- Training assistance

**Key Features:**
- ✅ Chat with AI
- ✅ @mention documents (@Employee-Handbook)
- ✅ @mention tasks (@Fix-Bug)
- ✅ @All My Tasks for reports
- ✅ Document sidebar with search
- ✅ Upload documents (pending approval)
- ✅ AI knows your personality, hobbies, favorite game, etc.
- ✅ Streaming responses
- ✅ Markdown support

---

### **2. 🔵 CLIENT: KNOWLEDGE BASE** (`/client/knowledge-base`)
**What It Is:**
- Document repository **WITHOUT AI CHAT**
- Manage staff documents
- Approve/reject staff uploads
- Upload own procedures (auto-approved)
- View company policies from admin

**Key Features:**
- ✅ View all documents (staff + company)
- ✅ Approve/Reject staff PENDING documents
- ✅ Upload own procedures (auto-APPROVED)
- ✅ Search and filter
- ✅ Download documents
- ❌ NO AI chat interface
- ❌ Cannot @mention or ask questions

---

### **3. 🔴 ADMIN: KNOWLEDGE BASE** (`/admin/knowledge-base`)
**What It Is:**
- Company-wide document management **WITHOUT AI CHAT**
- Upload policies, SOPs, training materials
- All uploads auto-APPROVED
- Visible to ALL staff across ALL companies

**Key Features:**
- ✅ Upload company policies
- ✅ View all documents
- ✅ Auto-approved status
- ✅ Global visibility (all staff can see)
- ❌ NO AI chat interface
- ❌ Cannot @mention or ask questions

---

## 🏗️ TECHNICAL ARCHITECTURE

### **Role Detection Flow:**
```typescript
// In app/api/chat/route.ts (lines 41-97)

1. Session check → Get auth user ID

2. Try StaffUser first:
   - Fetch staff_users with interests & profile
   - userType = 'STAFF'
   - PERSONALIZED with hobbies, games, personality

3. If not staff, try ClientUser:
   - Fetch client_users
   - userType = 'CLIENT'
   - BASIC context only

4. If not client, try ManagementUser:
   - Fetch management_users
   - userType = 'ADMIN'
   - BASIC context only
```

### **Document Approval Workflow:**
```
STAFF uploads doc → status: PENDING
     ↓
CLIENT sees PENDING doc
     ↓
CLIENT clicks "Approve" → status: APPROVED
     ↓
STAFF can now @mention in AI chat
     ↓
AI can read and reference doc
```

### **Document Visibility Rules:**
| Uploader | Status | Staff Can See? | Client Can See? | Admin Can See? | AI Can Use? |
|----------|--------|----------------|-----------------|----------------|-------------|
| STAFF | PENDING | ✅ Own only | ✅ For approval | ✅ Yes | ❌ No |
| STAFF | APPROVED | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| STAFF | REJECTED | ✅ Own only | ✅ Yes | ✅ Yes | ❌ No |
| CLIENT | AUTO-APPROVED | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| ADMIN | AUTO-APPROVED | ✅ ALL staff | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🎨 UI/UX BREAKDOWN

### **Staff AI Assistant:**
```
┌─────────────────────────────────────────────┐
│  🤖 AI Assistant                            │
│  ┌───────────────┬───────────────────────┐  │
│  │  Documents    │  Chat Interface       │  │
│  │  (Sidebar)    │                       │  │
│  │               │  User: "help me"      │  │
│  │  📄 Handbook  │  AI:  "Sure! ..."     │  │
│  │  📄 Training  │                       │  │
│  │  📄 SEO Guide │  [@mention support]   │  │
│  │               │                       │  │
│  │  [Upload Doc] │  [Type message...] 📤 │  │
│  └───────────────┴───────────────────────┘  │
└─────────────────────────────────────────────┘
```

### **Client Knowledge Base:**
```
┌─────────────────────────────────────────────┐
│  📚 Knowledge Base                          │
│  ┌─────────────────────────────────────┐   │
│  │  [Upload Document] [Search...]      │   │
│  ├─────────────────────────────────────┤   │
│  │  📄 Staff Doc (PENDING)             │   │
│  │      [✅ Approve] [❌ Reject]        │   │
│  ├─────────────────────────────────────┤   │
│  │  📄 Training Manual (APPROVED)      │   │
│  │      [View] [Download]              │   │
│  ├─────────────────────────────────────┤   │
│  │  📄 Company Policy (ADMIN)          │   │
│  │      [View] [Download]              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 💡 AI PERSONALIZATION (Staff Only)

### **What AI Knows About Staff:**
```typescript
// From staff_interests table:
{
  favoriteGame: "Valorant",
  hobbies: "Gaming, Reading, Hiking",
  sportsInterest: "Basketball",
  musicTaste: "Lo-fi, Hip Hop",
  favoriteMoviesBooks: "Inception, 1984",
  favoriteColor: "Blue",
  foodPreferences: "Pizza, Sushi",
  dreamDestinations: "Japan, Iceland",
  petNames: "Luna (cat)",
  favoriteQuotes: "Stay hungry, stay foolish",
  funFacts: "Can solve Rubik's cube in under 2 min",
  personalityType: "INTJ",
  
  // From staff_profiles:
  currentRole: "SEO Specialist",
  daysEmployed: 247,
  timezone: "Asia/Manila",
  employmentStatus: "ACTIVE"
}
```

### **How AI Uses This:**
- **Personalized greetings:** "Hey [name], I know you love gaming..."
- **Relatable analogies:** "This task is like leveling up in Valorant!"
- **Motivational context:** "Based on your INTJ personality..."
- **Work style tips:** "As an SEO Specialist with 247 days..."

---

## 🔥 KEY FEATURES

### **1. @Mention System:**
```
User types: "@Employee-Handbook How do I request leave?"
     ↓
System detects: @Employee-Handbook
     ↓
Fetches document content from DB
     ↓
Sends to Claude with document as context
     ↓
AI responds with specific info from handbook
     ↓
Shows "Referenced: Employee-Handbook" badge
```

### **2. Task Reports:**
```
User types: "@All My Tasks What should I focus on today?"
     ↓
Fetches ALL user's tasks from DB
     ↓
Sends task list to Claude
     ↓
AI analyzes priorities, deadlines, blockers
     ↓
Returns prioritized daily plan
```

### **3. Document Upload:**
```
Staff uploads PDF
     ↓
CloudConvert extracts text
     ↓
Stored in DB with status: PENDING
     ↓
Client gets notification
     ↓
Client approves
     ↓
Status: APPROVED
     ↓
Now available for @mentions in AI
```

---

## 📂 DATABASE SCHEMA

### **documents table:**
```sql
{
  id: string (UUID)
  title: string
  category: "CLIENT" | "TRAINING" | "PROCEDURE" | "CULTURE" | "SEO"
  content: text (extracted from file)
  fileUrl: string (Supabase storage)
  uploadedBy: string (user ID)
  uploadedByRole: "STAFF" | "CLIENT" | "ADMIN"
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionNote: string (optional)
  companyId: string (for filtering)
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 🎯 USE CASES

### **Staff Examples:**
1. **Training:** `@Training-Manual How do I escalate a ticket?`
2. **Task Help:** `@Build-Dashboard I'm stuck on the login page`
3. **Daily Planning:** `@All My Tasks What should I focus on?`
4. **SEO Help:** `@SEO-Guide Best practices for meta descriptions?`
5. **Client Procedures:** `@Client-SOP How does client want reports?`

### **Current Limitations (Client/Admin):**
1. ❌ No AI chat interface
2. ❌ Cannot ask questions
3. ❌ Cannot @mention documents
4. ❌ Cannot get task reports
5. ✅ Can only manage documents
6. ✅ Can approve/reject uploads
7. ✅ Can upload own docs

---

## 🔧 API ENDPOINTS

### **AI Chat:**
- **POST** `/api/chat` - Send message to Claude
  - Input: `{ messages, documentIds, taskIds }`
  - Output: Streaming response
  - Checks user role for personalization
  - Filters documents by approval status

### **Documents:**
- **GET** `/api/documents` - Fetch user documents
  - Filters by role and approval status
- **POST** `/api/documents` - Upload document
  - Sets status based on role
- **DELETE** `/api/documents/[id]` - Delete document

### **Tasks:**
- **GET** `/api/tasks` - Fetch user tasks
  - For @mentions and reports

---

## 📊 CURRENT STATE ASSESSMENT

### **✅ What Works Great:**
1. Staff AI chat is **fully functional**
2. Document approval workflow is **solid**
3. @mention system is **intuitive**
4. Personalization is **impressive**
5. Streaming responses are **fast**
6. Claude 3.5 Sonnet is **powerful**

### **🎯 What's Different Per Role:**
| Feature | Staff | Client | Admin |
|---------|-------|--------|-------|
| AI Chat | ✅ Full | ❌ None | ❌ None |
| @Mentions | ✅ Yes | ❌ No | ❌ No |
| Upload Docs | ✅ Pending | ✅ Auto-approved | ✅ Auto-approved |
| Approve Docs | ❌ No | ✅ Yes | ✅ Yes |
| View Docs | ✅ Approved only | ✅ All | ✅ All |
| Task Reports | ✅ Yes | ❌ No | ❌ No |
| Personalization | ✅ Full | ❌ None | ❌ None |

---

## 🚀 CONCLUSION

**The AI Assistant is ONLY for STAFF!**

- Staff get the full AI chat experience
- Clients get a document approval system (knowledge base)
- Admin gets a document management system (knowledge base)

**No AI chat for Clients or Admin currently - it's a Staff-only productivity tool!**

---

## 📝 READY FOR YOUR INPUT

Now that you've seen the complete setup, **what do you want the AI Assistant to do?**

Tell me your vision and I'll help build it! 🚀

