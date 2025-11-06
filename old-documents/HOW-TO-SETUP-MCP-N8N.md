# 🚀 How to Set Up MCP for n8n (5 Minutes)

## ⚡ Super Quick Setup

### Step 1: Open Cursor Settings (30 seconds)
- Press `Cmd + ,` (Mac) or `Ctrl + ,` (Windows)
- Search for **"MCP"** or **"Model Context Protocol"**

### Step 2: Add n8n MCP Server (2 minutes)
Click **"Edit Config"** and paste this:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": [
        "-y",
        "@n8n/mcp-server"
      ],
      "env": {
        "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNGRkNGE1Yi02NWNhLTQwMjktYjQ1Zi0xMzFmNzNlODEwNGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxMTE5OTQ0fQ.-RvaXRwajrWG-FX60L2mnV7g7OKmJNbLc8cI8vgs2mE",
        "N8N_BASE_URL": "https://stepten.app.n8n.cloud"
      }
    }
  }
}
```

### Step 3: Save & Restart (1 minute)
- Click **Save**
- **Completely quit Cursor** (Cmd + Q)
- **Reopen Cursor**

### Step 4: Test It Works (1 minute)
Ask the AI in Cursor:
```
Can you list my n8n workflows?
```

✅ **Success!** You should see 2 workflows:
- My workflow (ID: ZJdgVlcLero4rrDM)
- My workflow 2 (ID: lr25JW0S9eGcOJHV)

---

## 🎯 What You Can Do Now

### Ask the AI to Create Workflows:

**Example 1: Slack Notifications**
```
Create an n8n workflow that posts to #support when a new ticket is created
```

**Example 2: Scheduled Reminders**
```
Create an n8n workflow that sends performance review reminders every Monday at 9 AM
```

**Example 3: Database Automation**
```
Create an n8n workflow that monitors Supabase for new staff and sends welcome emails
```

**Example 4: View & Manage**
```
Show me all my workflows
Execute workflow ZJdgVlcLero4rrDM with test data
Activate workflow "My workflow"
```

---

## 🔍 Troubleshooting

### ❌ "MCP Server not found"
**Solution**: Make sure you fully restarted Cursor (Quit & Reopen)

### ❌ "Cannot connect to n8n"
**Solution**: 
1. Check internet connection
2. Verify https://stepten.app.n8n.cloud/ is accessible
3. Test with: `node test-n8n-connection.js`

### ❌ "AI doesn't see workflows"
**Solution**:
1. Check MCP config is saved in Cursor Settings
2. Verify you restarted Cursor completely
3. Check Cursor console for MCP errors (Help > Toggle Developer Tools)

---

## 📚 Full Documentation

- **Quick Reference**: `N8N-README.md`
- **Complete Guide**: `N8N-MCP-COMPLETE-SETUP.md`
- **Workflow Examples**: `N8N-WORKFLOW-EXAMPLES.md` (10 examples!)
- **Import Templates**: `N8N-IMPORT-GUIDE.md`

---

## 🎉 That's It!

Once MCP is configured, you can create workflows by chatting with the AI. It's like having an n8n expert assistant!

**Your n8n Instance**: https://stepten.app.n8n.cloud/

---

## ⚙️ What is MCP?

**MCP (Model Context Protocol)** lets AI assistants (like Cursor) connect to external tools and services.

With n8n MCP:
- ✨ AI can list your workflows
- ✨ AI can create new workflows
- ✨ AI can execute workflows
- ✨ AI can update workflows
- ✨ All through natural conversation!

---

## 🚀 Next Steps

1. ✅ Set up MCP (follow steps above)
2. ⏳ Import template workflow (`n8n-workflow-template.json`)
3. ⏳ Configure Supabase credentials in n8n
4. ⏳ Configure Slack credentials in n8n
5. ⏳ Create your first automation!

---

**Status**: ✅ Ready to use  
**Instance**: https://stepten.app.n8n.cloud/  
**Posted to**: Slack #development  
**Date**: October 22, 2025






