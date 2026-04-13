import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sm2, QUALITY_MAP } from '../sm2.ts'

/** Default starting state for a new card. */
const NEW_CARD = { quality: 4, easeFactor: 2.5, interval: 0, repetitions: 0 }

// Pin Date.now so nextReviewAt assertions are deterministic
const FIXED_NOW = new Date('2026-04-13T12:00:00Z')
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(FIXED_NOW) })
afterEach(() => { vi.useRealTimers() })

// ---------- Ease factor ----------

describe('ease factor', () => {
  it('increases on perfect recall (quality 5)', () => {
    const result = sm2({ ...NEW_CARD, quality: 5 })
    expect(result.easeFactor).toBeGreaterThan(2.5)
  })

  it('stays the same on quality 4', () => {
    // EF formula: 2.5 + (0.1 - (5-4)*(0.08 + (5-4)*0.02)) = 2.5 + 0 = 2.5
    const result = sm2({ ...NEW_CARD, quality: 4 })
    expect(result.easeFactor).toBe(2.5)
  })

  it('decreases on quality 3 (hard)', () => {
    const result = sm2({ ...NEW_CARD, quality: 3 })
    expect(result.easeFactor).toBeLessThan(2.5)
  })

  it('never drops below 1.3', () => {
    // Repeated failures with minimum EF
    const result = sm2({ quality: 0, easeFactor: 1.3, interval: 1, repetitions: 3 })
    expect(result.easeFactor).toBe(1.3)
  })

  it('rounds to 2 decimal places', () => {
    const result = sm2({ quality: 5, easeFactor: 2.5, interval: 1, repetitions: 1 })
    const decimals = result.easeFactor.toString().split('.')[1]?.length ?? 0
    expect(decimals).toBeLessThanOrEqual(2)
  })
})

// ---------- Interval ----------

describe('interval', () => {
  it('sets interval to 1 on first successful review', () => {
    const result = sm2({ quality: 4, easeFactor: 2.5, interval: 0, repetitions: 0 })
    expect(result.interval).toBe(1)
  })

  it('sets interval to 6 on second successful review', () => {
    const result = sm2({ quality: 4, easeFactor: 2.5, interval: 1, repetitions: 1 })
    expect(result.interval).toBe(6)
  })

  it('multiplies by ease factor on third+ review', () => {
    const ef = 2.5
    const result = sm2({ quality: 4, easeFactor: ef, interval: 6, repetitions: 2 })
    expect(result.interval).toBe(Math.round(6 * ef))
  })

  it('resets interval to 0 on failure (quality < 3)', () => {
    const result = sm2({ quality: 2, easeFactor: 2.5, interval: 15, repetitions: 5 })
    expect(result.interval).toBe(0)
  })

  it('resets interval to 0 on complete blackout (quality 0)', () => {
    const result = sm2({ quality: 0, easeFactor: 2.5, interval: 30, repetitions: 8 })
    expect(result.interval).toBe(0)
  })
})

// ---------- Repetitions ----------

describe('repetitions', () => {
  it('increments on success', () => {
    const result = sm2({ quality: 4, easeFactor: 2.5, interval: 6, repetitions: 2 })
    expect(result.repetitions).toBe(3)
  })

  it('resets to 0 on failure', () => {
    const result = sm2({ quality: 1, easeFactor: 2.5, interval: 15, repetitions: 5 })
    expect(result.repetitions).toBe(0)
  })
})

// ---------- Next review date ----------

describe('nextReviewAt', () => {
  it('schedules 10 minutes later on failure', () => {
    const result = sm2({ quality: 1, easeFactor: 2.5, interval: 15, repetitions: 5 })
    const expected = new Date(FIXED_NOW)
    expected.setMinutes(expected.getMinutes() + 10)
    expect(result.nextReviewAt).toEqual(expected)
  })

  it('schedules N days later on success', () => {
    const result = sm2({ quality: 4, easeFactor: 2.5, interval: 0, repetitions: 0 })
    const expected = new Date(FIXED_NOW)
    expected.setDate(expected.getDate() + 1)
    expect(result.nextReviewAt).toEqual(expected)
  })
})

// ---------- Concept state transitions ----------

describe('conceptState', () => {
  it('returns "learning" on failure (reps reset to 0)', () => {
    const result = sm2({ quality: 1, easeFactor: 2.5, interval: 6, repetitions: 3 })
    expect(result.conceptState).toBe('learning')
  })

  it('returns "learning" for reps 1-2', () => {
    expect(sm2({ ...NEW_CARD, quality: 4 }).conceptState).toBe('learning')
    expect(sm2({ quality: 4, easeFactor: 2.5, interval: 1, repetitions: 1 }).conceptState).toBe('learning')
  })

  it('returns "familiar" for reps 3-5', () => {
    const result = sm2({ quality: 4, easeFactor: 2.5, interval: 6, repetitions: 2 })
    expect(result.repetitions).toBe(3)
    expect(result.conceptState).toBe('familiar')
  })

  it('returns "mastered" for reps > 5', () => {
    const result = sm2({ quality: 4, easeFactor: 2.5, interval: 30, repetitions: 5 })
    expect(result.repetitions).toBe(6)
    expect(result.conceptState).toBe('mastered')
  })
})

// ---------- QUALITY_MAP ----------

describe('QUALITY_MAP', () => {
  it('maps labels to correct SM-2 scores', () => {
    expect(QUALITY_MAP.again).toBe(1)
    expect(QUALITY_MAP.hard).toBe(3)
    expect(QUALITY_MAP.good).toBe(4)
    expect(QUALITY_MAP.easy).toBe(5)
  })
})

// ---------- Full lifecycle ----------

describe('full review lifecycle', () => {
  it('progresses from new through mastered', () => {
    let state = { easeFactor: 2.5, interval: 0, repetitions: 0 }

    // First review — good
    let result = sm2({ ...state, quality: 4 })
    expect(result.conceptState).toBe('learning')
    state = result

    // Second — good
    result = sm2({ ...state, quality: 4 })
    expect(result.conceptState).toBe('learning')
    state = result

    // Third — good
    result = sm2({ ...state, quality: 4 })
    expect(result.conceptState).toBe('familiar')
    state = result

    // Continue until mastered
    for (let i = 0; i < 3; i++) {
      result = sm2({ ...state, quality: 5 })
      state = result
    }
    expect(result.conceptState).toBe('mastered')
    expect(result.interval).toBeGreaterThan(15)
  })

  it('resets progress on lapse then rebuilds', () => {
    // Build up to familiar
    let state = { easeFactor: 2.5, interval: 0, repetitions: 0 }
    for (let i = 0; i < 3; i++) {
      state = sm2({ ...state, quality: 4 })
    }
    expect(state.repetitions).toBe(3)

    // Lapse
    const lapsed = sm2({ ...state, quality: 1 })
    expect(lapsed.repetitions).toBe(0)
    expect(lapsed.interval).toBe(0)
    expect(lapsed.conceptState).toBe('learning')

    // Ease factor should have decreased
    expect(lapsed.easeFactor).toBeLessThan(state.easeFactor)
  })
})
