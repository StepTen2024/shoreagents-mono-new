# 🎨 DATABASE RELATIONSHIPS - VISUAL GUIDE

> Visual representation of all database table relationships in the Shore Agents AI Monorepo

---

## 🏗️ COMPLETE ENTITY RELATIONSHIP DIAGRAM

### User Ecosystem

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         THREE USER TYPES SYSTEM                             │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│  MANAGEMENT_USERS    │         │   CLIENT_USERS       │         │    STAFF_USERS       │
│  ══════════════════  │         │  ══════════════════  │         │  ══════════════════  │
│  id (PK)             │         │  id (PK)             │         │  id (PK)             │
│  authUserId (UK)     │         │  authUserId (UK)     │         │  authUserId (UK)     │
│  name                │         │  name                │         │  name                │
│  email (UK)          │         │  email (UK)          │         │  email (UK)          │
│  role (ENUM)         │         │  role (ENUM)         │         │  role (ENUM)         │
│   - ADMIN            │         │   - OWNER            │         │   - STAFF            │
│   - MANAGER          │         │   - ADMIN            │         │   - TEAM_LEAD        │
│  department (ENUM)   │         │   - MANAGER          │         │  companyId (FK)      │
│  phone               │         │   - VIEWER           │         │  active (bool)       │
│  avatar              │         │  companyId (FK)      │         │  avatar              │
│  coverPhoto          │         │  avatar              │         │  coverPhoto          │
└──────┬───────────────┘         │  coverPhoto          │         │  createdAt           │
       │ 1:1                     └──────┬───────────────┘         │  updatedAt           │
       ↓                                │ 1:1                     └──────┬───────────────┘
┌──────────────────────┐                ↓                                │ 1:1
│ MANAGEMENT_PROFILES  │         ┌──────────────────────┐                ↓
│ ═══════════════════  │         │  CLIENT_PROFILES     │         ┌──────────────────────┐
│ managementUserId(FK) │         │  ═══════════════════ │         │  STAFF_PROFILES      │
│ timezone 🌍          │         │  clientUserId (FK)   │         │  ═══════════════════ │
│ startDate            │         │  timezone 🌍         │         │  staffUserId (FK)    │
│ salary               │         │  position            │         │  timezone 🌍         │
│ bio                  │         │  department          │         │  startDate           │
│ responsibilities     │         │  phone               │         │  salary              │
└──────────────────────┘         └──────────────────────┘         │  employmentStatus    │
                                                                  └──────────────────────┘
       │                                │                                │
       │ manages (1:M)                  │ belongs to (M:1)              │ works for (M:1)
       │                                │                                │
       │                                │                                │
       └────────────────────────────────┼────────────────────────────────┘
                                        │
                                        ↓
                        ┌───────────────────────────────┐
                        │         COMPANY               │
                        │  ═══════════════════════════  │
                        │  id (PK)                      │
                        │  companyName                  │
                        │  organizationId (UK)          │
                        │  accountManagerId (FK) ───────┘ (to management_users)
                        │  tradingName                  │
                        │  industry                     │
                        │  location                     │
                        │  billingEmail                 │
                        │  website                      │
                        │  phone                        │
                        │  logo                         │
                        │  coverPhoto                   │
                        │  bio                          │
                        │  contractStart                │
                        │  isActive (bool)              │
                        │  createdAt                    │
                        │  updatedAt                    │
                        └───────────────────────────────┘
