# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

@AGENTS.md

## What this project does

PainkillerRLS is a Next.js app that generates production-ready Supabase RLS migration files from SQL schemas. The user pastes a schema (or connects to a live Supabase project), and a 4-step AI pipeline classifies tables, retrieves relevant RLS patterns from a vector knowledge base, generates policies, and validates the output. After generation, a context-aware chat panel lets users ask questions about their policies.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

Running the one-off setup scripts requires dotenv-cli to load `.env.local`:

```bash
# Generate the 8 RLS pattern docs in docs/rls-patterns/
npx dotenv-cli -e .env.local -- npx tsx scripts/generate-docs.ts

# Embed and ingest docs into Supabase pgvector
npx dotenv-cli -e .env.local -- npx tsx scripts/ingest.ts
```

## Environment variables

All required in `.env.local`:

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | LLM calls (llama-3.3-70b-versatile) |
| `HUGGINGFACE_API_KEY` | Embeddings (BAAI/bge-base-en-v1.5) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role access for vector queries and schema introspection |

## Architecture

### AI pipeline (`lib/pipeline.ts`)

The core logic is a single async generator `runPipelineGenerator(schema)` that emits SSE-style progress events. It runs four sequential steps:

1. **Classify** (`classifySchema`) — Groq identifies each table's `pattern`, `ownershipColumn`, and `sensitivity`.
2. **Retrieve** (`retrievePatterns`) — for each table classification, builds a query string, embeds it via HuggingFace, and calls the Supabase `match_rls_docs` RPC to fetch the 2 most relevant pattern docs from pgvector.
3. **Generate** (`generatePolicies`) — Groq produces a complete SQL migration file using the schema, classifications, and retrieved docs as context.
4. **Validate** (`validatePolicies`) — Groq reviews the output against RLS correctness rules (e.g. UPDATE requires both `USING` and `WITH CHECK`) and returns a corrected version if needed.

### API routes

- `POST /api/generate` — accepts `{ mode: 'paste', sql }` or `{ mode: 'connect', projectRef, serviceKey }`, streams SSE events from the pipeline. In `connect` mode it fetches the schema from the Supabase OpenAPI spec.
- `POST /api/chat` — accepts `{ messages, schema, migration }`, streams a plain-text Groq response. The system prompt includes the full schema and generated migration so the assistant can give schema-specific answers.

### Knowledge base setup

The RAG knowledge base lives in a `rls_docs` Supabase table with a `vector(768)` embedding column. The `match_rls_docs` RPC does cosine similarity search. To rebuild it:

1. Run `generate-docs.ts` to create the 8 markdown files in `docs/rls-patterns/`.
2. Run `ingest.ts` to chunk each doc by `##` heading, embed each chunk, and upsert into `rls_docs`.

The 8 patterns the knowledge base covers: basic-ownership, multi-tenant, public-read-private-write, admin-bypass, join-based, insert-only, profiles, authenticated-only.

### Frontend (`app/page.tsx`)

Single `'use client'` component. Two-column layout: left panel (40%) handles input and the generate button; right panel (60%) shows the pipeline progress, then the syntax-highlighted migration output, then the chat panel. All state is local React state — no external state library.

## Chat Memory System (in progress)

Hybrid memory for `/api/chat` combining recency window with semantic retrieval.

### Database
- Table: `chat_messages` in the Genius in Supabase project (same DB as `rls_docs`)
- Columns: `id`, `conversation_id`, `role`, `content`, `embedding (vector 768)`, `token_count`, `created_at`
- Indexes: composite `(conversation_id, created_at desc)`, IVFFlat on `embedding` with 100 lists
- RPC: `match_chat_messages(query_embedding, conversation_id_filter, match_threshold, match_count, exclude_ids)` — cosine similarity, filters by conversation, excludes recency-window IDs, skips messages under 100 chars, threshold 0.7, returns top 2

### Migration workflow
- SQL files live in `db/` and are applied manually via Supabase Dashboard SQL editor
- No Supabase CLI, no `supabase init`, no `db push`
- See `db/README.md` for the apply procedure

