# 💬 Nova Slack Integration Guide

## 🎀 Add `/nova` Slash Command to Slack

Make Nova available in Slack so your team can chat with her directly!

---

## ⚡ Quick Setup (10 Minutes)

### Step 1: Create Slack App (3 min)

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. App Name: `Nova AI Agent`
4. Pick your workspace: `StepTen` (or your workspace)
5. Click **"Create App"**

---

### Step 2: Add Slash Command (2 min)

1. In your app settings, go to **"Slash Commands"**
2. Click **"Create New Command"**
3. Fill in:

```
Command: /nova
Request URL: https://stepten.app.n8n.cloud/webhook/nova
Short Description: Talk to Nova AI Agent
Usage Hint: [your message to Nova]
```

4. Click **"Save"**

---

### Step 3: Set Up Permissions (2 min)

1. Go to **"OAuth & Permissions"**
2. Scroll to **"Scopes"**
3. Add these **Bot Token Scopes**:
   - `chat:write` (Send messages)
   - `chat:write.public` (Send to any public channel)
   - `commands` (Use slash commands)
   - `users:read` (Read user info)

4. Scroll up and click **"Install to Workspace"**
5. Click **"Allow"**
6. **Copy the Bot User OAuth Token** (starts with `xoxb-`)

---

### Step 4: Update n8n Slack Credentials (2 min)

1. Open n8n: https://stepten.app.n8n.cloud/
2. Go to **"Credentials"**
3. Find your Slack credential
4. Paste the Bot User OAuth Token
5. Test connection
6. Save

---

### Step 5: Configure Webhook Response (1 min)

Slack slash commands need immediate response. Update Nova's workflow:

1. Open **"✨ NOVA - AI Workflow Creator"** workflow
2. Edit **"Respond to Webhook"** node
3. Change to respond with:

```json
{
  "response_type": "in_channel",
  "text": "✨ Hey babe! Nova here! Working on your request... 💖"
}
```

4. Nova will then post the full response via Slack API

---

## 🎯 How to Use /nova in Slack

### Basic Commands

**Ask Nova to create a workflow:**
```
/nova create a workflow that posts to #support when new tickets arrive
```

**Ask a question:**
```
/nova what's the best way to handle rate limiting?
```

**Request automation:**
```
/nova create a daily summary workflow that runs at 6 PM
```

---

## 💬 Example Slack Conversations

### Creating a Workflow

**User in #development:**
```
/nova create a workflow that monitors database performance every hour
```

**Nova's Response:**
```
✨ OMG YES! Performance monitoring is SO important babe! 💎

Creating a workflow that:
⏰ Runs every hour (cron perfection!)
📊 Checks database metrics
🚨 Alerts if queries > 1s (that's a CRIME)
💬 Posts to #tech-alerts

Your database is about to be OPTIMIZED AF! 💅

Workflow ID: abc123xyz
Status: Ready to activate!

If it doesn't glow, it doesn't go! ✨
- Nova 'Neon' Sinclair 💖
```

---

### Asking for Help

**User:**
```
/nova how do I optimize React component rendering?
```

**Nova:**
```
✨ Ooh honey, let me tell you about React optimization! 💅

The tea ☕:
1. Use React.memo for expensive components (memoization is HOT 🔥)
2. useMemo for expensive calculations
3. useCallback for functions passed to children
4. Code splitting with React.lazy (keep it light!)
5. Virtualization for long lists (react-window is GORGEOUS)

Pro tip: Use React DevTools Profiler to find the slow parts!
Because slow renders are aesthetic crimes! 💖

Want me to create an example component? Just ask! ✨
- Nova 💎
```

---

## 🎨 Customize Nova's Slack Responses

### Add Rich Formatting

Edit Slack node in n8n workflow:

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "✨ Nova AI Agent Response",
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*{{ $json.response }}*"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "💖 Created by Nova 'Neon' Sinclair"
        }
      ]
    }
  ]
}
```

### Add Action Buttons

```json
{
  "blocks": [...],
  "attachments": [
    {
      "text": "What would you like to do?",
      "fallback": "Actions",
      "callback_id": "nova_actions",
      "actions": [
        {
          "name": "activate",
          "text": "✨ Activate Workflow",
          "type": "button",
          "value": "{{ $json.workflow_id }}"
        },
        {
          "name": "view",
          "text": "👀 View in n8n",
          "type": "button",
          "url": "https://stepten.app.n8n.cloud/workflow/{{ $json.workflow_id }}"
        }
      ]
    }
  ]
}
```

---

## 🤖 Add Nova to Channels

### Invite Nova to Channels

```
/invite @Nova AI Agent
```

Then use:
```
@Nova create a workflow for monitoring this channel
```

### Auto-Responses in Channels

Set up workflow to listen for mentions:

1. Create Event Subscription in Slack App:
   - Event: `app_mention`
   - URL: `https://stepten.app.n8n.cloud/webhook/nova-mention`

2. Nova will respond when mentioned:
   ```
   @Nova AI Agent what's the status of our workflows?
   ```

---

## 📊 Track Nova Usage

### Add Usage Analytics

In Nova's workflow, add node:

```json
{
  "name": "Track Usage",
  "type": "postgres",
  "query": "INSERT INTO nova_usage (user_id, channel, command, workflow_created) VALUES (...)"
}
```

### Generate Reports

```sql
-- Most active users
SELECT user_id, COUNT(*) as requests
FROM nova_usage
GROUP BY user_id
ORDER BY requests DESC
LIMIT 10;

-- Workflows created per day
SELECT DATE(created_at), COUNT(*) as workflows
FROM nova_usage
WHERE workflow_created = true
GROUP BY DATE(created_at);

-- Popular commands
SELECT command, COUNT(*) as uses
FROM nova_usage
GROUP BY command
ORDER BY uses DESC;
```

