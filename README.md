# Smash Diary

Smash Diary is a mobile-first badminton journal for logging matches, tracking recent results, and surfacing lightweight player metrics.

The app uses Postgres through Drizzle ORM. Local development and tests run against a Postgres container loaded with a copy of the production data.

## What It Does

- Record singles and doubles matches
- Create players during match entry
- Switch player context from the persistent identity picker in the app shell
- Browse player-focused match history
- View dashboard and stats for the selected player while keeping a global leaderboard view
- Inspect a dedicated match detail screen
- Edit or delete a saved match from its detail screen

User-facing docs use the term "match". Some internal code still uses `game` in names and types.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Drizzle ORM
- Postgres
- Docker Compose for the local database
- Jest + ts-jest
- Playwright

## Quick Start

You need Docker with Compose.

```bash
npm install
cp .env.example .env
npm run db:reset
npm run dev
```

Open `http://localhost:3000`.

`npm run db:reset` starts the local Postgres container, applies the migrations, and loads `db/seed.sql`. The `DATABASE_URL` in `.env.example` already points at that container.

## Environment Variables

- `DATABASE_URL`: required by the app and the Drizzle commands
- `LOG_LEVEL`: optional logger level such as `debug`, `info`, `warn`, or `error`

The app shell always includes a player picker. Dashboard, match history, and player-specific stats content depend on that selected player context.
Reads and writes now flow through internal JSON route handlers under `src/app/api`.
Match save, update, delete, and validation-summary feedback are surfaced through in-app toast notifications.
Persisted player identity is deduplicated case-insensitively by normalized `name`, without a separate stored lookup column.

## Local Database

- `docker-compose.yml` runs Postgres 17 on `127.0.0.1:5433`. It is for development and tests only.
- `db/seed.sql` is a data-only copy of production. It holds real player names and match history.
- `npm run db:reset` applies the migrations, then replaces every row with the seed. Local changes are lost.
- Playwright and `npm run test:db` run the same reset before they start.
- The schema lives in `src/lib/db/schema.ts`. `games.played_on` is a date-only value, and `slot` holds the hour.

## Database Workflow

- `npm run db:generate` creates Drizzle migration files
- `npm run db:migrate` applies migrations using `DATABASE_URL`
- `npm run db:studio` opens Drizzle Studio
- `npm run db:reset` rebuilds the local database from the migrations and `db/seed.sql`

Schema changes should be accompanied by a matching migration in `drizzle/`.

## Testing and Linting

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:watch`
- `npm run test:db`
- `npx playwright install chromium`
- `npm run test:ui`
- `npm run test:ui:headed`
- `npm run build`

Tests live beside source files as `*.test.ts` under `src/`.
Postgres repository tests are `*.db.test.ts` files. `npm run test:db` runs them against the local database. `npm run test` skips them, so it runs without Docker.
UI smoke tests live under `tests/ui`. They reset the local database, start the app against it, and create the matches and players they check.
Playwright uses an isolated local server on `127.0.0.1:3101` by default so it does not attach to an existing app already running on port `3000`.

## Project Layout

- `src/app`: routes, JSON route handlers, thin pages, and UI components
- `src/lib`: domain logic, validation, queries, repositories, DB access, metrics, and utilities
- `drizzle`: SQL migrations and Drizzle metadata
- `db`: seed data for the local database
- `scripts`: local database tooling
- `tests`: Playwright UI tests and DB test setup
- `docs`: architecture, development, data model, product walkthrough, and design notes

## Further Reading

- [docs/README.md](docs/README.md)
- [docs/guides/development.md](docs/guides/development.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)
- [docs/architecture/data-model.md](docs/architecture/data-model.md)
- [docs/product/walkthrough.md](docs/product/walkthrough.md)
- [docs/design/system.md](docs/design/system.md)
