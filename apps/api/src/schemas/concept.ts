import { z } from 'zod'
import { DateTimeSchema } from './common.ts'

/** Concept state machine — must stay in sync with db/schema.ts conceptsTable.state enum. */
export const ConceptStateSchema = z.enum(['new', 'learning', 'familiar', 'mastered'])

/** Per-concept spaced-repetition schedule — returned alongside concepts in review endpoints. */
export const ReviewScheduleSchema = z.object({
  easeFactor: z.number(),
  interval: z.number().int(),
  repetitions: z.number().int(),
  nextReviewAt: DateTimeSchema.nullable(),
  lastReviewedAt: DateTimeSchema.nullable(),
  totalReviews: z.number().int(),
  correctReviews: z.number().int(),
}).meta({ id: 'ReviewSchedule' })

/**
 * Saved vocabulary concept — mirror of conceptsTable columns consumed by the API.
 * Every column shipped to the wire is declared explicitly (no .passthrough()) so
 * the emitted OpenAPI spec is the single source of truth for the response contract.
 */
export const ConceptSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  concept: z.string(),
  translation: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  state: ConceptStateSchema,
  contextBefore: z.string().nullable().optional(),
  contextAfter: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  userNotes: z.string().nullable().optional(),
  exampleSentence: z.string().nullable().optional(),
  phoneticApproximation: z.string().nullable().optional(),
  commonUsage: z.string().nullable().optional(),
  grammarRules: z.string().nullable().optional(),
  commonness: z.string().nullable().optional(),
  fixedExpression: z.string().nullable().optional(),
  relatedWords: z.string().nullable().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
}).meta({ id: 'Concept' })

/** Concept with its current review schedule attached (review endpoints include this). */
export const ConceptWithScheduleSchema = ConceptSchema.extend({
  schedule: ReviewScheduleSchema,
}).meta({ id: 'ConceptWithSchedule' })
