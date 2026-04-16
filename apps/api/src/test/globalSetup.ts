/**
 * Vitest globalSetup — runs once per test invocation before any test file.
 *
 * Boots a `postgres:16-alpine` container via testcontainers, applies every
 * Drizzle migration in `apps/api/drizzle/`, and exposes the container's URL
 * to workers via `process.env.DATABASE_URL`. Also sets fake values for the
 * other env vars read at module init (Supabase, Gemini) so MSW can intercept
 * them without hitting the network.
 *
 * Tests run in `singleThread: true` mode so this process.env mutation is
 * visible in the worker thread without needing `provide()`.
 */
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_FOLDER = path.resolve(__dirname, '../../drizzle')

let container: StartedPostgreSqlContainer | undefined

export async function setup() {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('gato_test')
    .withUsername('gato')
    .withPassword('gato')
    .start()

  const databaseUrl = container.getConnectionUri()
  process.env.DATABASE_URL = databaseUrl

  // Stub module-init-time env reads so no app module crashes at import.
  process.env.SUPABASE_URL = 'http://msw.local/supabase'
  process.env.SUPABASE_SECRET_KEY = 'test-secret'
  process.env.GEMINI_API_KEY = 'test-gemini-key'
  process.env.DEEPL_API_KEY = 'test-deepl-key'
  process.env.DEEPL_API_URL = 'http://msw.local/deepl'
  process.env.ALLOWED_ORIGINS = ''

  const migrator = postgres(databaseUrl, { max: 1 })
  const dbForMigration = drizzle(migrator)
  await migrate(dbForMigration, { migrationsFolder: MIGRATIONS_FOLDER })
  await migrator.end()
}

export async function teardown() {
  if (container) await container.stop()
}
