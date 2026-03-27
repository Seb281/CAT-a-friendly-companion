import type { FastifyRequest, FastifyReply } from 'fastify'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { extractJSON, promptBuilder } from './helpers.ts'
import { getAuthenticatedUserEmail, supabase } from '../middleware/supabaseAuth.ts'
import { userContextData } from '../data/usersData.ts'
import 'dotenv/config'

const systemGeminiKey = process.env.GEMINI_API_KEY
if (!systemGeminiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required')
}

// System default provider
const google = createGoogleGenerativeAI({
  apiKey: systemGeminiKey,
})

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
  try {
    const { text, targetLanguage, sourceLanguage, personalContext } =
      request.body

    if (!text || !targetLanguage) {
      console.error(
        'Validation error: missing required fields: text, targetLanguage'
      )
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

    // Determine Provider and API Key
    let model: any = google('gemini-3.1-flash-lite-preview') // Default system model

    // Try to identify user and check for custom settings
    try {
      // Check if there's an auth header even if this is a "public" endpoint
      const authHeader = request.headers.authorization
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        
        if (user?.email) {
          const settings = await userContextData.retrieveUserContext(user.email)
          
          if (settings.customApiKey && settings.preferredProvider) {
            if (settings.preferredProvider === 'openai') {
              const openai = createOpenAI({
                apiKey: settings.customApiKey,
              })
              model = openai('gpt-4o')
            } else if (settings.preferredProvider === 'google') {
              const customGoogle = createGoogleGenerativeAI({
                apiKey: settings.customApiKey,
              })
              model = customGoogle('gemini-2.5-flash')
            } else if (settings.preferredProvider === 'anthropic') {
              const anthropic = createAnthropic({ apiKey: settings.customApiKey })
              model = anthropic('claude-sonnet-4-5')
            } else if (settings.preferredProvider === 'mistral') {
              const mistral = createMistral({ apiKey: settings.customApiKey })
              model = mistral('mistral-large-latest')
            }
          }
        }
      }
    } catch (authError) {
      // Non-fatal: just use default provider if auth/lookup fails
      console.warn('Failed to resolve user settings for translation:', authError)
    }

    async function callAIWithRetry(
      prompt: string,
      maxRetries: number = 3
    ): Promise<string> {
      let lastError: Error | null = null

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { text } = await generateText({
            model: model,
            prompt: prompt,
            temperature: 0,
          })
          return text
        } catch (error) {
          lastError = error as Error
          console.warn(`Attempt ${attempt + 1} failed:`, error)
        }
      }

      throw new Error(
        `Failed to retrieve translation after ${maxRetries} attempts. Last error: ${lastError?.message}`
      )
    }

    const responseText = await callAIWithRetry(prompt)

    if (responseText) {
      const translationResult = extractJSON(responseText)
      return reply.status(200).send(translationResult)
    } else {
      throw new Error('Failed to retrieve translation text')
    }

  } catch (error) {
    console.error('Translation error:', error)
    return reply.status(500).send({
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