```

---

## 👤 STAFF USER RELATED TABLES (17 TABLES)

```
                                    ┌──────────────────┐
                                    │   STAFF_USERS    │
                                    │   ════════════   │
                                    │   id (PK)        │
                                    │   authUserId     │
                                    │   name           │
                                    │   email          │
                                    │   role           │
                                    │   companyId (FK) │
                                    │   active         │
                                    └────────┬─────────┘
                                             │
                  ┌──────────────────────────┼──────────────────────────┐
                  │                          │                          │
    ┌─────────────▼────┐         ┌──────────▼────────┐    ┌───────────▼──────────┐
    │ STAFF_PROFILES   │         │ STAFF_ONBOARDING  │    │ STAFF_OFFBOARDING    │
    │ ════════════════ │         │ ════════════════  │    │ ════════════════════ │
    │ id (PK)          │         │ id (PK)           │    │ id (PK)              │
    │ staffUserId (FK) │ (1:1)   │ staffUserId (FK)  │    │ staffUserId (FK) (1:1)│
    │ phone            │         │ ══════════════════│    │ ══════════════════   │
    │ location         │         │ 9-STEP PROCESS:   │    │ initiatedBy          │
    │ employmentStatus │         │ 1. personalInfo   │    │ reason (ENUM)        │
    │ startDate        │         │ 2. govId          │    │ lastWorkingDate      │
    │ daysEmployed     │         │ 3. documents      │    │ status (ENUM)        │
    │ currentRole      │         │ 4. signature      │    │ exitInterview        │
    │ salary           │         │ 5. emergency      │    │ equipmentReturned    │
    │ totalLeave       │         │ 6. education      │    │ accessRevoked        │
    │ usedLeave        │         │ 7. medical        │    │ finalPayment         │
    │ hmo              │         │ 8. resume         │    │ clearanceIssued      │
    │ civilStatus      │         │ 9. dataPrivacy    │    │ clearanceSignature   │
    │ dateOfBirth      │         │                   │    │ createdAt            │
    │ gender           │         │ Each step has:    │    │ completedAt          │
    └────────┬─────────┘         │ - status (ENUM)   │    └──────────────────────┘
             │                   │ - feedback        │
             │ (1:M)             │ - verifiedAt      │
             ↓                   │ - verifiedBy      │
    ┌────────────────┐          │                   │
    │ WORK_SCHEDULES │          │ completionPercent │
    │ ══════════════ │          │ isComplete        │
    │ id (PK)        │          └───────────────────┘
    │ profileId (FK) │
    │ dayOfWeek      │
    │ startTime      │
    │ endTime        │
    │ isWorkday      │
    └────────────────┘


                            ┌──────────────────┐
                            │   STAFF_USERS    │
                            └────────┬─────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
    ┌────▼──────────────┐   ┌───────▼─────────┐   ┌───────────▼──────────┐
    │ STAFF_PERSONAL_   │   │ STAFF_WELCOME_  │   │ EMPLOYMENT_          │
    │ RECORDS           │   │ FORMS           │   │ CONTRACTS            │
    │ ════════════════  │   │ ══════════════  │   │ ═══════════════════  │
    │ id (PK)           │   │ id (PK)         │   │ id (PK)              │
    │ staffUserId (FK)  │   │ staffUserId(FK) │   │ staffUserId (FK)(1:1)│
    │ sss               │   │ ═══════════════ │   │ jobAcceptanceId (FK) │
    │ tin               │   │ name            │   │ companyId (FK)       │
    │ philhealthNo      │   │ client          │   │ ══════════════════   │
    │ pagibigNo         │   │ startDate       │   │ employeeName         │
    │ emergencyContact  │   │ favoriteFastFood│   │ employeeAddress      │
    │ validIdUrl        │   │ favoriteColor   │   │ position             │
    │ birthCertUrl      │   │ favoriteMusic   │   │ startDate            │
    │ nbiClearanceUrl   │   │ favoriteMovie   │   │ workSchedule         │
    │ policeClearance   │   │ favoriteBook    │   │ basicSalary          │
    │ sssDocUrl         │   │ hobby           │   │ deMinimis            │
    │ tinDocUrl         │   │ dreamDestination│   │ totalMonthlyGross    │
    │ philhealthDocUrl  │   │ favoriteSeason  │   │ hmoOffer             │
    │ pagibigDocUrl     │   │ petName         │   │ paidLeave            │
    └───────────────────┘   │ favoriteSport   │   │ probationaryPeriod   │
                            │ favoriteGame    │   │ pageInitials (JSON)  │
                            │ favoriteQuote   │   │ finalSignatureUrl    │
                            │ funFact         │   │ pagesInitialed       │
                            │ additionalInfo  │   │ totalPages           │
                            │ completed       │   │ fullyInitialed       │
                            │ submittedAt     │   │ signed               │
                            └─────────────────┘   │ signedAt             │
                                                  │ adminApproved        │
                                                  │ adminApprovedAt      │
                                                  │ adminApprovedBy      │
                                                  └──────────────────────┘


                            ┌──────────────────┐
                            │   STAFF_USERS    │
                            └────────┬─────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
    ┌────▼──────────────┐   ┌───────▼──────────┐   ┌──────────▼────────────┐
    │ GAMIFICATION_     │   │ TIME_ENTRIES     │   │ BREAKS                │
    │ PROFILES          │   │ ════════════════ │   │ ═════════════════════ │
    │ ════════════════  │   │ id (PK)          │   │ id (PK)               │
    │ id (PK)           │   │ staffUserId (FK) │   │ staffUserId (FK)      │
    │ staffUserId(FK)1:1│   │ clockIn          │   │ timeEntryId (FK)      │
    │ level             │   │ clockOut         │   │ type (ENUM)           │
    │ points            │   │ totalHours       │   │  - MORNING            │
    │ rank              │   │ notes            │   │  - LUNCH              │
    │ streak            │   │ breaksScheduled  │   │  - AFTERNOON          │
    │ tasksCompleted    │   │ clockOutReason   │   │  - AWAY               │
    │ performanceScore  │   │ expectedClockIn  │   │ awayReason (ENUM)     │
    │ reviewRating      │   │ lateBy (minutes) │   │ scheduledStart        │
    └────────┬──────────┘   │ wasLate (bool)   │   │ scheduledEnd          │
             │               │ createdAt        │   │ actualStart           │
             │ (1:M)         │ updatedAt        │   │ actualEnd             │
             ↓               └──────────────────┘   │ duration              │
    ┌────────────────┐                             │ notes                 │
    │ USER_BADGES    │                             │ isLate                │
    │ ══════════════ │                             │ lateBy                │
    │ id (PK)        │                             │ isPaused              │
    │ profileId (FK) │                             │ pauseUsed             │
    │ badgeType(ENUM)│                             │ pausedAt              │
    │ earnedAt       │                             │ pausedDuration        │
    │                │                             │ createdAt             │
    │ TYPES:         │                             │ updatedAt             │
    │ - SPEEDSTER    │                             └───────────────────────┘
    │ - PERFECTIONIST│
    │ - FIRE         │
    │ - EARLY_BIRD   │              ┌──────────────────┐
    │ - TEAM_PLAYER  │              │   STAFF_USERS    │
    │ - TOP_PERFORMER│              └────────┬─────────┘
    │ - CONSISTENT   │                       │
    │ - INNOVATOR    │                       │ (1:M)
    └────────────────┘                       ↓
                                    ┌─────────────────────┐
                                    │ PERFORMANCE_METRICS │
                                    │ ═══════════════════ │
                                    │ id (PK)             │
                                    │ staffUserId (FK)    │
                                    │ date                │
                                    │ ═══════════════════ │
                                    │ mouseMovements      │
                                    │ mouseClicks         │
                                    │ keystrokes          │
                                    │ activeTime          │
                                    │ idleTime            │
                                    │ screenTime          │
                                    │ downloads           │
                                    │ uploads             │
                                    │ bandwidth           │
                                    │ clipboardActions    │
                                    │ filesAccessed       │
                                    │ urlsVisited         │
                                    │ tabsSwitched        │
                                    │ productivityScore   │
                                    │ applicationsUsed    │
                                    │  (JSON)             │
                                    │ visitedUrls (JSON)  │
                                    │ screenshotUrls      │
                                    │  (JSON)             │
                                    │ createdAt           │
                                    │ updatedAt           │
                                    └─────────────────────┘


                            ┌──────────────────┐
                            │   STAFF_USERS    │
                            └────────┬─────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
    ┌────▼────────────┐     ┌───────▼─────────┐       ┌────────▼──────────┐
    │ REVIEWS         │     │ DOCUMENTS       │       │ KUDOS             │
    │ ═══════════════ │     │ ═══════════════ │       │ ═════════════════ │
    │ id (PK)         │     │ id (PK)         │       │ id (PK)           │
    │ staffUserId(FK) │     │ staffUserId(FK) │       │ fromId (FK) ──────┼─┐
    │ type (ENUM)     │     │ title           │       │ toId (FK)   ──────┼─┤
    │  - MONTH_1      │     │ category(ENUM)  │       │ message           │ │
    │  - MONTH_3      │     │  - CLIENT       │       │ createdAt         │ │
    │  - MONTH_5      │     │  - TRAINING     │       └───────────────────┘ │
    │  - RECURRING    │     │  - PROCEDURE    │                             │
    │ status (ENUM)   │     │  - CULTURE      │       (Self-referential     │
    │ client          │     │  - SEO          │        Many-to-Many)        │
    │ reviewer        │     │  - OTHER        │                             │
    │ reviewerTitle   │     │ uploadedBy      │       Staff can give kudos  │
    │ submittedDate   │     │ size            │       to other staff ───────┘
    │ evaluationPeriod│     │ fileUrl         │
    │ overallScore    │     │ content         │
    │ acknowledgedDate│     │ source (ENUM)   │
    │ dueDate         │     │  - STAFF        │
    │ ratings (JSON)  │     │  - CLIENT       │
    │ performanceLevel│     │  - ADMIN        │
    │ strengths       │     │ sharedWithAll   │
    │ improvements    │     │ sharedWith[]    │
    │ additionalComm  │     │ createdAt       │
    │ managementNotes │     │ updatedAt       │
    │ reviewedBy      │     └────────┬────────┘
    │ reviewedDate    │              │
    │ createdAt       │              │ (1:M)
    │ updatedAt       │              ↓
    └─────────────────┘     ┌────────────────────┐
                            │ DOCUMENT_COMMENTS  │
                            │ ══════════════════ │
                            │ id (PK)            │
                            │ documentId (FK)    │
                            │ content            │
                            │ userId             │
                            │ userType           │
                            │ userName           │
                            │ userAvatar         │
                            │ createdAt          │
                            └────────────────────┘
