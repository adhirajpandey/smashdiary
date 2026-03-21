# Smash Diary

Mobile-first badminton diary for recording standalone 21-point games.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Postgres persistence via Drizzle ORM

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
   - Optional: set `LOG_LEVEL` to `debug`, `info`, `warn`, or `error`. Default is `info`.
2. Run migrations:

```bash
npm run db:migrate
```

3. (Optional) Import existing local JSON diary data once:

```bash
npm run db:import:diary
```

## Current behavior

- Tracks singles and doubles as standalone game records
- Supports create, edit, delete, recent history, and basic stats
- Persists data in Postgres via `DATABASE_URL`
- `src/data/diary.json` can be imported with `npm run db:import:diary`

## Design direction

Visual system is based on `docs/DESIGN.md` and implemented with:

- `Space Grotesk` for display hierarchy
- `Lexend` for operational UI copy
- dark tonal surfaces, neon lime primary actions, electric blue accents
- no hard border-based card grids
