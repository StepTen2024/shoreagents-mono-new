# n8n MCP Integration Setup

## Overview

This guide helps you connect your n8n instance at **https://stepten.app.n8n.cloud/** to Cursor using the Model Context Protocol (MCP).

## Configuration Details

- **n8n Instance**: https://stepten.app.n8n.cloud/
- **API Token**: Configured (JWT token)
- **MCP Server**: `@n8n/mcp-server`

## Setup Instructions

### Method 1: Cursor Settings (Recommended)

1. Open **Cursor Settings** (Cmd+, on Mac)
2. Search for "MCP" or navigate to **Features > Model Context Protocol**
3. Click "Edit Config" or add a new MCP server
4. Add the following configuration:

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
        "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNGRkNGE1Yi02NWNhLTQwMjktYjQ1Zi0xMzFmNzNlODEwNGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNjExMTk5NDR9.-RvaXRwajrWG-FX60L2mnV7g7OKmJNbLc8cI8vgs2mE",
        "N8N_BASE_URL": "https://stepten.app.n8n.cloud"
      }
    }
  }
}
```

5. Save the configuration
6. **Restart Cursor** to activate the MCP server

### Method 2: Using Config File

1. The configuration has been saved to `mcp-config.json` in your project
2. Copy this configuration to your Cursor MCP settings
3. Restart Cursor

## Verifying the Setup

After restarting Cursor, you should be able to:

### Available n8n MCP Tools

Once configured, you'll have access to tools like:

- **List Workflows** - View all workflows in your n8n instance
- **Execute Workflow** - Run a workflow with parameters
- **Get Workflow** - Fetch details about a specific workflow
- **Create Workflow** - Create new workflows programmatically
- **Update Workflow** - Modify existing workflows
- **Activate/Deactivate Workflow** - Control workflow status

## Testing the Connection

### Test 1: List All Workflows

Ask the AI:
```
Can you list all my n8n workflows?
```

### Test 2: Execute a Workflow

Ask the AI:
```
Can you execute workflow [workflow-id] with these parameters?
```

### Test 3: Create a Simple Workflow

Ask the AI:
```
Can you create a simple n8n workflow that sends a Slack message?
```

## Troubleshooting

### MCP Server Not Found
If you get "n8n MCP server not found":
```bash
# Install globally (optional)
npm install -g @n8n/mcp-server

# Or use npx (automatically downloads)
npx -y @n8n/mcp-server
```

### Connection Issues
1. Verify your API token is correct
2. Check that https://stepten.app.n8n.cloud is accessible
3. Ensure you have internet connectivity
4. Try restarting Cursor

### Token Expired
If your JWT token expires, you'll need to:
1. Go to your n8n instance
2. Navigate to Settings > API
3. Generate a new API key
4. Update the `N8N_API_KEY` in your MCP configuration
5. Restart Cursor

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit API tokens to git**
   - Add `mcp-config.json` to `.gitignore`
   - Use environment variables for sensitive data

2. **Rotate tokens regularly**
   - Generate new API keys periodically
   - Revoke old tokens when no longer needed

3. **Limit token scope**
   - Use minimal permissions required
   - Create separate tokens for different purposes

## Next Steps

Once configured, you can:

1. **Automate Workflows** - Create workflows for your ShoreAgents platform
2. **Integrate with Slack** - Connect n8n workflows with Slack notifications
3. **Database Automation** - Set up workflows for database operations
4. **Monitoring** - Create workflows to monitor your platform
5. **Notifications** - Set up automated notifications for events

## Example Use Cases

### 1. New Staff Onboarding Workflow
```
Create an n8n workflow that:
- Triggers when a new staff member is added to the database
- Sends a welcome email
- Creates a Slack channel
- Notifies the team
```

### 2. Performance Review Automation
```
Create an n8n workflow that:
- Runs weekly to check for pending reviews
- Sends reminders to managers
- Posts updates to Slack
```

### 3. Ticket Management
```
Create an n8n workflow that:
- Monitors new support tickets
- Categorizes them by priority
- Assigns to appropriate team members
- Sends notifications
```

## Documentation Links

- [n8n MCP Documentation](https://docs.n8n.io/integrations/mcp/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Cursor MCP Guide](https://docs.cursor.com/context/model-context-protocol)

## Support

If you encounter issues:
1. Check the Cursor console for MCP errors
2. Verify n8n instance is accessible
3. Test API token with curl:

```bash
curl -X GET https://stepten.app.n8n.cloud/api/v1/workflows \
  -H "X-N8N-API-KEY: YOUR_API_KEY"
```

---

**Created**: October 22, 2025  
**Instance**: https://stepten.app.n8n.cloud/  
**Status**: Ready for configuration






