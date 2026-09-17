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
cp .env.example .env.local   # add your Gemini key
npm run dev
```

Without `GEMINI_API_KEY` the app runs, but generation shows a clear "Ideako isn't connected yet" state instead of failing silently.

**Model selection.** Gemini model IDs are retired regularly (`gemini-2.0-flash` was shut down on 1 June 2026). Ideako therefore asks the API which models your key can use and picks the newest stable Flash model automatically, caching the answer for an hour and re-checking if a request ever 404s. Set `GEMINI_MODEL` only if you want to pin a specific ID.

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
    ai/                     contracts (shared), gemini (server), prompts (server),
                            route helpers + rate limit (server), client (browser)
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
