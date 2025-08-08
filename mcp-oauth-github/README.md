# Model Context Protocol (MCP) Server with GitHub OAuth for Puch AI

This is an advanced template for creating a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server that supports remote connections with **Puch AI using GitHub OAuth**.

You can deploy this to your own Cloudflare account. Once you create a GitHub OAuth app, you'll have a fully functional, serverless MCP server. Puch AI users will be able to connect to it by signing in with their GitHub account, allowing you to create tools that are only available to specific users.

You can use this as a reference example for how to integrate other OAuth providers with an MCP server deployed to Cloudflare, using the [`workers-oauth-provider`](https://github.com/cloudflare/workers-oauth-provider) library.

## Getting Started

Clone the repo directly & install dependencies: `pnpm install`.

### For Production

1.  **Create a new [GitHub OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app):**
    *   **Homepage URL**: Use your worker's final URL, e.g., `https://mcp-github-oauth.<your-subdomain>.workers.dev`
    *   **Authorization callback URL**: This is crucial. It must be your worker's URL with `/callback` appended: `https://mcp-github-oauth.<your-subdomain>.workers.dev/callback`
    *   Note your **Client ID** and generate a new **Client secret**.

2.  **Set Secrets via Wrangler**
    Use the Wrangler CLI to securely store your GitHub app credentials.
    ```bash
    # Paste your Client ID when prompted
    wrangler secret put GITHUB_CLIENT_ID

    # Paste your Client Secret when prompted
    wrangler secret put GITHUB_CLIENT_SECRET

    # Add a secure, random string for cookie encryption (e.g., openssl rand -hex 32)
    wrangler secret put COOKIE_ENCRYPTION_KEY
    ```
    > [!IMPORTANT]
    > When you create the first secret, Wrangler will ask if you want to create a new Worker. Enter "Y" to create it and save the secret.

3.  **Set up a KV Namespace**
    This is required for the OAuth library to store session state.
    *   Create the KV namespace:
        `wrangler kv:namespace create "OAUTH_KV"`
    *   Copy the `id` that the command outputs and add it to your `wrangler.toml` file.

4.  **Deploy to Cloudflare**
    Deploy the MCP server to make it live on your `workers.dev` domain.
    `wrangler deploy`

You now have a remote MCP server ready to connect with Puch AI!

## How to Connect with Puch AI

With your server deployed, connecting from Puch AI is a seamless OAuth flow.

1.  **[Open Puch AI](https://wa.me/+919998881729)** in your WhatsApp.

2.  **Start a new conversation** with Puch.

3.  **Use the standard connect command** with your server's public URL:
    ```
    /mcp connect https://mcp-github-oauth.<your-subdomain>.workers.dev/sse
    ```

4.  **Authorize the Connection:**
    *   Puch AI will recognize that your server requires authentication and will reply with a unique login link.
    *   Tap the link to open it in your browser.
    *   You will be redirected to GitHub to sign in and authorize the application.
    *   Click **"Authorize"** to grant access.

5.  **Connection Complete:**
    *   After authorization, you will be redirected back, and Puch AI will send a confirmation message in WhatsApp that the connection is successful. Your GitHub-gated tools are now available!

## Access Control: The Power of OAuth

This MCP server uses GitHub OAuth for authentication, which is its main advantage. All authenticated GitHub users can access basic tools like `add` and `userInfoOctokit`.

The real power is restricting tools. For example, the `generateImage` tool is restricted to specific GitHub users listed in the `ALLOWED_USERNAMES` set in your `src/index.ts` file:

```typescript
// Add GitHub usernames to grant them access to protected tools
const ALLOWED_USERNAMES = new Set([
  'your-github-username',
  'teammate1'
]);

// Inside your tool definition, you can check the user's identity
// The framework makes the authenticated user available to you.
if (ALLOWED_USERNAMES.has(authenticatedUser.login)) {
  // Allow access to the tool
} else {
  // Deny access
}
```

## How Does It Work?

This project combines several powerful Cloudflare and MCP libraries:

*   **OAuth Provider (`workers-oauth-provider`)**: A complete OAuth 2.1 server implementation for Cloudflare Workers. It handles the entire OAuth flow, from redirecting the user to GitHub to validating tokens and managing the session.
*   **Durable MCP**: Extends MCP functionality using Cloudflare's Durable Objects. This provides persistent state management for your server, securely stores the authentication context between requests, and makes the authenticated user's information available to your tools.
*   **MCP Remote**: Enables your server to expose tools that can be invoked by MCP clients like Puch AI. It defines the communication protocol, handles requests and responses, and maintains the Server-Sent Events (SSE) connection.
