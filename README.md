# Smash Diary

Smash Diary is a mobile-first badminton journal for logging singles and doubles matches, tracking recent results, and surfacing lightweight player metrics.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Postgres with Drizzle ORM
- React Query for client-side data fetching
- Jest + ts-jest for unit tests
- Playwright for end-to-end tests

## Features

- Record singles and doubles matches
- Create players on demand from match entry
- Browse recent match history
- View dashboard, stats, and matches by selected player
- Persist the selected player identity between visits
- Open match detail pages and edit or delete saved matches
- Support legacy route redirects from `/games/*` and `/rankings`
- Persist games and players in Postgres

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a local env file and set your database connection:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL`

Optional:
- `LOG_LEVEL=debug|info|warn|error` (defaults to `info`)
- `APP_MODE=test` (uses local SQLite test mode with dummy data)

3. Run database migrations:

```bash
npm run db:migrate
```

4. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Test Mode (SQLite Dummy Data)

Set `APP_MODE=test` to run the app against a local SQLite file seeded from `src/data/diary.json`:

```bash
APP_MODE=test npm run dev
```

In this mode:
- `DATABASE_URL` is not required
- data resets to the dummy seed on each server start
- create, edit, delete, and identity flows still work for end-to-end testing

## Scripts

- `npm run dev` starts the local Next.js server
- `npm run build` creates a production build
- `npm run start` serves the production build
- `npm run lint` runs ESLint
- `npm run test` runs Jest once
- `npm run test:watch` runs Jest in watch mode
- `npm run test:e2e` runs Playwright end-to-end tests
- `npm run test:e2e:headed` runs Playwright in headed mode
- `npm run test:e2e:ui` opens the Playwright UI runner
- `npm run db:generate` creates Drizzle migration files
- `npm run db:migrate` applies migrations
- `npm run db:studio` opens Drizzle Studio

## Project Layout

- `src/app` routes, route handlers, and UI components
- `src/lib` shared client logic, validation, metrics, and utilities
- `src/lib/server` service, repository, and API error helpers
- `src/data` local seed and reference data
- `drizzle` SQL migrations and metadata
- `docs` design references and notes
- `tests/e2e` Playwright coverage for identity, dashboard, and match flows

## Design Notes

The visual system follows [docs/DESIGN.md](docs/DESIGN.md): `Space Grotesk` for display typography, `Lexend` for UI copy, dark tonal surfaces, neon lime primary actions, and electric blue accents. Avoid rigid card grids and hard divider lines when extending the UI.

## Testing

Tests live beside source files as `*.test.ts` under `src/`, and end-to-end coverage lives under `tests/e2e`. Run `npm run test` before submitting changes, especially for validation, metrics, and service logic, and use `npm run test:e2e` to verify the app flow in `APP_MODE=test`.
