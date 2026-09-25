# Architecture

Smash Diary is a Next.js App Router application with a thin server layer and a repository-backed data access boundary. Route files stay small, domain rules live in one place, and all persistence goes through a single Postgres repository.

## App Shape

- `src/app` contains App Router pages, layouts, loading/error boundaries, JSON route handlers, and client render components
- Route pages stay thin and mainly mount client-side containers that fetch screen data from internal JSON endpoints
- Writes go through JSON route handlers backed by the shared command and repository layers

Current route surfaces:

- `/`: dashboard view
- `/matches`: match history
- `/matches/new`: new match form
- `/matches/[id]`: match detail
- `/matches/[id]/edit`: edit form for an existing match
- `/stats`: player stats
- `/rankings`: redirects to `/stats`

Every page renders inside a shared shell with a mobile header, bottom navigation, and the persistent identity picker.

## Layer Boundaries

### UI and route layer

`src/app` owns page composition and user-facing components.

- Route files stay thin and mostly render page shells for dashboard, history, stats, and form flows
- Client containers and presentational components such as dashboard, history, stats, forms, and shell controls live under `src/app/_components`
- Route handlers under `src/app/api` expose the app's internal JSON endpoints:
  - `GET /api/dashboard`, `GET /api/stats`, and `GET /api/players` for screen data
  - `GET /api/matches` for match history, and `POST /api/matches` to create a match
  - `GET`, `PUT`, and `DELETE /api/matches/[id]` to read, update, and delete one match

### Query layer

`src/lib/queries` provides read-oriented functions.

- `matches.ts` and `players.ts` delegate to the selected repository
- Query functions return already-resolved match data for server-side composition
- `src/lib/services` assembles screen-specific JSON view models for dashboard, history, stats, and match detail

### Command layer

`src/lib/commands/save-match.ts` is the core write entrypoint used by the JSON match APIs.

- `saveMatch()` stays thin
- `saveMatchFromJson()` handles JSON payload validation before delegating to the command
- The command delegates persistence to the repository

### Repository layer

`src/lib/repositories` provides the persistence boundary.

- `postgres-match-repository.ts` is the only implementation
- `getMatchRepository()` returns it. Command and route tests mock this function to run without a database
- Shared transformation logic lives in `src/lib/repositories/shared.ts`

### Domain and validation layer

Business rules live in `src/lib/domain/matches.ts` and are re-exported through `src/lib/validation.ts`.

This layer is responsible for:

- determining players-per-side for singles vs doubles
- deriving the winning side from scores
- validating final-score rules
- validating roster size and duplicate-player rules

### Database layer

- `src/lib/db/schema.ts` defines the Postgres schema with Drizzle
- `src/lib/db/index.ts` initializes the Postgres Drizzle client

## Read Flow

The normal read path is:

1. A client page container fetches JSON from an internal route handler.
2. The route handler calls a screen-data service.
3. The service calls repository-backed query functions.
4. The repository returns players or resolved matches.
5. The service derives dashboard, history, stats, or detail view data and returns JSON.
6. React components render the resulting view.

Examples:

- The dashboard route fetches screen-ready metrics, leaderboard data, and recent matches. Selected-player state from the shell decides which personalized JSON view model is requested.
- The match history route fetches player-filtered history from the matches API. Without a selected player, the route shows an empty state instead of a mixed global feed.
- The match detail route fetches a single resolved match from the match-detail API and renders a read-only score and side breakdown.

## Write Flow

The normal write path is:

1. The client form submits JSON to `POST /api/matches` for create and `PUT /api/matches/[id]` for edit. The match actions menu on the detail page and on match cards calls `DELETE /api/matches/[id]`. Saved-match-backed forms personalize the selected player into the fixed "You" side when that player is part of the saved roster; otherwise the form falls back to neutral `Side A` / `Side B` labels.
2. The route handler parses the JSON body and passes it to `saveMatchFromJson()`.
3. The service validates the payload with `gameFormSchema` and derives `winnerSide`.
4. The service calls the `saveMatch()` command.
5. The command delegates to the repository.
6. The repository upserts players, resolves the four roster slots, and writes the match in a transaction.
7. Delete requests flow through a matching service and command path before the repository removes the match.
8. The client invalidates affected queries, shows an in-app toast notification, and navigates to the destination screen when appropriate.

Mutation handlers return `400` for malformed or schema-invalid payloads, `404` when an update or delete targets a missing match, and `500` for unexpected persistence failures. The client treats a `404` on delete as already deleted, and a `404` on update sends the user back to the match list.

This keeps route handlers thin while moving dashboard, history, and stats derivation into the server-side service layer before JSON is returned.

## Database

- The app always uses Postgres and requires `DATABASE_URL`
- The schema lives in `src/lib/db/schema.ts`, with migrations in `drizzle/`
- Development and tests use a local Postgres 17 container from `docker-compose.yml`, loaded from `db/seed.sql` by `npm run db:reset`

## Domain Entities

The core domain types live in `src/lib/types.ts`.

- `Player`: persisted player record
- `Game`: persisted match record; internal naming still uses `game`
- `ResolvedGame`: a UI-facing match shape with `sideAPlayers` and `sideBPlayers` attached
- `PlayerStatsSummary`, `PlayerDashboardMetrics`, `PlayerStanding`: derived metrics used by dashboard and stats views

## Rule Enforcement

Rules are enforced in more than one place by design:

- Form and domain validation reject invalid match input before persistence
- Postgres schema constraints enforce score validity and core invariants at the database level

That duplication is intentional. It keeps invalid input out early while still protecting stored data if an invalid write path bypasses the UI.
