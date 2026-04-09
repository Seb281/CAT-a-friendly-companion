import { db } from '../db/index.ts'
import { and, eq, gte, desc, sql, count } from 'drizzle-orm'
import {
  tutorConversationsTable,
  tutorMessagesTable,
  type TutorConversation,
  type TutorMessage,
} from '../db/schema.ts'

/**
 * Data access layer for tutor conversations and messages.
 * All functions that accept userId enforce ownership at the query level.
 */
const tutorData = {
  /**
   * Creates a new conversation for the given user.
   */
  async createConversation(userId: number): Promise<TutorConversation> {
    const [conversation] = await db
      .insert(tutorConversationsTable)
      .values({ userId })
      .returning()
    return conversation!
  },

  /**
   * Retrieves paginated conversations for a user, ordered by most recently updated.
   */
  async getConversations(
    userId: number,
    limit: number,
    offset: number
  ): Promise<{ conversations: TutorConversation[]; total: number }> {
    const [conversations, totalResult] = await Promise.all([
      db.query.tutorConversationsTable.findMany({
        where: eq(tutorConversationsTable.userId, userId),
        orderBy: [desc(tutorConversationsTable.updatedAt)],
        limit,
        offset,
      }),
      db
        .select({ count: count() })
        .from(tutorConversationsTable)
        .where(eq(tutorConversationsTable.userId, userId)),
    ])
    return { conversations, total: totalResult[0]?.count ?? 0 }
  },

  /**
   * Retrieves a single conversation, enforcing ownership via userId.
   * Returns null if not found or not owned by user.
   */
  async getConversation(
    conversationId: number,
    userId: number
  ): Promise<TutorConversation | null> {
    const conversation = await db.query.tutorConversationsTable.findFirst({
      where: and(
        eq(tutorConversationsTable.id, conversationId),
        eq(tutorConversationsTable.userId, userId)
      ),
    })
    return conversation ?? null
  },

  /**
   * Deletes a conversation (and cascade-deletes its messages), enforcing ownership.
   */
  async deleteConversation(
    conversationId: number,
    userId: number
  ): Promise<void> {
    await db
      .delete(tutorConversationsTable)
      .where(
        and(
          eq(tutorConversationsTable.id, conversationId),
          eq(tutorConversationsTable.userId, userId)
        )
      )
  },

  /**
   * Updates the title of a conversation, enforcing ownership.
   */
  async updateConversationTitle(
    conversationId: number,
    userId: number,
    title: string
  ): Promise<void> {
    await db
      .update(tutorConversationsTable)
      .set({ title })
      .where(
        and(
          eq(tutorConversationsTable.id, conversationId),
          eq(tutorConversationsTable.userId, userId)
        )
      )
  },

  /**
   * Retrieves messages for a conversation, ordered chronologically.
   * Optional limit for future summarization use.
   */
  async getMessages(
    conversationId: number,
    limit?: number
  ): Promise<TutorMessage[]> {
    return db.query.tutorMessagesTable.findMany({
      where: eq(tutorMessagesTable.conversationId, conversationId),
      orderBy: [tutorMessagesTable.createdAt],
      ...(limit ? { limit } : {}),
    })
  },

  /**
   * Adds a message to a conversation and increments the conversation's message count.
   * Uses a transaction to keep the count consistent.
   */
  async addMessage(
    conversationId: number,
    role: 'user' | 'assistant',
    content: string
  ): Promise<TutorMessage> {
    return db.transaction(async (tx) => {
      const [message] = await tx
        .insert(tutorMessagesTable)
        .values({ conversationId, role, content })
        .returning()

      await tx
        .update(tutorConversationsTable)
        .set({
          messageCount: sql`${tutorConversationsTable.messageCount} + 1`,
        })
        .where(eq(tutorConversationsTable.id, conversationId))

      return message!
    })
  },

  /**
   * Counts user messages sent today (UTC) across all of a user's conversations.
   * Used for daily rate limiting.
   */
  async getDailyUserMessageCount(userId: number): Promise<number> {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const result = await db
      .select({ count: count() })
      .from(tutorMessagesTable)
      .innerJoin(
        tutorConversationsTable,
        eq(tutorMessagesTable.conversationId, tutorConversationsTable.id)
      )
      .where(
        and(
          eq(tutorConversationsTable.userId, userId),
          eq(tutorMessagesTable.role, 'user'),
          gte(tutorMessagesTable.createdAt, todayStart)
        )
      )

    return result[0]?.count ?? 0
  },
}

export default tutorData
