# GitHub Issue to Create Manually

**Title:** 🎨 GUNTING: Style Interview "Pending" Status Page - URGENT

**Assignee:** Kyle-Pantig

**Labels:** enhancement, urgent, gunting, frontend, ui

**Description:**

## 🎯 Assignment: Kyle (@Kyle-Pantig / Shadow Agent 005)

**Priority:** 🔴 URGENT - ASAP  
**Branch:** `Gunting-Project-Scissor`  
**Estimated Time:** 30-45 minutes

---

## 📋 Task Description

Style the **Interview Request Pending page** to match the beautiful design we have on other pages.

### What Needs Styling:

**Location:** This is the page clients see when they request an interview (the screenshot with "Waiting for Admin" message)

**Current State:** Basic/ugly quick fix styling  
**Target State:** Beautiful, professional UI matching the client interviews page

---

## 🎨 Design Requirements

### 1. Status Card Styling
- Yellow gradient background (from-yellow-50 to-yellow-100)
- Left border accent (border-l-4 border-l-yellow-500)
- Clock icon with proper sizing
- Clean typography

### 2. Message Box
Current message:
```
"Waiting for Admin
Our admin team is coordinating with the candidate to schedule your interview. 
You'll be notified once a time is confirmed."
```

Should look like:
- Rounded card with padding
- Icon on the left (Clock)
- Bold title
- Lighter description text
- Professional spacing

### 3. Preferred Times Display
- Show as colored badges (blue-50 bg, blue-700 text, blue-200 border)
- Proper date formatting
- Flex wrap layout

---

## 📁 Reference Files

**Check these for styling patterns:**
- `app/client/interviews/page.tsx` (lines 232-244)
- `app/admin/recruitment/page.tsx` (lines 713-766)

**Full task details:** See `GUNTING-TASK-KYLE-INTERVIEW-PENDING-STYLING.md` in repo

---

## ✅ Acceptance Criteria

- [ ] Status message has yellow gradient background
- [ ] Clock icon displayed on left
- [ ] Text properly formatted (bold title, lighter description)
- [ ] Preferred times shown as blue badges
- [ ] Card has hover effects
- [ ] Mobile responsive
- [ ] No linting errors

---

## 🚀 Steps to Complete

1. Pull: `git checkout Gunting-Project-Scissor && git pull`
2. Find "Waiting for Admin" page
3. Apply styling from reference files
4. Test thoroughly
5. Commit: "GUNTING-KYLE: Styled interview pending status page"
6. Push to `Gunting-Project-Scissor`
7. Notify Stephen when done

---

**Assigned to:** @Kyle-Pantig  
**Branch:** `Gunting-Project-Scissor`  
**Status:** 🔴 Urgent - Blocking flow testing
