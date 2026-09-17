# Ideako

**Your AI creative partner.** Ideako learns how you communicate and helps you create social media content in your own voice. LinkedIn first; other platforms can be added behind the same architecture.

## The workflow

```
Landing → Sign up / sign in → Who are you creating for? → Teach Ideako your voice
→ Create: describe an idea, pick a content type, tone and length, add references
→ Generate → Edit and refine (rewrite, shorten, expand, improve the hook, …)
→ Hashtag suggestions (recommended / broader / niche) → Save / copy → come back later
```

## Product surface

| Area | What it does |
| --- | --- |
| `/` | Landing page. |
| `/onboarding` | Three-step setup: who you create for, about you, your voice (tone chips, previous posts, company material, notes). |
| `/signin` | Local sign-in seam; real auth plugs in here. |
| `/create` | The workspace. Composer on the left, editor with refine actions, *Ideako's take* and hashtags on the right. |
| `/references` | Library of past posts Ideako studies for style (never copies). |
| `/voice` | What Ideako has learned about your voice, plus brand description, audience, preferences, things to avoid, background documents. |
| `/saved` | Saved posts and full history with open, edit, duplicate, delete, use as reference. |
| `/settings` | Profile, platform, export / clear workspace. |

## Getting started

```bash
npm install
cp .env.example .env.local   # add at least one free AI key
npm run dev
```

## Choosing a free AI engine

Ideako is not tied to one model vendor. It has an engine layer with pluggable providers and automatic fallback, because free tiers all share the same two problems: rate limits and retired model names.

| Provider | Free tier | Why use it | Key |
| --- | --- | --- | --- |
| **Google Gemini** (default) | Yes, no card | Best writing quality for this workload; native JSON mode | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Groq** | Yes, no card | Very fast Llama models; ideal fallback when Gemini is rate-limited | [console.groq.com/keys](https://console.groq.com/keys) |
| **OpenRouter** | Free models (`:free`) | Wide choice; quality and uptime vary by model | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Custom** | Depends | Any OpenAI-compatible endpoint: Cerebras, Mistral, Together, local Ollama | `AI_BASE_URL` + `AI_API_KEY` |

Recommended setup: **Gemini + Groq**. Two keys, both free, and the product keeps working when either one throttles.

How it behaves:

- **Model resolution.** Each provider asks its API which models the key can use and picks the newest stable general-purpose one. `gemini-2.0-flash` was retired on 1 June 2026; nothing in Ideako needs editing when that happens again. Pin a model with `GEMINI_MODEL` / `GROQ_MODEL` if you want to.
- **Fallback.** On a rate limit, timeout, outage, or empty/unreadable answer, the engine moves to the next configured provider. Hard failures (a blocked prompt, a rejected key) stop and report clearly.
- **Visibility.** Settings → *AI engine* shows the chain, the resolved models, and a *Test connection* button. `GET /api/engine` returns the same without keys.

Without any key the app runs, and generation shows a clear "not connected" state with the two free signup links.

## Architecture

```
src/
  app/                      Next.js App Router
    api/{generate,refine,hashtags,insights,voice}   Server-side Gemini routes
    (workspace)/            Authenticated workspace pages, shared AppShell
    onboarding/  signin/    Entry flows
  components/
    ui/                     Button, Chip, Field, Segmented, Disclosure, Icons, …
    create/                 Composer, ReferenceBlock, PostEditor, PostPreview,
                            HashtagPanel, InsightPanel, ResultPane, CreateWorkspace
    app/                    AppShell, PageHeader, References/Voice/Saved/Settings views
    onboarding/  landing/
  lib/
    types.ts                Domain model: User, Profile, Voice, Reference,
                            GeneratedPost (+ versions, hashtags, insight)
    constants.ts            Content types, tones, lengths, refine actions, platforms
    ai/                     contracts (shared), engine + providers/ (server),
                            prompts (server), route helpers + rate limit, client (browser)
    storage/                IdeakoRepository interface + LocalRepository (localStorage)
    store/                  WorkspaceProvider: hydrated state + typed actions
```

**Persistence.** Everything is written through `IdeakoRepository`. Today that is `LocalRepository` (browser storage). Implement the same interface on top of a database and swap it in `lib/storage/index.ts`; the UI does not change.

**AI.** The API key never reaches the browser. Each route validates its body, applies a per-IP rate limit, builds a prompt from the shared *voice brief* (profile + voice + references + knowledge), and returns a typed `{ ok, data | error }` envelope. Timeouts, 429s, safety blocks, empty and malformed responses all map to friendly, retryable errors, and a failed request never touches the user's draft.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the build
npm run lint     # eslint
```
