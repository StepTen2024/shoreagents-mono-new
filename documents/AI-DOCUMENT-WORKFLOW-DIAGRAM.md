# 📊 AI ASSISTANT - DOCUMENT WORKFLOW DIAGRAM

---

## 🔄 DOCUMENT APPROVAL FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                     STAFF UPLOADS DOCUMENT                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Status: PENDING   │ ⏳
         │  uploadedByRole:   │
         │  STAFF             │
         └────────┬───────────┘
                  │
                  ├─────────────────────────────────────────┐
                  │                                         │
                  ▼                                         ▼
    ┌─────────────────────────┐           ┌─────────────────────────┐
    │   CLIENT REVIEWS DOC    │           │  STAFF SEES OWN DOC     │
    │   (Knowledge Base)      │           │  Status: PENDING        │
    │                         │           │  ⚠️ NOT in AI Chat!     │
    └────────┬────────────────┘           └─────────────────────────┘
             │
             ├────────────────┬─────────────────┐
             │                │                 │
             ▼                ▼                 ▼
     ┌───────────┐    ┌──────────┐     ┌──────────────┐
     │ ✓ APPROVE │    │ ✗ REJECT │     │ (Ignore it)  │
     └─────┬─────┘    └────┬─────┘     └──────────────┘
           │               │
           │               │
           ▼               ▼
  ┌─────────────┐  ┌──────────────────┐
  │  APPROVED   │  │    REJECTED      │
  │  Status:    │  │    Status:       │
  │  APPROVED   │  │    REJECTED      │
  │  ✅         │  │    ❌            │
  └──────┬──────┘  │    rejectionNote:│
         │         │    "Please fix   │
         │         │    formatting"   │
         │         └────────┬─────────┘
         │                  │
         │                  │
         ▼                  ▼
┌────────────────┐  ┌──────────────────┐
│ NOW VISIBLE    │  │ STAFF REVISES    │
│ IN AI CHAT!    │  │ Re-uploads new   │
│ Staff can @    │  │ version          │
│ mention it     │  │ Status: PENDING  │
└────────────────┘  └──────────────────┘
```

---

## 🎯 ROLE-BASED VISIBILITY

```
┌───────────────────────────────────────────────────────────────┐
│                       ADMIN UPLOADS                           │
│                  (Company Policies, SOPs)                     │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Status: APPROVED│ ✅
                   │ uploadedByRole: │
                   │ ADMIN           │
                   │ sharedWithAll:  │
                   │ true            │
                   └────────┬────────┘
                            │
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
         ┌─────────────┐         ┌─────────────┐
         │  ALL STAFF  │         │  ALL STAFF  │
         │  (Company A)│         │  (Company B)│
         │  Can see it │         │  Can see it │
         │  in AI Chat │         │  in AI Chat │
         └─────────────┘         └─────────────┘

┌───────────────────────────────────────────────────────────────┐
│                       CLIENT UPLOADS                          │
│                  (Client Procedures, Guides)                  │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Status: APPROVED│ ✅
                   │ uploadedByRole: │
                   │ CLIENT          │
                   │ companyId:      │
                   │ abc-123         │
                   └────────┬────────┘
                            │
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
         ┌─────────────┐         ┌─────────────┐
         │ STAFF from  │         │ STAFF from  │
         │ Company A   │         │ Company B   │
         │ ✅ CAN SEE  │         │ ❌ CANNOT   │
         │             │         │    SEE      │
         └─────────────┘         └─────────────┘

┌───────────────────────────────────────────────────────────────┐
│                       STAFF UPLOADS                           │
│                  (Work Samples, Drafts)                       │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Status: PENDING │ ⏳
                   │ uploadedByRole: │
                   │ STAFF           │
                   │ staffUserId:    │
                   │ john-123        │
                   └────────┬────────┘
                            │
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
         ┌─────────────┐         ┌─────────────┐
         │  THE STAFF  │         │ THEIR CLIENT│
         │  (John)     │         │ (Company A) │
         │  ✅ Can see │         │ ✅ Can see  │
         │  (PENDING)  │         │  (Review it)│
         └─────────────┘         └─────────────┘
                                         │
                                         │ Approves
                                         ▼
                                 ┌─────────────┐
                                 │ NOW VISIBLE │
                                 │ IN AI CHAT  │
                                 │ (APPROVED)  │
                                 └─────────────┘
