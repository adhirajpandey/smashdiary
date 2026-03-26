# Repository Guidelines

## Project Structure & Module Organization
`src/app` contains Next.js App Router pages, server actions, and UI components under `_components`. Shared domain logic lives in `src/lib` (`db`, validation, metrics, store, utils), with Jest tests colocated as `*.test.ts`. Static seed data lives in `src/data`, database migrations and metadata in `drizzle/`, and design references in `docs/`.

## Build, Test, and Development Commands
Use `npm run dev` to start the local app at `http://localhost:3000`. Run `npm run build` for a production build and `npm run start` to serve it. Use `npm run lint` for ESLint checks and `npm run test` or `npm run test:watch` for Jest. Database workflows use Drizzle: `npm run db:generate`, `npm run db:migrate`, and `npm run db:studio`.

## Coding Style & Naming Conventions
This repo uses strict TypeScript with the `@/*` path alias mapped to `src/*`. Follow existing style: 2-space indentation, semicolons, double quotes, and named exports for shared modules. Keep React components in PascalCase (`DashboardView`), helpers in camelCase (`deriveWinnerSide`), and route files in Next.js conventions (`page.tsx`, `layout.tsx`, `error.tsx`). Prefer colocating small tests beside the module they cover.

## Testing Guidelines
Jest runs in a Node environment via `ts-jest` and scans `src/**/*.test.ts`. Name tests after the target module, for example `src/lib/validation.test.ts`. Add or update focused tests for any changes to validation, metrics, or store logic before broadening coverage. There is no enforced coverage gate in config, so contributors should keep tests meaningful and targeted.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits such as `fix(validation): tighten match rules` and `feat(data): migrate to postgres`. Use `type(scope): imperative subject`, keep the subject concise, and scope by feature or file when useful. PRs should explain behavior changes, list any schema or env updates, link the relevant issue when available, and include screenshots for UI changes.

## Security & Configuration Tips
Do not commit `.env` values. Copy `.env.example` to a local env file and set `DATABASE_URL`; `LOG_LEVEL` is optional. When changing schema or persistence behavior, include the matching Drizzle migration and note any local setup steps in the PR.