```

---

## 📋 TASK MANAGEMENT SYSTEM

```
                        ┌──────────────────────────────────────┐
                        │           TASKS                      │
                        │  ══════════════════════════════════  │
                        │  id (PK)                             │
                        │  title                               │
                        │  description                         │
                        │  status (ENUM)                       │
                        │   - TODO                             │
                        │   - IN_PROGRESS                      │
                        │   - STUCK                            │
                        │   - FOR_REVIEW                       │
                        │   - COMPLETED                        │
                        │  priority (ENUM)                     │
                        │   - LOW, MEDIUM, HIGH, URGENT        │
                        │  source (ENUM)                       │
                        │   - SELF, CLIENT, MANAGEMENT         │
                        │  deadline                            │
                        │  completedAt                         │
                        │  timeSpent (minutes)                 │
                        │  tags[] (array)                      │
                        │  attachments[] (array)               │
                        │  companyId (FK)                      │
                        │  clientUserId (FK)                   │
                        │  createdById                         │
                        │  createdByType (ENUM)                │
                        │  createdAt                           │
                        │  updatedAt                           │
                        └───┬──────────────┬──────────────┬────┘
                            │              │              │
        ┌───────────────────┘              │              └─────────────────┐
        │                                  │                                │
        │ (1:M)                            │ (1:M)                          │ (M:1)
        ↓                                  ↓                                ↓
