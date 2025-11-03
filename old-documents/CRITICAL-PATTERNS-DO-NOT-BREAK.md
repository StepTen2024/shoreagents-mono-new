# 🚨 CRITICAL PATTERNS - DO NOT BREAK

## ⚠️ READ THIS BEFORE MAKING ANY CHANGES

This document contains **MANDATORY** patterns that must be followed in this codebase. Violating these patterns **WILL BREAK THE APPLICATION**.

---

## 1️⃣ **AUTHENTICATION PATTERN (NEVER CHANGE)**

### ✅ CORRECT - Use This Always

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Continue with authenticated logic...
}
```

### ❌ WRONG - Never Use These

```typescript
// ❌ DO NOT USE
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"  // default import

const session = await getServerSession(authOptions)  // WRONG
if (!session?.user?.id) { ... }  // WRONG - use email
```

### **Why This Matters:**
- `auth()` is the configured function in `/lib/auth.ts`
- `{ prisma }` is a named export, not default
- `session.user.email` is the consistent identifier across the app
- Using wrong imports causes **runtime errors** and **authentication failures**

---

## 2️⃣ **PRISMA IMPORT PATTERN**

### ✅ CORRECT

```typescript
import { prisma } from "@/lib/prisma"

const user = await prisma.user.findUnique({ ... })
```

### ❌ WRONG

```typescript
import prisma from "@/lib/prisma"  // NO DEFAULT EXPORT
```

### **File: `/lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()
// ↑ Named export, not default

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

---

## 3️⃣ **CLIENT TASK SOURCE TRACKING**

### ✅ CORRECT - Always Set Source

```typescript
// When creating tasks from client portal
const task = await prisma.task.create({
  data: {
    userId: staffId,
    title: "Task Title",
    source: 'CLIENT',  // ← REQUIRED!
    status: 'TODO',
    priority: 'MEDIUM',
    // ... other fields
  }
})
```

### **Why This Matters:**
- `source` field tracks who created the task
- Staff portal shows badges based on source
- `CLIENT` = created by client
- `SELF` = created by staff member
- `MANAGEMENT` = created by admin

### **Badge Display:**
```typescript
{task.source === 'CLIENT' && (
  <Badge className="bg-blue-600">CLIENT</Badge>
)}
{task.source === 'SELF' && (
  <Badge className="bg-gray-600">SELF</Badge>
)}
```

---

## 4️⃣ **CLIENT-STAFF DATA SYNC PATTERN**

### **How Data Flows:**

```
CLIENT CREATES TASK
       ↓
POST /api/client/tasks
       ↓
Task saved with:
  - userId: staffId (who will work on it)
  - source: 'CLIENT' (who created it)
       ↓
STAFF SEES AT /tasks
       ↓
Staff updates status via drag & drop
       ↓
PUT /api/tasks/[id]
       ↓
CLIENT SEES UPDATE AT /client/tasks
```

