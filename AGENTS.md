# Repository Guidelines (Agents)

## Purpose
This file is the single source of truth for coding agents working in this repo. It prioritizes accuracy, minimal changes, and alignment with the current codebase.

## Project Overview
Smash Diary is a mobile-first badminton journal for recording completed singles and doubles matches, creating players during match entry, tracking recent history, and surfacing lightweight player metrics. The app runs on Next.js and can switch between a Postgres-backed default mode and a local SQLite-backed test mode.

## Rules (Must Follow)
- Start by reviewing relevant docs in `docs/` and `README.md` before making changes.
- Read the files you will touch before planning or editing.
- Keep changes minimal and focused on the request.
- Follow existing code patterns, naming conventions, and route structure.
- Keep route files thin; prefer domain, query, command, and repository layers for non-trivial logic.
- Do not document planned behavior as if it already exists.
- When changing schema or persistence behavior, keep the Postgres and SQLite test-mode paths aligned where behavior overlaps.
- Add or update focused tests for behavior changes when feasible.
- Do not change app code just to satisfy tests.
- Update `README.md` or `docs/` when behavior, setup, runtime modes, or contributor workflow changes.
- If anything important is unclear, ask the user.

## Current Project Structure
- `README.md`: project overview, quick start, runtime modes, and docs entry links.
- `AGENTS.md`: this file.
- `src/`: application source.
  - `app/`: Next.js App Router pages, server actions, boundaries, and UI components under `_components/`.
  - `lib/`: shared logic including `commands/`, `db/`, `domain/`, `queries/`, `repositories/`, validation, metrics, and utilities.
  - `data/`: local seed and reference data.
- `drizzle/`: SQL migrations and Drizzle metadata.
- `docs/`: living documentation set.
  - `README.md`: docs index.
  - `architecture/`: system overview and data model docs.
  - `guides/`: development workflow and setup docs.
  - `product/`: implemented product behavior docs.
  - `design/`: visual system guidance and screenshots.

## Build, Test, and Development Commands
### App
- Install: `npm install`
- Run (dev): `npm run dev`
- Build: `npm run build`
- Start production build: `npm run start`

### Quality
- Lint: `npm run lint`
- Test: `npm run test`
- Test watch mode: `npm run test:watch`

### Database
- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Open Drizzle Studio: `npm run db:studio`

## Architecture
- Refer to `docs/architecture/overview.md` for the app shape, runtime modes, and read/write flow.
- Refer to `docs/architecture/data-model.md` for schema, relationships, resolved match data, and migration expectations.
- Refer to `docs/guides/development.md` for setup, commands, and contributor workflow.
- Refer to `docs/product/walkthrough.md` for current screens, workflows, and explicit product boundaries.
- Refer to `docs/design/system.md` for UI and visual guidance.

## Runtime and Persistence Rules (Important)
- **Default mode**: uses Postgres through the repository selected by `src/lib/repositories/index.ts`; requires `DATABASE_URL`.
- **Test mode**: enabled with `APP_MODE=test`; uses the local SQLite-backed repository and seed data from `src/data/diary.json`.
- **Write path**: form submission flows through `src/app/actions.ts`, domain validation, `saveMatch`, and the active repository.
- **Read path**: route pages load page-data queries, which delegate to repository-backed query functions and selector utilities.

## Coding and Testing Rules
- Use strict TypeScript patterns already present in the repo.
- Follow existing style: 2-space indentation, semicolons, double quotes, and named exports for shared modules.
- Use PascalCase for React components and camelCase for helpers and selectors.
- Name tests after the target module and colocate them as `*.test.ts` under `src/`.
- Prioritize focused tests for validation, server actions, repositories, metrics, and utilities when those areas change.

## Documentation Rules
- Prefer `docs/*` for new or updated technical documentation beyond the root onboarding flow.
- Keep docs accurate to the current codebase and remove outdated claims.
- Use `README.md` for quick start and repo entrypoint updates.
- Use `docs/architecture/` for architecture and persistence documentation.
- Use `docs/guides/` for setup, local workflow, and command guidance.
- Use `docs/product/` for implemented screen and workflow behavior.
- Use `docs/design/` for design system guidance and reference screenshots.

## When in Doubt
- Ask before making assumptions about product behavior.
- If a change affects runtime modes, schema, or contributor workflow, update docs in the same change.
- If a change touches persistence, verify whether both the Drizzle schema and SQLite test-mode schema need to be updated.
