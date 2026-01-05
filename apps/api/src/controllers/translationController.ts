import type { FastifyRequest, FastifyReply } from 'fastify'
import { GoogleGenAI, GenerateContentResponse } from '@google/genai'
import { extractJSON, promptBuilder } from './helpers.ts'
import 'dotenv/config'

const geminiKey = process.env.GEMINI_API_KEY

if (!geminiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required')
}

const ai = new GoogleGenAI({ apiKey: geminiKey })

type TranslationRequest = {
  text: string
  targetLanguage: string
  sourceLanguage: string
  personalContext: string
}

export async function translate(
  request: FastifyRequest<{ Body: TranslationRequest }>,
  reply: FastifyReply
): Promise<void> {
  console.log('incoming request with body:', request.body)
  try {
    const { text, targetLanguage, sourceLanguage, personalContext } =
      request.body

    if (!text || !targetLanguage) {
      console.error(
        'Validation error: missing required fields: text, targetLanguage'
      )
      console.error('Received:', {
        text,
        targetLanguage,
        sourceLanguage,
        personalContext,
      })
      return reply.status(400).send({
        error: 'Missing required fields: text, targetLanguage',
      })
    }

    const prompt = promptBuilder(
      text,
      targetLanguage,
      sourceLanguage,
      personalContext
    )

    console.log('Generated prompt:', prompt)

    async function callAIWithRetry(
      prompt: string,
      maxRetries: number = 3
    ): Promise<GenerateContentResponse> {
      let lastError: Error | null = null

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              temperature: 0,
            },
          })
          return response
        } catch (error) {
          lastError = error as Error
          console.warn(`Attempt ${attempt + 1} failed:`, error)
        }
      }

      throw new Error(
        `Failed to retrieve translation after ${maxRetries} attempts. Last error: ${lastError?.message}`
      )
    }

    const response = await callAIWithRetry(prompt)

    console.log('Gemini response received')

    let responseText: string | undefined
    if (response && typeof response.text === 'function') {
      responseText = response.text()
    } else if (response && 'text' in response) {
      responseText = response.text as string
    }

    console.log('Raw response text:', responseText)

    if (responseText) {
      const translationResult = extractJSON(responseText)
      return reply.status(200).send(translationResult)
    } else {
      console.error(
        'Gemini response missing text:',
        JSON.stringify(response, null, 2)
      )
      throw new Error('Failed to retrieve translation')
    }
  } catch (error) {
    console.error('Translation error:', error)
    return reply.status(500).send({
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
