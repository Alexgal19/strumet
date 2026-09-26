# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router application written in TypeScript. Routes and API handlers live in `src/app/`; shared UI lives in `src/components/` (`ui/` contains shadcn components). Put reusable hooks in `src/hooks/`, application state in `src/context/`, and Firebase, date, and data helpers in `src/lib/`. Automated flows live in `src/ai/`. Static assets belong in `public/`; database access rules are in `database.rules.json`. Unit tests are in `src/__tests__/`, and browser tests are in `e2e/`.

## Build, Test, and Development Commands

- `npm install` installs dependencies; use Node.js 22 or newer.
- `npm run dev` starts the local server at `http://localhost:3000`.
- `npm run build` runs the mobile UI check, then creates a production build; `npm run start` serves that build.
- `npm run lint` checks `src/` with ESLint. `npm run verify` runs the mobile check, lint, and TypeScript type checking.
- `npm test -- --run` runs Vitest once. `npx playwright test` runs browser tests against a separately started local server.

## Coding Style & Naming Conventions

Follow nearby TypeScript and TSX files: two-space indentation, semicolons, and the existing quote style. Use the `@/` alias for imports from `src/`. Name React components in PascalCase, hooks `use-*.ts(x)`, and route files according to Next.js conventions (`page.tsx`, `route.ts`). Prefer Tailwind utility classes and existing `src/components/ui/` primitives. ESLint and Prettier are configured as development dependencies; run `npm run lint` before submitting changes.

## Testing Guidelines

Vitest uses jsdom and Testing Library. Name unit tests `*.test.ts(x)` or `*.spec.ts(x)` under `src/`; add focused tests for changed logic. Playwright specs belong in `e2e/` and use `*.spec.ts`. No minimum coverage threshold is configured. For changed screens, run `npm run check:mobile` and inspect both desktop and mobile layouts.

## Commit & Pull Request Guidelines

Recent commits use Conventional Commit messages such as `fix(mobile): resolve chart overlap` and `feat(mobile): add UI validator`. Use a clear type and optional scope (`feat`, `fix`, `docs`, `test`, `refactor`, or `chore`). In pull requests, summarize the change, link the relevant issue when one exists, list verification commands, and include screenshots for visible UI changes.

## Configuration & Security

Keep credentials in local environment files and out of commits. Review `database.rules.json` when changing Firebase Realtime Database paths. Import `src/lib/firebase-admin.ts` only from server-side code.
