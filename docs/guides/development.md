# Development

This document is for contributors working on the app locally. It focuses on setup, runtime modes, validation points, and the workflows most likely to matter during day-to-day changes.

## Prerequisites

- Node.js with npm available locally
- Postgres available if you want to run in default mode
- A valid `DATABASE_URL` for migration commands and default runtime mode

## Initial Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Available variables:

- `DATABASE_URL`: required for default app runtime and Drizzle commands
- `LOG_LEVEL`: optional logger level
- `APP_MODE`: set to `test` for local SQLite-backed runtime

If you are running against Postgres, apply migrations before starting the app:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

## Runtime Modes

### Default mode

Use default mode when working on the real persistence path.

- active when `APP_MODE` is unset
- repository implementation: `src/lib/repositories/postgres-match-repository.ts`
- requires `DATABASE_URL`
- Drizzle schema source: `src/lib/db/schema.ts`

### Test mode

Use test mode when you want a self-contained local environment.

```bash
APP_MODE=test npm run dev
```

Behavior:

- repository implementation: `src/lib/repositories/sqlite-match-repository.ts`
- local database file: `.gstack/test-mode.sqlite`
- seed source: `src/data/diary.json`
- schema bootstrapped by `src/lib/db/test-sqlite.ts`

Test mode is useful for UI and workflow validation when a Postgres instance is not available.

## Player Context

The app shell includes a persistent identity picker. Several screens intentionally depend on the selected player:

- the dashboard only renders personal metrics when a player is selected
- match history filters to the selected player's matches
- stats render the selected player's record breakdown, while still showing the shared leaderboard when no player is selected
- the new-match form treats the selected player as the "You" side and pre-fills that roster slot

## Commands

### App lifecycle

- `npm run dev`: start the Next.js development server
- `npm run dev:test`: start the app in SQLite-backed test mode
- `npm run build`: create a production build
- `npm run start`: serve the production build

### Quality checks

- `npm run lint`: run ESLint
- `npm run test`: run Jest once
- `npm run test:watch`: run Jest in watch mode
- `npx playwright install chromium`: install the browser used by the UI suite
- `npm run test:ui`: run the Playwright smoke suite
- `npm run test:ui:headed`: run the Playwright smoke suite with a visible browser

### Database

- `npm run db:generate`: generate Drizzle migrations from schema changes
- `npm run db:migrate`: apply migrations
- `npm run db:studio`: open Drizzle Studio

## Working Areas

### App and UI

- `src/app`: App Router pages, JSON route handlers, and route-level composition
- `src/app/_components`: UI building blocks and page views

### Domain and persistence

- `src/lib/domain`: match rules and validation logic
- `src/lib/api`: shared JSON API client, transport contracts, and response helpers
- `src/lib/services`: server-side screen-data composition and JSON write coordination
- `src/lib/queries`: read-oriented accessors
- `src/lib/commands`: write-oriented accessors
- `src/lib/repositories`: persistence boundary and backend selection
- `src/lib/db`: Postgres schema and DB initialization

### Local data and migrations

- `src/data`: seed and reference data
- `drizzle`: migrations and metadata snapshots

## Validation and Business Rules

For match-entry changes, check both of these places:

- `src/lib/domain/matches.ts`: roster rules and score validity
- `src/lib/db/schema.ts`: database-level constraints

If a schema-affecting change also impacts test mode, update `src/lib/db/test-sqlite.ts` to keep local behavior aligned.

## Tests

Tests live beside the source under `src/` as `*.test.ts`.
Playwright UI smoke tests live under `tests/ui/`.

Areas with meaningful existing test coverage include:

- route handlers
- API and client boundary behavior
- validation and action error normalization
- metrics and selectors
- screen-data services
- repositories shared logic
- utilities
- mobile UI workflows via Playwright (create singles, create doubles, edit, delete, and validation messaging)

When changing behavior, prefer focused test updates near the touched module before broadening scope.
Run the UI suite in `APP_MODE=test`; it starts the app against the seeded SQLite dataset and does not require Postgres.

## Contribution Expectations

Follow the current repo conventions:

- TypeScript with strict settings
- 2-space indentation
- semicolons
- double quotes
- named exports for shared modules
- PascalCase for React components
- camelCase for helpers and functions
- Next.js route naming conventions for route files

Commit style follows Conventional Commits such as:

```text
docs(readme): rewrite onboarding flow
fix(validation): tighten singles roster rule
```

When changing schema or persistence behavior:

- include the matching Drizzle migration
- mention env or setup implications in the PR

When changing match-entry behavior:

- keep JSON API mutations aligned with the shared validation and command path
- keep the Postgres and SQLite repository behavior aligned where persistence overlaps

For UI changes, keep the established visual language and refer to [system.md](../design/system.md) instead of duplicating design rules into feature docs.
