# Architecture

Smash Diary is a Next.js App Router application with a thin server layer and a repository-backed data access boundary. The codebase is organized so that route files stay small, domain rules are centralized, and persistence can switch between Postgres and SQLite without changing the UI layer.

## App Shape

- `src/app` contains App Router pages, layouts, loading/error boundaries, and server actions
- Route pages fetch data on the server and render React components with hydrated client-side interactions where needed
- Writes go through server actions, not client-side direct database calls

Current route surfaces:

- `/`: dashboard view
- `/matches`: match history
- `/matches/new`: new match form
- shared shell controls: mobile header, bottom navigation, and persistent identity picker
- `/matches/[id]`: match detail
- `/stats`: player stats
- `/rankings`: redirects to `/stats`

## Layer Boundaries

### UI and route layer

`src/app` owns page composition and user-facing components.

- Route files call query helpers from `src/lib/queries/page-data.ts`
- UI components such as dashboard, history, stats, forms, and shell controls live under `src/app/_components`
- The server action in `src/app/actions.ts` handles form submission for create and update flows

### Query layer

`src/lib/queries` provides read-oriented functions.

- `page-data.ts` groups route-specific read needs
- `matches.ts` and `players.ts` delegate to the selected repository
- Query functions return already-resolved match data for UI consumption

### Command layer

`src/lib/commands/save-match.ts` is the write entrypoint used by the server action.

- The command itself stays thin
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

1. A route page calls a page-data query helper.
2. The query helper calls repository-backed query functions.
3. The active repository returns players or resolved matches.
4. Selector utilities derive player-centric metrics for the UI.
5. React components render the resulting view.

Examples:

- The dashboard page loads matches and players, then uses selector functions such as `getDashboardMetrics()` and `getTopPerformers()`. Selected-player state from the shell decides whether personal dashboard content renders.
- The match history page loads matches and players, then filters matches for the selected player. Without a selected player, the route shows an empty state instead of a mixed global feed.
- The match detail page loads a single resolved match and renders a read-only score and side breakdown.

## Write Flow

The normal write path is:

1. The form posts to `upsertGameAction` in `src/app/actions.ts`. The selected player from shell context is treated as the fixed "You" side in the form UI.
2. The action parses form data and validates it with `gameFormSchema`.
3. The action derives `winnerSide`.
4. The action calls the `saveMatch()` command.
5. The command delegates to the active repository.
6. The repository upserts players, writes the match, and writes participants in a transaction.
7. The action revalidates affected routes and redirects back to the dashboard with `savedGameId`.

The server action intentionally keeps orchestration in one place while leaving persistence and business rules outside the route layer.

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
