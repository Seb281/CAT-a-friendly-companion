import type {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify'
import { streamText } from 'ai'
import { requireAuth } from '../middleware/supabaseAuth.ts'
import { resolveUser } from '../middleware/resolveUser.ts'
import tutorData from '../data/tutorData.ts'
import { buildSystemPrompt, resolveModel } from '../controllers/tutorHelpers.ts'

type ConversationParams = { id: string }

type MessagesQuerystring = { limit?: string; offset?: string }

type SendMessageBody = { content: string }

/**
 * Tutor routes plugin. Registers all /tutor/* endpoints.
 */
export async function tutorRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  const PER_CONVERSATION_LIMIT = 30
  const DAILY_MESSAGE_LIMIT = 600

  const auth = [requireAuth, resolveUser]

  // POST /tutor/conversations — create a new conversation
  fastify.post(
    '/tutor/conversations',
    { preHandler: auth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const conversation = await tutorData.createConversation(
          request.dbUser.id
        )
        return reply.status(201).send({ conversation })
      } catch (error) {
        request.log.error(error, 'Failed to create conversation')
        return reply.status(500).send({ error: 'Failed to create conversation' })
      }
    }
  )

  // GET /tutor/conversations — list conversations
  fastify.get<{ Querystring: MessagesQuerystring }>(
    '/tutor/conversations',
    { preHandler: auth },
    async (
      request: FastifyRequest<{ Querystring: MessagesQuerystring }>,
      reply: FastifyReply
    ) => {
      try {
        const limit = Math.min(parseInt(request.query.limit ?? '20', 10) || 20, 50)
        const offset = parseInt(request.query.offset ?? '0', 10) || 0
        const result = await tutorData.getConversations(
          request.dbUser.id,
          limit,
          offset
        )
        return reply.send(result)
      } catch (error) {
        request.log.error(error, 'Failed to list conversations')
        return reply.status(500).send({ error: 'Failed to list conversations' })
      }
    }
  )

  // GET /tutor/conversations/:id/messages — get messages for a conversation
  fastify.get<{ Params: ConversationParams }>(
    '/tutor/conversations/:id/messages',
    { preHandler: auth },
    async (
      request: FastifyRequest<{ Params: ConversationParams }>,
      reply: FastifyReply
    ) => {
      const conversationId = parseInt(request.params.id, 10)
      if (isNaN(conversationId)) {
        return reply.status(400).send({ error: 'Invalid conversation ID' })
      }

      try {
        const conversation = await tutorData.getConversation(
          conversationId,
          request.dbUser.id
        )
        if (!conversation) {
          return reply.status(404).send({ error: 'Conversation not found' })
        }

        const messages = await tutorData.getMessages(conversationId)
        return reply.send({ messages })
      } catch (error) {
        request.log.error(error, 'Failed to get messages')
        return reply.status(500).send({ error: 'Failed to get messages' })
      }
    }
  )

  // DELETE /tutor/conversations/:id — delete a conversation
  fastify.delete<{ Params: ConversationParams }>(
    '/tutor/conversations/:id',
    { preHandler: auth },
    async (
      request: FastifyRequest<{ Params: ConversationParams }>,
      reply: FastifyReply
    ) => {
      const conversationId = parseInt(request.params.id, 10)
      if (isNaN(conversationId)) {
        return reply.status(400).send({ error: 'Invalid conversation ID' })
      }

      try {
        const conversation = await tutorData.getConversation(
          conversationId,
          request.dbUser.id
        )
        if (!conversation) {
          return reply.status(404).send({ error: 'Conversation not found' })
        }

        await tutorData.deleteConversation(conversationId, request.dbUser.id)
        return reply.send({ message: 'Conversation deleted' })
      } catch (error) {
        request.log.error(error, 'Failed to delete conversation')
        return reply.status(500).send({ error: 'Failed to delete conversation' })
      }
    }
  )

  // POST /tutor/conversations/:id/messages — send a message and stream the response
  fastify.post<{ Params: ConversationParams; Body: SendMessageBody }>(
    '/tutor/conversations/:id/messages',
    { preHandler: auth },
    async (
      request: FastifyRequest<{
        Params: ConversationParams
        Body: SendMessageBody
      }>,
      reply: FastifyReply
    ) => {
      const { content } = request.body
      if (!content || typeof content !== 'string' || !content.trim()) {
        return reply.status(400).send({ error: 'Message content is required' })
      }

      const conversationId = parseInt(request.params.id, 10)
      if (isNaN(conversationId)) {
        return reply.status(400).send({ error: 'Invalid conversation ID' })
      }

      try {
        const conversation = await tutorData.getConversation(
          conversationId,
          request.dbUser.id
        )
        if (!conversation) {
          return reply.status(404).send({ error: 'Conversation not found' })
        }

        // Rate limiting (only for users without a custom API key)
        if (!request.dbUser.customApiKey) {
          if (conversation.messageCount >= PER_CONVERSATION_LIMIT) {
            return reply.status(429).send({
              error: 'rate_limited',
              message: 'Conversation message limit reached. Start a new conversation.',
            })
          }

          const dailyCount = await tutorData.getDailyUserMessageCount(
            request.dbUser.id
          )
          if (dailyCount >= DAILY_MESSAGE_LIMIT) {
            return reply.status(429).send({
              error: 'rate_limited',
              message: 'Daily message limit reached. Add your own API key in settings for unlimited access.',
            })
          }
        }

        // Save the user message
        await tutorData.addMessage(conversationId, 'user', content.trim())

        // Auto-generate title from first message
        if (conversation.messageCount === 0) {
          const title = content.trim().length <= 50
            ? content.trim()
            : content.trim().substring(0, 50).replace(/\s\S*$/, '…')
          await tutorData.updateConversationTitle(
            conversationId,
            request.dbUser.id,
            title
          )
        }

        // Fetch conversation history for context
        const messages = await tutorData.getMessages(conversationId)

        // Build the prompt
        const systemPrompt = buildSystemPrompt({
          targetLanguage: request.dbUser.targetLanguage,
          context: request.dbUser.context,
          displayLanguage: request.dbUser.displayLanguage,
        })

        // Resolve the LLM model
        const model = resolveModel({
          customApiKey: request.dbUser.customApiKey,
          preferredProvider: request.dbUser.preferredProvider,
        })

        if (!model) {
          return reply.status(503).send({
            error: 'LLM not available',
            message: 'No API key configured for the AI teacher.',
          })
        }

        // Stream the response via SSE
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        })

        const result = streamText({
          model,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        })

        let fullResponse = ''

        for await (const chunk of result.textStream) {
          fullResponse += chunk
          reply.raw.write(
            `data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`
          )
        }

        // Save the full assistant response
        const assistantMessage = await tutorData.addMessage(
          conversationId,
          'assistant',
          fullResponse
        )

        reply.raw.write(
          `data: ${JSON.stringify({ type: 'done', messageId: assistantMessage.id })}\n\n`
        )
        reply.raw.end()
      } catch (error) {
        request.log.error(error, 'Failed to send tutor message')

        // If headers already sent (mid-stream error), send error event
        if (reply.raw.headersSent) {
          reply.raw.write(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`
          )
          reply.raw.end()
        } else {
          return reply
            .status(500)
            .send({ error: 'Failed to send message' })
        }
      }
    }
  )
}
