# 🎥 AI-POWERED VIDEO CALL WORKFLOW - FUTURE FEATURE

**Status:** 💡 Concept / Future Implementation  
**Priority:** High - Game-changing feature  
**Estimated Time:** 4-6 weeks full implementation  
**Cost per Call:** ~$1.67 (can charge $50+)  

---

## 🎯 THE VISION

Automatically process client training calls to extract action items, create tasks, and assign to staff - all without manual work.

### **Current Workflow (Manual):**
```
📹 Client Call → 📝 Someone takes notes → ✍️ Someone creates tasks → 👤 Someone assigns → 📬 Staff gets notified
```

### **Future Workflow (Automated):**
```
📹 Client Call → 🤖 AI does EVERYTHING → ✅ Staff just works
```

---

## 🔥 WHY THIS IS GENIUS

### **1. Removes Manual Note-Taking** 📝
- No more scrambling to capture everything
- No missed action items
- Perfect accuracy

### **2. Nothing Gets Lost** 🎯
- ✅ Every request captured
- ✅ Every action item logged
- ✅ Every timeline documented
- ✅ Full transcript for reference

### **3. Instant Accountability** 📊
```
Client: "We need X, Y, Z done by Friday"
AI: Creates 3 tasks, assigns to staff, sets deadline Friday
Staff: Gets notifications immediately
Client: Sees tasks in their portal instantly
```

### **4. Training Documentation** 📚
- Every training call = Searchable knowledge base
- New staff can search: "How to use VAULTRE CRM?"
- AI finds transcript + creates training tasks

---

## 🎬 EXAMPLE WORKFLOW

### **During Training Call:**
```
Client: "Okay team, we need to update all our VAULTRE listings 
         with the new pricing by next Friday. Also, the CRM 
         login isn't working for Sarah. Can IT look at that?"
```

### **AI Processes (30 seconds after call):**
```
✅ Task Created: "Update all VAULTRE listings with new pricing"
   - Assigned to: Marketing Team
   - Deadline: Next Friday
   - Priority: HIGH
   - Source: [Link to timestamp 00:12:34 in recording]

✅ Ticket Created: "CRM login issue for Sarah"
   - Category: IT
   - Priority: URGENT
   - Description: Extracted from call + timestamp
   - Assigned to: IT Support
```

### **Notifications Sent:**
```
📬 Marketing Team: "New task from Client ABC training call"
📬 IT Support: "New urgent ticket from Client ABC"
📬 Client: "We've created 2 action items from your call"
```

### **Client Portal Shows:**
```
📹 Training Call - Nov 22, 2025
   Duration: 45 mins
   Participants: 5
   
   📋 Action Items Created (2):
   ✅ Update VAULTRE listings - In Progress (60%)
   ✅ Fix CRM login - Completed ✓
   
   🎙️ [View Transcript] [Listen to Recording]
   💬 Click any task to jump to that part of the call
```

---

## 🛠️ TECHNICAL IMPLEMENTATION

### **Tech Stack:**

1. **Daily.co API** 📹
   - Video conferencing platform
   - Built-in cloud recording
   - Webhook notifications
   - Cost: $0.004/min per participant

2. **OpenAI Whisper API** 🎙️
   - Audio transcription
   - Uses existing OPENAI_API_KEY
   - Cost: $0.006/min
   - Provides timestamps per segment

3. **Claude API** 🤖
   - Already integrated! ✅
   - Analyzes transcripts
   - Extracts action items
   - Creates tasks/tickets via tools
   - Cost: ~$0.50/call

**Total Cost: ~$1.67 per 45-min call with 5 participants**

---

## 📋 REQUIRED API KEYS

```env
# ✅ Already Have:
OPENAI_API_KEY=sk-...              # For Whisper + Embeddings
ANTHROPIC_API_KEY=sk-ant-...       # For Claude
DAILY_API_KEY=...                  # For Daily.co

# That's it! No additional keys needed!
```

**Note:** Whisper uses the SAME OpenAI API key we already use for embeddings!

