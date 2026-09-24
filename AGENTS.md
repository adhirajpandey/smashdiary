# Repository Guidelines (Agents)

## Purpose
This file is the single source of truth for coding agents working in this repo. It prioritizes accuracy, minimal changes, and alignment with the current codebase.

## Project Overview
Smash Diary is a mobile-first badminton journal for recording completed singles and doubles matches, creating players during match entry, tracking recent history, and surfacing lightweight player metrics. The app runs on Next.js with Postgres through Drizzle ORM. Development and tests use a local Postgres container loaded with a copy of production data.

## Rules (Must Follow)
- Start by reviewing relevant docs in `docs/` and `README.md` before making changes.
- Read the files you will touch before planning or editing.
- Keep changes minimal and focused on the request.
- Follow existing code patterns, naming conventions, and route structure.
- Keep route files thin; prefer domain, query, command, and repository layers for non-trivial logic.
- Do not document planned behavior as if it already exists.
- Add or update focused tests for behavior changes when feasible.
- Do not change app code just to satisfy tests.
- Update `README.md` or `docs/` when behavior, setup, the local database, or contributor workflow changes.
- If anything important is unclear, ask the user.

## Current Project Structure
- `README.md`: project overview, quick start, local database, and docs entry links.
- `AGENTS.md`: this file.
- `src/`: application source.
  - `app/`: Next.js App Router pages, JSON route handlers under `api/`, boundaries, and UI components under `_components/`.
  - `lib/`: shared logic including `commands/`, `db/`, `domain/`, `queries/`, `repositories/`, validation, metrics, and utilities.
  - `data/`: an early CSV export of matches that the app does not read.
- `drizzle/`: SQL migrations and Drizzle metadata.
- `db/seed.sql`: data-only copy of production used to seed the local database.
- `scripts/db-reset.mjs`: resets the local database.
- `docker-compose.yml`: local Postgres 17 for development and tests.
- `tests/ui/`: Playwright UI tests. `tests/db/`: setup for the Postgres repository tests.
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
- Type check: `npm run typecheck`
- Test: `npm run test`
- Test watch mode: `npm run test:watch`
- Postgres repository tests: `npm run test:db` (needs Docker)
- UI tests: `npm run test:ui` (needs Docker and Playwright Chromium)

### Database
- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- Open Drizzle Studio: `npm run db:studio`
- Reset the local database from migrations and `db/seed.sql`: `npm run db:reset`

## Architecture
- Refer to `docs/architecture/overview.md` for the app shape, database, and read/write flow.
- Refer to `docs/architecture/data-model.md` for schema, relationships, resolved match data, and migration expectations.
- Refer to `docs/guides/development.md` for setup, commands, and contributor workflow.
- Refer to `docs/product/walkthrough.md` for current screens, workflows, and explicit product boundaries.
- Refer to `docs/design/system.md` for UI and visual guidance.

## Runtime and Persistence Rules (Important)
- **Database**: Postgres only, through `src/lib/repositories/postgres-match-repository.ts`. The app requires `DATABASE_URL`.
- **Local database**: `npm run db:reset` targets the Docker Compose container on `127.0.0.1:5433` and ignores `DATABASE_URL`. Never point tests or resets at production.
- **Write path**: forms send JSON to the route handlers under `src/app/api/matches`, which call `saveMatchFromJson` in `src/lib/services/save-match.ts`, then `saveMatch` and the repository.
- **Read path**: client pages fetch JSON from route handlers, which call screen-data services. The services use repository-backed query functions and selector utilities.

## Coding and Testing Rules
- Use strict TypeScript patterns already present in the repo.
- Follow existing style: 2-space indentation, semicolons, double quotes, and named exports for shared modules.
- Use PascalCase for React components and camelCase for helpers and selectors.
- Name tests after the target module and colocate them as `*.test.ts` under `src/`. Tests that need the database use `*.db.test.ts`.
- UI tests create the matches and players they check. The only seeded row they may rely on is the player `Adhiraj`.
- Prioritize focused tests for validation, route handlers, repositories, metrics, and utilities when those areas change.

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
- If a change affects the local database, schema, or contributor workflow, update docs in the same change.
- If a change touches the schema, add the matching migration and check that `npm run db:reset` still applies it and loads `db/seed.sql`.
