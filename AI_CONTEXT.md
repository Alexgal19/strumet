# AI_CONTEXT.md — Strumet HR System

> Universal AI agent reference. Read this **before writing any code**.  
> Mirrors CLAUDE.md but formatted for non-Claude agents (Gemini, Codex, Copilot, etc.).  
> Section `last-updated` is regenerated automatically on every `git push` via `.git/hooks/pre-push`.

---

## Language Instruction

> **CRITICAL — applies to every AI agent reading this file.**

The user communicates in **Polish**. You must **always respond in Ukrainian (Українська мова)**, regardless of the language the user writes in. This is a non-negotiable hard requirement — do not respond in Polish, English, or any other language.

- User input language: Polish (polski)
- Agent response language: Ukrainian (українська) — always, without exception

---

## Project at a Glance

| Property | Value |
| -------- | ----- |
| **Name** | Strumet — HR management system (Polish UI) |
| **Framework** | Next.js 16 · App Router · Turbopack |
| **Runtime** | React 19 · TypeScript (strict) |
| **Database** | Firebase Realtime Database (RTDB) — NOT Firestore |
| **Auth** | Firebase Auth (email/password) |
| **Styling** | TailwindCSS 3.4 + shadcn/ui (Radix UI) |
| **Tables** | TanStack Table v8 + TanStack Virtual |
| **Deployment** | Firebase App Hosting |
| **Live URL** | `https://studio--kadry-online-4h3x9.us-central1.hosted.app` |

---

## Absolute Rules — Never Break These

### 1. No `React.memo` on TanStack Table components

`table.getState()` returns the **same object reference** after mutations. `React.memo` won't detect changes → controlled inputs (search, filters) silently stop working.

### 2. No `getPaginationRowModel()` in `useReactTable`

Adding it caps `getRowModel()` to 10 rows and breaks TanStack Virtual. The table uses virtualization, not pagination.

### 3. No global `WebkitTextFillColor` in `<Input>`

Setting it anywhere inside a global `Input` component breaks text visibility everywhere. Autofill styling must use the scoped CSS selector only:

```css
input:-webkit-autofill { -webkit-text-fill-color: ...; }
```

### 4. Run `npm run build` before declaring work done

`tsc` alone doesn't catch App Router-specific errors. The build step is the only reliable type check for this project.

### 5. Never nest Dialog inside Dialog

Radix UI uses portals — nested Dialogs break. Lift print/clothing dialogs to page level. Pass data up via callback props (e.g. `onPrintClothing`).

### 6. No server-side PDF generation

The only PDF mechanism is `window.print()` + `@media print` CSS. Do not introduce Puppeteer, jsPDF, or any server-side renderer.

---

## Repository Layout

```text
src/
├── app/
│   ├── layout.tsx                # Root layout, PWA metadata
│   ├── globals.css               # Global styles + @media print
│   ├── login/page.tsx            # Public
│   ├── register/page.tsx         # Public
│   └── (app)/                    # Auth-guarded group
│       ├── aktywni/page.tsx      # Active employees (main view)
│       ├── zwolnieni/page.tsx    # Terminated employees
│       ├── planowanie/page.tsx
│       ├── statystyki/page.tsx
│       ├── konfiguracja/page.tsx
│       └── employees/            # Shared table + columns
│           ├── employee-table.tsx
│           ├── columns.tsx
│           └── data-table-toolbar.tsx
├── components/
│   ├── ui/                       # shadcn/ui — use these
│   ├── ui-v2/                    # LEGACY — do NOT use
│   ├── employee-form.tsx
│   ├── app-shell.tsx
│   ├── app-top-bar.tsx           # Desktop nav
│   └── app-bottom-nav.tsx        # Mobile nav
├── context/
│   └── app-context.tsx           # Global state + Firebase listeners
├── hooks/
│   ├── use-employees.ts
│   ├── use-employee-mutations.ts
│   └── use-debounced-value.ts
├── lib/
│   ├── types.ts                  # All TypeScript interfaces — read first
│   ├── utils.ts                  # cn(), objectToArray()
│   ├── firebase.ts               # Client-side Firebase init (lazy)
│   ├── firebase-admin.ts         # Server-side only
│   ├── date.ts                   # formatDate(), parseMaybeDate()
│   └── legalization-statuses.ts
└── ai/flows/                     # CRON job flows (email alerts)
```

---

## Data Layer

### Source of Truth: `app-context.tsx`

All CRUD goes through context handlers. **Do not use** `lib/actions/employee-actions.ts` — those server actions are unused and superseded by context handlers.

**Context exposes:**

- `employees`, `absences`, `config`, `notifications`, `statsHistory`
- `currentUser`, `isLoading`
- `saveEmployee`, `terminateEmployee`, `restoreEmployee`, `deleteEmployee`

### Firebase RTDB Schema (key paths)

```text
employees/{id}
  fullName, hireDate, jobTitle, department, manager
  cardNumber, nationality, lockerNumber, departmentLockerNumber, sealNumber
  status: 'aktywny' | 'zwolniony'
  status_fullName              # composite sort key: `${status}_${fullName}`
  terminationDate?
  plannedTerminationDate?
  vacationStartDate?, vacationEndDate?
  contractEndDate?             # legacy — not shown in form
  legalizationStatus?
  welderLicense?

config/
  departments/{id}/{ name }
  jobTitles/{id}/{ name }
  managers/{id}/{ name }
  nationalities/{id}/{ name }
  clothingItems/{id}/{ name }
  jobTitleClothingSets/{jobTitleId}/{ id, description }
  resendApiKey                 # Resend email API key lives here, NOT in env

absences/{id}/{ employeeId, date }
notifications/{id}/{ title, message, createdAt, read }
statisticsHistory/{YYYY-MM-DD}/{ totalActive, departments, jobTitles, ... }
users/{uid}/{ email, role: 'admin' | 'guest' }
```

