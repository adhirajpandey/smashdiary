# Product Walkthrough

This document describes the product surface that is currently implemented. It is intentionally narrow: it should help contributors understand the app behavior without turning planned ideas into documented features.

## Main Screens

### Dashboard (`/`)

The dashboard is the main landing screen.

It currently shows:

- quick access to add a new match
- player-specific dashboard metrics such as win rate and player rating
- counts for singles and doubles activity
- recent matches for the selected player
- a top-performer summary

If no player is selected in context, the dashboard does not render metrics content. The player context is controlled from the identity picker anchored in the app shell.

### Match History (`/matches`)

The history screen shows match history for the selected player.

- matches are shown newest first
- the page title adapts to the current player selection
- an empty state prompts for player selection before the feed is shown
- the feed links into match detail pages

### Match Form (`/matches/new`)

The new-match screen is the main write surface.

Current supported behavior:

- log a completed singles or doubles match
- treat the currently selected player as the fixed "You" slot
- enter final scores
- assign players to side A and side B
- use existing player suggestions through a two-step picker that opens the list first and only starts typing after tapping the search area
- create new players implicitly by typing names during submission
- prefill the date field with the current local date and default the slot dropdown to `8 PM` for new entries
- only accept completed matches dated today or earlier
- adjust scores with either number inputs or score stepper buttons
- route to the saved match detail screen after a successful save

The underlying JSON match API also supports update behavior when an ID is supplied, even though the primary documented workflow is new match entry.

### Match Detail (`/matches/[id]`)

The detail screen shows a single resolved match.

It currently displays:

- match format
- played date and slot
- final score
- winning side
- side A roster
- side B roster
- actions to edit or delete the saved match

Edit routes to `/matches/[id]/edit` and pre-fills the form with the saved match. When the currently selected player is part of that saved roster, the form keeps that player in the fixed `You` slot; otherwise the editor falls back to neutral `Side A` / `Side B` labels. Delete uses an inline confirmation state on the detail screen. Save, update, delete, and validation-summary outcomes are surfaced through in-app toast notifications. If another tab or device already deleted the match, Delete reports it as already deleted and returns to the match list, and Update returns to the match list without saving.

Invalid or missing IDs resolve to the app's not-found behavior.

### Stats (`/stats`)

The stats screen renders player-focused summary information derived from stored matches and players. It is read-only, depends on the currently selected player context for the personal performance view, and still shows the shared leaderboard when no player is selected. The personal section uses a compact performance surface with headline metrics, average point differential, and a wins/losses split under a `Record` label for the active format.

Detailed stats, rating, leaderboard, and format-segmentation behavior is documented in `stats-and-leaderboard.md`.

### Rankings Redirect (`/rankings`)

`/rankings` does not currently render a separate rankings experience. It immediately redirects to `/stats`.

## Supported Workflows

The product currently supports these main workflows:

- selecting a player context from the shell identity picker
- logging completed singles matches
- logging completed doubles matches
- creating new players as part of match entry
- viewing recent history for the selected player
- reviewing dashboard and stats-derived player metrics
- opening a match detail page for a specific saved match
- editing a saved match from its detail screen
- deleting a saved match from its detail screen

## Current Product Boundaries

These capabilities are not documented as supported because they are not clearly implemented as standalone product features:

- live scoring or in-progress match tracking
- player management screens outside match entry flows
- authentication or multi-user accounts
- remote sync beyond the configured database backend
- a separate rankings page with distinct behavior from stats
- public APIs or external integrations

The docs should stay aligned with these boundaries until the codebase adds explicit support for more features.
