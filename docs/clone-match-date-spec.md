# Spec: Clone Match Date Preservation

## Objective
When a user clones an existing match from `/matches/new?cloneFrom=<id>`, the new match form should use the source match date instead of today's date. This keeps repeated entry for older sessions accurate without requiring manual date correction.

## Tech Stack
Next.js 16 App Router, React 19, TypeScript, Jest, Playwright.

## Commands
- Lint: `npm run lint`
- Unit test: `npm run test -- src/lib/clone-match.test.ts`
- UI test: `npm run test:ui -- tests/ui/clone-match.spec.ts`
- Build: `npm run build`

## Project Structure
- `src/lib/clone-match.ts`: transforms a resolved match into clone form seed state.
- `src/app/_components/game-form.tsx`: initializes the match form state from edit or clone seeds.
- `src/lib/clone-match.test.ts`: focused regression tests for clone seed behavior.
- `tests/ui/clone-match.spec.ts`: browser-level clone workflow coverage.

## Code Style
```ts
export function buildCloneMatchSeed(match: ResolvedGame, selectedPlayerId: number | null): CloneMatchSeed {
  const seed = buildGameFormSeed(match, selectedPlayerId);

  return {
    format: seed.format,
    playedOn: seed.playedOn,
    sideAPlayers: seed.sideAPlayers,
    sideBPlayers: seed.sideBPlayers,
    mode: seed.mode,
  };
}
```

## Testing Strategy
Use a focused Jest regression test for clone seed state. Keep the existing UI clone coverage intact and add UI assertions only if the unit boundary is insufficient.

## Boundaries
- Always: Preserve existing clone behavior for format, player order, personalized mode, and reset scores.
- Ask first: Copying source match slot or source match scores into cloned entries.
- Never: Change edit form behavior or persistence schema for this bug fix.

## Success Criteria
- Clone seed includes the source match `playedOn` date.
- `GameForm` initializes `playedOn` from `cloneSeed` when present.
- Existing clone seed tests pass.
