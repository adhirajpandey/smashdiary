# Data Model

Smash Diary stores badminton matches using two core tables: `players` and `games`. In user-facing docs we call them matches, but the current schema and some TypeScript types still use the term `game`.

## Tables and Relationships

The Postgres source of truth is `src/lib/db/schema.ts`.

### `players`

Represents a distinct player identity.

Fields of note:

- `id`: numeric primary key
- `name`: display name
- `created_at`, `updated_at`: timestamps

Constraint:

- unique case-insensitive index on `lower(name)`

### `games`

Represents one completed badminton match.

Fields of note:

- `id`: numeric primary key
- `played_on`: match date stored as a date-only value
- `slot`: hourly slot label from `12 AM` through `11 PM`
- `format`: `singles` or `doubles`
- `side_a_player_1_id`, `side_b_player_1_id`: required player references for the first slot on each side
- `side_a_player_2_id`, `side_b_player_2_id`: optional second-slot player references used only for doubles
- `side_a_score`, `side_b_score`: final scores
- `winner_side`: `A` or `B`
- `created_at`, `updated_at`: timestamps

Key constraints:

- format must be `singles` or `doubles`
- singles rows must leave both second-slot player columns empty
- doubles rows must populate both second-slot player columns
- a player cannot appear more than once in the four occupied roster slots
- winner side must be `A` or `B`
- scores must stay between 0 and 30
- ties are not allowed
- winner side must match the higher score
- the final score must satisfy badminton finish rules

## Match Composition

Participants are stored directly on the match row.

- side A slot 1 is stored in `games.side_a_player_1_id`
- side A slot 2 is stored in `games.side_a_player_2_id`
- side B slot 1 is stored in `games.side_b_player_1_id`
- side B slot 2 is stored in `games.side_b_player_2_id`
- slot columns preserve player order within each side

Expected roster size by match format:

- singles: one player per side
- doubles: two players per side

That rule is enforced in the application validation layer and also protected by Postgres table checks. The repository writes slot IDs based on already-validated input.

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

`played_on` is intentionally stored as a date-only value, and `slot` carries the selected hour label separately. The app does not persist a full wall-clock timestamp for match entry anymore, which keeps the entered date and selected slot stable across server and client rendering.

The repository layer exposes two conceptual data shapes:

### Persisted shapes

These are the raw storage-oriented records reflected in `src/lib/types.ts`.

- `Player`
- `Game`

### Resolved shape

The UI primarily consumes `ResolvedGame`, which combines:

- the base `Game` fields
- `sideAPlayers: Player[]`
- `sideBPlayers: Player[]`

The repository builds this resolved shape by joining the four game slot columns back to `players`, then assembling side arrays in slot order.

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
- if you write a migration by hand, also add its `drizzle/meta/NNNN_snapshot.json`, then check that `npm run db:generate` reports no schema changes
- keep repository reads and writes compatible with the new schema
- update documentation if setup, runtime behavior, or data semantics change
- run `npm run db:reset` to check that the migrations apply to a fresh database and that `db/seed.sql` still loads
