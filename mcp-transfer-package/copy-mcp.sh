#!/bin/bash
# copy-mcp.sh - Automated MCP Setup Copy Script

NEW_PROJECT_PATH=$1

if [ -z "$NEW_PROJECT_PATH" ]; then
    echo "❌ Usage: ./copy-mcp.sh /path/to/new/project"
    echo "📝 Example: ./copy-mcp.sh /Users/username/Documents/my-new-project"
    exit 1
fi

echo "🚀 Copying MCP setup to $NEW_PROJECT_PATH..."

# Check if target directory exists
if [ ! -d "$NEW_PROJECT_PATH" ]; then
    echo "❌ Target directory does not exist: $NEW_PROJECT_PATH"
    echo "💡 Please create the directory first or use an existing project path"
    exit 1
fi

# Create lib directory if it doesn't exist
mkdir -p "$NEW_PROJECT_PATH/lib"

# Copy core MCP files
echo "📁 Copying core MCP files..."
cp mcp.json "$NEW_PROJECT_PATH/"
cp github-mcp-server.js "$NEW_PROJECT_PATH/"
cp nova-agent-server.js "$NEW_PROJECT_PATH/"

# Copy NOVA intelligence module
if [ -f "lib/nova-intelligence.js" ]; then
    cp lib/nova-intelligence.js "$NEW_PROJECT_PATH/lib/"
    echo "✅ Copied NOVA intelligence module"
else
    echo "⚠️ NOVA intelligence module not found, skipping..."
fi

# Copy environment template
if [ -f ".env" ]; then
    cp .env "$NEW_PROJECT_PATH/.env.template"
    echo "✅ Copied environment template"
else
    echo "⚠️ .env file not found, creating template..."
    cat > "$NEW_PROJECT_PATH/.env.template" << EOF
# Slack Configuration
SLACK_BOT_TOKEN=your_slack_bot_token_here

# GitHub Configuration  
GITHUB_TOKEN=your_github_token_here

# Claude AI Configuration
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# n8n Configuration
N8N_API_URL=https://stepten.app.n8n.cloud
N8N_API_KEY=your_n8n_api_key_here

# NOVA Configuration
NOVA_PERSONALITY=rebel
NOVA_AUTONOMOUS=true
NOVA_INTELLIGENT=true
EOF
fi

# Create package.json additions
echo "📦 Creating package.json additions..."
cat > "$NEW_PROJECT_PATH/mcp-dependencies.json" << EOF
{
  "mcpDependencies": {
    "@anthropic-ai/sdk": "^0.65.0",
    "@modelcontextprotocol/sdk": "^1.20.1",
    "@octokit/rest": "^22.0.0",
    "@slack/web-api": "^7.11.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  }
}
EOF

# Create setup instructions
cat > "$NEW_PROJECT_PATH/MCP-SETUP-INSTRUCTIONS.md" << EOF
# MCP Setup Instructions

## 🚀 Quick Setup

1. **Install Dependencies:**
   \`\`\`bash
   npm install @anthropic-ai/sdk @modelcontextprotocol/sdk @octokit/rest @slack/web-api dotenv express
   \`\`\`

2. **Configure Environment:**
   \`\`\`bash
   cp .env.template .env
   # Edit .env with your actual API keys
   \`\`\`

3. **Update mcp.json Paths:**
   - Edit \`mcp.json\` and update all file paths to match your project structure
   - Use absolute paths for best results

4. **Copy to Cursor Config:**
   \`\`\`bash
   # Windows
   cp mcp.json C:\\Users\\YourUsername\\.cursor\\mcp.json
   
   # Mac/Linux  
   cp mcp.json ~/.cursor/mcp.json
   \`\`\`

5. **Restart Cursor:**
   - Close Cursor completely
   - Reopen Cursor
   - Check MCP servers are loaded

## ✅ Verification

Test each MCP server:
\`\`\`bash
# Test GitHub MCP
node github-mcp-server.js

# Test NOVA Agent
node nova-agent-server.js
\`\`\`

## 🎯 You're Ready!

Your MCP setup is now ready to use in Cursor!
EOF

echo ""
echo "✅ MCP files copied successfully!"
echo ""
echo "📝 Next steps:"
echo "1. cd $NEW_PROJECT_PATH"
echo "2. npm install @anthropic-ai/sdk @modelcontextprotocol/sdk @octokit/rest @slack/web-api dotenv express"
echo "3. cp .env.template .env"
echo "4. Edit .env with your actual API keys"
echo "5. Update paths in mcp.json"
echo "6. Copy mcp.json to Cursor config directory"
echo "7. Restart Cursor"
echo ""
echo "📖 See MCP-SETUP-INSTRUCTIONS.md for detailed steps"
echo ""
echo "🎉 Happy coding with MCP!"
