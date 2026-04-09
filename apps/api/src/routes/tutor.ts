import type {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify'
import { requireAuth } from '../middleware/supabaseAuth.ts'
import { resolveUser } from '../middleware/resolveUser.ts'
import tutorData from '../data/tutorData.ts'

type ConversationParams = { id: string }

type MessagesQuerystring = { limit?: string; offset?: string }

/**
 * Tutor routes plugin. Registers all /tutor/* endpoints.
 */
export async function tutorRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
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
}
