# MCP Transfer Package

This package contains all the essential files needed to set up MCP (Model Context Protocol) integration with NOVA AI Agent, GitHub, Slack, and n8n in any new project.

## 📦 Contents

### Core NOVA Agent Files
- `nova-agent-server.js` - Main NOVA agent MCP server
- `nova-intelligence.js` - Claude API integration for NOVA's intelligence

### Documentation & Setup
- `MCP-COPY-GUIDE.md` - Comprehensive setup guide
- `QUICK-MCP-COPY.md` - 5-minute quick setup guide
- `env-template.txt` - Environment variables template

### Automation Scripts
- `copy-mcp.bat` - Windows batch script for automated setup
- `copy-mcp.sh` - Linux/Mac shell script for automated setup

## 🚀 Quick Start

1. **Copy files to your project:**
   ```bash
   # Windows
   copy-mcp.bat /path/to/your/project
   
   # Linux/Mac
   ./copy-mcp.sh /path/to/your/project
   ```

2. **Install dependencies:**
   ```bash
   npm install @modelcontextprotocol/sdk @octokit/rest @slack/web-api @anthropic-ai/sdk express dotenv
   ```

3. **Configure environment:**
   - Copy `env-template.txt` to `.env` in your project root
   - Fill in your API keys and tokens

4. **Set up MCP in Cursor:**
   - Add MCP server configuration to your `mcp.json`
   - See `MCP-COPY-GUIDE.md` for detailed instructions

## 🔧 Required Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.20.1",
  "@octokit/rest": "^22.0.0",
  "@slack/web-api": "^7.11.0",
  "@anthropic-ai/sdk": "^0.65.0",
  "express": "^4.19.2",
  "dotenv": "^17.2.3"
}
```

## 📋 Environment Variables

See `env-template.txt` for all required environment variables.

## 🎯 Features

- **NOVA AI Agent** - Autonomous AI agent with rebel personality
- **GitHub Integration** - Repository management, issues, PRs
- **Slack Integration** - Multi-channel monitoring and responses
- **n8n Integration** - Workflow automation
- **Claude API** - Advanced AI reasoning and decision making

## 📚 Documentation

- `MCP-COPY-GUIDE.md` - Complete setup guide
- `QUICK-MCP-COPY.md` - Quick start guide

## 🆘 Support

For issues or questions, refer to the documentation files or check the main project repository.

