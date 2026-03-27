# Architecture

Smash Diary is a Next.js App Router application with a thin server layer and a repository-backed data access boundary. The codebase is organized so that route files stay small, domain rules are centralized, and persistence can switch between Postgres and SQLite without changing the UI layer.

## App Shape

- `src/app` contains App Router pages, layouts, loading/error boundaries, JSON route handlers, and client render components
- Route pages stay thin and mainly mount client-side containers that fetch screen data from internal JSON endpoints
- Writes go through JSON route handlers backed by the shared command and repository layers

Current route surfaces:

- `/`: dashboard view
- `/matches`: match history
- `/matches/new`: new match form
- `/matches/[id]/edit`: edit form for an existing match
- shared shell controls: mobile header, bottom navigation, and persistent identity picker
- `/matches/[id]`: match detail
- `/stats`: player stats
- `/rankings`: redirects to `/stats`

## Layer Boundaries

### UI and route layer

`src/app` owns page composition and user-facing components.

- Route files stay thin and mostly render page shells for dashboard, history, stats, and form flows
- Client containers and presentational components such as dashboard, history, stats, forms, and shell controls live under `src/app/_components`
- Route handlers under `src/app/api` expose the app's internal JSON read and write endpoints (`/api/matches` with `/api/games` aliases for compatibility)

### Query layer

`src/lib/queries` provides read-oriented functions.

- `matches.ts` and `players.ts` delegate to the selected repository
- Query functions return already-resolved match data for server-side composition
- `src/lib/services` assembles screen-specific JSON view models for dashboard, history, stats, and match detail

### Command layer

`src/lib/commands/save-match.ts` is the core write entrypoint used by the JSON match APIs.

- `saveMatch()` stays thin
- `saveMatchFromJson()` handles JSON payload validation before delegating to the command
- Persistence decisions are delegated to the active repository

### Repository layer

`src/lib/repositories` provides the persistence boundary.

- `getMatchRepository()` chooses the implementation based on runtime mode
- `postgres-match-repository.ts` handles default runtime persistence
- `sqlite-match-repository.ts` handles local test-mode persistence
- Shared transformation logic lives in `src/lib/repositories/shared.ts`

This repository pattern is the main seam that allows the app to run against Postgres in normal development and SQLite in seeded test mode without changing route or UI code.

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
- `src/lib/db/test-sqlite.ts` initializes the test SQLite database and seeds it from local JSON data

## Read Flow

The normal read path is:

1. A client page container fetches JSON from an internal route handler.
2. The route handler calls a screen-data service.
3. The service calls repository-backed query functions.
4. The active repository returns players or resolved matches.
5. The service derives dashboard, history, stats, or detail view data and returns JSON.
6. React components render the resulting view.

Examples:

- The dashboard route fetches screen-ready metrics, leaderboard data, and recent matches. Selected-player state from the shell decides which personalized JSON view model is requested.
- The match history route fetches player-filtered history from the matches API. Without a selected player, the route shows an empty state instead of a mixed global feed.
- The match detail route fetches a single resolved match from the match-detail API and renders a read-only score and side breakdown.

## Write Flow

The normal write path is:

1. The client form submits JSON to `POST /api/matches` (or `POST /api/games`) for create and `PUT /api/matches/[id]` (or `PUT /api/games/[id]`) for edit. Match detail actions can also call `DELETE /api/matches/[id]` or `DELETE /api/games/[id]`. The selected player from shell context is treated as the fixed "You" side in the form UI.
2. The route handler parses the JSON body and passes it to `saveMatchFromJson()`.
3. The service validates the payload with `gameFormSchema` and derives `winnerSide`.
4. The service calls the `saveMatch()` command.
5. The command delegates to the active repository.
6. The repository upserts players, writes the match, and writes participants in a transaction.
7. Delete requests flow through a matching service and command path before the repository removes participants and the match in a transaction.
8. The client invalidates affected queries, shows an in-app toast notification, and navigates to the destination screen when appropriate.

This keeps route handlers thin while moving dashboard, history, and stats derivation into the server-side service layer before JSON is returned.

## Runtime Modes

### Default mode

- Selected when `APP_MODE` is unset or not equal to `test`
- Uses `postgres-match-repository`
- Requires `DATABASE_URL`
- Uses Drizzle schema and migrations in `drizzle/`

### Test mode

- Selected when `APP_MODE=test`
- Uses `sqlite-match-repository`
- Stores data in `.gstack/test-mode.sqlite`
- Creates schema locally and reseeds from `src/data/diary.json`

This mode is intended for local product exploration and end-to-end testing without a running Postgres instance.

## Domain Entities

The core domain types live in `src/lib/types.ts`.

- `Player`: persisted player record
- `Game`: persisted match record; internal naming still uses `game`
- `GameParticipant`: join record between a match and a player, including side and slot
- `ResolvedGame`: a UI-facing match shape with `sideAPlayers` and `sideBPlayers` attached
- `PlayerStatsSummary`, `PlayerDashboardMetrics`, `PlayerStanding`: derived metrics used by dashboard and stats views

## Rule Enforcement

Rules are enforced in more than one place by design:

- Form and domain validation reject invalid match input before persistence
- Postgres schema constraints enforce score validity and core invariants at the database level
- SQLite test mode recreates equivalent constraints and trigger checks locally

That duplication is intentional. It keeps invalid input out early while still protecting stored data if an invalid write path bypasses the UI.
