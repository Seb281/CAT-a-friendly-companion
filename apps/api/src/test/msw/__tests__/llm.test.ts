import { afterEach, describe, expect, it } from 'vitest'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { extractJSON } from '../../../controllers/helpers.ts'
import { CANNED_LLM_JSON, clearProviderCallLog, providerCallLog } from '../llm.ts'

describe('MSW LLM handlers', () => {
  afterEach(() => clearProviderCallLog())

  it('Gemini canned response parses through extractJSON', async () => {
    const google = createGoogleGenerativeAI({ apiKey: 'test-gemini-key' })
    const { text } = await generateText({ model: google('gemini-2.5-flash'), prompt: 'hi' })
    const parsed = extractJSON(text) as typeof CANNED_LLM_JSON
    expect(parsed.contextualTranslation).toBe(CANNED_LLM_JSON.contextualTranslation)
    expect(providerCallLog).toEqual(['google'])
  })
})
