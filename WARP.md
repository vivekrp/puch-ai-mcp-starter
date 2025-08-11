# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

This is a starter template for creating Model Context Protocol (MCP) servers that work with Puch AI. The repository contains multiple implementations demonstrating different authentication methods for MCP servers:

- **Bearer token authentication** (Python-based) - simplest approach, required by Puch AI
- **Google OAuth authentication** (TypeScript/Cloudflare Workers) - advanced cloud deployment
- **GitHub OAuth authentication** (TypeScript/Cloudflare Workers) - advanced cloud deployment with user access control

## Development Commands

### Python Bearer Token Server (Primary Implementation)

```bash
# Setup environment
uv venv
uv sync
source .venv/bin/activate

# Configure environment
cp .env.example .env
# Edit .env with AUTH_TOKEN and MY_NUMBER

# Run the basic MCP server
cd mcp-bearer-token
python mcp_starter.py

# Run the user-scoped task management server
python puch-user-id-mcp-example.py

# Make server public with ngrok (required for Puch AI)
ngrok http 8086
```

### TypeScript OAuth Servers (Advanced)

```bash
# Google OAuth Server
cd mcp-google-oauth
pnpm install
wrangler dev  # Development
wrangler deploy  # Production

# GitHub OAuth Server
cd mcp-oauth-github
pnpm install
wrangler dev  # Development
wrangler deploy  # Production
```

## Architecture Overview

### Core MCP Concepts

The repository demonstrates the Model Context Protocol architecture:

1. **MCP Server**: Exposes tools/functions that AI assistants can invoke
2. **Authentication**: Bearer tokens or OAuth for secure access
3. **Tool Registration**: Each server defines tools with descriptions and schemas
4. **Communication**: JSON-RPC 2.0 over HTTP with Server-Sent Events (SSE)

### Python Implementation (`mcp-bearer-token/`)

- **FastMCP Framework**: Uses `fastmcp` library for rapid MCP server development
- **Bearer Authentication**: Simple token-based auth via `SimpleBearerAuthProvider`
- **Tool Pattern**: Uses `@mcp.tool` decorator with Pydantic models for validation
- **Required Tools**: 
  - `validate()`: Returns phone number for Puch AI validation
  - Custom tools with rich descriptions using `RichToolDescription`

Key files:
- `mcp_starter.py`: Basic server with job search and image processing tools
- `puch-user-id-mcp-example.py`: Demonstrates user-scoped data with `puch_user_id`

### TypeScript OAuth Implementations

- **Cloudflare Workers**: Serverless deployment platform
- **OAuth Provider**: Uses `@cloudflare/workers-oauth-provider` for OAuth flows
- **Durable Objects**: For persistent session state (via `agents/mcp` McpAgent)
- **KV Storage**: For OAuth session management

Key patterns:
- Extends `McpAgent<Env, Record<string, never>, Props>` base class
- OAuth context stored in encrypted `Props` type
- Tools can access authenticated user info via `this.props`

## Development Patterns

### Adding New Tools (Python)

```python
from typing import Annotated
from pydantic import Field

@mcp.tool(description="Tool description here")
async def your_tool_name(
    parameter: Annotated[str, Field(description="Parameter description")]
) -> str:
    # Tool implementation
    return "Result"
```

### Rich Tool Descriptions

Use structured descriptions for better AI understanding:

```python
class RichToolDescription(BaseModel):
    description: str
    use_when: str
    side_effects: str | None = None

TOOL_DESCRIPTION = RichToolDescription(
    description="What the tool does",
    use_when="When to use this tool", 
    side_effects="What changes it makes"
)

@mcp.tool(description=TOOL_DESCRIPTION.model_dump_json())
async def my_tool():
    pass
```

### User-Scoped Data Pattern

For multi-user applications, use `puch_user_id` to scope data:

```python
def _user_tasks(puch_user_id: str) -> dict[str, dict]:
    if not puch_user_id:
        raise McpError(ErrorData(code=INVALID_PARAMS, message="puch_user_id is required"))
    return TASKS.setdefault(puch_user_id, {})
```

### OAuth Access Control (TypeScript)

```typescript
const ALLOWED_USERNAMES = new Set<string>(['username1', 'username2']);

// In tool definition
if (ALLOWED_USERNAMES.has(this.props.login)) {
  // Grant access to protected tool
} else {
  // Deny access
}
```

## Environment Configuration

### Python Servers
- `AUTH_TOKEN`: Secret bearer token for authentication
- `MY_NUMBER`: WhatsApp number in format `{country_code}{number}`

### Cloudflare Workers
- Secrets via `wrangler secret put`: 
  - `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET` 
  - `COOKIE_ENCRYPTION_KEY`
- KV namespace for OAuth sessions: `OAUTH_KV`

## Puch AI Integration

### Connection Pattern
```
/mcp connect https://your-server-url/endpoint auth_token_here
/mcp diagnostics-level debug  # For debugging
```

### Required Tools
- `validate()`: Must return the phone number `+919998881729` or `919998881729`
- `about()`: Optional tool describing the server

### Server Endpoints
- Python: `http://localhost:8086` (via ngrok for public access)
- TypeScript: `/sse` endpoint for Server-Sent Events connection

## Key Dependencies

### Python Stack
- `fastmcp>=2.11.2`: Core MCP server framework
- `python-dotenv>=1.1.1`: Environment variable loading
- `pillow>=11.3.0`: Image processing capabilities
- `httpx`, `beautifulsoup4`, `readabilipy`: Web scraping utilities

### TypeScript Stack  
- `@modelcontextprotocol/sdk`: Core MCP protocol implementation
- `@cloudflare/workers-oauth-provider`: OAuth server implementation
- `workers-mcp`, `agents`: MCP framework for Cloudflare Workers
- `hono`: HTTP framework for routing
- `octokit`: GitHub API integration (GitHub OAuth variant)

## Testing and Deployment

### Local Testing
- Use MCP Inspector: `npx @modelcontextprotocol/inspector@latest`
- Select SSE transport, connect to local server endpoints
- Test OAuth flow and tool invocations

### Production Deployment
- Python: Deploy to Railway, Render, Heroku, or DigitalOcean
- TypeScript: Deploy to Cloudflare Workers via `wrangler deploy`
- Ensure HTTPS endpoints for Puch AI compatibility
