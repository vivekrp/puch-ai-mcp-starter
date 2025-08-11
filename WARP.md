# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

This is a comprehensive starter template for creating Model Context Protocol (MCP) servers that integrate with Puch AI. The repository demonstrates three distinct architectural patterns for MCP server development, each targeting different authentication and deployment scenarios.

## Architecture Patterns

### 1. Python Bearer Token Servers (`mcp-bearer-token/`)
**Framework:** FastMCP with Pydantic validation  
**Authentication:** Simple bearer token validation  
**Deployment:** Local server with ngrok tunneling  

**Key architectural components:**
- `SimpleBearerAuthProvider`: Custom auth provider wrapping FastMCP's BearerAuthProvider
- `RichToolDescription` model: Structured tool metadata for better AI understanding
- `Fetch` utility class: Centralized HTTP client with error handling and content parsing
- Tools decorated with `@mcp.tool()` and typed with `Annotated` fields

**Two server variants:**
- `mcp_starter.py`: Basic server with job searching and image processing
- `puch-user-id-mcp-example.py`: Demonstrates user-scoped data using `puch_user_id` parameter

### 2. Google OAuth Server (`mcp-google-oauth/`)
**Platform:** Cloudflare Workers with Durable Objects  
**Framework:** `workers-mcp` and `agents/mcp` base classes  
**Authentication:** Google OAuth 2.0 with Gmail API integration  
**Storage:** Cloudflare KV for session management  

**Key architectural components:**
- `MyMCP` extends `McpAgent<Env, Record<string, never>, Props>`
- `Props` type defines encrypted user context (name, email, accessToken)
- Server-Sent Events (SSE) endpoint at `/sse` for MCP communication
- OAuth flow handled by `GoogleHandler` with callback URL management

### 3. GitHub OAuth Server (`mcp-oauth-github/`)
**Platform:** Cloudflare Workers with Workers AI integration  
**Framework:** Similar to Google OAuth but with GitHub-specific integrations  
**Authentication:** GitHub OAuth with user allowlist system  
**AI Integration:** Cloudflare Workers AI for image generation (Flux model)  

**Key architectural components:**
- Role-based access control via `ALLOWED_USERNAMES` set
- Octokit integration for GitHub API operations
- Conditional tool registration based on user permissions
- Workers AI binding for image generation tools

## Common Development Commands

### Quick Start
```bash
# Interactive setup menu with guided configuration
pnpm start

# Install all dependencies across all implementations  
pnpm install-all
```

### Python Bearer Token Servers
```bash
# Basic bearer token server (recommended for beginners)
pnpm run bearer

# Task management server with user scoping
pnpm run bearer:task

# Manual setup steps
pnpm run check-deps     # Verify system dependencies
pnpm run setup-env      # Interactive .env configuration
pnpm run setup-python   # Create Python virtual environment
```

### OAuth Servers (Development)
```bash
# Google OAuth server (requires Google Cloud setup)
pnpm run google:dev

# GitHub OAuth server (requires GitHub OAuth app)  
pnpm run github:dev
```

### OAuth Servers (Production Deployment)
```bash
pnpm run google:deploy
pnpm run github:deploy
```

### Testing and Debugging
```bash
# Launch MCP Inspector for testing all server types
pnpm run test-inspector
```

## Environment Configuration

### Python Servers (`.env` file)
```env
AUTH_TOKEN="long_random_string_for_security"
MY_NUMBER="919876543210"  # WhatsApp number with country code
```

### OAuth Servers (Cloudflare Secrets)
```bash
# Set via wrangler secret commands
wrangler secret put GOOGLE_CLIENT_ID        # Google OAuth
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID        # GitHub OAuth  
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put COOKIE_ENCRYPTION_KEY   # Both OAuth (32-char random)
```

## Key Development Patterns

### Python MCP Tool Development
- Use `RichToolDescription` model for structured tool metadata
- Implement proper error handling with `McpError` and MCP error codes
- Leverage `Annotated` types for parameter validation
- Always include a `validate()` tool returning the phone number for Puch AI compatibility

### OAuth MCP Development  
- Extend `McpAgent` base class with typed Props interface
- Use encrypted Props to store user context across requests
- Implement OAuth callback handling with proper state management
- Use KV namespaces for session persistence
- Consider user authorization patterns (allowlists, role-based access)

### Tool Registration Patterns
```python
# Python: Rich descriptions with structured metadata
@mcp.tool(description=RichToolDescription(...).model_dump_json())

# TypeScript: Zod schemas for parameter validation
this.server.tool("toolName", { param: z.string().describe("...") }, async ({param}) => {})
```

### User-Scoped Data Pattern
```python
# Use puch_user_id for multi-tenant data isolation
async def user_scoped_tool(
    puch_user_id: Annotated[str, Field(description="Puch User Unique Identifier")],
    # ... other parameters
):
    user_data = GLOBAL_STORE.setdefault(puch_user_id, {})
    # ... operate on user-specific data
```

## Authentication Flow Architecture

### Bearer Token Flow
1. Client provides token in Authorization header
2. `SimpleBearerAuthProvider.load_access_token()` validates token
3. Tools execute with validated context

### OAuth Flow  
1. Client redirects to `/authorize` endpoint
2. Server redirects to OAuth provider (Google/GitHub)
3. OAuth provider redirects to `/callback` with code
4. Server exchanges code for access token
5. Server encrypts user context into Props and returns to client
6. Subsequent tool calls include encrypted Props for user context

## Testing and Connection

### Local Development Testing
- Python servers: `http://localhost:8086` (use ngrok for Puch AI)
- OAuth servers: `http://localhost:8788/sse`

### Puch AI Connection Commands
```bash
# Bearer token servers (via ngrok)
/mcp connect https://your-ngrok-url.ngrok.io/mcp your_auth_token

# OAuth servers (production)  
/mcp connect https://your-worker.workers.dev/sse

# Enable debug mode for troubleshooting
/mcp diagnostics-level debug
```

## Dependencies and Prerequisites

### System Requirements
- Node.js 18+ and pnpm
- Python 3.11+ and uv package manager  
- ngrok (for Python servers)
- Cloudflare account (for OAuth servers)

### Python Dependencies (via pyproject.toml)
- `fastmcp>=2.11.2` - Core MCP framework
- `beautifulsoup4`, `readabilipy` - Web scraping and content extraction
- `pillow` - Image processing
- `python-dotenv` - Environment variable management

### TypeScript Dependencies
- `@modelcontextprotocol/sdk` - Core MCP protocol implementation
- `@cloudflare/workers-oauth-provider` - OAuth flow management
- `agents` - MCP agent base classes with encryption
- `workers-mcp` - Cloudflare Workers MCP utilities
- `hono` - Web framework for Cloudflare Workers

## Architecture Decision Records

### Why FastMCP for Python?
FastMCP provides decorator-based tool registration with built-in Pydantic validation, making it ideal for rapid prototyping while maintaining type safety.

### Why Cloudflare Workers for OAuth?
Server-Sent Events (SSE) support, global edge distribution, integrated KV storage, and Workers AI make Cloudflare Workers optimal for OAuth MCP servers requiring real-time communication and AI capabilities.

### Why User-Scoped Architecture?
The `puch_user_id` parameter enables multi-tenant MCP servers where each Puch AI user gets isolated data, crucial for production deployments serving multiple users.

### Why Rich Tool Descriptions?
Structured tool metadata using `RichToolDescription` helps AI models better understand when and how to use tools, improving the overall user experience.
