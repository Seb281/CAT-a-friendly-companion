import type { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify'
import {
  requireAuth,
  getAuthenticatedUserId,
} from '../middleware/supabaseAuth.ts'
import { usersData } from '../data/usersData.ts'
import statsData from '../data/statsData.ts'

type ActivityQuerystring = {
  days?: string
}

export async function statsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET /stats/overview — overall stats for the user
  fastify.get(
    '/stats/overview',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const supabaseId = getAuthenticatedUserId(request)
      if (!supabaseId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const user = await usersData.retrieveUserBySupabaseId(supabaseId)
      if (!user) {
        return reply.send({
          totalConcepts: 0,
          currentStreak: 0,
          longestStreak: 0,
          avgAccuracy: 0,
          conceptsByState: {},
        })
      }

      const stats = await statsData.getOverviewStats(user.id)
      return reply.send(stats)
    }
  )

  // GET /stats/activity — daily activity history
  fastify.get<{ Querystring: ActivityQuerystring }>(
    '/stats/activity',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest<{ Querystring: ActivityQuerystring }>, reply: FastifyReply) => {
      const supabaseId = getAuthenticatedUserId(request)
      if (!supabaseId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const user = await usersData.retrieveUserBySupabaseId(supabaseId)
      if (!user) {
        return reply.send({ activity: [] })
      }

      const days = request.query.days ? parseInt(request.query.days, 10) : 90
      const activity = await statsData.getActivityHistory(user.id, days)
      return reply.send({ activity })
    }
  )
}
