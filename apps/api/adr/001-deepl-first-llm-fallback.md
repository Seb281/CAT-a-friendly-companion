# ADR-001: DeepL-First, LLM-Fallback Translation

**Date:** 2026-04-14
**Status:** Accepted

## Context

Gato needs to translate user-selected text and provide linguistic enrichment (pronunciation, grammar, related words). These are two distinct tasks with different performance characteristics.

LLMs can do both translation and enrichment in a single prompt, but they're slow (1-3s latency) and expensive (token-based pricing that scales with prompt complexity). DeepL is a dedicated translation API — fast (~200ms), accurate, and priced per character with predictable costs. However, DeepL can only translate; it can't generate enrichment data. DeepL also doesn't support every language.

The question: should translation and enrichment go through one pipeline (LLM-only) or two (DeepL + LLM)?

## Decision

Use DeepL as the primary translation provider. Fall back to an LLM only when:
- The target language isn't in DeepL's supported set
- DeepL returns an error

Enrichment is always LLM-generated, as a separate request after translation completes. This applies to both the DeepL and LLM translation paths.

The implementation lives in `services/translationOrchestrator.ts`:
- **DeepL path:** returns `{ provider: 'deepl' }` with translation only. Enrichment is fetched via a separate `enrich` action.
- **LLM fallback path:** returns `{ provider: 'llm' }` with translation and enrichment in one shot (since we're already paying for the LLM call).

## Consequences

**Benefits:**
- Translation latency drops significantly for DeepL-supported languages (~200ms vs 1-3s).
- Cost is predictable — DeepL's per-character pricing doesn't fluctuate with prompt length.
- Enrichment is decoupled from translation, enabling independent caching and retries.
- BYOK users who bring their own LLM key still benefit from DeepL translation — their key only affects enrichment and the fallback path.

**Trade-offs:**
- Two code paths to maintain in the translation orchestrator. Each path returns a different shape (translation-only vs translation+enrichment), and callers must handle both.
- DeepL is a paid external dependency. If the service is down, the LLM fallback catches it, but there's a brief latency spike while the DeepL timeout expires.
- Language support is gated by DeepL's coverage. New languages only get fast translation once DeepL adds them.
