# Development

This document is for contributors working on the app locally. It focuses on setup, the local database, validation points, and the workflows most likely to matter during day-to-day changes.

## Prerequisites

- Node.js with npm
- Docker with Compose, for the local Postgres database

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

- `DATABASE_URL`: required by the app and the Drizzle commands. The example value points at the local Docker Compose database.
- `LOG_LEVEL`: optional logger level

Start the local database, apply the migrations, and load the seed data:

```bash
npm run db:reset
```

Start the development server:

```bash
npm run dev
```

## Local Database

The app has one persistence path: Postgres through `src/lib/repositories/postgres-match-repository.ts`, with the schema in `src/lib/db/schema.ts`.

For local work, `docker-compose.yml` runs Postgres 17 on `127.0.0.1:5433`. Production runs Postgres 17 as well.

`npm run db:reset` does three things:

1. Starts the container if it is not running.
2. Applies the Drizzle migrations from `drizzle/`.
3. Truncates `players` and `games`, then loads `db/seed.sql`.

The reset always targets the local container. It ignores `DATABASE_URL`, so it cannot touch production even if your `.env` points there.

`db/seed.sql` is a data-only copy of production. Tests and your own experiments write into the same local database, and the next reset discards those rows. To refresh the seed from a newer production backup, restore the backup into the local container and regenerate the file with `pg_dump --data-only --inserts --column-inserts --schema=public`. Keep the `TRUNCATE` header and remove the `\restrict` and `\unrestrict` lines.

## Player Context

The app shell includes a persistent identity picker. Several screens intentionally depend on the selected player:

- the dashboard only renders personal metrics when a player is selected
- match history filters to the selected player's matches
- stats render the selected player's record breakdown, while still showing the shared leaderboard when no player is selected
- the new-match form treats the selected player as the "You" side and pre-fills that roster slot

## Commands

### App lifecycle

- `npm run dev`: start the Next.js development server
- `npm run build`: create a production build
- `npm run start`: serve the production build

### Quality checks

- `npm run lint`: run ESLint
- `npm run typecheck`: type-check the app and tests with `tsc --noEmit`
- `npm run test`: run Jest once
- `npm run test:watch`: run Jest in watch mode
- `npm run test:db`: reset the local database and run the Postgres repository tests
- `npx playwright install chromium`: install the browser used by the UI suite
- `npm run test:ui`: run the Playwright smoke suite
- `npm run test:ui:headed`: run the Playwright smoke suite with a visible browser

### Database

- `npm run db:generate`: generate Drizzle migrations from schema changes
- `npm run db:migrate`: apply migrations
- `npm run db:studio`: open Drizzle Studio
- `npm run db:reset`: rebuild the local database from the migrations and `db/seed.sql`

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
- `src/lib/repositories`: persistence boundary
- `src/lib/db`: Postgres schema and DB initialization

### Local data and migrations

- `db/seed.sql`: local seed data
- `drizzle`: migrations and metadata snapshots

## Validation and Business Rules

For match-entry changes, check both of these places:

- `src/lib/domain/matches.ts`: roster rules and score validity
- `src/lib/db/schema.ts`: database-level constraints
- player identity is deduplicated case-insensitively from normalized `name`; there is no separate persisted lookup column

## Tests

Unit tests live beside the source under `src/` as `*.test.ts`. They mock the repository and run without a database.
Postgres repository tests live beside the source as `*.db.test.ts` and run with `npm run test:db`.
Playwright UI smoke tests live under `tests/ui/`.

Areas with meaningful existing test coverage include:

- route handlers
- API and client boundary behavior
- validation and action error normalization
- metrics and selectors
- screen-data services
- repositories shared logic
- the Postgres repository, including one test that pins a known bug in concurrent player creation
- utilities
- mobile UI workflows via Playwright (create singles, create doubles, edit, delete, and validation messaging)

When changing behavior, prefer focused test updates near the touched module before broadening scope.
The UI suite resets the local database before it runs, then starts the app against it. Specs create the matches and players they check through `POST /api/matches`. The only seeded row they rely on is the player `Adhiraj`.
By default Playwright starts its own isolated server on `127.0.0.1:3101` and does not reuse an existing process, which prevents accidental attachment to a server already running on `3000`.
If you intentionally want Playwright to reuse an already-running test server on that same port, set `PLAYWRIGHT_REUSE_SERVER=1`.

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
- keep mutation error mapping aligned with the current contract: invalid JSON and validation errors return `400`, missing update targets return `404`, and unexpected save failures return `500`

For UI changes, keep the established visual language and refer to [system.md](../design/system.md) instead of duplicating design rules into feature docs.
