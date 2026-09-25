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
- Clone, edit, or delete a saved match from its detail screen or match card

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

## Local Database

`docker-compose.yml` runs Postgres 17 on `127.0.0.1:5433` for development and tests. `db/seed.sql` is a data-only copy of production, and `npm run db:reset` reloads it, discarding local changes. See [docs/guides/development.md](docs/guides/development.md) for environment variables, commands, and tests.

## Project Layout

- `src/app`: routes, JSON route handlers, thin pages, and UI components
- `src/lib`: domain logic, validation, queries, repositories, DB access, metrics, and utilities
- `drizzle`: SQL migrations and Drizzle metadata
- `db`: seed data for the local database
- `scripts`: local database tooling
- `tests`: Playwright UI tests and DB test setup
- `docs`: architecture, development, deployment, data model, product walkthrough, and design notes

## Further Reading

- [docs/README.md](docs/README.md)
- [docs/guides/development.md](docs/guides/development.md)
- [docs/guides/deployment.md](docs/guides/deployment.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)
- [docs/architecture/data-model.md](docs/architecture/data-model.md)
- [docs/product/walkthrough.md](docs/product/walkthrough.md)
- [docs/design/system.md](docs/design/system.md)
