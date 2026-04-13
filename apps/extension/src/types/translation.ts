export type { TranslationResponse, EnrichmentResponse, RelatedWord } from '@gato/shared'
import type { TranslationResponse } from '@gato/shared'

/** Extension-internal signal for content script -> sidepanel communication. */
export interface SidepanelTranslationSignal {
  inputText: string
  result: TranslationResponse
  fromCache: boolean
  cachedConceptId?: number
  contextBefore: string
  contextAfter: string
  sourceUrl: string
  timestamp: number
}
