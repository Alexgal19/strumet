# Codebase Structure

**Analysis Date:** 2026-05-20

## Directory Layout

```
[project-root]/
├── src/                # Application source code
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable UI components
│   ├── context/        # Global state management
│   ├── lib/            # Utilities and Firebase integration
│   ├── hooks/          # Custom React hooks
│   ├── __tests__/      # Unit tests
├── e2e/                # End-to-end tests
├── tests/              # Additional test files
├── public/             # Static assets
├── .planning/          # Codebase analysis and plans
├── docs/               # Documentation
├── scripts/            # Utility scripts
```

## Directory Purposes

**src/app:**
- Purpose: Defines application routes and layouts
- Contains: Page components, layouts
- Key files: `layout.tsx`, `global-error.tsx`

**src/components:**
- Purpose: Reusable UI components
- Contains: Functional components, TailwindCSS styling
- Key files: `app-shell.tsx`, `app-bottom-nav.tsx`

**src/context:**
- Purpose: Centralized state management
- Contains: Context API, Firebase listeners
- Key files: `app-context.tsx`

**src/lib:**
- Purpose: Utilities and Firebase integration
- Contains: Firebase initialization, helper functions
- Key files: `firebase.ts`, `firebase-admin.ts`

**src/hooks:**
- Purpose: Custom React hooks
- Contains: Hook implementations
- Key files: `use-toast.ts`, `use-mobile.tsx`

**src/__tests__:**
- Purpose: Unit tests
- Contains: Test files
- Key files: `use-debounced-value.test.ts`, `date.test.ts`

**e2e:**
- Purpose: End-to-end tests
- Contains: Playwright test files
- Key files: `example.spec.ts`, `employee-management.spec.ts`

**tests:**
- Purpose: Additional test files
- Contains: Test utilities
- Key files: `main.e2e.tsx`

**public:**
- Purpose: Static assets
- Contains: Images, fonts, etc.

**.planning:**
- Purpose: Codebase analysis and plans
- Contains: Markdown files for planning

**docs:**
- Purpose: Documentation
- Contains: Project documentation
- Key files: `blueprint.md`, `design-system-v2-quick-start.md`

**scripts:**
- Purpose: Utility scripts
- Contains: Scripts for database seeding, etc.
- Key files: `seed-database.ts`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout
- `src/app/global-error.tsx`: Error boundary

**Configuration:**
- `next.config.ts`: Next.js configuration
- `tailwind.config.ts`: TailwindCSS configuration
- `vitest.config.ts`: Vitest configuration
- `playwright.config.ts`: Playwright configuration

**Core Logic:**
- `src/context/app-context.tsx`: State management
- `src/lib/firebase.ts`: Firebase client
- `src/lib/firebase-admin.ts`: Firebase admin

**Testing:**
- `src/__tests__/`: Unit tests
- `e2e/`: End-to-end tests

## Naming Conventions

**Files:**
- Pattern: `kebab-case`
- Example: `app-shell.tsx`

**Directories:**
- Pattern: `kebab-case`
- Example: `app`

## Where to Add New Code

**New Feature:**
- Primary code: `src/app/`
- Tests: `src/__tests__/`

**New Component/Module:**
- Implementation: `src/components/`

**Utilities:**
- Shared helpers: `src/lib/`

## Special Directories

**.planning:**
- Purpose: Codebase analysis and plans
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-05-20*