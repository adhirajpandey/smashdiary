# Deployment

Smash Diary runs on Vercel at `smashdiary.online`, with its database on Supabase. This guide covers how the app reaches production and how to apply a migration to the production database without breaking it.

## Hosting

- **Vercel project**: linked to this repository through the Vercel GitHub integration.
- **Production**: every push to `main` builds and deploys to `smashdiary.online`. Vercel runs `npm run build` with its default Next.js settings. The repository has no `vercel.json`.
- **Function region**: the same region as the database, set in the Vercel project settings rather than in the repository.
- **Preview deployments**: Vercel also builds each pull request. Previews sit behind Vercel Authentication and are not used for testing.

## Environment Variables

Production sets one variable in Vercel:

- `DATABASE_URL`: the Supabase transaction pooler URL, port `6543`. The Postgres client runs with `prepare: false`, which the transaction pooler requires.

`LOG_LEVEL` is not set, so the app logs at `info`.

## Database

Production runs Postgres 17 on Supabase. A daily dump of the database is kept outside this repository.

The app does not run migrations. A push to `main` deploys code only, so a migration must reach production before the code that depends on it.

## Apply a Migration

Drizzle records applied migrations in `drizzle.__drizzle_migrations`. `npm run db:migrate` applies every migration in `drizzle/meta/_journal.json` whose `when` value is later than the newest `created_at` in that table. It runs them in one transaction. Do not run migration SQL by hand, because the table then no longer matches the database.

1. Keep `.env` pointed at the local container, as in `.env.example`. Do not save the production URL in `.env`, because `npm run dev`, `db:studio`, and `db:migrate` all read it.
2. Change `src/lib/db/schema.ts`, run `npm run db:generate`, and commit the migration with its snapshot.
3. Write the migration so the code that is already deployed keeps working after it runs. For example, add a nullable column first, and drop the old one in a later change.
4. Check the migration against the local database:

   ```bash
   npm run db:reset
   npm run test:db
   npm run test:ui
   ```

5. Check that a database backup from the last day exists.
6. In the Supabase SQL editor, compare the production history with `drizzle/meta/_journal.json`:

   ```sql
   SELECT id, created_at FROM drizzle.__drizzle_migrations ORDER BY id;
   ```

   The newest `created_at` must equal the `when` of the last migration already in production. If it does not, stop and repair the table before you continue.

7. Apply the migration with the Supabase session pooler URL, port `5432`. Set the URL for this one command only.

   Bash:

   ```bash
   DATABASE_URL='<session pooler URL>' npm run db:migrate
   ```

   PowerShell:

   ```powershell
   $env:DATABASE_URL = '<session pooler URL>'; npm run db:migrate; Remove-Item Env:DATABASE_URL
   ```

8. Run the query from step 6 again. It returns one more row, with the new migration's `when`.
9. Merge the pull request. After Vercel deploys, open `smashdiary.online` and check that the changed screens load.

## Roll Back

- **Code**: in the Vercel dashboard, promote an earlier production deployment.
- **Data**: restore the latest database backup. Drizzle has no down migrations, so undo a schema change with a new migration.
