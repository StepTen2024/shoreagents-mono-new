# 🎯 ACTIVITY FEED AUTO-GENERATION - INTEGRATION PLAN

## ✅ **WHAT GETS POSTED:**

### **1. Staff Onboarding** 🎉
**Event:** Staff completes onboarding (reaches 100%)  
**Post:** "🎉 Welcome [Name] to the team! Excited to have you on board! 👋"  
**Integration:** `/app/api/staff/onboarding/complete/route.ts`

---

### **2. Clock In** ☀️
**Event:** Staff clocks in for the day  
**Post:** "☀️ [Name] just clocked in! Let's crush it today! 💪"  
**Integration:** `/app/api/time-tracking/clock-in/route.ts`

---

### **3. Clock Out** 🏁
**Event:** Staff clocks out  
**Post:** "🏁 [Name] clocked out after 8.5 hours! Great work today! 🌟"  
**Integration:** `/app/api/time-tracking/clock-out/route.ts`

---

### **4. Break Started** ☕
**Event:** Staff starts a break (Morning/Lunch/Afternoon)  
**Posts:**
- "☕ [Name] is taking morning break. Enjoy the recharge! 😊"
- "🍽️ [Name] is taking lunch break. Enjoy the recharge! 😊"  
**Integration:** `/app/api/breaks/start/route.ts`

---

### **5. Break Ended** ⚡
**Event:** Staff ends a break  
**Post:** "⚡ [Name] is back from break! Ready to tackle the day! 🚀"  
**Integration:** `/app/api/breaks/end/route.ts`

---

### **6. Good Reviews** 🌟
**Event:** Staff completes review with 75%+ score  
**Posts:**
- **95%+:** "🏆 [Name] completed their Month 3 Review with a 98% score! Outstanding performance! 🎉"
- **90-94%:** "⭐ [Name] completed their Month 3 Review with a 92% score! Exceptional work! 🎉"
- **85-89%:** "🌟 [Name] completed their Month 3 Review with a 87% score! Great work! 🎉"
- **75-84%:** "👏 [Name] completed their Month 3 Review with a 78% score! Solid performance! 🎉"  
**Integration:** `/app/api/reviews/submit/route.ts` or similar  
**Note:** Only posts if score >= 75% (no shaming!)

---

### **7. Tasks Completed** ✅
**Event:** Task status changes to DONE/COMPLETED  
**Posts:**
- **URGENT:** "🔥 [Name] completed 'Fix critical bug'! One more off the list! 🎯"
- **HIGH:** "⚡ [Name] completed 'Update documentation'! One more off the list! 🎯"
- **MEDIUM/LOW:** "✅ [Name] completed 'Review PR'! One more off the list! 🎯"  
**Integration:** `/app/api/tasks/[id]/route.ts` (PUT endpoint)

---

### **8. Client Documents** 📄
**Event:** Client uploads a document  
**Post:** "📄 Shore Agents uploaded 'Q4 Strategy Guide.pdf'! New materials available for the team! 📚"  
**Integration:** `/app/api/client/documents/route.ts` (POST endpoint)  
**Note:** Only client uploads, NOT staff's own documents

---

## ❌ **WHAT DOESN'T GET POSTED:**

- ❌ **Tickets** - Not useful for feed
- ❌ **Staff's own documents** - Only client documents
- ❌ **Bad reviews** - No shaming (only 75%+ scores)
- ❌ **Task creation** - Only completion
- ❌ **Minor updates** - Keep feed meaningful

---

## 📂 **FILES TO MODIFY:**

### **1. Activity Generator Service** ✅ **CREATED**
```
✅ /lib/activity-generator.ts
   - Contains all post generation logic
   - Helper functions for each activity type
   - Smart emoji selection
   - No shaming (75%+ reviews only)
```

### **2. Time Tracking APIs**
```
📝 /app/api/time-tracking/clock-in/route.ts
   - Add: logClockedIn(staffUserId, staffName)
   
📝 /app/api/time-tracking/clock-out/route.ts
   - Add: logClockedOut(staffUserId, staffName, totalHours)
```

