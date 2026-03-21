# Smash Diary

Mobile-first badminton diary for recording standalone 21-point games.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- File-backed JSON persistence with a Supabase-ready client stub

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current behavior

- Tracks singles and doubles as standalone game records
- Supports create, edit, delete, recent history, and basic stats
- Uses `src/data/diary.json` for local persistence during development
- Includes `.env.example` for future Supabase wiring

## Design direction

Visual system is based on `docs/DESIGN.md` and implemented with:

- `Space Grotesk` for display hierarchy
- `Lexend` for operational UI copy
- dark tonal surfaces, neon lime primary actions, electric blue accents
- no hard border-based card grids
