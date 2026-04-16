#!/usr/bin/env tsx
/**
 * Writes the current OpenAPI spec to apps/api/openapi.json.
 *
 * Invoked via `pnpm --filter api spec:generate`. Also run in CI to check for
 * drift against the committed file. Boots the app without a network listener
 * or database (testcontainers is NOT started here), collects every registered
 * route schema, serializes, writes.
 */
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildApp } from '../src/app.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.resolve(__dirname, '../openapi.json')

async function main() {
  // Minimal env so supabaseAuth.ts module-init doesn't throw.
  process.env.SUPABASE_URL ??= 'http://unused.local/supabase'
  process.env.SUPABASE_SECRET_KEY ??= 'unused-during-spec-generation'

  const app = await buildApp({ logger: false })
  await app.ready()

  const spec = app.swagger()
  writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2) + '\n', 'utf-8')

  await app.close()
  console.log(`Wrote ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error('Spec generation failed:', err)
  process.exit(1)
})