---

## 🚀 IMPLEMENTATION PHASES

### **Phase 1: Basic Integration (1-2 weeks)**
```typescript
// Features:
- ✅ Create Daily.co meeting rooms
- ✅ Enable cloud recording
- ✅ Store meeting metadata in database
- ✅ Display upcoming/past calls in client portal
- ✅ Access recordings

// Files to create:
- lib/daily-integration.ts
- app/api/meetings/create/route.ts
- app/api/meetings/[id]/route.ts
- components/meetings/meeting-room.tsx
```

### **Phase 2: Transcription (1 week)**
```typescript
// Features:
- ✅ Webhook catches recording ready
- ✅ Download recording from Daily.co
- ✅ Send to Whisper API
- ✅ Store transcript in database
- ✅ Display in UI with timestamps

// Files to create:
- lib/whisper-transcription.ts
- app/api/webhooks/daily/route.ts
- app/api/meetings/[id]/transcript/route.ts
- components/meetings/transcript-viewer.tsx
```

### **Phase 3: AI Processing (1 week)**
```typescript
// Features:
- ✅ Claude analyzes transcript
- ✅ Extracts action items
- ✅ Creates tasks automatically
- ✅ Creates tickets for issues
- ✅ Links tasks to transcript timestamps
- ✅ Notifies assigned staff

// Files to create:
- lib/call-ai-processor.ts
- lib/ai-tools.ts (add new tools)
- app/api/meetings/[id]/process/route.ts
```

### **Phase 4: Smart Features (2 weeks)**
```typescript
// Features:
- ✅ Auto-assign to specific staff members
- ✅ Click timestamp → play that part of call
- ✅ Searchable transcript database
- ✅ AI-generated meeting summary
- ✅ Client can approve/reject tasks
- ✅ Track promises made vs completed

// Files to create:
- lib/meeting-search.ts
- components/meetings/timestamp-player.tsx
- components/meetings/meeting-summary.tsx
- app/client/meetings/[id]/page.tsx
```

### **Phase 5: Advanced Features (Future)**
```typescript
// Features:
- ✅ Real-time transcription during call
- ✅ AI suggests action items DURING call
- ✅ Sentiment analysis (is client happy?)
- ✅ Automatic follow-up email generation
- ✅ Track recurring topics across calls
- ✅ Performance metrics per staff member
```

---

## 📊 DATABASE SCHEMA CHANGES

### **New Tables Needed:**

```sql
-- Meetings table
create table public.meetings (
  id text primary key default gen_random_uuid()::text,
  room_name text not null,
  daily_room_url text not null,
  client_id text references client_users(id),
  company_id text references company(id),
  created_by_id text not null,
  created_by_type text not null, -- STAFF, CLIENT, MANAGEMENT
  purpose text,
  scheduled_at timestamp,
  started_at timestamp,
  ended_at timestamp,
  duration_minutes integer,
  status text not null, -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  recording_url text,
  recording_ready boolean default false,
  transcript text,
  transcript_ready boolean default false,
  ai_processed boolean default false,
  participants jsonb, -- Array of participant info
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

-- Meeting tasks (links tasks to meetings)
create table public.meeting_tasks (
  id text primary key default gen_random_uuid()::text,
  meeting_id text references meetings(id) on delete cascade,
  task_id text references tasks(id) on delete cascade,
  transcript_timestamp text, -- "00:12:34" - where in call this was mentioned
  created_at timestamp not null default now()
);

-- Meeting transcripts (for searchability)
create table public.meeting_transcript_segments (
  id text primary key default gen_random_uuid()::text,
  meeting_id text references meetings(id) on delete cascade,
  speaker text,
  text text not null,
  start_time decimal not null, -- seconds
  end_time decimal not null,
  created_at timestamp not null default now()
);

-- Add indexes
create index meeting_transcript_search_idx on meeting_transcript_segments using gin(to_tsvector('english', text));
```

---

## 🎯 CODE EXAMPLES

### **1. Create Meeting Room**

