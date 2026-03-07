# alche:me — Project Rules

## Project Overview
- **Stack**: Next.js 15 (App Router) + Google ADK (Python/FastAPI) + Firebase + Cloud Run
- **Language**: TypeScript (frontend), Python (agent backend)
- **Package Manager**: npm
- **Test**: Vitest + jsdom (`npx vitest run`)
- **Type Check**: `npx tsc --noEmit`
- **Python Test**: `cd agent && python -m pytest tests/ -v`

## UI Terminology (2026-02-17~)
- User-facing label for inventory/vanity: **My Cosme**
- User-facing label for suggestions/buying: **Next Cosme**
- DB values, variable names, API routes remain unchanged (`inventory`, `suggestions`, etc.)

## Directory Structure (`docs/`)
- `docs/architecture/` — System design, PRD, specs, prompts catalog
- `docs/plans/` — Implementation plans, backlog, audits, rollout plans
- `docs/guides/` — Setup guides, deploy guides, test guides
- `docs/reference/` — ADK docs, test scenarios, external references
- `docs/research/` — UI/UX リサーチレポート, 競合分析
- `docs/handoff/` — Session handoff notes
- `docs/presentation/` — Demo storyboard, articles