### **Critical Rules:**
1. **Client API** (`/api/client/tasks`) creates tasks with `source: 'CLIENT'`
2. **Staff API** (`/api/tasks`) updates tasks (doesn't change source)
3. **Client view** shows tasks for ALL assigned staff
4. **Staff view** shows tasks assigned to that specific user
5. **Both sides** can update status, priority, etc.

---

## 5️⃣ **UI COMPONENT PATTERNS**

### **Bulk Create Dialog (Client Tasks)**

#### ✅ CORRECT - High Contrast UI

```tsx
<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white">
  <DialogHeader>
    <DialogTitle className="text-gray-900">Bulk Create Tasks</DialogTitle>
  </DialogHeader>
  
  <Card className="p-4 bg-blue-50 border-2 border-blue-200">
    <Input
      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
      placeholder="Task title"
    />
  </Card>
</DialogContent>
```

#### ❌ WRONG - Low Contrast (Invisible)

```tsx
<DialogContent className="max-w-3xl">  {/* No bg-white */}
  <Card className="p-4">  {/* No bg-blue-50 or border */}
    <Input
      placeholder="Task title"  {/* No text color specified */}
    />
  </Card>
</DialogContent>
```

### **Why This Matters:**
- Default dialog has transparent/gray background
- White text on white background = invisible
- Must explicitly set `bg-white` and `text-gray-900`

---

## 6️⃣ **DOCUMENT SHARING PATTERN**

### **Staff Uploads Document:**

```typescript
// In /api/documents (staff side)
const document = await prisma.document.create({
  data: {
    userId: staffUser.id,  // Staff member who uploaded
    title: "Policy Document",
    category: "HR",
    content: documentContent,
    uploadedBy: staffUser.name
  }
})

// Check which clients this staff is assigned to
const assignments = await prisma.staffAssignment.findMany({
  where: {
    userId: staffUser.id,
    isActive: true
  },
  include: { client: true }
})

// Documents automatically shared with assigned clients
```

### **Client Sees Document:**

```typescript
// In /api/client/documents (client side)
const clientUser = await prisma.clientUser.findUnique({
  where: { email: session.user.email },
  include: { client: true }
})

// Get documents from assigned staff
const assignments = await prisma.staffAssignment.findMany({
  where: {
    clientId: clientUser.client.id,
    isActive: true
  }
})

const staffIds = assignments.map(a => a.userId)

const documents = await prisma.document.findMany({
  where: {
    userId: { in: staffIds }  // All assigned staff docs
  }
})
```

### **Badge Display:**

```typescript
// Purple badge = Staff document
<Badge className="bg-purple-600">Staff Document</Badge>

// Blue badge = Client document
<Badge className="bg-blue-600">Client Document</Badge>
```

---

## 7️⃣ **TIME TRACKING PATTERN**

### **Staff Clock In/Out:**

```typescript
// Clock In
POST /api/time-tracking/clock-in
{
  userId: session.user.id,
  date: today,
  clockIn: now
}

// Clock Out
POST /api/time-tracking/clock-out
{
  id: activeEntryId,
  clockOut: now,
  totalHours: (clockOut - clockIn) in hours
}
```

### **Client Views Time Data:**

```typescript
// In /api/client/time-tracking
const clientUser = await prisma.clientUser.findUnique({
  where: { email: session.user.email },
  include: { client: true }
})

const assignments = await prisma.staffAssignment.findMany({
  where: {
    clientId: clientUser.client.id,
    isActive: true
  }
})

const staffIds = assignments.map(a => a.userId)

const timeEntries = await prisma.timeEntry.findMany({
  where: {
    userId: { in: staffIds },  // All assigned staff
    date: { gte: startDate, lte: endDate }
  },
  include: {
    user: {
      select: { name: true, avatar: true }
    }
  }
})
```

### **Critical: totalHours Type Conversion**

```typescript
// ❌ WRONG - Decimal type can't call toFixed
<div>{entry.totalHours.toFixed(2)}</div>

// ✅ CORRECT - Convert to Number first
<div>{Number(entry.totalHours).toFixed(2)}</div>
```

---

## 8️⃣ **COMPONENT EXPORT PATTERNS**

### **Sidebar Components:**

#### ✅ CORRECT - Named Export

```typescript
// /components/client-sidebar.tsx
export function ClientSidebar() {
  return <nav>...</nav>
}

// Import as:
import { ClientSidebar } from "@/components/client-sidebar"
```

#### ❌ WRONG - Mixed Exports

```typescript
// Don't mix default and named exports
export default function ClientSidebar() { ... }

// And then import as named:
import { ClientSidebar } from "@/components/client-sidebar"  // BREAKS
```

---

## 9️⃣ **PAGE COMPONENT PATTERNS**

### ✅ CORRECT - Default Export for Pages

```typescript
// /app/client/tasks/page.tsx
export default function ClientTasksPage() {
  return <div>...</div>
}
```

### ✅ CORRECT - Import Other Component

```typescript
// /app/time-tracking/page.tsx
import TimeTracking from "@/components/time-tracking"

export default function TimeTrackingPage() {
  return <TimeTracking />
}
```

### ❌ WRONG - Empty Page

```typescript
// /app/time-tracking/page.tsx
// (empty file)

// Results in: "The default export is not a React Component"
```

---

## 🔟 **API RESPONSE PATTERNS**

### **Success Responses:**

```typescript
// Single item
return NextResponse.json({ task }, { status: 200 })

// List
return NextResponse.json({ tasks }, { status: 200 })

// Created
return NextResponse.json({ task }, { status: 201 })

// With metadata
return NextResponse.json({
  tasks,
  count: tasks.length,
  message: "Success"
}, { status: 201 })
```

### **Error Responses:**

```typescript
// Unauthorized
return NextResponse.json(
  { error: "Unauthorized" },
  { status: 401 }
)

// Not Found
return NextResponse.json(
  { error: "Task not found" },
  { status: 404 }
)

// Server Error
return NextResponse.json(
  { error: "Failed to create task" },
  { status: 500 }
)
```

---

## 1️⃣1️⃣ **DATABASE QUERY PATTERNS**

### **Find with Relations:**

```typescript
const task = await prisma.task.findUnique({
  where: { id },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    }
  }
})
```

### **Filter with Date Range:**

```typescript
const timeEntries = await prisma.timeEntry.findMany({
  where: {
    userId: { in: staffIds },
    date: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }
})
```

### **Bulk Create:**

```typescript
await Promise.all(
  tasks.map(task =>
    prisma.task.create({
      data: {
        ...task,
        userId,
        source: 'CLIENT',
        status: 'TODO'
      }
    })
  )
)
```

---

## 🎯 **TESTING CHECKLIST**

After making ANY changes, test these:

### **✅ Staff Portal:**
1. Visit `http://localhost:3000/tasks`
2. Create a task
3. Drag task to different column
4. Verify task updates

### **✅ Client Portal:**
1. Visit `http://localhost:3000/client/tasks`
2. Create single task
3. Create bulk tasks (5+)
4. Verify tasks appear with "CLIENT" badge
5. Update task status
6. Verify staff can see it

### **✅ Authentication:**
1. Logout
2. Login again
3. All pages should load
4. No "Unauthorized" errors

### **✅ Terminal:**
1. No import errors
2. No 404 errors (missing routes)
3. No 500 errors (server crashes)
4. All API routes return 200/201

---

## 🚫 **NEVER DO THIS:**

1. ❌ Change import pattern for `auth` or `prisma`
2. ❌ Use `session?.user?.id` instead of `session?.user?.email`
3. ❌ Create tasks without setting `source` field
4. ❌ Use default export for `ClientSidebar`
5. ❌ Leave page files empty
6. ❌ Remove `bg-white` from dialog components
7. ❌ Call `toFixed()` on Prisma Decimal without converting to Number
8. ❌ Delete or overwrite working files without backing up
9. ❌ Change API response structure without updating frontend
10. ❌ Skip testing after making changes
11. ❌ **DUPLICATE RETURN STATEMENTS** - React components can only have ONE return
12. ❌ **COPY-PASTE ENTIRE COMPONENTS** - Always check for duplicates before saving

---

## 📚 **QUICK REFERENCE**

### **Files to NEVER Modify:**
- `/lib/auth.ts` - Auth configuration
- `/lib/prisma.ts` - Prisma client singleton
- `/prisma/schema.prisma` - Database schema (unless adding new features)

### **Files with Strict Patterns:**
- `/app/api/client/tasks/route.ts` - Client task API
- `/app/api/client/tasks/[id]/route.ts` - Individual task API
- `/app/api/client/documents/route.ts` - Document API
- `/app/api/client/time-tracking/route.ts` - Time tracking API
- `/app/client/tasks/page.tsx` - Client tasks UI
- `/components/client-sidebar.tsx` - Named export only

### **Import Checklist:**
```typescript
✅ import { auth } from "@/lib/auth"
✅ import { prisma } from "@/lib/prisma"
✅ import { NextRequest, NextResponse } from "next/server"
✅ const session = await auth()
✅ if (!session?.user?.email) { ... }
```

---

## 🆘 **IF SOMETHING BREAKS:**

1. **Check terminal for errors**
   - Import errors? Fix imports to match patterns above
   - 404 errors? API route missing or wrong path
   - 500 errors? Check Prisma query syntax

2. **Check browser console**
   - Authentication errors? Check `auth()` pattern
   - Type errors? Check data transformations
   - UI not visible? Check `bg-white` and `text-gray-900`

3. **Reference Documentation:**
   - `CLIENT-TASKS-COMPLETE.md` - Tasks system
   - `SHARED-KNOWLEDGE-BASE.md` - Documents system
   - `TIME-TRACKING-SETUP.md` - Time tracking
   - `PROJECT_STATUS.md` - Overall status

4. **Last Resort:**
   - Check git history
   - Find last working version
   - Compare differences

---

## 🎯 **SUMMARY OF CRITICAL RULES:**

1. **Always use** `{ auth }` and `{ prisma }` imports
2. **Always check** `session?.user?.email` (not `.id`)
3. **Always set** `source: 'CLIENT'` for client-created tasks
4. **Always include** user relations in task queries
5. **Always use** `bg-white` for dialog backgrounds
6. **Always convert** Prisma Decimals to Number before `.toFixed()`
7. **Always test** both client and staff portals after changes
8. **Never change** working import patterns
9. **Never delete** files without confirmation
10. **Never assume** - always verify in terminal and browser

---

**Last Updated:** October 13, 2025  
**Violating these patterns will break the application. Follow them strictly.**

---

## 1️⃣2️⃣ **DUPLICATE CODE DETECTION (CRITICAL)**

### ⚠️ THE PROBLEM - Support Tickets Had This Issue

**Error:** "Return statement is not allowed here"

**Cause:** The entire return statement in `/components/support-tickets.tsx` was accidentally duplicated.

### ✅ CORRECT - One Return Per Component

```javascript
export default function SupportTickets() {
  // ... all logic, hooks, functions ...
  
  // ONLY ONE RETURN STATEMENT
  return (
    <div>
      {/* All JSX here */}
    </div>
  )
}  // ← Component ends here
```

### ❌ WRONG - Duplicate Return Causes Syntax Error

```javascript
export default function SupportTickets() {
  // ... logic ...
  
  return (
    <div>First return</div>
  )
  }  // ← Tries to close function
  
  return (  // ← ❌ SYNTAX ERROR! Can't have two returns
    <div>Duplicate return</div>
  )
}
```

### **How to Detect Duplicates:**

```bash
# Check for multiple return statements
grep -n "return (" components/support-tickets.tsx

# Should only show ONE main return (line 242 in this case)
# If you see TWO lines, you have a duplicate!
```

### **Why This Matters:**
- JavaScript functions can only have ONE return statement at the function level
- React components are functions
- Duplicate returns cause immediate syntax errors
- Usually happens from copy-paste mistakes or bad git merges

### **If You See This Error:**
1. Open the file
2. Search for `return (`
3. Find the duplicate (usually at the end)
4. Delete everything from the duplicate onwards
5. Verify proper closing brace

---

## 1️⃣3️⃣ **PROFILE MODEL FIELDS (CRITICAL)**

### ✅ CORRECT - Use These Field Names

```typescript
// ✅ Profile fields that EXIST
profile: {
  select: {
    currentRole: true,     // ← Position/Role (NOT "position")
    client: true,          // ← Client/Department (NOT "department")
    location: true,        // ← Fallback location
    phone: true,
    employmentStatus: true,
    startDate: true,
    salary: true,
    // ... other actual fields
  }
}

// Map to display-friendly names
const position = profile?.currentRole || 'Staff Member'
const department = profile?.client || profile?.location || 'General'
```

### ❌ WRONG - These Fields DO NOT Exist

```typescript
// ❌ DO NOT USE - These will cause Prisma errors
profile: {
  select: {
    position: true,     // DOES NOT EXIST
    department: true,   // DOES NOT EXIST
  }
}
```

### **Why This Matters:**
- The Profile model uses `currentRole` not `position`
- The Profile model uses `client` not `department`
- Using wrong field names causes "Unknown field" Prisma validation errors
- This breaks the Client Monitoring page and any staff-related queries

### **Error You'll See If You Break This:**
```
PrismaClientValidationError: Unknown field `position` for select statement on model `Profile`
```

---

## 1️⃣4️⃣ **CLOUDCONVERT DOCUMENT UPLOAD PATTERN**

### ✅ CORRECT - Use This Pattern for File Uploads

```typescript
import CloudConvert from 'cloudconvert'

// Extract text content from file using CloudConvert
let content = ""
let fileSize = "0 KB"

if (file) {
  fileSize = `${(file.size / 1024).toFixed(2)} KB`
  const fileName = file.name
  const fileExt = '.' + fileName.split('.').pop()?.toLowerCase()
  
  try {
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // For TXT and MD files, read directly (no conversion needed)
    if (fileExt === '.txt' || fileExt === '.md') {
      const buffer = Buffer.from(fileBuffer)
      content = buffer.toString('utf-8')
      console.log('✅ Text file read directly, length:', content.length)
    } 
    // For PDF, DOC, DOCX - use CloudConvert
    else if (fileExt === '.pdf' || fileExt === '.doc' || fileExt === '.docx') {
      console.log('☁️ Starting CloudConvert extraction for', fileName)
      
      const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!)
      
      const job = await cloudConvert.jobs.create({
        tasks: {
          'upload-file': { operation: 'import/upload' },
          'convert-to-txt': {
            operation: 'convert',
            input: 'upload-file',
            output_format: 'txt',
            engine: fileExt === '.pdf' ? 'pdftotext' : undefined,
          },
          'export-txt': {
            operation: 'export/url',
            input: 'convert-to-txt',
          },
        },
      })

      const uploadTask = job.tasks.filter((task) => task.name === 'upload-file')[0]
      const buffer = Buffer.from(fileBuffer)
      await cloudConvert.tasks.upload(uploadTask, buffer, fileName)

      const completedJob = await cloudConvert.jobs.wait(job.id)
      const exportTask = completedJob.tasks.filter((task) => task.name === 'export-txt')[0]

      if (exportTask?.result?.files?.[0]?.url) {
        const txtUrl = exportTask.result.files[0].url
        const response = await fetch(txtUrl)
        content = await response.text()
        console.log('✅ Text extracted successfully, length:', content.length)
      } else {
        content = `[File: ${fileName}]`
      }
    } else {
      content = `[Unsupported file type: ${fileExt}]`
    }
  } catch (err) {
    console.error("Error extracting text:", err)
    content = `[File: ${fileName} - Extraction failed]`
  }
}

// Create document with extracted text
const document = await prisma.document.create({
  data: {
    userId: user.id,
    title,
    category,
    source: 'STAFF',  // or 'CLIENT'
    content,  // Extracted text
    size: fileSize,
    uploadedBy: user.name,
    fileUrl: null,
  },
})
```

### ❌ WRONG - Don't Use These Approaches

```typescript
// ❌ DO NOT USE - Basic text decoding (doesn't work for PDF/DOCX)
const arrayBuffer = await file.arrayBuffer()
const decoder = new TextDecoder('utf-8')
content = decoder.decode(arrayBuffer)  // ❌ Returns garbage for PDFs

// ❌ DO NOT USE - JSON body for file uploads
const body = await request.json()  // ❌ Can't send binary files in JSON
const { file, title } = body  // ❌ Wrong

// ❌ DO NOT USE - Missing CloudConvert for PDFs
if (fileExt === '.pdf') {
  // Just read directly ❌ WRONG
  content = buffer.toString('utf-8')
}
```

### **Why This Matters:**
- **PDFs, DOCs, and DOCX files** contain binary data, not plain text
- Using `TextDecoder` on PDFs returns garbled characters, not readable text
- CloudConvert extracts the actual text content from these files
- TXT and MD files can be read directly (no conversion needed)
- FormData is required for file uploads, not JSON
- Always include error handling - CloudConvert can fail

### **Where This Is Used:**
- `/app/api/documents/route.ts` - Staff document uploads
- `/app/api/client/documents/route.ts` - Client document uploads
- Any future file upload endpoints

### **Error You'll See If You Break This:**
```
// If using TextDecoder on PDF:
content = "ÿþ%PDF-1.4ÿþ1 0 obj..." // Garbage binary data

// If missing CloudConvert:
Error: Cannot decode binary file format

// If using JSON instead of FormData:
Error: file is not a File object
```

### **Environment Variable Required:**
```env
CLOUDCONVERT_API_KEY="your_api_key_here"
```

---

## 📖 **RELATED DOCUMENTATION:**

- [CLIENT-TASKS-COMPLETE.md](./CLIENT-TASKS-COMPLETE.md) - Client Tasks System
- [CLIENT-MONITORING-COMPLETE.md](./CLIENT-MONITORING-COMPLETE.md) - ✅ **NEW** Client Monitoring System
- [SHARED-KNOWLEDGE-BASE.md](./SHARED-KNOWLEDGE-BASE.md) - Document Sharing
- [TIME-TRACKING-SETUP.md](./TIME-TRACKING-SETUP.md) - Time Tracking
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Project Status
- [BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md) - Backend APIs

---

**🚨 MANDATORY READING FOR ALL DEVELOPERS WORKING ON THIS PROJECT 🚨**

