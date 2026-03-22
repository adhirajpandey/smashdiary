# Smash Diary

Smash Diary is a mobile-first badminton journal for logging matches, tracking recent results, and surfacing lightweight player metrics.

The app is built for quick local iteration: in normal mode it uses Postgres through Drizzle ORM, and in test mode it swaps to a local SQLite database seeded with dummy data.

## What It Does

- Record singles and doubles matches
- Create players during match entry
- Browse match history
- View dashboard and stats for the selected player
- Inspect a dedicated match detail screen

User-facing docs use the term "match". Some internal code still uses `game` in names and types.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Drizzle ORM
- Postgres in default mode
- SQLite in local test mode
- Jest + ts-jest

## Quick Start

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

If you want to run the app without Postgres, use test mode instead:

```bash
APP_MODE=test npm run dev
```

## Environment Variables

- `DATABASE_URL`: required in default mode and for Drizzle migration commands
- `LOG_LEVEL`: optional logger level such as `debug`, `info`, `warn`, or `error`
- `APP_MODE`: set to `test` to use the local SQLite test repository

## Runtime Modes

### Default mode

- Uses the Postgres repository
- Reads schema from `src/lib/db/schema.ts`
- Requires `DATABASE_URL`
- Stores `games.played_at` as an Asia/Kolkata wall-clock timestamp instead of a UTC-normalized instant

### Test mode

- Enabled with `APP_MODE=test`
- Uses a local SQLite file at `.gstack/test-mode.sqlite`
- Seeds data from `src/data/diary.json` on server start
- Resets seeded data when the server process is reinitialized
- Does not require `DATABASE_URL` for app runtime
- Mirrors the same Asia/Kolkata wall-clock `played_at` behavior used in Postgres

## Database Workflow

- `npm run db:generate` creates Drizzle migration files
- `npm run db:migrate` applies migrations using `DATABASE_URL`
- `npm run db:studio` opens Drizzle Studio

Schema changes should be accompanied by a matching migration in `drizzle/`.

## Testing and Linting

- `npm run lint`
- `npm run test`
- `npm run test:watch`
- `npm run build`

Tests live beside source files as `*.test.ts` under `src/`.

## Project Layout

- `src/app`: routes, server actions, and UI components
- `src/lib`: domain logic, validation, queries, repositories, DB access, metrics, and utilities
- `src/data`: local seed and reference data
- `drizzle`: SQL migrations and Drizzle metadata
- `docs`: architecture, development, data model, product walkthrough, and design notes

## Further Reading

- [docs/README.md](docs/README.md)
- [docs/guides/development.md](docs/guides/development.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)
- [docs/architecture/data-model.md](docs/architecture/data-model.md)
- [docs/product/walkthrough.md](docs/product/walkthrough.md)
- [docs/design/system.md](docs/design/system.md)
