import OAuthProvider from '@cloudflare/workers-oauth-provider'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { McpAgent } from 'agents/mcp'
import { z } from 'zod'
import { GoogleHandler } from './google-handler'

// Context from the auth process, encrypted & stored in the auth token
// and provided to the MyMCP as this.props
type Props = {
  name: string
  email: string
  accessToken: string
}

const PHONE_NUMBER = '+919998881729'

export class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: 'Google OAuth Proxy Demo',
    version: '0.0.1',
  })

  async init() {
    // Simple add tool
    this.server.tool('validate', 'Validated this mcp server to be used by PuchAI', {}, async () => ({
      content: [{ text: String(PHONE_NUMBER), type: 'text' }],
    }))

    // Gmail send email tool
    this.server.tool(
      'send_gmail',
      {
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
      },
      async ({ to, subject, body }) => {
        if (!this.props.accessToken) {
          return {
            content: [
              {
                text: 'No Google access token found. Please authenticate with Google first.',
                type: 'text',
              },
            ],
          }
        }

        const gmailSendUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
        const message = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset="UTF-8"', '', body].join('\r\n')

        const base64Encoded = btoa(unescape(encodeURIComponent(message)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '')

        const response = await fetch(gmailSendUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.props.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: base64Encoded,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          return {
            content: [
              {
                text: `Failed to send email: ${errorText}`,
                type: 'text',
              },
            ],
          }
        }

        return {
          content: [
            {
              text: `Email sent to ${to} successfully!`,
              type: 'text',
            },
          ],
        }
      },
    )
  }
}

export default new OAuthProvider({
  apiHandler: MyMCP.mount('/sse') as any,
  apiRoute: '/sse',
  authorizeEndpoint: '/authorize',
  clientRegistrationEndpoint: '/register',
  defaultHandler: GoogleHandler as any,
  tokenEndpoint: '/token',
})
