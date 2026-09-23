# Stats And Leaderboard

This document explains how the current stats-related product surfaces work in Smash Diary. It covers what data is used, how each metric is calculated, what each UI component shows, and what the numbers represent in practical terms.

The goal here is descriptive accuracy. This is not a proposal for a future ranking system.

## Scope

This document covers the current behavior behind:

- dashboard metrics on `/`
- the player stats screen on `/stats`
- the shared format-specific leaderboard shown on dashboard and stats
- recent-match snippets and player-perspective score rendering
- the `/rankings` redirect

## Data Source And Flow

Stats are derived at read time. They are not persisted as separate database fields.

Current flow:

1. The client reads the selected player ID from browser local storage through `SelectedPlayerProvider`.
2. The client reads the selected stats format from browser local storage through `StatsFormatProvider`.
3. The dashboard and stats pages request JSON from `/api/dashboard` and `/api/stats` with that active format.
4. The service layer loads all resolved matches and all players from the active repository.
5. Selector functions in `src/lib/match-selectors.ts` first filter to the active format, then derive summaries, ratings, recent matches, and leaderboard standings.
6. UI components render those derived values.

Relevant files:

- `src/app/_components/selected-player-provider.tsx`
- `src/app/_components/stats-format-provider.tsx`
- `src/lib/services/shared.ts`
- `src/lib/match-selectors.ts`
- `src/app/_components/dashboard-view.tsx`
- `src/app/_components/stats-panel.tsx`
- `src/app/_components/leaderboard-panel.tsx`

## Player Context

Most personal stats are keyed off two pieces of client state:

- the selected player in the shell identity picker
- the selected stats format (`singles` or `doubles`)

- If no player is selected, the dashboard does not render personal metrics.
- If no player is selected, the stats screen shows an empty personal state but still renders the shared leaderboard.
- If a player is selected but has no matches in the active format, the selectors return `null` personal metrics and the UI shows a format-specific empty state instead of zeros.

The selected player is stored in local storage under `smash-diary:selected-player`.
The selected stats format is stored under `smash-diary:selected-stats-format` and defaults to `singles`.

## Match Ordering

Several stats surfaces depend on the repository match order.

Matches are sorted descending by:

1. `playedOn`
2. `slot`
3. `id`

That means the app treats the newest date as most recent, then the later time slot on the same day, then the larger match ID as the final tie-breaker.

This ordering is shared by both Postgres and SQLite repositories through `sortResolvedMatchesDescending()`.

## Core Selector Logic

Most stats behavior comes from `src/lib/match-selectors.ts`.

### `getPlayerSide(match, playerId)`

Determines whether the player appears on side `A`, side `B`, or not at all.

This is the base helper used by win/loss and perspective calculations.

### `didPlayerWin(match, playerId)`

Returns `true` when:

- the player is part of the match, and
- `match.winnerSide` matches the player's side

If the player is not part of the match, it returns `false`.

### `getPlayerPerspectiveScore(match, playerId)`

Normalizes the score into player-relative terms:

- `scoreFor`: the selected player's side score
- `scoreAgainst`: the opposing side score

If no player side can be resolved, it falls back to the stored `A` vs `B` score orientation.

### `getPlayerMatches(matches, playerId)`

Filters the full resolved match list down to only matches where the player appears on either side.

This filtered list is the base input for summary, rating, and recent-match derivation.

### `filterMatchesByFormat(matches, format)`

Reduces the match set to only `singles` or only `doubles`.

All dashboard and stats metrics are now derived from this filtered set first.

## What The Main Stats Represent

### Player Summary

`getPlayerSummary()` builds the active-format player record used on the stats screen.

It includes:

- `totalMatches`: all matches involving the player
- `format`: the active format
- `wins`: matches where the player's side won
- `losses`: `totalMatches - wins`

Important detail: these are counts of matches played in the active format, not sets, rallies, or partner/opponent-adjusted performance measures.

Hard eligibility rule:

- if the player has zero matches in the active format, no summary is returned
- the UI should not show zero-value personal metrics in that case

### Win Rate

The UI label is "Win rate", but the internal dashboard field is `winScore`.

Formula:

`winRate = wins / totalMatches`

