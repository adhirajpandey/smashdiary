# Data Model

Smash Diary stores badminton matches using three core tables: players, games, and game participants. In user-facing docs we call them matches, but the current schema and some TypeScript types still use the term `game`.

## Tables and Relationships

The Postgres source of truth is `src/lib/db/schema.ts`.

### `players`

Represents a distinct player identity.

Fields of note:

- `id`: numeric primary key
- `name`: display name
- `name_key`: normalized lookup key used to prevent duplicates
- `created_at`, `updated_at`: timestamps

Constraint:

- unique index on `name_key`

### `games`

Represents one completed badminton match.

Fields of note:

- `id`: numeric primary key
- `played_at`: match timestamp stored as an Asia/Kolkata wall-clock value
- `format`: `singles` or `doubles`
- `side_a_score`, `side_b_score`: final scores
- `winner_side`: `A` or `B`
- `created_at`, `updated_at`: timestamps

Key constraints:

- format must be `singles` or `doubles`
- winner side must be `A` or `B`
- scores must stay between 0 and 30
- ties are not allowed
- winner side must match the higher score
- the final score must satisfy badminton finish rules

### `game_participants`

Connects players to a match and records side membership.

Fields of note:

- `game_id`: foreign key to `games`
- `player_id`: foreign key to `players`
- `side`: `A` or `B`
- `slot`: `1` or `2`
- `created_at`: timestamp

Key constraints:

- each side uses slots `1` or `2`
- a slot can only be used once per side per match
- the same player cannot appear twice in the same match

## Match Composition

Participants are stored separately from the match row.

- side A players are stored as `game_participants` rows with `side = 'A'`
- side B players are stored as `game_participants` rows with `side = 'B'`
- `slot` preserves player order within a side

Expected roster size by match format:

- singles: one player per side
- doubles: two players per side

That rule is enforced in the application validation layer and also protected in the SQLite test-mode schema through triggers. The Postgres repository writes participants based on already-validated input.

## Score Rules

The scoring model assumes only completed matches are stored.

Accepted finish conditions:

- `21-x` where the losing side has at most 19
- extended results from `22-20` through `29-27`
- `30-29` as the maximum-score finish

Rejected conditions include:

- ties
- scores where neither side reaches 21
- overtime results without a 2-point lead before 30
- any result above 30

## Persisted vs Resolved Shapes

`played_at` is intentionally stored as the match's local wall-clock time in Asia/Kolkata. The app does not normalize it to UTC for persistence, which keeps the entered date and time stable across server and client rendering.

The repository layer exposes two conceptual data shapes:

### Persisted shapes

These are the raw storage-oriented records reflected in `src/lib/types.ts`.

- `Player`
- `Game`
- `GameParticipant`

### Resolved shape

The UI primarily consumes `ResolvedGame`, which combines:

- the base `Game` fields
- `sideAPlayers: Player[]`
- `sideBPlayers: Player[]`

Repositories build this resolved shape by joining match rows, participant rows, and player rows, then grouping them by match ID.

## Derived Metrics

Dashboard and stats views build metrics from `ResolvedGame[]` plus `Player[]`.

Current derived types include:

- `PlayerStatsSummary`
- `PlayerDashboardMetrics`
- `PlayerStanding`

These are computed in selector functions, not stored in the database.

## Migration Expectations

When changing persistence behavior:

- update `src/lib/db/schema.ts`
- generate or add the matching migration under `drizzle/`
- keep repository reads and writes compatible with the new schema
- update test-mode SQLite schema in `src/lib/db/test-sqlite.ts` if the change affects tables or constraints
- update documentation if setup, runtime behavior, or data semantics change

Do not treat the SQLite schema as disposable documentation-only code. It is a functional persistence backend for local test mode and should evolve with the Postgres model where behavior overlaps.
