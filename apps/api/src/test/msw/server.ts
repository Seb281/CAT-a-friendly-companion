import { setupServer } from 'msw/node'
import { supabaseAuthHandlers } from './supabaseAuth.ts'
import { deeplHandlers } from './deepl.ts'
import { llmHandlers } from './llm.ts'

export const server = setupServer(
  ...supabaseAuthHandlers,
  ...deeplHandlers,
  ...llmHandlers,
)