```

---

## 🧠 AI PERSONALIZATION FLOW

```
┌───────────────────────────────────────────────────────────────┐
│                   STAFF USER LOGS IN                          │
│                    Opens AI Assistant                         │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  API FETCHES:   │
                   │  • User profile │
                   │  • Interests    │
                   │  • Documents    │
                   │  • Tasks        │
                   └────────┬────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │     BUILD PERSONALIZATION CONTEXT    │
         │                                      │
         │  • Name: John Smith                  │
         │  • Favorite Game: Valorant           │
         │  • Hobby: Photography                │
         │  • Sport: Basketball                 │
         │  • Music: Lo-fi Hip Hop              │
         │  • Dream Destination: Tokyo          │
         │  • Personality: INTJ                 │
         │  • Role: Content Specialist          │
         │  • Days Employed: 87                 │
         └────────┬─────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────┐
    │   INJECT INTO AI SYSTEM PROMPT      │
    │                                     │
    │   "You are helping John with BPO   │
    │   work. He loves Valorant and      │
    │   photography. Make conversations  │
    │   relatable to his interests!"     │
    └────────┬────────────────────────────┘
             │
             ▼
   ┌─────────────────────────────────────────┐
   │  USER ASKS: "What should I focus on?"  │
   └────────┬────────────────────────────────┘
            │
            ▼
   ┌─────────────────────────────────────────────────────┐
   │  AI RESPONDS (Personalized):                        │
   │                                                      │
   │  "Hey John! 🎮                                      │
   │                                                      │
   │  I see you've got 3 tasks today. Since you love    │
   │  Valorant, think of these like your daily missions:│
   │                                                      │
   │  1. 🎯 MAIN QUEST: Update Client Dashboard         │
   │  2. ⚔️ SIDE QUEST: Review SEO Report               │
   │  3. 🛡️ BONUS: Team Stand-up Notes                  │
   │                                                      │
   │  Your photography skills will help with that       │
   │  visual content task later! 📸"                    │
   └─────────────────────────────────────────────────────┘
```

---

## 📋 DOCUMENT TYPES IN AI CHAT

```
┌────────────────────────────────────────────────────────────┐
│              STAFF USER IN AI ASSISTANT                    │
│              Types: "@" to mention a document              │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ DOCUMENT LIST   │
                    │ SHOWS:          │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 📋 ADMIN DOCS   │ │ 📄 CLIENT DOCS  │ │ 📝 STAFF DOCS   │
│ (Policies/SOPs) │ │ (Procedures)    │ │ (Own uploads)   │
│                 │ │                 │ │                 │
│ Leave Policy    │ │ Style Guide     │ │ Report Draft    │
│ ✅ APPROVED     │ │ ✅ APPROVED     │ │ ✅ APPROVED     │
│                 │ │                 │ │                 │
│ HR Handbook     │ │ SEO Guidelines  │ │ Client Proposal │
│ ✅ APPROVED     │ │ ✅ APPROVED     │ │ ⏳ PENDING      │
│                 │ │                 │ │ ❌ NOT SHOWN    │
└─────────────────┘ └─────────────────┘ └─────────────────┘

         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ STAFF SELECTS:  │
                    │ "Leave Policy"  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────────────────────┐
                    │ AI READS DOCUMENT CONTENT       │
                    │ Sees badge: 📋 COMPANY POLICY   │
                    │ Uploaded by: Admin              │
                    └────────┬────────────────────────┘
                             │
                             ▼
                    ┌─────────────────────────────────┐
                    │ AI RESPONDS:                    │
                    │                                 │
                    │ "Hey John! Based on the         │
                    │ Leave Policy (📋 Company        │
                    │ Policy), you're entitled to:    │
                    │                                 │
                    │ • 15 days annual leave          │
                    │ • 5 days sick leave             │
                    │ • Public holidays               │
                    │                                 │
                    │ Want me to help you request     │
                    │ time off for that Tokyo trip?   │
                    │ ✈️"                             │
                    └─────────────────────────────────┘
```

---

## 🎯 KEY TAKEAWAYS

1. **PENDING docs are invisible in AI until approved**
2. **ADMIN docs are global (all staff can see)**
3. **CLIENT docs are company-specific (only their staff)**
4. **STAFF docs require client approval**
5. **AI is personalized based on interests + profile**

---

**🚀 READY TO DEPLOY!**

