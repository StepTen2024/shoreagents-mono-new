# MCP Copy Guide - How to Copy MCP Setup to Other Projects

## 📋 **What You Need to Copy**

### 1. **Core MCP Files**
- `mcp.json` - Main MCP configuration file
- `github-mcp-server.js` - GitHub MCP server
- `nova-agent-server.js` - NOVA agent server
- `lib/nova-intelligence.js` - NOVA intelligence module

### 2. **Environment Variables**
- `.env` file with all the API keys and tokens
- Update the paths in `mcp.json` to match your new project

### 3. **Package Dependencies**
- Add required packages to `package.json`

---

## 🚀 **Step-by-Step Copy Process**

### **Step 1: Copy Core Files**

```bash
# Copy these files to your new project:
cp mcp.json /path/to/new/project/
cp github-mcp-server.js /path/to/new/project/
cp nova-agent-server.js /path/to/new/project/
cp lib/nova-intelligence.js /path/to/new/project/lib/
```

### **Step 2: Update mcp.json Paths**

Edit the `mcp.json` file in your new project and update the paths:

```json
{
  "mcpServers": {
    "nova-slack-mcp": {
      "command": "node",
      "args": ["/path/to/your/remote-agents-ai/nova-slack-mcp-server.js"],
      "env": {
        "SLACK_BOT_TOKEN": "your_slack_token_here"
      }
    },
    "github-mcp": {
      "command": "node",
      "args": ["/path/to/your/new/project/github-mcp-server.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    },
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "https://stepten.app.n8n.cloud",
        "N8N_API_KEY": "your_n8n_api_key_here"
      }
    },
    "nova-agent": {
      "command": "node",
      "args": ["/path/to/your/new/project/nova-agent-server.js"],
      "env": {
        "SLACK_BOT_TOKEN": "your_slack_token_here",
        "GITHUB_TOKEN": "your_github_token_here",
        "CLAUDE_API_KEY": "your_claude_api_key_here",
        "CLAUDE_MODEL": "claude-3-5-sonnet-20241022",
        "NOVA_PERSONALITY": "rebel",
        "NOVA_AUTONOMOUS": "true",
        "NOVA_INTELLIGENT": "true"
      }
    }
  }
}
```

### **Step 3: Copy Environment Variables**

Copy your `.env` file and update the paths:

```bash
cp .env /path/to/new/project/
```

### **Step 4: Install Dependencies**

Add these to your new project's `package.json`:

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.65.0",
    "@modelcontextprotocol/sdk": "^1.20.1",
    "@octokit/rest": "^22.0.0",
    "@slack/web-api": "^7.11.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  }
}
```

Then run:
```bash
npm install
```

### **Step 5: Update Cursor MCP Configuration**

Copy the `mcp.json` to your Cursor configuration:

**Windows:**
```bash
cp mcp.json C:\Users\YourUsername\.cursor\mcp.json
```

**Mac:**
```bash
cp mcp.json ~/.cursor/mcp.json
```

**Linux:**
```bash
cp mcp.json ~/.cursor/mcp.json
```

---

## 🔧 **Quick Copy Script**

Create this script to automate the copy process:

```bash
#!/bin/bash
# copy-mcp.sh

NEW_PROJECT_PATH=$1

if [ -z "$NEW_PROJECT_PATH" ]; then
    echo "Usage: ./copy-mcp.sh /path/to/new/project"
    exit 1
fi

echo "🚀 Copying MCP setup to $NEW_PROJECT_PATH..."

# Create lib directory if it doesn't exist
mkdir -p "$NEW_PROJECT_PATH/lib"

# Copy core files
cp mcp.json "$NEW_PROJECT_PATH/"
cp github-mcp-server.js "$NEW_PROJECT_PATH/"
cp nova-agent-server.js "$NEW_PROJECT_PATH/"
cp lib/nova-intelligence.js "$NEW_PROJECT_PATH/lib/"

# Copy environment template
cp .env "$NEW_PROJECT_PATH/.env.template"

echo "✅ MCP files copied successfully!"
echo "📝 Next steps:"
echo "1. Update paths in $NEW_PROJECT_PATH/mcp.json"
echo "2. Update API keys in $NEW_PROJECT_PATH/.env"
echo "3. Install dependencies: npm install"
echo "4. Copy mcp.json to Cursor config directory"
echo "5. Restart Cursor"
```

---

## 🎯 **Project-Specific Customizations**

### **For Different Project Types:**

#### **React/Next.js Projects:**
- Keep all MCP files in the root
- Add MCP scripts to `package.json`

#### **Node.js Backend Projects:**
- Place MCP files in a `mcp/` directory
- Update paths accordingly

#### **Python Projects:**
- You'll need to create Python equivalents
- Use the same environment variables
- Adapt the server logic to Python

---

## 🔑 **Environment Variables to Update**

Make sure to update these in your new project's `.env`:

```env
# Slack
SLACK_BOT_TOKEN=your_slack_bot_token_here

# GitHub
GITHUB_TOKEN=your_github_token_here

# Claude AI
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# n8n
N8N_API_URL=https://stepten.app.n8n.cloud
N8N_API_KEY=your_n8n_api_key_here

# NOVA Settings
NOVA_PERSONALITY=rebel
NOVA_AUTONOMOUS=true
NOVA_INTELLIGENT=true
```

---

## ✅ **Verification Steps**

After copying, verify everything works:

1. **Check MCP in Cursor:**
   - Open Cursor
   - Check if MCP servers are loaded
   - Test GitHub MCP functions
   - Test Slack MCP functions

2. **Test NOVA:**
   ```bash
   node nova-agent-server.js
   ```

3. **Test GitHub MCP:**
   ```bash
   node github-mcp-server.js
   ```

---

## 🚨 **Common Issues & Solutions**

### **Issue: MCP not loading in Cursor**
- **Solution:** Check file paths in `mcp.json`
- **Solution:** Ensure all dependencies are installed
- **Solution:** Restart Cursor completely

### **Issue: API errors**
- **Solution:** Verify all API keys in `.env`
- **Solution:** Check token permissions
- **Solution:** Ensure tokens haven't expired

### **Issue: Path not found errors**
- **Solution:** Use absolute paths in `mcp.json`
- **Solution:** Check file permissions
- **Solution:** Verify files exist in target locations

---

## 🎉 **You're All Set!**

Once copied and configured, you'll have:
- ✅ GitHub MCP for repository management
- ✅ Slack MCP for team communication  
- ✅ n8n MCP for workflow automation
- ✅ NOVA agent for autonomous AI assistance

**Happy coding with MCP!** 🚀