### `objectToArray()` utility

RTDB returns plain objects. Use `lib/utils.ts → objectToArray()`. There's a duplicate inside `app-context.tsx` — always prefer the one from `lib/utils.ts`.

---

## Key Types (`src/lib/types.ts`)

Always read this file before adding or editing fields. Core interfaces:

- `Employee` — main entity
- `AllConfig` — departments, jobTitles, managers, nationalities, clothingItems, clothingingSets
- `ClothingIssuance`, `CirculationCard`, `FingerprintAppointment`
- `AbsenceRecord`, `Order`, `StatsSnapshot`
- `AppNotification`, `AuthUser`, `User`, `UserRole`

> `contractEndDate` exists in the `Employee` type (legacy DB data) but is **removed from the form UI**.

---

## Component Patterns

### Layout Height

`AppShell` uses `h-dvh` (not `h-full`). The parent `SidebarProvider` (shadcn) has no explicit height. `h-full` collapses — always use `h-dvh` for the root shell div.

### Print Pattern

1. `window.print()` called only at page level (never inside a Dialog)
2. `globals.css` hides everything except `.print-only` during print
3. Print components (e.g. `ClothingIssuancePrintForm`) are rendered at page level
4. Data flows from table → `onPrintClothing(employee, issuance)` callback → page state → print div

### Table Virtualization (`employee-table.tsx`)

Uses `@tanstack/react-virtual`. Row count is always `table.getRowModel().rows.length` (not a page slice). Filter / sort models are in `useReactTable` options — never pagination.

### Dynamic Import (SSR-unsafe components)

Heavy or browser-only components (e.g. `PassportScanner`, OCR) are loaded with `dynamic(..., { ssr: false })`.

### Auth Guard

`authInitializedRef` in `app-context.tsx` prevents `isLoading` from flipping to `false` before `onAuthStateChanged` fires. This avoids false redirects to `/login` on hard refresh.

---

## shadcn/ui — Usage Notes

- Import from `@/components/ui/` — never `ui-v2/`
- Radix primitives are already wrapped — use the shadcn wrappers
- Icons: `lucide-react` (optimized import via `next.config.ts`)
- Never add inline `style` for colors/spacing that Tailwind can express

---

## Styling Conventions

- Tailwind utility classes — no custom CSS except `globals.css`
- Dark mode via `class` strategy — check both light and dark before submitting
- Mobile-first — test at ≤ 640px. Bottom nav is `app-bottom-nav.tsx`; top bar is desktop-only
- Font variables: `--font-body`, `--font-heading` (defined in `layout.tsx`)

---

## Testing

| Type | Tool | Location |
| ---- | ---- | -------- |
| Unit | Vitest + jsdom | `src/**/*.test.{ts,tsx}` |
| E2E | Playwright | `e2e/` |

Run unit tests: `npm test`  
Run e2e (requires dev server): `npm run dev` then Playwright.

---

## CRON / Automation

Daily cron at `23:00 Europe/Warsaw` → `/api/cron/daily-checks` → runs all `ai/flows/`:

- Contract expiry alerts (7-day warning)
- Fingerprint appointment reminders
- Planned termination checks
- Daily stats snapshot

Email sent via Resend. API key read from RTDB `config/resendApiKey`.

---

## Deployment Workflow

```bash
# 1. Commit
git add <specific files>
git commit -m "type(scope): description"
git push origin main          # pre-push hook updates CLAUDE.md

# 2. Deploy to Firebase App Hosting
firebase apphosting:rollouts:create studio --git-branch main
```

Monitor: Firebase Console → App Hosting → `studio` backend

---

## ESLint Rules in Force

- `typescript-eslint` (strict types)
- `@next/next` core-web-vitals
- `eslint-plugin-no-secrets` — **will error on any hardcoded API keys or tokens**
- `eslint-config-prettier` — formatting deferred to Prettier

Run before pushing: `npm run lint`

---

## Common Mistakes to Avoid

| Mistake | Why it breaks |
| ------- | ------------- |
| `React.memo` on table components | Same-reference `table.getState()` — memoization never triggers re-render |
| `getPaginationRowModel()` | Hard-limits rows to 10, destroys virtualization |
| Global `WebkitTextFillColor` | Overrides all text fields, makes input values invisible |
| `h-full` on `AppShell` | Collapses when parent has no height — use `h-dvh` |
| Nested Radix Dialogs | Portal conflicts, broken z-index, focus traps |
| Importing from `ui-v2/` | Legacy components, unmaintained |
| Using server actions from `lib/actions/` | Bypasses context state — use context handlers |
| Calling `objectToArray()` from `app-context.tsx` | Duplicate — use `lib/utils.ts` version |
| Hardcoded secrets in any source file | ESLint `no-secrets` will block the commit |
| PDF via any library | Only `window.print()` is supported |

---

## Environment Variables

All public vars are in `apphosting.yaml` and prefixed `NEXT_PUBLIC_FIREBASE_*`. There are no `.env` files committed. Secrets (future) go through Firebase Secret Manager.

---

*Last reviewed: <!-- AUTO:last-updated -->2026-05-13<!-- /AUTO:last-updated -->*
