# How to Import n8n Workflow Templates

## Quick Import Guide

### Step 1: Open n8n
Navigate to: https://stepten.app.n8n.cloud/

### Step 2: Import Workflow
1. Click on **Workflows** in the left sidebar
2. Click the **Import** button (top right)
3. Choose one of these methods:

#### Method A: Import from File
1. Click **"Import from File"**
2. Select `n8n-workflow-template.json` from your project
3. Click **Open**

#### Method B: Import from URL
1. Copy the contents of `n8n-workflow-template.json`
2. Click **"Import from URL"** 
3. Paste the JSON content
4. Click **Import**

### Step 3: Configure Credentials

The imported workflow needs these credentials:

#### 1. Supabase PostgreSQL Connection

**Node:** Log to Activity Feed, Assign to Support Staff, Update Ticket Status

**Settings:**
```
Host: your-project.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [your-supabase-password]
SSL: Enabled
```

**To add:**
1. Click on any Supabase node
2. Click **"Create New Credential"**
3. Fill in the details above
4. Click **Save**

#### 2. Slack API Connection

**Node:** Notify Slack #support, DM Staff (Urgent)

**Settings:**
```
Access Token: [your-slack-bot-token]
```

**To get Slack token:**
1. Go to https://api.slack.com/apps
2. Select your ShoreAgents app (or create one)
3. Go to **OAuth & Permissions**
4. Copy the **Bot User OAuth Token**
5. Required scopes:
   - `chat:write`
   - `chat:write.public`
   - `users:read`

**To add in n8n:**
1. Click on any Slack node
2. Click **"Create New Credential"**
3. Paste the token
4. Click **Save**

### Step 4: Update Webhook URL

1. Click on the **"Webhook - New Ticket"** node
2. Note the webhook URL (e.g., `https://stepten.app.n8n.cloud/webhook/new-ticket`)
3. Copy this URL - you'll need it to trigger the workflow

### Step 5: Test the Workflow

#### Test with Sample Data
1. Click the **Execute Workflow** button
2. Click on the Webhook node
3. Click **"Listen for Test Event"**
4. Send a test request:

```bash
curl -X POST https://stepten.app.n8n.cloud/webhook/new-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "test-123",
    "title": "Test Support Ticket",
    "client_name": "ACME Corp",
    "priority": "urgent",
    "ticket_url": "https://app.shoreagents.com/tickets/test-123"
  }'
```

5. You should see the workflow execute through all nodes

### Step 6: Activate the Workflow

1. Toggle the **Active** switch at the top right
2. The workflow is now live and ready to receive real webhooks!

---

## Available Template Workflows

### 1. n8n-workflow-template.json
**Name:** ShoreAgents - New Support Ticket Handler  
**Purpose:** Automatically process and assign support tickets  
**Triggers:** Webhook  
**Actions:** 
- Logs to activity feed
- Posts to Slack
- Assigns to support staff (if urgent)
- Sends DM notification
- Updates ticket status

---

## Creating More Workflows

### Method 1: Using n8n Web UI
1. Click **Add Workflow**
2. Add nodes by clicking **+**
3. Connect nodes by dragging
4. Configure each node
5. Test and activate

### Method 2: Using MCP (After Setup)
Once you configure MCP in Cursor (see `N8N-MCP-SETUP.md`), you can ask the AI:

```
Create an n8n workflow that:
1. Runs every Monday at 9 AM
2. Queries pending performance reviews from Supabase
3. Sends Slack reminders to managers
```

The AI will create and activate the workflow for you!

---

## Workflow Template Structure

### Basic Workflow Pattern
```
Trigger Node (Webhook/Schedule)
    ↓
Data Processing (Query/Transform)
    ↓
Conditional Logic (If/Switch)
    ↓
Actions (Slack/Email/Database)
    ↓
Response/Logging
```

### Common Node Combinations

#### Database → Slack Notification
```json
[PostgreSQL Node] → [Slack Node]
Query data → Send notification
```

#### Webhook → Process → Respond
```json
[Webhook] → [Process Data] → [Respond to Webhook]
Receive → Transform → Reply
```

#### Schedule → Query → Loop → Action
```json
[Schedule] → [Query] → [Split In Batches] → [Action]
Cron → Get items → Process each → Do something
```

---

## Troubleshooting

### Workflow Not Executing
- ✅ Check if workflow is **Active** (toggle in top right)
- ✅ Verify webhook URL is correct
- ✅ Check **Executions** tab for errors

### Credentials Error
- ✅ Click on the erroring node
- ✅ Re-test the credential
- ✅ Update if expired or incorrect

### Slack Not Posting
- ✅ Verify bot is added to the channel
- ✅ Check token has correct scopes
- ✅ Test with a simple message first

### Database Connection Failed
- ✅ Check Supabase is accessible
- ✅ Verify credentials are correct
- ✅ Ensure SSL is enabled

### Webhook Not Triggering
- ✅ Workflow must be **Active**
- ✅ Test with curl command first
- ✅ Check webhook path matches

---

## Best Practices

### 1. Naming Conventions
- **Workflows:** `ShoreAgents - [Purpose]`
- **Nodes:** Clear, descriptive names
- **Variables:** Use consistent naming

### 2. Error Handling
- Add error handling paths
- Set up retry logic
- Log failures for debugging

### 3. Testing
- Always test with sample data first
- Use manual execution during development
- Monitor the Executions tab

### 4. Security
- Never commit credentials
- Use environment variables
- Limit webhook access

### 5. Performance
- Use batching for large datasets
- Add delays between API calls
- Optimize database queries

---

## Next Steps After Import

1. ✅ Import the template workflow
2. ✅ Configure Supabase credentials
3. ✅ Configure Slack credentials
4. ✅ Test with sample data
5. ✅ Activate the workflow
6. ⏳ Connect to your ShoreAgents app
7. ⏳ Create more workflows based on examples
8. ⏳ Set up MCP for AI-assisted workflow creation

---

## Resources

- **n8n Documentation**: https://docs.n8n.io/
- **Workflow Examples**: `N8N-WORKFLOW-EXAMPLES.md`
- **MCP Setup**: `N8N-MCP-SETUP.md`
- **Your Instance**: https://stepten.app.n8n.cloud/

---

**Last Updated**: October 22, 2025  
**Template Version**: 1.0  
**Status**: Ready to import






