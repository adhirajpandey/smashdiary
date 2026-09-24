# Codebase Review Revalidation

Reviewed on 2026-09-24 against branch `chore/remove-sqlite-test-mode` (PR #9), which removes the SQLite test mode.

This review replaces the 2026-03-28 review. Each finding from that review was rechecked against the code, and findings that no longer hold were dropped. It also records problems found while removing SQLite.

Nothing in this document is fixed yet unless its status says so.

## Findings From The March Review

| ID | Finding | Status | Evidence |
| --- | --- | --- | --- |
| A1 | Dashboard, matches, and stats load every match and player, then filter in memory | Valid, not urgent | Against the 277 production matches on a Raspberry Pi dev server, each read API answered in 60 to 230 ms. `/api/matches` returns about 32 KB with no pagination. At about 1.5 new matches a day, this stays small for years. |
| A2 | Postgres and SQLite write logic is duplicated | Fixed by PR #9 | The SQLite repository no longer exists. |
| A3 | `/api/games` compatibility aliases add surface area | Valid, wider than reported | No code in this repo or in Saarthi, Shed, Garden, or Greenhouse calls `/api/games`. `/api/dashboard/[playerId]` and `/api/stats/[playerId]` are also unused, because the client calls the query-parameter routes. |
| Q1 | `fetchJson()` assumes every response body is JSON | Valid, lower impact | A non-JSON failure throws a `SyntaxError`. The form then shows the generic "Save failed" toast and screens show the system-fault view, so the message is vague but not wrong. |
| Q2 | `handleSubmit` has no reentry guard | Valid, low risk | Only the disabled submit button blocks a second submit. The gap lasts from the first submit until React re-renders. |
| Q3 | Route handlers discard errors | Valid, wider than reported | None of the 9 route files logs a caught error. `saveMatchFromJson` also swallows persistence errors. A failed save in production leaves no log entry. |
| Q4 | The selected player does not sync across tabs | Valid, low | `selected-player-provider.tsx` has no `storage` event listener. |
| D1 | `AGENTS.md` describes the removed `src/app/actions.ts` write path | Fixed by PR #9 | |

### Test And Edge-Case Gaps From The March Review

| Gap | Status | Evidence |
| --- | --- | --- |
| GET route error branches untested | Valid | The dashboard, players, and stats route tests each have one happy-path test. |
| Delete failure toast untested | Valid | No test covers the "Delete failed" branch in `match-actions-menu.tsx`. |
| Non-JSON response handling untested | Valid | Same root cause as Q1. |
| Concurrent edit and delete of the same match | Valid | Updating a deleted match returns `404`, but no test covers it. N1 affects the message the user sees. |
| Player name maximum length | Valid, minor | The API rejects names over 32 characters, but the player inputs have no `maxLength`, so users only learn the limit after submitting. |
| Old stored player ID after the data changes | No longer valid | `identity-picker.tsx` clears a stored ID that no longer matches a player. |
| No deployment documentation | Valid | The repo has no deployment config or guide. `next.config.ts` sets `output: "standalone"`, and it is not documented why. |

### Dropped Items

- `getTopPerformers()` as a slow path: the function no longer exists.
- Thin service modules, missing ASCII diagrams, and repeated `try/catch` blocks in routes were opinions rather than defects. The logging fix for Q3 removes the repeated blocks anyway.

## New Findings

| ID | Finding | Evidence |
| --- | --- | --- |
| N1 | Server and not-found errors show a validation title | `game-form.tsx` shows "Check the highlighted values" for every `ApiClientError`, including `500` save failures and `404` on update. |
| N2 | Malformed dates reach the database layer | `playedOn` is only checked as a non-empty string. `"garbage"` passes validation, then `normalizePlayedOnValue` throws and the API returns `500` instead of `400`. `"March 5 2026"` is parsed in server local time and read back in UTC, so it is stored as `2026-03-04` on a server east of UTC. |
| N3 | A save fails when another request creates the same new player at the same time | `upsertPlayers` catches the unique-index violation inside the transaction. Postgres has already aborted the transaction, so the follow-up select fails with `25P02`. The DB test "known bug: fails when another transaction commits the same new player mid-save" reproduces it on every run. |
| N4 | Test files have type errors that nothing checks | `tsc --noEmit` reports 10 errors in `src/lib/config/env.test.ts` and `src/lib/repositories/shared.test.ts`. Jest passes because ts-jest does not fail on them, and no script runs `tsc`. |
| N5 | Unused code | Nothing imports `src/lib/store.ts`, `src/lib/supabase.ts`, `src/lib/fonts.ts`, `src/lib/config/index.ts`, `game-list.tsx`, or `page-hero.tsx`. `src/lib/diary-metrics.ts` only re-exports `match-selectors.ts` under old names. `isMatchSlot`, `ensureArray`, `fromInputDateValue`, and the `DiaryStore` type have no callers outside their tests. `formatMatchDate` has an overload whose `timeZone` argument is ignored. `docs/clone-match-date-spec.md` describes a shipped fix, and `src/data/real.csv` is an early export that nothing reads. |

## Plan

### Next Wave

Three pull requests, each with tests for the behavior it changes:

1. Cleanup: remove the N5 code and files, the unused routes from A3, and the duplicate selector exports. Fix N4.
2. Server fixes: make `upsertPlayers` handle the conflict without aborting the transaction and flip the N3 test to expect success. Validate `playedOn` as a real `YYYY-MM-DD` date (N2). Add a shared route error helper that logs the caught error (Q3), and cover the GET error branches.
3. Client fixes: turn non-JSON responses into `ApiClientError` (Q1), give server and not-found errors their own toast titles (N1), add a submit guard (Q2), and set `maxLength={32}` on player inputs.

### Later, As GitHub Issues

- A1: filter by player in the repository query and paginate match history.
- Q4: sync the selected player across tabs.
- Tests for the delete failure toast and for concurrent edit and delete.
- Deployment documentation, once the current hosting setup and the need for `output: "standalone"` are confirmed.
