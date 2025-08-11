# 🚀 Complete Setup Guide for All MCP Implementations

This document provides comprehensive setup instructions for all three MCP server implementations in this repository, along with the convenient scripts we've created to make setup easier.

## 🎯 **Super Quick Start (Recommended)**

The fastest way to get started with any MCP implementation:

```bash
# 1. Install dependencies
pnpm install

# 2. Interactive guided setup
pnpm start
```

This launches an interactive menu where you can choose which implementation to set up, with guided assistance for each step.

## 📋 **Individual Setup Instructions**

### 1. **Python Bearer Token Server** 🐍
*Easiest implementation, recommended for beginners*

**One-Command Setup:**
```bash
pnpm run bearer
```

**Step-by-Step Manual Setup:**
```bash
# Check system dependencies
pnpm run check-deps

# Interactive environment setup (.env file)
pnpm run setup-env

# Set up Python environment
pnpm run setup-python

# Start the server
pnpm run bearer

# In another terminal, make it public
ngrok http 8086

# Connect in Puch AI:
# /mcp connect https://your-ngrok-url.ngrok.io/mcp your_auth_token
```

**What this server includes:**
- Job search and web scraping tools (`job_finder`)
- Image processing tool (`make_img_black_and_white`)
- Bearer token authentication
- Required `validate()` tool for Puch AI compatibility
- Rich tool descriptions for better AI understanding

**Environment Variables Required:**
```env
AUTH_TOKEN="your_secret_token_here_make_it_long_and_random"
MY_NUMBER="919876543210"  # Your WhatsApp number with country code
```

### 2. **Python Task Management Server** 📋
*Demonstrates user-scoped data with puch_user_id*

**Setup:**
```bash
pnpm run bearer:task
```

**What this server demonstrates:**
- User-scoped data using `puch_user_id` parameter
- Task management operations (add, list, complete, remove)
- In-memory storage with per-user data isolation
- Rich tool descriptions with structured metadata
- Proper error handling with MCP error codes

**Available Tools:**
- `add_task` - Create tasks with priority, due dates, tags
- `list_tasks` - Filter tasks by status, tag, or search term
- `get_task` - Retrieve specific task details
- `complete_task` - Mark tasks as completed
- `remove_task` - Delete tasks permanently
- `validate` - Puch AI validation endpoint

### 3. **Google OAuth Server** 🔐
*Advanced implementation with Google OAuth authentication*

**Prerequisites:**
- Google Cloud Project with OAuth 2.0 credentials
- Gmail API enabled in Google Cloud Console
- Cloudflare account for deployment

**Quick Setup:**
```bash
pnpm run google
```

**Manual Setup Steps:**

1. **Create Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing
   - Enable Gmail API
   - Create OAuth 2.0 Client ID credentials
   - Set authorized redirect URI: `https://your-worker.your-subdomain.workers.dev/callback`

2. **Configure Cloudflare:**
   ```bash
   cd mcp-google-oauth
   pnpm install
   
   # Create KV namespace for OAuth sessions
   wrangler kv:namespace create "OAUTH_KV"
   # Update the returned ID in wrangler.jsonc
   
   # Set secrets
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET  
   wrangler secret put COOKIE_ENCRYPTION_KEY  # Use: openssl rand -hex 32
   ```

3. **Deploy:**
   ```bash
   # Development
   pnpm run google:dev
   
   # Production  
   pnpm run google:deploy
   ```

**What this server includes:**
- Complete Google OAuth 2.0 flow
- Gmail sending functionality (`send_gmail` tool)
- Server-Sent Events (SSE) for MCP communication
- Encrypted session management with KV storage
- Cloudflare Workers deployment

**Available Tools:**
- `validate` - Puch AI validation
- `about` - Server description
- `send_gmail` - Send emails via Gmail API (requires user authentication)

### 4. **GitHub OAuth Server** 🐙
*Advanced implementation with GitHub OAuth and access control*