┌────────────────┐            ┌─────────────────────┐         ┌──────────────────┐
│ SUBTASKS       │            │ TASK_RESPONSES      │         │ STAFF_USERS      │
│ ══════════════ │            │ ═══════════════════ │         │ (via legacy FK)  │
│ id (PK)        │            │ id (PK)             │         └──────────────────┘
│ taskId (FK)    │            │ taskId (FK)         │
│ title          │            │ content             │                │
│ completed      │            │ createdByType(ENUM) │                │
│ order          │            │ createdById         │                │ (M:M)
│ completedAt    │            │ attachments[]       │                ↓
│ createdAt      │            │ createdAt           │         ┌──────────────────┐
│ updatedAt      │            └─────────────────────┘         │ TASK_ASSIGNMENTS │
└────────────────┘                                            │ ════════════════ │
                                                              │ id (PK)          │
    (Checklist items                  (Comments/Updates      │ taskId (FK)      │
     for main task)                    on tasks by anyone)   │ staffUserId (FK) │
                                                              │ createdAt        │
                                                              └──────────────────┘

                                                              Many-to-Many
                                                              relationship allows
                                                              multiple staff on
                                                              one task
```

---

## 🎫 TICKET SUPPORT SYSTEM

```
                            ┌─────────────────────────────────┐
                            │          TICKETS                │
                            │  ═════════════════════════════  │
                            │  id (PK)                        │
                            │  ticketId (UK - formatted)      │
                            │  title                          │
                            │  description                    │
                            │  category (ENUM - 25 types!)    │
                            │   IT, HR, MANAGEMENT, EQUIPMENT │
                            │   STATION, SURROUNDINGS, etc.   │
                            │  priority (ENUM)                │
                            │   LOW, MEDIUM, HIGH, URGENT     │
                            │  status (ENUM)                  │
                            │   OPEN, IN_PROGRESS, RESOLVED   │
                            │   CLOSED                        │
                            │  assignedTo                     │
                            │  resolvedDate                   │
                            │  attachments[]                  │
                            │  createdByType                  │
                            │  staffUserId (FK)               │
                            │  clientUserId (FK)              │
                            │  managementUserId (FK)          │
                            │  createdAt                      │
                            │  updatedAt                      │
                            └──────────┬──────────────────────┘
                                       │
                                       │ (1:M)
                                       ↓
                            ┌──────────────────────────────────┐
                            │    TICKET_RESPONSES              │
                            │  ══════════════════════════════  │
                            │  id (PK)                         │
                            │  ticketId (FK)                   │
                            │  message                         │
                            │  createdByType                   │
                            │  attachments[]                   │
                            │  staffUserId (FK)                │
                            │  clientUserId (FK)               │
                            │  managementUserId (FK)           │
                            │  createdAt                       │
                            └──────────────────────────────────┘

    Any of the 3 user types can:
    - Create tickets (usually staff)
    - Respond to tickets
    - Attach files
