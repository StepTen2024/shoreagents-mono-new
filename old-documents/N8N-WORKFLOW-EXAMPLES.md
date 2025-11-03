# n8n Workflow Examples for ShoreAgents Platform

## Current n8n Instance Status

✅ **Connection Verified**: October 22, 2025  
🌐 **Instance URL**: https://stepten.app.n8n.cloud/  
📋 **Existing Workflows**: 2 workflows found

### Existing Workflows
1. **My workflow** (ID: `ZJdgVlcLero4rrDM`) - Inactive
2. **My workflow 2** (ID: `lr25JW0S9eGcOJHV`) - Inactive

---

## Example Workflows for ShoreAgents

### 1. New Staff Onboarding Automation

**Purpose**: Automate the onboarding process when a new staff member is added

**Workflow Steps**:
```
1. Webhook Trigger (from your app when staff is created)
   ↓
2. Supabase Node (fetch staff details)
   ↓
3. Split into parallel branches:
   ├─> Send Welcome Email (Email node)
   ├─> Create Slack Channel (Slack API)
   ├─> Post to #general (Slack node)
   └─> Add to HR Dashboard (HTTP Request)
   ↓
4. Log to activity feed (Supabase Insert)
```

**Trigger Example**:
```json
{
  "event": "staff.created",
  "staffId": "123",
  "email": "newstaff@shoreagents.com",
  "name": "John Doe",
  "role": "Virtual Assistant"
}
```

---

### 2. Performance Review Reminder System

**Purpose**: Send automated reminders for pending performance reviews

**Workflow Steps**:
```
1. Schedule Trigger (Every Monday at 9 AM)
   ↓
2. Supabase Query (find pending reviews)
   ↓
3. Filter (only reviews overdue by 3+ days)
   ↓
4. Loop through each review:
   ├─> Get manager details
   ├─> Send Slack DM to manager
   ├─> Send email reminder
   └─> Update review status (reminder_sent)
```

**Database Query**:
```sql
SELECT 
  pr.*,
  s.name as staff_name,
  m.name as manager_name,
  m.email as manager_email
FROM performance_reviews pr
JOIN staff_users s ON pr.staff_user_id = s.id
JOIN staff_users m ON pr.reviewer_id = m.id
WHERE pr.status = 'pending'
  AND pr.due_date < NOW() - INTERVAL '3 days'
  AND pr.reminder_sent = false
```

---

### 3. Support Ticket Auto-Assignment

**Purpose**: Automatically assign and route support tickets

**Workflow Steps**:
```
1. Webhook Trigger (new ticket created)
   ↓
2. AI Node (analyze ticket content)
   ├─> Extract keywords
   ├─> Determine priority
   └─> Suggest category
   ↓
3. Switch based on priority:
   ├─> URGENT: Notify on-call staff immediately
   ├─> HIGH: Assign to available support staff
   └─> NORMAL: Add to queue
   ↓
4. Update ticket in database
   ↓
5. Send notification via Slack/Email
```

---

### 4. Daily Activity Feed Aggregator

**Purpose**: Generate daily summary of platform activity

**Workflow Steps**:
```
1. Schedule Trigger (Every day at 6 PM)
   ↓
2. Parallel Data Collection:
   ├─> Query today's time entries
   ├─> Query tickets created/resolved
   ├─> Query performance reviews
   ├─> Query breaks taken
   └─> Query active staff count
   ↓
3. Aggregate & Format Data
   ↓
4. Generate Summary Report
   ↓
5. Send to Slack #daily-summary
   ↓
6. Store in activity_feed table
```

---

### 5. Break Time Compliance Monitor

**Purpose**: Monitor and alert on break compliance

**Workflow Steps**:
```
1. Schedule Trigger (Every 2 hours during work hours)
   ↓
2. Query active shifts without breaks
   ↓
3. Filter staff working 4+ hours without break
   ↓
4. For each staff member:
   ├─> Send gentle reminder (Slack DM)
   ├─> Notify their manager
   └─> Log compliance check
   ↓
5. Generate compliance report
```

---

### 6. Real-Time Slack Integration

**Purpose**: Sync platform events to Slack channels

**Workflow Steps**:
```
1. Webhook Trigger (any platform event)
   ↓
2. Switch based on event type:
   ├─> ticket.created → #support
   ├─> review.completed → #hr
   ├─> shift.started → #operations
   ├─> break.missed → #compliance
   └─> system.error → #tech-alerts
   ↓
3. Format message for Slack
   ↓
4. Post to appropriate channel
   ↓
5. Add reactions/threads as needed
```

---

### 7. Client Report Generator

**Purpose**: Generate and send weekly client reports

**Workflow Steps**:
```
1. Schedule Trigger (Every Friday at 4 PM)
   ↓
2. For each client:
   ├─> Query their staff performance
   ├─> Calculate metrics (productivity, hours, etc.)
   ├─> Gather screenshots samples
   ├─> Compile ticket statistics
   └─> Generate charts
   ↓
3. Create PDF report (PDF node)
   ↓
4. Send via email to client
   ↓
5. Upload to client portal
```

---

### 8. Database Backup Monitor

**Purpose**: Monitor and verify database backups

**Workflow Steps**:
```
1. Schedule Trigger (Daily at 2 AM)
   ↓
2. Check Supabase backup status (API)
   ↓
3. Verify last backup timestamp
   ↓
4. If backup is missing/failed:
   ├─> Send urgent alert to Slack
   ├─> Email technical team
   └─> Create incident ticket
   ↓
5. Log backup status
```