`winScore = Number((winRate * 10).toFixed(1))`

Display behavior:

- dashboard and stats call `formatPercent(metrics.winScore)`
- `formatPercent()` multiplies the stored `winScore` by `10` and rounds it
- example: a raw win rate of `0.64` becomes `6.4`, which is shown as `64%`

So the rendered percentage is a normal win percentage, but the stored view-model field is scaled to a `0.0` to `10.0` range first.

This is always computed within the active format only.

### Player Rating

The current player rating is a lightweight heuristic, not an Elo, Glicko, or ladder-based ranking.

Formula:

`wins = number of player wins`

`pointDiff = sum(scoreFor - scoreAgainst across player matches)`

`averageDiff = pointDiff / totalMatches`, or `0` when there are no matches

`winRate = wins / totalMatches`, or `0` when there are no matches

`rating = min(10, winRate * 10 + max(averageDiff, 0) * 0.5)`

The final number is rounded to one decimal place.

What this means:

- the rating is capped at `10.0`
- strong win percentage is the main driver
- positive average point margin increases the rating
- negative average point margin does not reduce the rating below the win-rate component because `averageDiff` is clamped with `max(averageDiff, 0)`
- a player with no matches in the active format is not eligible for a rating on the personal stats surfaces or leaderboard

Practical interpretation:

- it is best understood as a bounded confidence-style form score based on results and average margin
- it is not a cross-era or schedule-strength-adjusted ranking
- it does not account for opponent rating, teammate strength, recency weighting, or match format weighting

### Average Point Differential

The stats page also shows average point differential as supporting evidence for the headline metrics.

Formula:

`pointDiff = sum(scoreFor - scoreAgainst across player matches)`

`averagePointDiff = pointDiff / totalMatches`

The final number is rounded to one decimal place and keeps its sign.

Practical interpretation:

- positive values mean the player usually wins by more points than they concede
- negative values mean the player is typically outscored on average
- unlike the player rating formula, this number is not clamped to ignore negative margins
- it is computed only from matches in the active format

### Activity Counts

The dashboard's activity section is now format-specific.

It shows:

- total matches in the active format
- win/loss record in the active format

### Recent Matches

Dashboard recent matches come from:

- the selected player's filtered match list for the active format
- sliced to the first `4` items after repository sorting

So "Recent Matches" means:

- only matches involving the selected player
- only matches in the active format
- newest first
- at most four matches

The recent match cards are display-oriented view models built by `buildMatchFeedItems()`.

## Leaderboard Logic

The leaderboard is shared across dashboard and stats, but it is now format-specific.

It is generated by `getLeaderboard(matches, players, format)` and returns up to the top `5` rows for the active format.

### Backend ownership

All leaderboard ranking logic is backend-owned.

The frontend does not:

- sort leaderboard rows
- normalize the visible score
- decide who is eligible
- calculate Elo or rating values

The service layer returns a screen-ready leaderboard block that already includes:

- title
- score label
- score help text
- minimum match threshold
- ordered entries

### Singles leaderboard

Current behavior:

1. Filter to singles matches.
2. Walk matches in chronological order.
3. Initialize each player at `1500` Elo.
4. Update Elo after each singles result using win/loss only and a fixed `K = 32`.
5. Exclude players with fewer than `10` singles matches.
6. Sort by raw Elo descending.
7. Return up to the top `5`.

Each row shows:

- one player name
- wins and total matches
- a backend-computed display score

### Doubles leaderboard

Current behavior:

1. Filter to doubles matches.
2. Build team identities from exact unordered two-player pairs.
3. Walk doubles matches in chronological order.
4. Initialize each pair at `1500` Elo.
5. Update pair Elo after each result using win/loss only and a fixed `K = 32`.
6. Exclude pairs with fewer than `5` matches together.
7. Sort by raw pair Elo descending.
8. Return up to the top `5`.

Each row shows:

- both player names
- wins and total matches together
- a backend-computed display score

### Leaderboard score

The visible leaderboard score is not the raw Elo number.

The backend normalizes Elo into a `0.0` to `10.0` display score using:

- `1500 Elo = 5.0`
- every `100` Elo points = `1.0` display point
- clamp to `0.0-10.0`
- round to one decimal place