```

---

## 📱 ACTIVITY FEED & SOCIAL SYSTEM

```
                        ┌────────────────────────────────────────┐
                        │       ACTIVITY_POSTS                   │
                        │  ════════════════════════════════════  │
                        │  id (PK)                               │
                        │  type (ENUM)                           │
                        │   - ACHIEVEMENT, MILESTONE, KUDOS      │
                        │   - WIN, CELEBRATION, UPDATE           │
                        │   - ANNOUNCEMENT                       │
                        │  content                               │
                        │  achievement (JSON - if type=ACHIEVE)  │
                        │  images[] (array of URLs)              │
                        │  taggedUserIds[] (array)               │
                        │  audience (ENUM)                       │
                        │   - STAFF, CLIENT, MANAGEMENT, ALL     │
                        │  staffUserId (FK)                      │
                        │  clientUserId (FK)                     │
                        │  managementUserId (FK)                 │
                        │  createdAt                             │
                        │  updatedAt                             │
                        └───┬──────────────┬─────────────────┬───┘
                            │              │                 │
        ┌───────────────────┘              │                 └─────────────┐
        │                                  │                               │
        │ (1:M)                            │ (1:M)                         │ (1:M)
        ↓                                  ↓                               ↓
┌────────────────────┐        ┌────────────────────┐      ┌──────────────────┐
│ POST_REACTIONS     │        │ POST_COMMENTS      │      │ NOTIFICATIONS    │
│ ══════════════════ │        │ ══════════════════ │      │ ════════════════ │
│ id (PK)            │        │ id (PK)            │      │ id (PK)          │
│ postId (FK)        │        │ postId (FK)        │      │ userId (FK)      │
│ type (ENUM)        │        │ content            │      │ postId (FK)      │
│  - LIKE            │        │ staffUserId (FK)   │      │ type (ENUM)      │
│  - LOVE            │        │ clientUserId (FK)  │      │  - TAG           │
│  - CELEBRATE       │        │ managementUserId   │      │  - MENTION       │
│  - FIRE            │        │ createdAt          │      │  - COMMENT       │
│  - CLAP            │        └────────────────────┘      │  - REACTION      │
│  - LAUGH           │                                    │  - SYSTEM        │
│  - POO             │        (Anyone can comment)        │ title            │
│  - ROCKET          │                                    │ message          │
│  - SHOCKED         │                                    │ actionUrl        │
│  - MIND_BLOWN      │                                    │ read (bool)      │
│ staffUserId (FK)   │                                    │ readAt           │
│ clientUserId (FK)  │                                    │ createdAt        │
│ managementUserId   │                                    └──────────────────┘
│ createdAt          │
└────────────────────┘        (Notifications sent to
                              staff when tagged,
(Anyone can react)            mentioned, or their
                              post gets interaction)
```

---

## 💼 RECRUITMENT & HIRING PIPELINE

```
┌────────────────────┐
│   CLIENT_USERS     │
└────────┬───────────┘
         │
         │ creates (M:1)
         ↓