```typescript
// lib/daily-integration.ts
import axios from 'axios'

export async function createDailyRoom(
  clientId: string,
  purpose: string,
  scheduledAt: Date
) {
  const response = await axios.post(
    'https://api.daily.co/v1/rooms',
    {
      properties: {
        enable_recording: 'cloud',
        enable_transcription: false, // We'll use Whisper instead
        max_participants: 20,
        exp: Math.floor(scheduledAt.getTime() / 1000) + (24 * 60 * 60), // Expires 24h after scheduled time
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      }
    }
  )

  const room = response.data

  // Save to database
  const meeting = await prisma.meetings.create({
    data: {
      roomName: room.name,
      dailyRoomUrl: room.url,
      clientId,
      purpose,
      scheduledAt,
      status: 'SCHEDULED',
      recordingReady: false,
      transcriptReady: false,
      aiProcessed: false,
    }
  })

  return { meeting, roomUrl: room.url }
}
```

### **2. Transcribe Recording**

```typescript
// lib/whisper-transcription.ts
import OpenAI from 'openai'
import fs from 'fs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function transcribeRecording(
  recordingUrl: string,
  meetingId: string
) {
  // Download recording
  const response = await fetch(recordingUrl)
  const audioBuffer = await response.arrayBuffer()
  
  // Save temporarily
  const tempPath = `/tmp/${meetingId}.mp4`
  fs.writeFileSync(tempPath, Buffer.from(audioBuffer))
  
  // Transcribe with Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(tempPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  })
  
  // Save full transcript
  await prisma.meetings.update({
    where: { id: meetingId },
    data: {
      transcript: transcription.text,
      transcriptReady: true,
    }
  })
  
  // Save segments with timestamps
  for (const segment of transcription.segments) {
    await prisma.meeting_transcript_segments.create({
      data: {
        meetingId,
        text: segment.text,
        startTime: segment.start,
        endTime: segment.end,
      }
    })
  }
  
  // Clean up temp file
  fs.unlinkSync(tempPath)
  
  return transcription.text
}
```

### **3. AI Processing**

```typescript
// lib/call-ai-processor.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function processCallTranscript(
  transcript: string,
  meetingId: string
) {
  const meeting = await prisma.meetings.findUnique({
    where: { id: meetingId },
    include: {
      client_users: true,
      company: true,
    }
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Analyze this client training call transcript and extract action items.
      
      For each action item:
      - Create a task with clear title and description
      - Determine priority based on urgency mentioned in call
      - Extract deadline if mentioned
      - Identify who should be assigned (if mentioned)
      
      Call Transcript:
      ${transcript}
      
      Client: ${meeting.client_users?.name || 'Unknown'}
      Company: ${meeting.company?.companyName || 'Unknown'}`
    }],
    tools: [
      {
        name: 'create_task_from_call',
        description: 'Create a task based on action item mentioned in the call',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            deadline: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'description', 'priority']
        }
      },
      {
        name: 'create_ticket_from_call',
        description: 'Create a ticket for any issue/bug reported in the call',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            category: { enum: ['IT', 'HR', 'EQUIPMENT', 'OTHER'] },
            priority: { enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          },
          required: ['title', 'description', 'category', 'priority']
        }
      }
    ]
  })

  // Execute all tool calls
  const createdItems = []
  
  for (const block of response.content) {
    if (block.type === 'tool_use') {
      if (block.name === 'create_task_from_call') {
        const task = await createTaskFromCall(block.input, meetingId, meeting.clientId)
        createdItems.push({ type: 'task', data: task })
      } else if (block.name === 'create_ticket_from_call') {
        const ticket = await createTicketFromCall(block.input, meetingId)
        createdItems.push({ type: 'ticket', data: ticket })
      }
    }
  }

  // Mark as processed
  await prisma.meetings.update({
    where: { id: meetingId },
    data: { aiProcessed: true }
  })

  return createdItems
}

