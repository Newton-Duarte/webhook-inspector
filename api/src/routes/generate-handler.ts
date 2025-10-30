import { db } from '@/db'
import { webhooks } from '@/db/schema'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { inArray } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const generateHandler: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/generate',
    {
      schema: {
        summary: 'Generate a TypeScript handler',
        tags: ['Webhooks'],
        body: z.object({
          webhooksIds: z.array(z.string()),
        }),
        response: {
          201: z.object({
            code: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { webhooksIds } = request.body

      const result = await db
        .select({
          body: webhooks.body,
        })
        .from(webhooks)
        .where(inArray(webhooks.id, webhooksIds))

      const webhooksBodies = result.map((webhook) => webhook.body).join('\n\n')

      const { text } = await generateText({
        model: google('gemini-2.5-flash-lite'),
        prompt: `
          Generate a TypeScript function that serves as a handler for multiple webhook events.

          The function should handle the following webhook events with example payloads:

          """
          ${webhooksBodies}
          """

          The generated code should include:

          - A main function that takes the webhook request body as input.
          - Zod schemas for each event type.
          - Logic to handle each event based on the validated data.
          - Appropriate error handling for invalid payloads.

          ---

          You can use this prompt to request the TypeScript code you need for handling webhook events with Zod validation.

          Return only the code and do not return \`\`\`typescript or any other markdown symbols, do not include any introduction or text before or after the code.
        `.trim(),
      })

      return reply.status(201).send({ code: text })
    },
  )
}