┌─────────────────────────────────────────┐
│     INTERVIEW_REQUESTS                  │
│  ═════════════════════════════════════  │
│  id (PK)                                │
│  clientUserId (FK)                      │
│  bpocCandidateId                        │
│  candidateFirstName                     │
│  preferredTimes (JSON)                  │
│  clientNotes                            │
│  status (ENUM)                          │
│   - PENDING        → Admin reviews      │
│   - APPROVED       → Interview allowed  │
│   - SCHEDULED      → Meeting set        │
│   - COMPLETED      → Interview done     │
│   - HIRE_REQUESTED → Client wants hire  │
│   - OFFER_SENT     → Admin sent offer   │
│   - OFFER_ACCEPTED → Candidate accepts  │
│   - OFFER_DECLINED → Candidate declines │
│   - HIRED          → Account created    │
│  adminNotes                             │
│  meetingLink                            │
│  scheduledTime                          │
│  hireRequestedBy                        │
│  hireRequestedAt                        │
│  clientPreferredStart                   │
│  finalStartDate                         │
│  offerSentAt                            │
│  offerResponseAt                        │
│  offerDeclineReason                     │
│  createdAt                              │
│  updatedAt                              │
└────────┬────────────────────────────────┘
         │
         │ (1:1 when hired)
         ↓
┌──────────────────────────────────────────┐
│       JOB_ACCEPTANCES                    │
│  ══════════════════════════════════════  │
│  id (PK)                                 │
│  interviewRequestId (FK, UK)             │
│  bpocCandidateId                         │
│  candidateEmail                          │
│  candidatePhone                          │
│  position                                │
│  companyId (FK)                          │
│  acceptedByAdminId (management_users.id) │
│  acceptedAt                              │
│  signupEmailSent (bool)                  │
│  signupEmailSentAt                       │
│  staffUserId (FK, UK) ────────────────┐  │
│  contractSigned (bool)                │  │
│  contractSignedAt                     │  │
│  createdAt                            │  │
│  updatedAt                            │  │
└───────┬───────────────────────────────┼──┘
        │                               │
        │ (1:1)                         │
        ↓                               │
