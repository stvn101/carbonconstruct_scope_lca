# MCP Browser Setup for VS Code

This project is configured with Model Context Protocol (MCP) servers to enable browser automation and web content fetching capabilities in VS Code.

## Installed MCP Servers

### 1. Playwright MCP Server (@playwright/mcp)
**Purpose**: Browser automation, web scraping, testing
**Capabilities**:
- Navigate to web pages
- Take screenshots
- Interact with web elements (click, type, fill forms)
- Extract content from web pages
- Run automated tests

### 2. Fetch MCP Server (mcp-server-fetch)
**Purpose**: Web content fetching and processing
**Capabilities**:
- Fetch web pages and convert to markdown
- Handle various content types
- Respect robots.txt
- Custom user agents

### 3. Browserbase MCP Server (optional)
**Purpose**: Cloud-based browser automation
**Capabilities**:
- Browser automation in the cloud
- Scalable web scraping
- No local browser installation required

## Configuration Files

### `.vscode/mcp.json` - Workspace MCP Configuration
```json
{
  "servers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp"],
      "env": {
        "HEADLESS": "true",
        "BROWSER": "chromium"
      }
    },
    "fetch": {
      "type": "stdio",
      "command": "C:/Users/SteveDev/Downloads/code_sandbox_light_34cdb6f4_1760690233/carbonconstruct_scope_lca/.venv/Scripts/python.exe",
      "args": ["-m", "mcp_server_fetch"],
      "env": {}
    }
  }
}
```

### `.vscode/settings.json` - VS Code Settings
```json
{
    "chat.mcp.access": "all",
    "chat.mcp.autostart": "onlyNew"
}
```

## Usage in VS Code

1. **Open Chat View**: Press `Ctrl+Alt+I` to open the Chat view
2. **Select Agent Mode**: Choose Agent mode from the dropdown
3. **Access Tools**: Click the Tools button to see available MCP tools
4. **Use Browser Tools**: You can now use tools like:
   - `mcp_playwright_browser_navigate` - Navigate to web pages
   - `mcp_playwright_browser_take_screenshot` - Take screenshots
   - `mcp_playwright_browser_click` - Click on elements
   - `fetch` - Fetch web content

## Example Prompts

- "Take a screenshot of https://example.com"
- "Navigate to Google and search for 'carbon footprint calculator'"
- "Fetch the content from https://news.ycombinator.com and summarize the top stories"
- "Fill out a form on https://example.com/contact"

## Browser Configuration

The Playwright server is configured to:
- Run in headless mode by default
- Use Chromium browser
- Support full page automation

Browsers installed:
- Chromium (latest)
- Firefox (latest)
- WebKit (latest)

## Troubleshooting

### If MCP servers don't start:
1. Check VS Code Output panel for MCP errors
2. Verify installations:
   ```bash
   npx @playwright/mcp --help
   python -m mcp_server_fetch --help
   ```
3. Restart VS Code after configuration changes

### Common Issues:
- **Permission errors**: Ensure VS Code has proper permissions
- **Network restrictions**: Check if your network allows web automation
- **Browser installation**: Run `npx playwright install` if browsers are missing

## Security Considerations

- MCP tools can execute arbitrary browser actions
- Only use with trusted content
- Review tool invocations before confirming
- Be cautious with form submissions and sensitive data

## Advanced Configuration

You can customize the MCP servers by modifying the `mcp.json` file:
- Change browser type (chromium, firefox, webkit)
- Enable/disable headless mode
- Set custom timeouts
- Configure proxy settings
- Add custom headers

For more information, see the [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).