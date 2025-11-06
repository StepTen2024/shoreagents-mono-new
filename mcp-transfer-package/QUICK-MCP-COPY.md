# 🚀 Quick MCP Copy Guide

## **Manual Copy (5 Minutes)**

### **Step 1: Copy These Files**
```bash
# Copy these files to your new project:
mcp.json
github-mcp-server.js  
nova-agent-server.js
lib/nova-intelligence.js
.env (rename to .env.template)
```

### **Step 2: Install Dependencies**
Add to your new project's `package.json`:
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

Then run: `npm install`

### **Step 3: Update mcp.json Paths**
Edit `mcp.json` in your new project and change all paths to match your new project structure:

**Example:**
```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\Documents\\your-new-project\\github-mcp-server.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### **Step 4: Configure Environment**
```bash
# Copy and edit environment file
cp .env.template .env
# Edit .env with your actual API keys
```

### **Step 5: Copy to Cursor**
```bash
# Windows
copy mcp.json "C:\Users\YourUsername\.cursor\mcp.json"

# Mac/Linux
cp mcp.json ~/.cursor/mcp.json
```

### **Step 6: Restart Cursor**
- Close Cursor completely
- Reopen Cursor
- Check MCP servers are loaded

---

## **Automated Copy (Windows)**

Use the batch script:
```cmd
copy-mcp.bat "C:\path\to\your\new\project"
```

---

## **Automated Copy (Mac/Linux)**

Use the shell script:
```bash
./copy-mcp.sh /path/to/your/new/project
```

---

## **✅ Verification**

Test that everything works:
```bash
# Test GitHub MCP
node github-mcp-server.js

# Test NOVA Agent  
node nova-agent-server.js
```

---

## **🎯 You're Done!**

Your MCP setup is now copied and ready to use in your new project! 🚀