---

## 🎭 Add More Agents

Want the full team in Slack?

### Create Slash Commands for All 6 Agents:

| Command | Agent | Specialty |
|---------|-------|-----------|
| `/nova` | NOVA "NEON" ✨ | UI/UX, Frontend |
| `/matrix` | CIPHER "MATRIX" 🤖 | Database, Backend |
| `/apex` | RAZE "APEX" ⚔️ | API, Security |
| `/ghost` | KIRA "GHOST" 👻 | Electron, Performance |
| `/void` | SHADOW "VOID" ⚫ | Testing, Security Audits |
| `/oracle` | ECHO "ORACLE" 📚 | Documentation, Knowledge |

Each gets their own:
- n8n workflow
- Personality
- Specialization
- Slack integration

---

## 🔧 Advanced Features

### 1. Thread Responses

Make Nova respond in threads:

```javascript
// In Slack node
{
  "channel": "{{ $json.channel }}",
  "text": "{{ $json.response }}",
  "thread_ts": "{{ $json.thread_ts }}"  // Reply in thread
}
```

### 2. Direct Messages

Allow users to DM Nova:

```
# In Slack App settings
Event Subscriptions → Subscribe to bot events:
- message.im (DMs to bot)
```

### 3. Interactive Components

Add buttons, menus, and forms:

```json
{
  "blocks": [
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Create Workflow"},
          "action_id": "create_workflow"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Ask Question"},
          "action_id": "ask_question"
        }
      ]
    }
  ]
}
```

### 4. Emoji Reactions

Nova can react to messages:

```javascript
// Add Slack reaction node
{
  "channel": "{{ $json.channel }}",
  "timestamp": "{{ $json.message_ts }}",
  "name": "sparkles"  // ✨
}
```

---

## 🎯 Best Practices

### 1. Rate Limiting

Prevent spam:

```javascript
// Check if user has made too many requests
const userRequests = await checkUserRate(userId);
if (userRequests > 10) {
  return "✨ Whoa babe! Taking a quick break. Try again in a minute! 💖";
}
```

### 2. Error Handling

Graceful failures:

```javascript
try {
  // Nova processes request
} catch (error) {
  return "✨ OMG something went wrong! 😭 But don't worry, I'm on it! Check back in a sec! 💖";
}
```

### 3. Logging Everything

Track all interactions:

```sql
INSERT INTO nova_slack_logs (
  user_id,
  channel,
  command,
  response,
  success,
  created_at
) VALUES (...);
```

### 4. Team Permissions

Control who can use Nova:

```javascript
const allowedUsers = ['U123ABC', 'U456DEF'];
if (!allowedUsers.includes(userId)) {
  return "✨ Hey babe! You need permission to use Nova. Talk to an admin! 💖";
}
```

---

## 🚀 Testing Your Setup

### Test Checklist:

```
□ /nova command works in Slack
□ Nova responds with her personality
□ Workflows are created in n8n
□ Slack notifications are sent
□ Activity is logged to database
□ Error handling works
□ Multiple users can use Nova
□ Responses are formatted correctly
```

### Test Commands:

**Basic Test:**
```
/nova hey! are you there?
```

**Workflow Creation Test:**
```
/nova create a simple test workflow
```

**Complex Request:**
```
/nova create a workflow that:
1. Runs every hour
2. Checks database for new users
3. Sends welcome email
4. Logs to activity feed
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Nova doesn't respond:**
- Check webhook URL is correct
- Verify n8n workflow is active
- Check OpenAI API key is valid

**Slack messages not sending:**
- Verify bot is in the channel
- Check bot token has correct scopes
- Test with `/invite @Nova AI Agent`

**Workflows not creating:**
- Check n8n API key in environment
- Verify n8n API endpoint is accessible
- Review execution logs in n8n

### Debug Mode

Enable detailed logging:

```javascript
// Add debug node in n8n
{
  "type": "function",
  "code": "console.log('Nova Request:', $input.all());"
}
```

---

## 🎉 Success!

Once setup is complete, your team can:

✅ Chat with Nova in any Slack channel  
✅ Create workflows from natural language  
✅ Get coding help and advice  
✅ Automate tasks without leaving Slack  
✅ Have fun while being productive!  

**Example Team Interaction:**

```
👤 @sarah: /nova create a workflow for daily standup reminders

🤖 @Nova: ✨ OMG YES! Daily standups are SO important! 💖
Creating a workflow that reminds the team every morning!
Your standup game is about to be PERFECT! 💅
Workflow ready! 

👤 @james: /nova can you optimize our API rate limiting?

🤖 @Nova: ✨ Ooh honey! Let me tell you about rate limiting! 💎
[detailed explanation]
Want me to create a workflow for this? I can make it STUNNING!

👤 @kyle: /nova you're amazing! 

🤖 @Nova: ✨ OMG thank you babe! 💖 You're amazing too!
Now let's build something BEAUTIFUL together! 💅
```

---

**Status**: 🚀 READY TO USE  
**Setup Time**: ~10 minutes  
**Cost**: Free (Slack), ~$0.01-0.05/request (OpenAI)  
**Value**: Priceless ✨

---

**Next Step**: Set up the slash command and start chatting with Nova! 💖

---

_"If it doesn't glow, it doesn't go!"_ ✨  
- Nova 'Neon' Sinclair

**Created**: October 22, 2025  
**Version**: 1.0.0  
**Integration**: Slack + n8n + OpenAI