**Prerequisites:**
- GitHub OAuth App configured
- Cloudflare account with Workers AI enabled
- KV namespace for session storage

**Quick Setup:**
```bash
pnpm run github
```

**Manual Setup Steps:**

1. **Create GitHub OAuth App:**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create new OAuth App
   - Application name: "My MCP Server"
   - Homepage URL: `https://your-worker.your-subdomain.workers.dev`
   - Authorization callback URL: `https://your-worker.your-subdomain.workers.dev/callback`

2. **Configure Cloudflare:**
   ```bash
   cd mcp-oauth-github
   pnpm install
   
   # Create KV namespace
   wrangler kv:namespace create "OAUTH_KV"
   # Update the returned ID in wrangler.jsonc
   
   # Set secrets
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   wrangler secret put COOKIE_ENCRYPTION_KEY  # Use: openssl rand -hex 32
   ```

3. **Configure Access Control:**
   Edit `src/index.ts` to add allowed GitHub usernames:
   ```typescript
   const ALLOWED_USERNAMES = new Set<string>([
     'your-github-username',
     'teammate-username'
   ]);
   ```

4. **Deploy:**
   ```bash
   # Development
   pnpm run github:dev
   
   # Production
   pnpm run github:deploy
   ```

**What this server includes:**
- GitHub OAuth authentication flow
- User access control based on GitHub username
- GitHub API integration via Octokit
- AI image generation using Cloudflare Workers AI
- Role-based tool access (some tools restricted to allowed users)

**Available Tools:**
- `validate` - Puch AI validation
- `about` - Server description  
- `userInfoOctokit` - Get authenticated GitHub user info (all users)
- `generateImage` - AI image generation using Flux model (restricted users only)

## 🛠️ **Complete Scripts Reference**

We've created comprehensive scripts to streamline the setup process:

### **Main Scripts:**
```bash
pnpm start                 # Interactive quick start menu
pnpm run check-deps        # Check system dependencies
pnpm run setup-env         # Interactive environment setup
pnpm run setup-python      # Python virtual environment setup
pnpm run install-all       # Install all project dependencies
```

### **Server Scripts:**
```bash
# Python servers
pnpm run bearer            # Basic Bearer token MCP server
pnpm run bearer:task       # Task management MCP server

# OAuth servers
pnpm run google            # Google OAuth server (with setup checks)
pnpm run github            # GitHub OAuth server (with setup checks)
```

### **Direct Development Commands:**
```bash
# Google OAuth
pnpm run google:dev        # Development mode (wrangler dev)
pnpm run google:deploy     # Deploy to Cloudflare Workers

# GitHub OAuth  
pnpm run github:dev        # Development mode (wrangler dev)
pnpm run github:deploy     # Deploy to Cloudflare Workers
```

### **Testing Scripts:**
```bash
pnpm run test-inspector    # Launch MCP Inspector for testing
```

## 🔍 **Testing Your MCP Servers**

### **Using MCP Inspector (Recommended for development)**
```bash
pnpm run test-inspector
```

1. Select "SSE" transport type
2. Enter your server URL:
   - **Python servers:** `http://localhost:8086` (or ngrok HTTPS URL for Puch AI)
   - **OAuth servers:** `http://localhost:8788/sse` (dev) or `https://your-worker.workers.dev/sse` (prod)
3. Follow authentication flow (for OAuth servers)
4. Test individual tools using "List Tools" and tool invocation

### **Connecting with Puch AI**

**Bearer Token Servers:**
```
/mcp connect https://your-ngrok-url.ngrok.io/mcp your_auth_token
```

**OAuth Servers:**  
```
/mcp connect https://your-worker.workers.dev/sse
```

**Debug Mode (for troubleshooting):**
```
/mcp diagnostics-level debug
```

## 🏗️ **Architecture Overview**