### **3. Break APIs**
```
📝 /app/api/breaks/start/route.ts
   - Add: logBreakStarted(staffUserId, staffName, breakType)
   
📝 /app/api/breaks/end/route.ts
   - Add: logBreakEnded(staffUserId, staffName)
```

### **4. Task API**
```
📝 /app/api/tasks/[id]/route.ts (PUT endpoint)
   - Detect when status changes to DONE
   - Add: logTaskCompleted(staffUserId, staffName, taskTitle, priority)
```

### **5. Review APIs**
```
📝 /app/api/reviews/submit/route.ts (or wherever reviews are completed)
   - Calculate overall score
   - Only if >= 75%: logReviewCompleted(staffUserId, staffName, score, type)
```

### **6. Client Document API**
```
📝 /app/api/client/documents/route.ts (POST endpoint)
   - Add: logDocumentUploaded(staffUserId, documentTitle, clientName, companyName)
   - Use first staff in company as poster
```

### **7. Staff Onboarding API**
```
📝 /app/api/staff/onboarding/complete/route.ts
   - Add: logStaffOnboarded(staffUserId, staffName)
```

---

## 🎨 **POST EXAMPLES:**

### **Clock In**
```
☀️ James just clocked in! Let's crush it today! 💪
```

### **Lunch Break**
```
🍽️ Sarah is taking lunch break. Enjoy the recharge! 😊
```

### **Task Completed (Urgent)**
```
🔥 Maria completed "Fix critical payment bug"! One more off the list! 🎯
```

### **Excellent Review**
```
🏆 Robert completed their Month 3 Review with a 98% score! Outstanding performance! 🎉
```

### **Client Document**
```
📄 Shore Agents uploaded "SEO Best Practices 2025.pdf"! New materials available for the team! 📚
```

### **Staff Onboarded**
```
🎉 Welcome Alice Chen to the team! Excited to have you on board! 👋
```

---

## 🔄 **IMPLEMENTATION FLOW:**

```typescript
// Example: Clock In Integration

import { logClockedIn } from "@/lib/activity-generator"

export async function POST(request: NextRequest) {
  const staffUser = await getStaffUser()
  
  // ... existing clock-in logic ...
  
  const timeEntry = await prisma.timeEntry.create({...})
  
  // ✨ NEW: Auto-generate activity post
  await logClockedIn(staffUser.id, staffUser.name)
  
  return NextResponse.json({ success: true, timeEntry })
}
```

---

## 🎯 **BENEFITS:**

1. ✅ **Team Awareness** - Everyone sees what everyone's doing
2. ✅ **Motivation** - Celebrate wins and milestones
3. ✅ **Transparency** - Clear view of team activity
4. ✅ **Engagement** - Interactive feed with reactions/comments
5. ✅ **No Manual Posting** - Automatic, zero effort
6. ✅ **Smart Filtering** - Only meaningful events
7. ✅ **Positive Culture** - No shaming, only celebrations

---

## 📊 **EXPECTED FEED VOLUME:**

**For a team of 10 staff:**
- Clock ins/outs: ~20 posts/day
- Breaks: ~60 posts/day (3 breaks x 10 people x 2 events)
- Tasks: ~15 posts/day (average)
- Reviews: ~2 posts/week
- Documents: ~5 posts/week
- Onboarding: ~1 post/week

**Total:** ~100-120 posts/day (very active feed!)

**Note:** Can add filtering/grouping later if too much

---

## 🚀 **PHASE 1 IMPLEMENTATION:**

Start with these 3 (highest value):

1. ✅ **Task Completed** - Immediate value, celebrates wins
2. ✅ **Good Reviews** - Positive reinforcement
3. ✅ **Client Documents** - Keeps team informed

**Phase 2:** Clock in/out, breaks  
**Phase 3:** Staff onboarding

---

## 🧪 **TESTING PLAN:**

After each integration:
1. Trigger the event (complete task, upload doc, etc.)
2. Check `/activity` feed
3. Verify post appears with correct content
4. Verify reactions/comments still work
5. Check emoji and formatting

---

**Status:** ✅ **Service Created, Ready for Integration**  
**Next Step:** Integrate into key API routes (Phase 1)  
**Estimated Time:** 30-45 minutes for Phase 1