┌───────────────────────────────┐      │
│  EMPLOYMENT_CONTRACTS         │      │
│  ═══════════════════════════  │      │
│  id (PK)                      │      │
│  jobAcceptanceId (FK, UK)     │      │
│  staffUserId (FK, UK) ────────┼──────┘
│  companyId (FK)               │      
│  employeeName                 │      Links to created
│  employeeAddress              │      staff_users record
│  position                     │      after signup
│  startDate                    │
│  basicSalary                  │
│  deMinimis                    │
│  totalMonthlyGross            │
│  hmoOffer                     │
│  paidLeave                    │
│  probationaryPeriod           │
│  pageInitials (JSON)          │      (5 pages to
│  finalSignatureUrl            │       initial)
│  pagesInitialed               │
│  totalPages                   │
│  fullyInitialed (bool)        │
│  signed (bool)                │
│  signedAt                     │
│  adminApproved (bool)         │
│  adminApprovedAt              │
│  adminApprovedBy              │
│  createdAt                    │
│  updatedAt                    │
└───────────────────────────────┘
```

---

## 🔗 COMPLETE RELATIONSHIP SUMMARY

### Primary Key Relationships

| Parent Table | Child Table | Relationship Type | Description |
|--------------|-------------|-------------------|-------------|
| `company` | `staff_users` | 1:M | Company has many staff |
| `company` | `client_users` | 1:M | Company has many clients |
| `company` | `tasks` | 1:M | Company has many tasks |
| `management_users` | `company` | 1:M | Manager manages companies |
| `staff_users` | `staff_profiles` | 1:1 | Staff has one profile |
| `staff_users` | `staff_onboarding` | 1:1 | Staff has one onboarding |
| `staff_users` | `staff_offboarding` | 1:1 | Staff has one offboarding |
| `staff_users` | `staff_personal_records` | 1:1 | Staff has one personal record |
| `staff_users` | `staff_welcome_forms` | 1:1 | Staff has one welcome form |
| `staff_users` | `gamification_profiles` | 1:1 | Staff has one gamification profile |
| `staff_users` | `employment_contracts` | 1:1 | Staff has one contract |
| `staff_users` | `job_acceptances` | 1:1 | Staff has one job acceptance |
| `staff_profiles` | `work_schedules` | 1:M | Profile has many schedules |
| `staff_users` | `time_entries` | 1:M | Staff has many time entries |
| `time_entries` | `breaks` | 1:M | Time entry has many breaks |
| `staff_users` | `breaks` | 1:M | Staff has many breaks |
| `staff_users` | `performance_metrics` | 1:M | Staff has many metrics |
| `staff_users` | `reviews` | 1:M | Staff has many reviews |
| `staff_users` | `documents` | 1:M | Staff uploads many documents |
| `documents` | `document_comments` | 1:M | Document has many comments |
| `staff_users` | `tasks` | 1:M | Staff has many tasks (legacy) |
| `tasks` | `task_assignments` | M:M | Tasks have many staff |
| `staff_users` | `task_assignments` | M:M | Staff have many tasks |
| `tasks` | `subtasks` | 1:M | Task has many subtasks |
| `tasks` | `task_responses` | 1:M | Task has many responses |
| `staff_users` | `tickets` | 1:M | Staff creates many tickets |
| `client_users` | `tickets` | 1:M | Client creates many tickets |
| `management_users` | `tickets` | 1:M | Management creates tickets |
| `tickets` | `ticket_responses` | 1:M | Ticket has many responses |
| `staff_users` | `activity_posts` | 1:M | Staff creates many posts |
| `client_users` | `activity_posts` | 1:M | Client creates many posts |
| `management_users` | `activity_posts` | 1:M | Management creates posts |
| `activity_posts` | `post_reactions` | 1:M | Post has many reactions |
| `activity_posts` | `post_comments` | 1:M | Post has many comments |
| `activity_posts` | `notifications` | 1:M | Post generates notifications |
| `staff_users` | `notifications` | 1:M | Staff receives notifications |
| `gamification_profiles` | `user_badges` | 1:M | Profile has many badges |
| `staff_users` | `kudos` (from) | 1:M | Staff gives many kudos |
| `staff_users` | `kudos` (to) | 1:M | Staff receives many kudos |
| `client_users` | `client_profiles` | 1:1 | Client has one profile |
| `client_users` | `interview_requests` | 1:M | Client requests many interviews |
| `interview_requests` | `job_acceptances` | 1:1 | Interview leads to acceptance |
| `job_acceptances` | `employment_contracts` | 1:1 | Acceptance requires contract |

---

## 📐 FOREIGN KEY INDEX

### All Foreign Keys in System

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOREIGN KEY REFERENCE MAP                    │
└─────────────────────────────────────────────────────────────────┘

COMPANY TABLE REFERENCES:
  → management_users.id (accountManagerId)

CLIENT_USERS REFERENCES:
  → company.id (companyId)

STAFF_USERS REFERENCES:
  → company.id (companyId)

STAFF_PROFILES REFERENCES:
  → staff_users.id (staffUserId)

STAFF_ONBOARDING REFERENCES:
  → staff_users.id (staffUserId)

STAFF_OFFBOARDING REFERENCES:
  → staff_users.id (staffUserId)

STAFF_PERSONAL_RECORDS REFERENCES:
  → staff_users.id (staffUserId)

STAFF_WELCOME_FORMS REFERENCES:
  → staff_users.id (staffUserId)

WORK_SCHEDULES REFERENCES:
  → staff_profiles.id (profileId)

TIME_ENTRIES REFERENCES:
  → staff_users.id (staffUserId)

BREAKS REFERENCES:
  → staff_users.id (staffUserId)
  → time_entries.id (timeEntryId)

PERFORMANCE_METRICS REFERENCES:
  → staff_users.id (staffUserId)

REVIEWS REFERENCES:
  → staff_users.id (staffUserId)

GAMIFICATION_PROFILES REFERENCES:
  → staff_users.id (staffUserId)

USER_BADGES REFERENCES:
  → gamification_profiles.id (profileId)

KUDOS REFERENCES:
  → staff_users.id (fromId)
  → staff_users.id (toId)

DOCUMENTS REFERENCES:
  → staff_users.id (staffUserId)

DOCUMENT_COMMENTS REFERENCES:
  → documents.id (documentId)

CLIENT_PROFILES REFERENCES:
  → client_users.id (clientUserId)

TASKS REFERENCES:
  → staff_users.id (staffUserId) [legacy]
  → company.id (companyId)
  → client_users.id (clientUserId)

TASK_ASSIGNMENTS REFERENCES:
  → tasks.id (taskId)
  → staff_users.id (staffUserId)

SUBTASKS REFERENCES:
  → tasks.id (taskId)

TASK_RESPONSES REFERENCES:
  → tasks.id (taskId)

TICKETS REFERENCES:
  → staff_users.id (staffUserId)
  → client_users.id (clientUserId)
  → management_users.id (managementUserId)

TICKET_RESPONSES REFERENCES:
  → tickets.id (ticketId)
  → staff_users.id (staffUserId)
  → client_users.id (clientUserId)
  → management_users.id (managementUserId)

ACTIVITY_POSTS REFERENCES:
  → staff_users.id (staffUserId)
  → client_users.id (clientUserId)
  → management_users.id (managementUserId)

POST_REACTIONS REFERENCES:
  → activity_posts.id (postId)
  → staff_users.id (staffUserId)
  → client_users.id (clientUserId)
  → management_users.id (managementUserId)

POST_COMMENTS REFERENCES:
  → activity_posts.id (postId)
  → staff_users.id (staffUserId)
  → client_users.id (clientUserId)
  → management_users.id (managementUserId)

NOTIFICATIONS REFERENCES:
  → staff_users.id (userId)
  → activity_posts.id (postId)

INTERVIEW_REQUESTS REFERENCES:
  → client_users.id (clientUserId)

JOB_ACCEPTANCES REFERENCES:
  → interview_requests.id (interviewRequestId)
  → company.id (companyId)
  → staff_users.id (staffUserId)

EMPLOYMENT_CONTRACTS REFERENCES:
  → job_acceptances.id (jobAcceptanceId)
  → staff_users.id (staffUserId)
  → company.id (companyId)
```

