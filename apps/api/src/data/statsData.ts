import { db } from '../db/index.ts'
import { and, eq, sql, gte } from 'drizzle-orm'
import { dailyActivityTable, usersTable, conceptsTable, reviewScheduleTable } from '../db/schema.ts'
import type { DailyActivity } from '../db/schema.ts'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

const statsData = {
  /**
   * Upsert today's daily_activity row, incrementing the given field.
   * Also updates the user's streak.
   */
  async updateDailyActivity(
    userId: number,
    field: 'conceptsAdded' | 'reviewsCompleted' | 'correctReviews'
  ): Promise<void> {
    const today = todayStr()

    // Column mapping for the raw SQL increment
    const colMap = {
      conceptsAdded: 'concepts_added',
      reviewsCompleted: 'reviews_completed',
      correctReviews: 'correct_reviews',
    } as const

    const col = colMap[field]

    // Upsert the daily activity row
    await db.execute(sql`
      INSERT INTO daily_activity (user_id, date, ${sql.raw(col)})
      VALUES (${userId}, ${today}, 1)
      ON CONFLICT (user_id, date)
      DO UPDATE SET ${sql.raw(col)} = daily_activity.${sql.raw(col)} + 1
    `)

    // Update streak on the user
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    })

    if (!user) return

    const lastActive = user.lastActiveDate
    let newStreak = user.currentStreak

    if (lastActive === today) {
      // Already active today, no streak change
      return
    } else if (lastActive === yesterdayStr()) {
      // Consecutive day
      newStreak = user.currentStreak + 1
    } else {
      // Gap — reset streak
      newStreak = 1
    }

    const newLongest = Math.max(user.longestStreak, newStreak)

    await db
      .update(usersTable)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: today,
      })
      .where(eq(usersTable.id, userId))
  },

  /**
   * Get overview stats for a user.
   */
  async getOverviewStats(userId: number): Promise<{
    totalConcepts: number
    currentStreak: number
    longestStreak: number
    avgAccuracy: number
    conceptsByState: Record<string, number>
  }> {
    const [
      user,
      totalResult,
      stateResults,
      reviewStats,
    ] = await Promise.all([
      db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(conceptsTable)
        .where(eq(conceptsTable.userId, userId)),
      db
        .select({
          state: conceptsTable.state,
          count: sql<number>`count(*)::int`,
        })
        .from(conceptsTable)
        .where(eq(conceptsTable.userId, userId))
        .groupBy(conceptsTable.state),
      db
        .select({
          totalReviews: sql<number>`coalesce(sum(${reviewScheduleTable.totalReviews}), 0)::int`,
          correctReviews: sql<number>`coalesce(sum(${reviewScheduleTable.correctReviews}), 0)::int`,
        })
        .from(reviewScheduleTable)
        .where(eq(reviewScheduleTable.userId, userId)),
    ])

    const totalConcepts = totalResult[0]?.count ?? 0
    const currentStreak = user?.currentStreak ?? 0
    const longestStreak = user?.longestStreak ?? 0

    const totalReviews = reviewStats[0]?.totalReviews ?? 0
    const correctReviews = reviewStats[0]?.correctReviews ?? 0
    const avgAccuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0

    const conceptsByState: Record<string, number> = {}
    for (const row of stateResults) {
      conceptsByState[row.state] = row.count
    }

    return {
      totalConcepts,
      currentStreak,
      longestStreak,
      avgAccuracy,
      conceptsByState,
    }
  },

  /**
   * Get daily activity history for the last N days.
   */
  async getActivityHistory(
    userId: number,
    days: number = 90
  ): Promise<DailyActivity[]> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    return db.query.dailyActivityTable.findMany({
      where: and(
        eq(dailyActivityTable.userId, userId),
        gte(dailyActivityTable.date, cutoffStr)
      ),
      orderBy: dailyActivityTable.date,
    })
  },
}

export default statsData
