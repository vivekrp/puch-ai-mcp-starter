# Setup Guide - Puch AI MCP Starter

This guide walks you through setting up all three MCP server implementations: Python Bearer Token, Google OAuth, and GitHub OAuth.

## Quick Start Scripts

We've provided convenient scripts to set up and run each implementation:

```bash
# Install all dependencies for all implementations
pnpm install

# Set up and run Python Bearer Token server (recommended for beginners)
pnpm run bearer

# Set up and run Google OAuth server
pnpm run google

# Set up and run GitHub OAuth server  
pnpm run github

# Deploy OAuth servers to production
pnpm run deploy:google
pnpm run deploy:github
```

## Prerequisites

Before setting up any implementation, ensure you have:

1. **Node.js** (v18+) and **pnpm** installed
2. **Python** (3.11+) and **uv** package manager
3. **ngrok** account and CLI (for Python bearer token server)
4. **Cloudflare** account (for OAuth servers)

### Install Prerequisites

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install ngrok
# Visit https://ngrok.com/download and follow platform-specific instructions
```

## Implementation 1: Python Bearer Token Server (Recommended for Beginners)

### Manual Setup

1. **Set up Python environment:**
   ```bash
   uv venv
   uv sync
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   AUTH_TOKEN="your_secret_token_here_make_it_long_and_random"
   MY_NUMBER="919876543210"  # Your WhatsApp number with country code
   ```

3. **Run the basic MCP server:**
   ```bash
   cd mcp-bearer-token
   python mcp_starter.py
   ```

4. **Make server public with ngrok:**
   ```bash
   # In another terminal
   ngrok http 8086
   # Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
   ```

5. **Connect with Puch AI:**
   ```
   /mcp connect https://abc123.ngrok.io/mcp your_secret_token_here
   ```

### Alternative: User-Scoped Task Management Server

```bash
cd mcp-bearer-token
python puch-user-id-mcp-example.py
```

## Implementation 2: Google OAuth Server

### Prerequisites
- Google Cloud Project with OAuth 2.0 credentials
- Cloudflare account

### Manual Setup

1. **Create Google OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API (for the email sending tool)
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Set application type to "Web application"
   - Add authorized redirect URI: `https://your-worker.your-subdomain.workers.dev/callback`
   - Save Client ID and Client Secret

2. **Set up Cloudflare KV namespace:**
   ```bash
   cd mcp-google-oauth
   pnpm install
   wrangler kv:namespace create "OAUTH_KV"
   # Copy the returned ID and update wrangler.jsonc
   ```

3. **Configure secrets:**
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   # Paste your Google Client ID when prompted
   
   wrangler secret put GOOGLE_CLIENT_SECRET  
   # Paste your Google Client Secret when prompted
   
   wrangler secret put COOKIE_ENCRYPTION_KEY
   # Generate and paste a random 32-character string
   ```

4. **Update wrangler.jsonc:**
   Update the KV namespace ID in `mcp-google-oauth/wrangler.jsonc`:
   ```json
   "kv_namespaces": [
     {
       "binding": "OAUTH_KV",
       "id": "your_kv_namespace_id_here"
     }
   ]
   ```

5. **Deploy or run locally:**
   ```bash
   # For development
   wrangler dev
   
   # For production
   wrangler deploy
   ```

6. **Connect with Puch AI:**
   ```
   /mcp connect https://mcp-google-oauth.your-subdomain.workers.dev/sse
   ```

## Implementation 3: GitHub OAuth Server

### Prerequisites
- GitHub OAuth App
- Cloudflare account with Workers AI enabled

### Manual Setup

1. **Create GitHub OAuth App:**
   - Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
   - Application name: "My MCP Server"
   - Homepage URL: `https://your-worker.your-subdomain.workers.dev`
   - Authorization callback URL: `https://your-worker.your-subdomain.workers.dev/callback`
   - Save Client ID and generate Client Secret

2. **Set up Cloudflare KV namespace:**
   ```bash
   cd mcp-oauth-github
   pnpm install
   wrangler kv:namespace create "OAUTH_KV"
   # Copy the returned ID and update wrangler.jsonc
   ```

3. **Configure secrets:**
   ```bash
   wrangler secret put GITHUB_CLIENT_ID
   # Paste your GitHub Client ID when prompted
   
   wrangler secret put GITHUB_CLIENT_SECRET
   # Paste your GitHub Client Secret when prompted
   
   wrangler secret put COOKIE_ENCRYPTION_KEY
   # Generate and paste a random 32-character string (e.g., openssl rand -hex 32)
   ```

4. **Update wrangler.jsonc:**
   Update the KV namespace ID in `mcp-oauth-github/wrangler.jsonc`:
   ```json
   "kv_namespaces": [
     {
       "binding": "OAUTH_KV", 
       "id": "your_kv_namespace_id_here"
     }
   ]
   ```

5. **Configure user access (optional):**
   Edit `src/index.ts` to add allowed GitHub usernames:
   ```typescript
   const ALLOWED_USERNAMES = new Set<string>([
     'your-github-username',
     'teammate-username'
   ]);
   ```

6. **Deploy or run locally:**
   ```bash
   # For development
   wrangler dev
   
   # For production  
   wrangler deploy
   ```

7. **Connect with Puch AI:**
   ```
   /mcp connect https://mcp-github-oauth.your-subdomain.workers.dev/sse
   ```

## Testing Your MCP Servers

### Using MCP Inspector (for all implementations)

```bash
npx @modelcontextprotocol/inspector@latest
```

1. Select "SSE" transport type
2. Enter your server URL:
   - Bearer token: `http://localhost:8086` (with ngrok: `https://abc123.ngrok.io`)
   - OAuth servers: `http://localhost:8788/sse` (dev) or `https://your-worker.workers.dev/sse` (prod)
3. Click "Connect" and follow authentication flow (for OAuth)
4. Test tools using "List Tools" and individual tool invocations

### Debug Mode with Puch AI

Enable detailed error messages:
```
/mcp diagnostics-level debug
```

## Troubleshooting

### Common Issues

1. **Python server not accessible:**
   - Ensure ngrok is running and tunnel is active
   - Check firewall settings
   - Verify AUTH_TOKEN matches between .env and Puch AI connection

2. **OAuth flow fails:**
   - Verify callback URLs match exactly in OAuth app settings
   - Check that KV namespace is created and ID is correct in wrangler.jsonc
   - Ensure secrets are set correctly with `wrangler secret list`

3. **Wrangler deployment fails:**
   - Run `wrangler auth login` to authenticate with Cloudflare
   - Verify your Cloudflare account has Workers and KV enabled
   - For GitHub OAuth: ensure Workers AI is enabled for image generation tool

4. **Tools not appearing in Puch AI:**
   - Verify the `validate()` tool returns correct phone number
   - Check MCP server logs for connection errors
   - Try MCP Inspector first to verify server is working

### Environment Variables Reference

**Python (.env):**
```env
AUTH_TOKEN="long_random_string_for_security"
MY_NUMBER="919876543210"
```

**Cloudflare Secrets:**
```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
COOKIE_ENCRYPTION_KEY="32-character-random-string"

# GitHub OAuth  
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
COOKIE_ENCRYPTION_KEY="32-character-random-string"
```

## Next Steps

1. **Customize tools:** Add your own tools to any implementation
2. **Deploy to production:** Use cloud platforms for Python or Cloudflare Workers for OAuth
3. **Add authentication:** Implement user-specific data scoping
4. **Monitor usage:** Use Cloudflare Analytics or custom logging

For more details, see the individual README files in each implementation directory.
