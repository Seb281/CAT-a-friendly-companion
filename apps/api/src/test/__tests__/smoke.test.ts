import { describe, it, expect } from 'vitest'
import postgres from 'postgres'

describe('testcontainer smoke', () => {
  it('connects to the container and queries it', async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
    const rows = await sql`SELECT 1 AS one`
    expect(rows[0]?.one).toBe(1)
    await sql.end()
  })

  it('has all Drizzle-migrated tables', async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
    const rows = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    const names = rows.map((r) => r.table_name)
    expect(names).toContain('users')
    expect(names).toContain('concepts')
    expect(names).toContain('review_schedule')
    expect(names).toContain('review_events')
    await sql.end()
  })
})