### Embedding model
- `BAAI/bge-base-en-v1.5` via HuggingFace (same as `rls_docs` — 768 dims)
- Embeds first 500 chars of each message only

### Architecture flow (per chat turn)
1. Load last 4 messages from DB (recency)
2. If conversation has > 10 messages: embed user query, call `match_chat_messages`, exclude the 4 recency IDs, take top 2
3. Build context: system prompt + trimmed schema (1500 chars) + trimmed migration (3000 chars) + retrieved memories + last 4 messages + new user message
4. Stream Groq response
5. After response completes: embed user message + assistant response, insert both into `chat_messages`

### Status
- [x] SQL file created in `db/001_chat_messages.sql` (Step 1 — applied and verified)
- [x] `lib/chat-memory.ts` (Step 2)
- [x] Refactor `/api/chat/route.ts` (Step 3)
- [x] Frontend `conversationId` wiring (Step 4)
- [x] Manual testing (Step 5)

## UI

### Design language
- Dark-mode only. Color palette: zinc-950 base, zinc-900 panels, zinc-800 borders.
- Accent: rose-500 (`#f43f5e`) — not red-500, not purple. Used for active states, buttons, streaming cursors, policy badges.
- Typography: Geist Sans for UI, Geist Mono for code, inputs, and labels.
- All design tokens live as CSS custom properties in `app/globals.css` under `:root`, mapped to Tailwind v4 utilities via `@theme inline`.

### UI libraries
- **Tailwind CSS v4** — CSS-based config only (`@theme` in `globals.css`). No `tailwind.config.ts`. No `tailwindcss-animate` — use `style={{ animation: '...' }}` with the keyframes already defined in `globals.css`.
- **sonner v2** — toasts. `<Toaster>` lives in `layout.tsx`. Import `toast` from `'sonner'` wherever needed.
- **lucide-react v1** — icons (ChevronDown, Send, Copy, Check).
- **react-markdown v10 + remark-gfm** — markdown rendering in the chat panel.
- **react-syntax-highlighter (Prism / oneDark)** — SQL highlighting in both the output panel and chat code blocks.

### Components
- `app/components/ChatPanel.tsx` — self-contained chat UI. Props: `{ messages, isChatLoading, chatInput, setChatInput, onSend }`. Includes: suggested-prompt chips (empty state), message bubbles (user right-aligned, assistant left with rose avatar dot), streaming cursor animation, auto-scroll with user-scroll detection, `CodeBlock` with copy button, full markdown override set (`md` object).
- `app/page.tsx` — single `'use client'` page. All pipeline and chat state lives here. Three right-panel states: idle, pipeline running, output+chat.

### Layout
- Full-width top bar (44px, `bg-zinc-900/30`) with logo left, GitHub icon right.
- Below the top bar: two-column flex layout. Left 40% = input panel (`bg-zinc-900`). Right 60% = output panel (`bg-zinc-950`).
- **Responsive breakpoint: `min-[900px]:`** — below 900px the columns stack vertically (input on top, output below).
- Right panel output state: pipeline summary bar (collapsible) → SQL output with sticky line numbers → 1px divider → `h-[320px]` chat panel.
- Scrollable containers use `.scrollbar-thin` class (NOT `*` global — scoped only to the three containers that actually scroll).

### Animations
All keyframes are defined in `globals.css`: `cursor-blink`, `step-glow`, `msg-in`, `fade-in`, `shine`, `step-bar`, `sweep`. Apply via `style={{ animation: 'name duration easing fill' }}` or via `@theme` utilities for `animate-cursor`, `animate-step-glow`, `animate-msg-in`, `animate-fade-in`, `animate-shine`, `animate-step-bar`.

### Keyboard shortcuts
- **Chat send**: `Cmd+Enter` / `Ctrl+Enter` in the chat textarea (handled in `ChatPanel.tsx`).
- The `⌘↵` hint is displayed in the textarea corner as a non-interactive label.

### Favicon
- `public/favicon.svg` — lock icon in rose-500 on zinc-950 background.
- Referenced via `metadata.icons` in `app/layout.tsx`.
