/**
 * Quiz generation integration tests.
 *
 * Covers:
 *   1. type=flashcard → returns due concepts with schedule metadata
 *   2. type=multiple-choice → distractors + correctAnswer + 4 options
 *   3. type=multiple-choice with <4 concepts → returns with fewer distractors
 *   4. type=contextual-recall → prefers contextful concepts, falls back
 *   5. No due concepts falls back to any concept
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../app.ts'
import {
  createConcept,
  createSchedule,
  createUser,
} from '../../test/db/factories.ts'
import { TOKENS } from '../../test/fixtures/users.ts'

let app: FastifyInstance

beforeEach(async () => {
  app = await buildApp({ logger: false })
})

afterEach(async () => {
  await app.close()
})

/** Seeds Alice user with the supabaseId matching the MSW GoTrue fixture. */
async function seedAlice() {
  return createUser({ supabaseId: 'sb-alice', email: 'alice@test.local' })
}

describe('GET /quiz/generate', () => {
  it('type=flashcard returns due concepts with schedule metadata', async () => {
    const user = await seedAlice()
    const c1 = await createConcept({ userId: user.id, concept: 'c1' })
    await createSchedule({ conceptId: c1.id, userId: user.id })

    const res = await app.inject({
      method: 'GET',
      url: '/quiz/generate?type=flashcard&count=5',
      headers: { authorization: `Bearer ${TOKENS.alice}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.questions.length).toBe(1)
    expect(body.questions[0].conceptId).toBe(c1.id)
    expect(body.questions[0].schedule).toBeDefined()
    expect(body.questions[0].translation).toBeDefined()
  })

  it('type=multiple-choice attaches 3 distractors + correct answer', async () => {
    const user = await seedAlice()
    const main = await createConcept({
      userId: user.id,
      concept: 'main',
      translation: 'MAIN_T',
    })
    await createSchedule({ conceptId: main.id, userId: user.id })
    // Three extra concepts to pull distractors from
    for (let i = 0; i < 3; i++) {
      const d = await createConcept({
        userId: user.id,
        concept: `d${i}`,
        translation: `D${i}_T`,
      })
      // Future-dated so they don't show up as due themselves
      await createSchedule({
        conceptId: d.id,
        userId: user.id,
        nextReviewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
    }

    const res = await app.inject({
      method: 'GET',
      url: '/quiz/generate?type=multiple-choice&count=1',
      headers: { authorization: `Bearer ${TOKENS.alice}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.questions.length).toBe(1)
    const q = body.questions[0]
    expect(q.correctAnswer).toBe('MAIN_T')
    expect(q.options).toContain('MAIN_T')
    expect(q.options.length).toBe(4)
  })

  it('type=multiple-choice with <4 concepts returns fewer options, no crash', async () => {
    const user = await seedAlice()
    const main = await createConcept({
      userId: user.id,
      concept: 'only',
      translation: 'ONLY',
    })
    await createSchedule({ conceptId: main.id, userId: user.id })

    const res = await app.inject({
      method: 'GET',
      url: '/quiz/generate?type=multiple-choice&count=1',
      headers: { authorization: `Bearer ${TOKENS.alice}` },
    })

    expect(res.statusCode).toBe(200)
    const q = res.json().questions[0]
    expect(q.correctAnswer).toBe('ONLY')
    expect(q.options.length).toBeLessThanOrEqual(4)
    expect(q.options).toContain('ONLY')
  })

  it('type=contextual-recall prefers contextful concepts', async () => {
    const user = await seedAlice()
    const ctxConcept = await createConcept({
      userId: user.id,
      concept: 'with-ctx',
      contextBefore: 'Before text.',
      contextAfter: 'After text.',
    })
    await createSchedule({ conceptId: ctxConcept.id, userId: user.id })
    const plainConcept = await createConcept({
      userId: user.id,
      concept: 'no-ctx',
    })
    await createSchedule({ conceptId: plainConcept.id, userId: user.id })

    const res = await app.inject({
      method: 'GET',
      url: '/quiz/generate?type=contextual-recall&count=1',
      headers: { authorization: `Bearer ${TOKENS.alice}` },
    })

    expect(res.statusCode).toBe(200)
    const q = res.json().questions[0]
    expect(q.conceptId).toBe(ctxConcept.id)
    expect(q.contextBefore).toBe('Before text.')
  })

  it('no due concepts falls back to "any concepts"', async () => {
    const user = await seedAlice()
    const c = await createConcept({ userId: user.id, concept: 'future' })
    await createSchedule({
      conceptId: c.id,
      userId: user.id,
      nextReviewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    const res = await app.inject({
      method: 'GET',
      url: '/quiz/generate?type=flashcard&count=5',
      headers: { authorization: `Bearer ${TOKENS.alice}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.questions.length).toBe(1)
    expect(body.questions[0].conceptId).toBe(c.id)
  })
})
