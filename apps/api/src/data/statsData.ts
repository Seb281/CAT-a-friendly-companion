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
    let streakFreezes = user.streakFreezes
    let freezesUsed = user.freezesUsed

    if (lastActive === today) {
      // Already active today, no streak change
      return
    } else if (lastActive === yesterdayStr()) {
      // Consecutive day
      newStreak = user.currentStreak + 1
    } else {
      // Gap — check if we can use a streak freeze
      // Calculate days missed between lastActiveDate and today
      if (lastActive) {
        const lastDate = new Date(lastActive + 'T00:00:00Z')
        const todayDate = new Date(today + 'T00:00:00Z')
        const daysMissed = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        ) - 1

        if (daysMissed === 1 && streakFreezes > 0) {
          // Use a freeze to preserve the streak
          streakFreezes -= 1
          freezesUsed += 1
          newStreak = user.currentStreak + 1
        } else {
          // Too many days missed or no freezes — reset
          newStreak = 1
        }
      } else {
        // No previous activity — start fresh
        newStreak = 1
      }
    }

    // Award a freeze when streak reaches a new multiple of 7 (max 3 banked)
    const previousStreak = user.currentStreak
    if (
      newStreak >= 7 &&
      Math.floor(newStreak / 7) > Math.floor(previousStreak / 7) &&
      streakFreezes < 3
    ) {
      streakFreezes += 1
    }

    const newLongest = Math.max(user.longestStreak, newStreak)

    await db
      .update(usersTable)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: today,
        streakFreezes,
        freezesUsed,
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
    streakFreezes: number
    freezesUsed: number
    dailyGoal: number
    todayReviews: number
    todayGoalMet: boolean
  }> {
    const today = todayStr()

    const [
      user,
      totalResult,
      stateResults,
      reviewStats,
      todayActivity,
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
      db.query.dailyActivityTable.findFirst({
        where: and(
          eq(dailyActivityTable.userId, userId),
          eq(dailyActivityTable.date, today)
        ),
      }),
    ])

    const totalConcepts = totalResult[0]?.count ?? 0
    const currentStreak = user?.currentStreak ?? 0
    const longestStreak = user?.longestStreak ?? 0
    const streakFreezes = user?.streakFreezes ?? 0
    const freezesUsed = user?.freezesUsed ?? 0
    const dailyGoal = user?.dailyGoal ?? 10

    const totalReviews = reviewStats[0]?.totalReviews ?? 0
    const correctReviews = reviewStats[0]?.correctReviews ?? 0
    const avgAccuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0

    const todayReviews = todayActivity?.reviewsCompleted ?? 0

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
      streakFreezes,
      freezesUsed,
      dailyGoal,
      todayReviews,
      todayGoalMet: todayReviews >= dailyGoal,
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
