# Repository Guidelines

## Project Structure & Module Organization
This repo is a small workspace with separate apps:
- `frontend/`: Vite + React + TypeScript UI (`src/pages`, `src/components`, `src/stores`, `src/lib`).
- `backend/`: Express + TypeScript API and MySQL access (`server/index.ts`, `server/db.ts`).
- `agents/`: extraction prompt/rules files grouped by domain (`activities`, `billing`, `students`).
- `Data_Extraction/`: legacy/duplicate workspace snapshot; treat as reference unless a task explicitly targets it.

Runtime data is written under `data/` by the backend.

## Build, Test, and Development Commands
From repo root:
- `npm run install:all`: install frontend and backend dependencies.
- `npm run dev`: start frontend dev server (`frontend`).
- `npm run build`: type-check + production build frontend.
- `npm run server`: run backend via `tsx server/index.ts`.
- `npm run extract`: configured, but currently points to missing `backend/server/extract-cli.ts`.

Useful app-local commands:
- `cd frontend && npm run preview`: serve built frontend locally.

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode enabled in backend and frontend `tsconfig.json`).
- Indentation: 2 spaces; keep semicolon and import style consistent with surrounding file.
- Naming: React components/pages use `PascalCase` files (for example `WorkflowBilling.tsx`); low-level UI primitives use kebab-case filenames in `components/ui`.
- Use path alias `@/*` in frontend for `src/*` imports.
- No ESLint/Prettier config is committed currently; keep diffs minimal and style-local.

## Testing Guidelines
No automated test framework is currently configured in `package.json` files. For now:
- validate frontend changes with `npm run build` (type-check + bundle),
- validate backend changes by running `npm run server` and exercising key API routes.
- when adding tests, place them near source as `*.test.ts`/`*.test.tsx`.

## Commit & Pull Request Guidelines
Recent commits are short, plain-text messages (for example `Added MYSQL DATABASE`, `rollback`). Prefer clearer one-line imperative messages, ideally scoped:
- `frontend: add provider preview filters`
- `backend: normalize billing upsert logic`

For PRs, include:
- what changed and why,
- affected areas (`frontend`, `backend`, `agents`),
- manual verification steps,
- UI screenshots for frontend changes,
- linked issue/task when available.
