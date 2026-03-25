# Context-Aware Translator

A Chrome extension that translates selected text using LLMs, with surrounding context for more accurate translations.

Select text on any webpage, press `Cmd+Shift+T` (or `Ctrl+Shift+T`), and get a context-aware translation in an overlay popup.

## How it works

1. User selects text on a webpage
2. The extension captures the selected text plus surrounding context
3. Text + context is sent to the backend API
4. An LLM translates the text, informed by the surrounding context for better accuracy
5. The translation is displayed in an inline popup

## Tech stack

| App | Stack |
|-----|-------|
| `apps/extension` | React, TypeScript, WXT, Tailwind CSS, Radix UI |
| `apps/api` | Fastify, Drizzle ORM, PostgreSQL, Vercel AI SDK |
| `apps/web` | Next.js, Tailwind CSS, Radix UI |

**Infrastructure:** Supabase (auth + DB), Railway (API), Vercel (dashboard), Sentry (error tracking)

**Supported LLM providers:** Google Gemini (default), OpenAI, Anthropic, Mistral — users can bring their own API keys.

## Features

- Context-aware translations powered by LLMs
- Source language auto-detection
- Saved concepts — build a personal translation dictionary
- Custom API key support for multiple LLM providers
- Personal context/glossary for domain-specific translations
- Auth sync between extension and web dashboard

## Development

```bash
pnpm install
pnpm dev          # Start all apps in development mode
```

### Extension

```bash
pnpm --filter context-aware-translator-extension dev
pnpm --filter context-aware-translator-extension build
```

Load `.output/chrome-mv3` as an unpacked extension in `chrome://extensions`.

### API

```bash
pnpm --filter context-aware-translator-api dev
```

Requires environment variables for Supabase, Gemini, and database connection — see `apps/api/.env.default`.
