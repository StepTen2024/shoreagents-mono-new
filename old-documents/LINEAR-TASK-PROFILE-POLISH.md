# Linear Task: Profile Page UI/UX Polish

**Date:** October 14, 2025  
**Task ID:** SHO-33  
**Assignee:** Stephen Atcheler  
**Priority:** P2 - Medium  
**Status:** Todo  

**URL:** https://linear.app/shoreagents/issue/SHO-33/profile-page-uiux-polish

---

## Overview

Profile page is now 100% functional with real data from the database. All hardcoded values have been removed and replaced with dynamic data from Supabase. This task focuses on UI/UX polish and feature enhancements.

---

## What Works Now (Completed Oct 14, 2025)

- ✅ **Real company name** - No more hardcoded "TechCorp Inc."
- ✅ **Real account manager** - Pulled from company relationship
- ✅ **All profile data dynamic** - From StaffProfile table
- ✅ **Work schedule** - Displays 7 days with correct times
- ✅ **Leave credits** - Shows accurate total, used, vacation, and sick leave
- ✅ **HMO status** - Toggle working correctly
- ✅ **Avatar/Cover upload** - Working (Kyle's previous work)

---

## What Needs Polish

### 1. Layout & Design
- [ ] Improve spacing and visual hierarchy
- [ ] Add loading states for data fetching
- [ ] Better error handling UI
- [ ] Responsive design improvements (mobile/tablet)

### 2. Data Display
- [ ] Add location field display
- [ ] Add gender & civil status display
- [ ] Add date of birth display
- [ ] Format dates consistently
- [ ] Add tooltips for complex fields

### 3. Interactivity
- [ ] Add edit profile functionality
- [ ] Add change password option
- [ ] Add notification preferences
- [ ] Add profile completion percentage indicator

### 4. Visual Enhancements
- [ ] Better placeholder states when data is missing
- [ ] Smooth transitions and animations
- [ ] Better color scheme consistency
- [ ] Add icons to sections
- [ ] Improve typography hierarchy

### 5. Additional Features
- [ ] Add profile activity feed
- [ ] Add recent documents section
- [ ] Add recent tasks section
- [ ] Add performance summary widget
- [ ] Add quick actions menu

---

## Technical Notes

### API Endpoint
**`/api/profile`** - Returns full staff profile data

### Component
**`components/profile-view.tsx`** - Main profile display component

### Data Available

**User Object:**
- id, name, email, role, avatar, coverPhoto

**Company Object:**
- companyName, accountManager

**Profile Object:**
- phone, location, gender, civilStatus, dateOfBirth
- employmentStatus, startDate, daysEmployed, currentRole
- salary, totalLeave, usedLeave, vacationUsed, sickUsed, hmo

**Work Schedules:**
- 7 days with startTime, endTime, isWorkday

---

## Testing Scenarios

Test with multiple staff users to ensure data displays correctly for:

1. **Complete Profiles**
   - Staff with all fields populated
   - Should display all information cleanly

2. **Missing Data**
   - Staff with optional fields empty
   - Should show graceful placeholders

3. **Employment Status**
   - Probation (0 leave days)
   - Regular (12 leave days)

4. **Benefits**
   - Staff with HMO
   - Staff without HMO

---

## Related Changes

### GitHub
- **Branch:** `full-stack-StepTen`
- **Commit:** `be45cb5`
- **PR:** Mega userId → staffUserId fix (20 files) + Profile dynamic data

### Previous Tasks
- **SHO-31:** Complete Staff Onboarding System
- **SHO-32:** Fix & Test Performance Tracking System (Kyle)

---

## Priority Rationale

**P2 - Medium Priority**
- Profile page is functional and working
- Not blocking any critical features
- Important for user experience and staff satisfaction
- Can be done in parallel with other work

---

## Acceptance Criteria

✅ All data fields display correctly  
✅ Responsive on mobile, tablet, and desktop  
✅ Loading states provide clear feedback  
✅ Error states are user-friendly  
✅ Smooth animations and transitions  
✅ Edit functionality working  
✅ All placeholder states implemented  
✅ Tested with various staff profiles  

---

**STATUS:** Ready to work on when time permits! 🎨