### **Python Implementation (`mcp-bearer-token/`)**
- **Framework:** FastMCP for rapid development
- **Authentication:** Simple bearer token via `SimpleBearerAuthProvider`
- **Tool Pattern:** `@mcp.tool` decorator with Pydantic validation
- **Rich Descriptions:** Structured tool metadata using `RichToolDescription` class
- **User Scoping:** `puch_user_id` parameter for multi-user data isolation

### **TypeScript OAuth Implementations**
- **Platform:** Cloudflare Workers for serverless deployment
- **OAuth:** `@cloudflare/workers-oauth-provider` for complete OAuth flows  
- **Architecture:** `McpAgent` base class with encrypted `Props` for user context
- **Storage:** KV namespaces for session management
- **Communication:** Server-Sent Events (SSE) for MCP protocol

## 📁 **Files Created in This Setup**

### **Documentation:**
- `SETUP.md` - Detailed setup guide with troubleshooting
- `COMPLETE_SETUP_GUIDE.md` - This comprehensive overview
- `WARP.md` - Architecture patterns and development guidance (updated)

### **Configuration:**
- `package.json` - Root package with all convenience scripts
- `/scripts/` directory with setup automation

### **Scripts Directory:**
- `quick-start.js` - Interactive setup menu
- `check-deps.js` - System dependency verification
- `setup-env.js` - Interactive environment configuration
- `run-bearer.js` - Python bearer token server launcher  
- `run-bearer-task.js` - Python task server launcher
- `run-google.js` - Google OAuth server launcher
- `run-github.js` - GitHub OAuth server launcher

## 🚨 **Common Issues and Troubleshooting**

### **Python Servers:**
1. **Server not accessible from Puch AI:**
   - Ensure ngrok tunnel is active and HTTPS URL is used
   - Verify AUTH_TOKEN matches between .env and connection command
   - Check firewall settings

2. **Python dependencies fail:**
   - Ensure Python 3.11+ is installed: `python3 --version`
   - Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Try: `uv venv && uv sync`

### **OAuth Servers:**
1. **Authentication flow fails:**
   - Verify callback URLs match exactly in OAuth app settings
   - Check KV namespace is created and ID is correct in wrangler.jsonc
   - Ensure all secrets are set: `wrangler secret list`

2. **Wrangler deployment issues:**
   - Authenticate: `wrangler auth login`
   - Verify Cloudflare account has Workers enabled
   - For GitHub OAuth: ensure Workers AI is enabled

3. **Tools not appearing:**
   - Verify `validate()` tool returns correct phone number
   - Check server logs for connection errors  
   - Test with MCP Inspector first

## 🔐 **Security Best Practices**

### **Environment Variables:**
- Use long, random AUTH_TOKEN values (32+ characters)
- Never commit .env files to version control
- Rotate tokens regularly in production

### **OAuth Secrets:**
- Use `wrangler secret put` for sensitive values
- Generate strong cookie encryption keys: `openssl rand -hex 32`
- Verify callback URLs use HTTPS in production

### **Access Control:**
- Implement user allowlists for restricted tools
- Validate user permissions on each tool invocation
- Log access attempts for security monitoring

## 🎯 **Next Steps**

1. **Start with Bearer Token server** - easiest to set up and test
2. **Customize tools** - add your own business logic and integrations  
3. **Deploy to production** - use cloud platforms or Cloudflare Workers
4. **Implement monitoring** - add logging and analytics
5. **Scale authentication** - move to OAuth for multi-user scenarios

## 📚 **Additional Resources**

- **Puch AI Documentation:** https://puch.ai/mcp
- **MCP Protocol Specification:** https://modelcontextprotocol.io/
- **Discord Community:** https://discord.gg/VMCnMvYx
- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **FastMCP Documentation:** https://github.com/jlowin/fastmcp

---

**Happy coding! 🚀**

This setup system makes it incredibly easy to get started with MCP servers for Puch AI. Choose the implementation that fits your needs, and you'll be up and running in minutes!