async function createTaskFromCall(input: any, meetingId: string, clientId: string) {
  // Similar to existing createTask but links to meeting
  const task = await prisma.tasks.create({
    data: {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      priority: input.priority,
      deadline: input.deadline ? new Date(input.deadline) : null,
      tags: input.tags || [],
      clientUserId: clientId,
      source: 'AI_AGENT',
      status: 'TODO',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  // Link to meeting
  await prisma.meeting_tasks.create({
    data: {
      meetingId,
      taskId: task.id,
    }
  })

  return task
}
```

### **4. Daily.co Webhook Handler**

```typescript
// app/api/webhooks/daily/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const payload = await request.json()

  // Handle recording.ready event
  if (payload.event === 'recording.ready') {
    const { room_name, download_url } = payload

    // Find meeting
    const meeting = await prisma.meetings.findFirst({
      where: { roomName: room_name }
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Update with recording URL
    await prisma.meetings.update({
      where: { id: meeting.id },
      data: {
        recordingUrl: download_url,
        recordingReady: true,
      }
    })

    // Trigger transcription (background job)
    await transcribeRecording(download_url, meeting.id)

    // After transcription, trigger AI processing
    const transcript = await prisma.meetings.findUnique({
      where: { id: meeting.id },
      select: { transcript: true }
    })

    if (transcript?.transcript) {
      await processCallTranscript(transcript.transcript, meeting.id)
    }
  }

  return NextResponse.json({ received: true })
}
```

---

## 🧪 TESTING STRATEGY (LOCAL)

### **Option 1: Use Pre-Recorded Audio**
```bash
# Record yourself talking for 2-3 minutes
# Pretend to be a client giving requirements
# Save as MP3/MP4

# Test Whisper:
node test-whisper.js

# Test AI extraction:
node test-ai-extraction.js
```

### **Option 2: Use Sample Transcript**
```typescript
const sampleTranscript = `
Client: Hi team, we need to update all our VAULTRE listings 
        with the new pricing by next Friday.
        
Staff: Got it, what's the new pricing structure?

Client: It's in the email I sent. Also, Sarah can't login 
        to the CRM. Can IT look at that urgently?
`

// Test AI without needing real audio
await processCallTranscript(sampleTranscript, 'test-meeting-id')
```

### **Option 3: Test with Yourself**
```bash
# Daily.co lets you join from multiple devices
# Open meeting URL in:
# - Browser Tab 1 (as "client")
# - Browser Tab 2 (as "staff")
# - OR use laptop + phone

# Talk between them to simulate a call
# Recording will capture everything
```

---

## 💰 PRICING & ROI

### **Cost Breakdown:**
```
45-minute client call with 5 participants:

Daily.co:     $0.004/min × 45 min × 5 people = $0.90
Whisper API:  $0.006/min × 45 min = $0.27
Claude API:   ~$0.50 per call analysis

Total: $1.67 per call
```

### **Potential Revenue:**
```
Charge clients:
- $50/call for "AI-assisted call processing"
- OR include in premium tier ($500/month)
- OR charge per task created ($5/task)

If client has 10 calls/month:
Cost: $16.70
Charge: $500
Profit: $483.30/month per client 💰
```

### **Value Proposition:**
```
"We automatically process your training calls:
✅ Full transcript with timestamps
✅ AI-extracted action items
✅ Tasks created & assigned instantly
✅ Full transparency & accountability
✅ Searchable call library

No manual note-taking. No missed action items.
Just results."
```

---

## 🎯 COMPETITIVE ADVANTAGE

### **NO OTHER BPO HAS THIS!**

Current market:
- ❌ Most BPOs: Manual notes, unclear follow-ups
- ❌ Some use Otter.ai: Transcript only, no automation
- ❌ Enterprise tools: Expensive, complex, not integrated

**You would offer:**
- ✅ Integrated with client portal
- ✅ Automatic task creation
- ✅ Direct staff assignment
- ✅ Real-time progress tracking
- ✅ Searchable knowledge base
- ✅ Full audit trail

**Clients would pay PREMIUM for this transparency!** 💎

---

## 📈 SUCCESS METRICS

Track these to prove ROI:

1. **Time Saved:**
   - Before: 30 mins post-call admin per call
   - After: 2 mins to review AI-created tasks
   - **Savings: 93% time reduction**

2. **Accuracy:**
   - Before: ~60% of action items captured
   - After: ~95% with AI
   - **Improvement: 58% more items tracked**

3. **Client Satisfaction:**
   - Track NPS scores before/after
   - Survey: "Do you feel heard?"
   - **Target: +20 NPS points**

4. **Staff Productivity:**
   - Tasks completed per week
   - Time from request → completion
   - **Target: 30% faster completion**

---

## 🚧 POTENTIAL CHALLENGES

### **1. Audio Quality**
- **Issue:** Bad audio = Bad transcript
- **Solution:** 
  - Daily.co has good quality by default
  - Add noise cancellation
  - Whisper is pretty robust

### **2. Multiple Speakers**
- **Issue:** Whisper doesn't identify speakers
- **Solution:**
  - Daily.co can provide speaker diarization
  - OR use AssemblyAI (has speaker detection)
  - OR prompt Claude to infer from context

### **3. Privacy Concerns**
- **Issue:** Clients may not want calls recorded
- **Solution:**
  - Make it opt-in
  - Clear consent at start of call
  - "This call is being recorded for task extraction"
  - Allow clients to review before tasks are created

### **4. Local Testing**
- **Issue:** Hard to test alone
- **Solution:**
  - Use sample transcripts
  - Join call from 2 devices
  - Partner with teammate for test calls

### **5. Cost at Scale**
- **Issue:** Costs add up with many calls
- **Solution:**
  - Pass costs to clients
  - Build it into pricing
  - ROI is huge (saves 30 mins × $20/hr = $10/call)

---

## 🎯 NEXT STEPS (WHEN READY)

1. **Research Phase** (1 week)
   - Test Whisper with sample audio
   - Test Claude with sample transcripts
   - Prototype task extraction

2. **MVP Development** (2-3 weeks)
   - Basic Daily.co integration
   - Recording → Transcript pipeline
   - AI task extraction
   - Display in client portal

3. **Internal Testing** (1 week)
   - Test with team calls
   - Refine AI prompts
   - Fix bugs

4. **Beta with 1-2 Clients** (2 weeks)
   - Get feedback
   - Measure time savings
   - Iterate on UX

5. **Full Launch** (1 week)
   - Marketing materials
   - Client training
   - Support docs

**Total: 6-7 weeks to production** 🚀

---

## 📚 RESOURCES

### **Documentation:**
- Daily.co API: https://docs.daily.co/reference/rest-api
- Whisper API: https://platform.openai.com/docs/guides/speech-to-text
- Claude API: https://docs.anthropic.com/claude/docs

### **Sample Code:**
- Daily.co React SDK: https://github.com/daily-co/daily-react
- Whisper Node.js: https://github.com/openai/openai-node
- Claude Function Calling: https://docs.anthropic.com/claude/docs/tool-use

### **Alternatives to Consider:**
- **AssemblyAI** (instead of Whisper)
  - Pros: Speaker diarization, better accuracy
  - Cons: More expensive ($0.016/min vs $0.006/min)
  
- **Deepgram** (instead of Whisper)
  - Pros: Real-time transcription, speaker detection
  - Cons: More complex setup

- **Zoom API** (instead of Daily.co)
  - Pros: More familiar to clients
  - Cons: More expensive, harder API

---

## 🐠 STATUS: DOCUMENTED FOR FUTURE

**Date Created:** November 22, 2025  
**Created By:** Stephen + AI Pair Programming Session  
**Inspired By:** Snow the Goldfish's IT ticket 😂  

**Priority Level:** HIGH - This is a game-changer  
**Estimated Start:** Q1 2026  
**Expected ROI:** 10x within 6 months  

---

**This feature would absolutely DESTROY the competition!** 🔥

When you're ready to build this, come back to this document and we'll knock it out! 🚀

