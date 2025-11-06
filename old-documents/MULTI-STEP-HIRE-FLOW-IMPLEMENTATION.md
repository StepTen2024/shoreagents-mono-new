# 🎯 Multi-Step Hire Flow Implementation

## Overview
Implementing a comprehensive hire flow system where candidates go through multiple stages from interview to hire, with proper status tracking and notifications.

## ✅ COMPLETED

### 1. Database Schema (Prisma)
- ✅ Added new `InterviewRequestStatus` enum values:
  - `HIRE_REQUESTED` - Client/Admin wants to hire
  - `OFFER_SENT` - Job offer sent to candidate
  - `OFFER_ACCEPTED` - Candidate accepted offer
  - `OFFER_DECLINED` - Candidate declined offer
  - `HIRED` - Candidate created account and onboarding started

- ✅ Added new fields to `InterviewRequest` model:
  - `hireRequestedBy` - Tracks who requested hire ('client' or 'admin')
  - `hireRequestedAt` - Timestamp of hire request
  - `clientPreferredStart` - Client's preferred start date
  - `finalStartDate` - Negotiated final start date
  - `offerSentAt` - When offer was sent to candidate
  - `offerResponseAt` - When candidate responded
  - `offerDeclineReason` - Reason if candidate declined

### 2. Backend APIs

#### ✅ Admin Hire API (`/api/admin/recruitment/interviews/hire`)
- Changed from immediate hire to sending job offer
- Sets status to `OFFER_SENT`
- Creates `JobAcceptance` record (pending candidate acceptance)
- Returns offer acceptance link instead of signup link

#### ✅ Candidate Offer Response API (`/api/offer/respond`)
- Allows candidate to accept or decline offer
- Updates status to `OFFER_ACCEPTED` or `OFFER_DECLINED`
- Records decline reason if applicable
- Returns signup link only after acceptance

#### ✅ Offer Details API (`/api/offer/details`)
- Fetches job offer details for candidate review
- Returns company info, position, preferred start date
- Shows current status and whether candidate can still respond

#### ✅ Client Hire Request API (`/api/client/interviews/hire-request`)
- Allows clients to request to hire a candidate
- Sets status to `HIRE_REQUESTED`
- Notifies admin of client's hire intent
- Includes client's preferred start date and notes

### 3. Frontend - Admin Portal

#### ✅ Updated Interview Stats Cards
- Changed from 4 cards to 5 cards:
  - Pending Interviews
  - **Offers Pending** (NEW - shows HIRE_REQUESTED + OFFER_SENT)
  - **Offer Accepted** (NEW)
  - Completed
  - Hired

## 🚧 IN PROGRESS / TODO

### 4. Frontend - Status Display
- ⏳ Update status badges to show all new statuses
- ⏳ Update status message boxes for new hire flow states
- ⏳ Add UI for viewing/editing start dates
- ⏳ Show who requested hire (client vs admin)

### 5. Frontend - Client Portal
- ⏳ Add "Request to Hire" button on client interviews page
- ⏳ Add preferred start date picker
- ⏳ Show hire request status to client

### 6. Frontend - Candidate Offer Page
- ⏳ Create `/offer/accept` page for candidates
- ⏳ Show job offer details
- ⏳ Accept/Decline buttons
- ⏳ Start date negotiation UI
- ⏳ Decline reason form

### 7. Staff Signup Integration
- ⏳ Update staff signup to only work after OFFER_ACCEPTED
- ⏳ Link staff account to JobAcceptance automatically
- ⏳ Set start date in employment contract

### 8. Notifications
- ⏳ Client hire request → Notify admin
- ⏳ Offer sent → Notify client
- ⏳ Offer accepted → Notify admin + client
- ⏳ Offer declined → Notify admin + client
- ⏳ Staff account created → Notify admin + client

### 9. Email Templates
- ⏳ Job offer email to candidate
- ⏳ Signup link email (after acceptance)
- ⏳ Hire request notification to admin
- ⏳ Status update emails to client

## Hire Flow Diagram

```
CLIENT or ADMIN
     |
     ↓
INTERVIEW COMPLETED
     |
     ├→ CLIENT: Click "Request to Hire" → Status: HIRE_REQUESTED
     |        ↓
     |   ADMIN NOTIFIED
     |        ↓
     └→ ADMIN: Click "Send Offer" → Status: OFFER_SENT
                    ↓
            Candidate receives email
                    ↓
         Candidate reviews offer page
                    ↓
            ┌───────┴───────┐
            ↓               ↓
        ACCEPT           DECLINE
            |               |
Status: OFFER_ACCEPTED   Status: OFFER_DECLINED
            |               |
     Admin + Client       Admin + Client
      notified            notified
            |
     Start date finalized
            |
     Signup link sent
            |
 Candidate creates account
            |
    Status: HIRED
            |
  Onboarding begins
```

## Testing Flow

### Test Scenario 1: Admin-Initiated Hire
1. Admin logs in
2. Goes to Recruitment → Interviews
3. Finds completed interview
4. Clicks "Hire" button
5. Fills position, company, email, phone
6. (Optional) Sets preferred start date
7. Clicks "Send Offer"
8. Status → OFFER_SENT
9. Copy offer link
10. Open in new tab (as candidate)
11. Review offer details
12. Click "Accept Offer"
13. (Optional) Propose start date
14. Status → OFFER_ACCEPTED
15. Receive signup link
16. Create staff account
17. Status → HIRED

### Test Scenario 2: Client-Initiated Hire
1. Client logs in
2. Goes to Interviews
3. Finds completed interview
4. Clicks "Request to Hire"
5. Sets preferred start date
6. Adds notes
7. Submits request
8. Status → HIRE_REQUESTED
9. Admin receives notification
10. Admin reviews and clicks "Send Offer"
11. (Continue from step 9 in Scenario 1)

## Database Migration

```bash
# Already run:
npx prisma generate
npx prisma db push --accept-data-loss
```

## Files Modified
- `prisma/schema.prisma`
- `app/api/admin/recruitment/interviews/hire/route.ts` (rewritten)
- `app/api/admin/recruitment/interviews/route.ts` (status transformation)
- `app/admin/recruitment/page.tsx` (stats cards updated)

## Files Created
- `app/api/offer/respond/route.ts`
- `app/api/offer/details/route.ts`
- `app/api/client/interviews/hire-request/route.ts`
- `MULTI-STEP-HIRE-FLOW-IMPLEMENTATION.md` (this file)

## Next Session Tasks
1. Complete frontend status badge updates
2. Add client hire request button
3. Create candidate offer acceptance page
4. Add start date negotiation UI
5. Implement notifications
6. Test complete flow end-to-end