---

### 9. Screenshot Processing Pipeline

**Purpose**: Process and organize uploaded screenshots

**Workflow Steps**:
```
1. Webhook Trigger (screenshot uploaded)
   ↓
2. Download screenshot from Supabase Storage
   ↓
3. Parallel Processing:
   ├─> Thumbnail generation
   ├─> Metadata extraction
   ├─> Privacy blur (if needed)
   └─> AI content analysis
   ↓
4. Store processed images
   ↓
5. Update database with URLs
   ↓
6. Notify relevant parties
```

---

### 10. Staff Availability Tracker

**Purpose**: Track and alert on staff availability

**Workflow Steps**:
```
1. Schedule Trigger (Every 15 minutes)
   ↓
2. Query current shifts
   ↓
3. Check Electron app heartbeats
   ↓
4. For each staff:
   ├─> Calculate idle time
   ├─> Check screenshot frequency
   └─> Verify activity levels
   ↓
5. If anomaly detected:
   ├─> Send check-in message
   └─> Alert supervisor
   ↓
6. Update availability status
```

---

## Quick Start: Creating Your First Workflow

### Option 1: Using n8n Web Interface

1. Go to https://stepten.app.n8n.cloud/
2. Click "Add Workflow"
3. Add nodes by clicking the "+" button
4. Configure each node
5. Activate the workflow

### Option 2: Using MCP (After Setup)

Once MCP is configured in Cursor, you can ask:

```
Create an n8n workflow that:
1. Triggers when a new support ticket is created
2. Posts a message to #support Slack channel
3. Assigns to the next available support staff
```

The AI will create the workflow programmatically!

---

## Common n8n Nodes for ShoreAgents

### Data Nodes
- **Supabase**: Direct database operations
- **PostgreSQL**: Advanced queries
- **HTTP Request**: API calls to your backend

### Communication Nodes
- **Slack**: Channel messages, DMs, notifications
- **Email**: Send emails via SMTP/SendGrid
- **Webhook**: Receive events from your app

### Logic Nodes
- **IF**: Conditional branching
- **Switch**: Multi-way branching
- **Merge**: Combine data streams
- **Split In Batches**: Process large datasets

### Utility Nodes
- **Schedule Trigger**: Cron-like scheduling
- **Code**: Custom JavaScript/Python
- **Set**: Transform data
- **Function**: Advanced transformations

---

## Connecting n8n to ShoreAgents

### 1. Add Webhook Endpoint to Your App

```typescript
// app/api/webhooks/n8n/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    // Trigger n8n workflow
    await fetch('https://stepten.app.n8n.cloud/webhook/YOUR_WEBHOOK_ID', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('n8n webhook error:', error);
    return NextResponse.json({ error: 'Failed to trigger workflow' }, { status: 500 });
  }
}
```

### 2. Trigger Workflows from Your App

```typescript
// lib/n8n.ts
export async function triggerN8nWorkflow(
  workflowId: string, 
  data: any
) {
  const response = await fetch(
    `https://stepten.app.n8n.cloud/webhook/${workflowId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  return response.json();
}

// Usage in your app
await triggerN8nWorkflow('staff-onboarding', {
  staffId: newStaff.id,
  email: newStaff.email,
  name: newStaff.name,
});
```

### 3. Supabase Integration

```typescript
// In n8n Supabase node configuration
{
  "host": "your-project.supabase.co",
  "port": 5432,
  "database": "postgres",
  "user": "postgres",
  "password": "your-password",
  "ssl": {
    "rejectUnauthorized": false
  }
}
```

---

## Monitoring & Debugging

### View Workflow Executions
1. Go to https://stepten.app.n8n.cloud/
2. Click on a workflow
3. View "Executions" tab
4. See success/failure status
5. Inspect input/output data

### Common Issues

**Workflow Not Triggering**
- Check webhook URL is correct
- Verify workflow is activated
- Check execution logs

**Database Connection Failed**
- Verify Supabase credentials
- Check network connectivity
- Ensure IP is whitelisted

**Slack Messages Not Sending**
- Check Slack API token
- Verify channel permissions
- Test with simple message first

---

## Best Practices

1. **Error Handling**
   - Add error handling nodes
   - Set up retry logic
   - Log failures for debugging

2. **Performance**
   - Use batching for large datasets
   - Add delays between API calls
   - Optimize database queries

3. **Security**
   - Use environment variables for secrets
   - Limit webhook access
   - Validate incoming data

4. **Testing**
   - Test with sample data first
   - Use manual trigger during development
   - Monitor executions closely

5. **Documentation**
   - Add notes to complex workflows
   - Document webhook URLs
   - Keep this guide updated

---

## Next Steps

1. ✅ **Connection tested** - Your n8n instance is ready
2. ⏳ **Configure MCP** - Follow instructions in `N8N-MCP-SETUP.md`
3. ⏳ **Restart Cursor** - Activate the MCP integration
4. ⏳ **Create first workflow** - Try one of the examples above
5. ⏳ **Connect to ShoreAgents** - Add webhooks to your app

---

**Documentation Version**: 1.0  
**Last Updated**: October 22, 2025  
**Status**: Ready for implementation  
**Existing Workflows**: 2 (both inactive)






