@echo off
REM copy-mcp.bat - Automated MCP Setup Copy Script for Windows

set NEW_PROJECT_PATH=%1

if "%NEW_PROJECT_PATH%"=="" (
    echo ❌ Usage: copy-mcp.bat "C:\path\to\new\project"
    echo 📝 Example: copy-mcp.bat "C:\Users\username\Documents\my-new-project"
    exit /b 1
)

echo 🚀 Copying MCP setup to %NEW_PROJECT_PATH%...

REM Check if target directory exists
if not exist "%NEW_PROJECT_PATH%" (
    echo ❌ Target directory does not exist: %NEW_PROJECT_PATH%
    echo 💡 Please create the directory first or use an existing project path
    exit /b 1
)

REM Create lib directory if it doesn't exist
if not exist "%NEW_PROJECT_PATH%\lib" mkdir "%NEW_PROJECT_PATH%\lib"

REM Copy core MCP files
echo 📁 Copying core MCP files...
copy mcp.json "%NEW_PROJECT_PATH%\"
copy github-mcp-server.js "%NEW_PROJECT_PATH%\"
copy nova-agent-server.js "%NEW_PROJECT_PATH%\"

REM Copy NOVA intelligence module
if exist "lib\nova-intelligence.js" (
    copy "lib\nova-intelligence.js" "%NEW_PROJECT_PATH%\lib\"
    echo ✅ Copied NOVA intelligence module
) else (
    echo ⚠️ NOVA intelligence module not found, skipping...
)

REM Copy environment template
if exist ".env" (
    copy .env "%NEW_PROJECT_PATH%\.env.template"
    echo ✅ Copied environment template
) else (
    echo ⚠️ .env file not found, creating template...
    (
        echo # Slack Configuration
        echo SLACK_BOT_TOKEN=your_slack_bot_token_here
        echo.
        echo # GitHub Configuration  
        echo GITHUB_TOKEN=your_github_token_here
        echo.
        echo # Claude AI Configuration
        echo CLAUDE_API_KEY=your_claude_api_key_here
        echo CLAUDE_MODEL=claude-3-5-sonnet-20241022
        echo.
        echo # n8n Configuration
        echo N8N_API_URL=https://stepten.app.n8n.cloud
        echo N8N_API_KEY=your_n8n_api_key_here
        echo.
        echo # NOVA Configuration
        echo NOVA_PERSONALITY=rebel
        echo NOVA_AUTONOMOUS=true
        echo NOVA_INTELLIGENT=true
    ) > "%NEW_PROJECT_PATH%\.env.template"
)

REM Create package.json additions
echo 📦 Creating package.json additions...
(
    echo {
    echo   "mcpDependencies": {
    echo     "@anthropic-ai/sdk": "^0.65.0",
    echo     "@modelcontextprotocol/sdk": "^1.20.1",
    echo     "@octokit/rest": "^22.0.0",
    echo     "@slack/web-api": "^7.11.0",
    echo     "dotenv": "^16.4.5",
    echo     "express": "^4.19.2"
    echo   }
    echo }
) > "%NEW_PROJECT_PATH%\mcp-dependencies.json"

REM Create setup instructions
(
    echo # MCP Setup Instructions
    echo.
    echo ## 🚀 Quick Setup
    echo.
    echo 1. **Install Dependencies:**
    echo    ```bash
    echo    npm install @anthropic-ai/sdk @modelcontextprotocol/sdk @octokit/rest @slack/web-api dotenv express
    echo    ```
    echo.
    echo 2. **Configure Environment:**
    echo    ```bash
    echo    copy .env.template .env
    echo    # Edit .env with your actual API keys
    echo    ```
    echo.
    echo 3. **Update mcp.json Paths:**
    echo    - Edit `mcp.json` and update all file paths to match your project structure
    echo    - Use absolute paths for best results
    echo.
    echo 4. **Copy to Cursor Config:**
    echo    ```bash
    echo    # Windows
    echo    copy mcp.json "C:\Users\YourUsername\.cursor\mcp.json"
    echo    ```
    echo.
    echo 5. **Restart Cursor:**
    echo    - Close Cursor completely
    echo    - Reopen Cursor
    echo    - Check MCP servers are loaded
    echo.
    echo ## ✅ Verification
    echo.
    echo Test each MCP server:
    echo ```bash
    echo # Test GitHub MCP
    echo node github-mcp-server.js
    echo.
    echo # Test NOVA Agent
    echo node nova-agent-server.js
    echo ```
    echo.
    echo ## 🎯 You're Ready!
    echo.
    echo Your MCP setup is now ready to use in Cursor!
) > "%NEW_PROJECT_PATH%\MCP-SETUP-INSTRUCTIONS.md"

echo.
echo ✅ MCP files copied successfully!
echo.
echo 📝 Next steps:
echo 1. cd "%NEW_PROJECT_PATH%"
echo 2. npm install @anthropic-ai/sdk @modelcontextprotocol/sdk @octokit/rest @slack/web-api dotenv express
echo 3. copy .env.template .env
echo 4. Edit .env with your actual API keys
echo 5. Update paths in mcp.json
echo 6. Copy mcp.json to Cursor config directory
echo 7. Restart Cursor
echo.
echo 📖 See MCP-SETUP-INSTRUCTIONS.md for detailed steps
echo.
echo 🎉 Happy coding with MCP!
pause