---

## 🎯 CASCADE DELETE RULES

```
DELETE CASCADE RELATIONSHIPS:

When STAFF_USERS is deleted:
  ├─ staff_profiles
  ├─ staff_onboarding
  ├─ staff_offboarding
  ├─ staff_personal_records
  ├─ staff_welcome_forms
  ├─ gamification_profiles
  │  └─ user_badges
  ├─ time_entries
  │  └─ breaks
  ├─ breaks
  ├─ performance_metrics
  ├─ reviews
  ├─ documents
  │  └─ document_comments
  ├─ tasks (if legacy FK set)
  ├─ task_assignments
  ├─ tickets
  ├─ ticket_responses
  ├─ activity_posts
  │  ├─ post_reactions
  │  ├─ post_comments
  │  └─ notifications
  ├─ kudos (both from and to)
  └─ notifications

When CLIENT_USERS is deleted:
  ├─ client_profiles
  ├─ interview_requests
  │  └─ job_acceptances
  │     └─ employment_contracts
  ├─ tickets
  ├─ ticket_responses
  ├─ activity_posts
  ├─ post_reactions
  └─ post_comments

When MANAGEMENT_USERS is deleted:
  ├─ tickets
  ├─ ticket_responses
  ├─ activity_posts
  ├─ post_reactions
  └─ post_comments

When COMPANY is deleted:
  ├─ client_users (and all their children)
  ├─ staff_users (and all their children)
  ├─ tasks
  ├─ job_acceptances
  └─ employment_contracts
```

---

## 📊 INDEXING STRATEGY

### Indexed Fields for Performance

```
PRIMARY KEYS (Auto-indexed):
  - All id fields

UNIQUE KEYS (Auto-indexed):
  - management_users.authUserId
  - management_users.email
  - staff_users.authUserId
  - staff_users.email
  - client_users.authUserId
  - client_users.email
  - company.organizationId
  - tickets.ticketId
  - [All 1:1 foreign keys]

CUSTOM INDEXES:

activity_posts:
  - audience
  - taggedUserIds (GIN index - array)
  - (audience, createdAt DESC) - composite
  - (type, createdAt DESC) - composite
  - taggedUserIds (GIN) - duplicate for performance

post_reactions:
  - postId
  - (postId, type) - composite
  - (postId, staffUserId, type) - unique composite

post_comments:
  - (postId, createdAt) - composite

notifications:
  - postId
  - (userId, createdAt DESC) - composite
  - (userId, read) - composite

staff_offboarding:
  - lastWorkingDate
  - status
```

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Total Tables Documented**: 33  
**Total Relationships Mapped**: 100+