Important implications:

- the leaderboard is global within the active format, not filtered to the selected player
- ranking is based on backend Elo, not the personal player-rating tile formula
- doubles rows represent exact pairs, not averages of two players' separate doubles ratings
- singles players below `10` matches and doubles pairs below `5` matches together are not included

## Screen And Component Behavior

### Dashboard (`/`)

The dashboard fetches `DashboardData` and passes it to `DashboardView`.

If a selected player exists and has at least one match in the active format, the dashboard shows:

- the singles/doubles selector
- quick link to add a match
- win rate tile for the active format
- player rating tile for the active format
- format-specific activity totals
- up to four recent matches in player perspective for the active format
- leaderboard top five for the active format

If there is no selected player:

- the page still renders the selector and leaderboard
- personal dashboard metrics are not rendered

If a player is selected but has no matches in the active format:

- the page shows an empty personal state for that format
- the leaderboard still renders for the active format

### Stats (`/stats`)

The stats page fetches `StatsData` and passes it to `StatsPanel`.

With a selected player and at least one match in the active format, it shows:

- the singles/doubles selector
- title using the player's name and active format
- subtitle showing total matches in the active format
- one `Performance` surface for the active format
- win rate as the dominant metric
- player rating as the secondary headline metric
- average point differential as supporting evidence in the right rail
- a `Record` label above the visual wins/losses split
- raw wins and losses counts anchored to the split, without a separate white record value
- the same format-specific leaderboard

Without a selected player, it shows:

- the selector
- heading and prompt to choose a player
- no personal performance metrics
- the same format-specific leaderboard

If a player is selected but has no matches in the active format:

- the selector
- a format-specific empty personal state
- no personal stat tiles
- the same format-specific leaderboard

### Leaderboard Panel

`LeaderboardPanel` is purely presentational.

It renders:

- backend-provided title
- rank position based on current array index
- one player name for singles rows, or both player names for doubles rows
- wins and total matches from the backend row data
- backend-provided display score to one decimal place
- a compact info button that reveals backend-provided score help text

It does not calculate standings on its own.

### Match Feed Perspective

`buildMatchFeedItems()` uses `getMatchPerspective()` to normalize match cards.

With a selected player:

- the player's side is shown as `ownSideNames`
- the opposing side is shown as `opposingSideNames`
- result is `Victory` or `Defeat`
- score is shown from the selected player's perspective

Without a selected player:

- own side defaults to stored side A
- opposing side defaults to stored side B
- result is `null`
- score is shown as side A score vs side B score

This is why the same base match can look different depending on whether a player context is active.

## What The Numbers Do Not Represent

The current implementation does not represent:

- opponent-adjusted skill
- partner-adjusted doubles impact
- streaks or momentum
- head-to-head records
- recency-weighted form
- percentile-based leaderboard placement
- official badminton ranking logic

Any contributor reading the UI should treat the current stats system as lightweight diary analytics, not a formal ranking engine.

## Runtime Mode Notes

The stats logic is shared across runtime modes.

- default mode reads from the Postgres-backed repository
- test mode reads from the SQLite-backed repository
- both repositories resolve the same `ResolvedGame` shape
- both repositories use the same sorting helpers before selector logic runs

That means metric behavior should stay aligned across Postgres and SQLite as long as both repositories continue to return the same resolved match data.

## Current Product Boundaries

`/rankings` is not a separate feature today. It redirects directly to `/stats`.

The app currently has:

- one personal stats view keyed by the selected player and active format
- one shared leaderboard derived from all eligible players or teams in the active format

It does not currently have:

- a dedicated rankings page with distinct rules
- configurable leaderboard windows
- seasonal or date-range filtering
- persisted rating history

## Contributor Notes

If stats behavior changes, the main code paths to review are:

- `src/lib/match-selectors.ts`
- `src/lib/services/shared.ts`
- `src/lib/types.ts`
- `src/lib/view-models.ts`
- `src/app/_components/dashboard-view.tsx`
- `src/app/_components/stats-panel.tsx`
- `src/app/_components/leaderboard-panel.tsx`

If the intended meaning of rating or leaderboard changes, update this document and `docs/product/walkthrough.md` together.
