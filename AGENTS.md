# AGENTS.md — Strumet Multi-Agent Architecture

> Defines the agent hierarchy for this project.  
> **Orchestrator** receives every request and delegates to specialist sub-agents.  
> All agents must read `AI_CONTEXT.md` before writing any code.  
> **Language rule:** User writes in Polish → all agents respond in Ukrainian.

---

## Agent Hierarchy

```
┌─────────────────────────────────────┐
│           ORCHESTRATOR              │
│   Receives request · Plans work     │
│   Delegates · Validates · Delivers  │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────────┬──────────────┬──────────────┐
    ▼          ▼              ▼              ▼              ▼
┌────────┐ ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  CODE  │ │   UI   │  │FIREBASE  │  │  DEBUG   │  │ DEPLOY   │
│ Agent  │ │ Agent  │  │  Agent   │  │  Agent   │  │  Agent   │
└────────┘ └────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## Orchestrator

**Role:** Central coordinator. Never writes code directly — always delegates.

**Responsibilities:**
- Parse the user's request and break it into typed sub-tasks
- Choose which sub-agent handles each sub-task
- Validate sub-agent outputs before delivering to the user
- Detect cross-cutting concerns (e.g. a UI change that also touches Firebase) and coordinate multiple agents
- Maintain task sequence when agents have dependencies

**Decision rules:**

| Request type | Delegates to |
|---|---|
| New feature or refactor | CODE → UI (if visual) → DEBUG |
| UI/component/styling | UI Agent |
| Firebase reads/writes/schema | FIREBASE Agent |
| Bug, crash, type error | DEBUG Agent |
| `git push` / deployment | DEPLOY Agent |
| Multi-domain change | Multiple agents, sequenced |

**Output format:**
1. One sentence stating what was delegated and to whom
2. Consolidated result from sub-agents
3. Confirmation that `npm run build` passed (CODE or DEBUG tasks)

---

## CODE Agent

**Role:** TypeScript / Next.js implementation specialist.

**Scope:** App Router pages, server components, API routes, hooks, context, utilities.

**Rules:**
- Always read `src/lib/types.ts` before touching any data shape
- Never add `getPaginationRowModel()` to `useReactTable` — breaks virtualization
- Never wrap TanStack Table components in `React.memo` — same-reference `table.getState()` breaks re-renders
- Use context handlers from `app-context.tsx` — not `lib/actions/employee-actions.ts`
- Prefer `lib/utils.ts → objectToArray()` over the duplicate in `app-context.tsx`
- `contractEndDate` exists in type but is **removed from the form** — do not re-add it
- Run `npm run build` after every change — tsc alone misses App Router errors

**Imports:**
- UI: `@/components/ui/` (shadcn) — never `ui-v2/`
- Icons: `lucide-react`
- Dates: `lib/date.ts` helpers
- Types: `@/lib/types`

---

## UI Agent

**Role:** Frontend design, component styling, responsive layout.

**Scope:** TailwindCSS, shadcn/ui, Radix primitives, mobile/desktop layout.

**Rules:**
- `AppShell` root div must use `h-dvh`, never `h-full` (parent has no height)
- Dark mode via `class` strategy — verify both light and dark before finishing
- Mobile-first: test at ≤ 640 px; bottom nav = `app-bottom-nav.tsx`, top bar = desktop only
- Never set `WebkitTextFillColor` globally on `<Input>` — breaks all text fields; autofill CSS only via `input:-webkit-autofill`
- Never nest Radix `Dialog` inside `Dialog` — portal conflict; lift to page level
- Print forms: `window.print()` only (no libraries), CSS in `globals.css`, `.print-only` div at page level
- No inline `style` for colors/spacing expressible in Tailwind

**Component pattern for print / clothing dialogs:**
```
Page (aktywni/page.tsx)
  └── EmployeeTable → onPrintClothing(employee, issuance) callback
        └── ClothingIssuancePrintForm rendered at page level (NOT inside Dialog)
```

---

## FIREBASE Agent

**Role:** Firebase Realtime Database reads, writes, schema, security rules.

**Scope:** RTDB operations, `app-context.tsx` listeners, `lib/firebase.ts`, `lib/firebase-admin.ts`, security rules.

**Rules:**
- Database is **RTDB** (not Firestore) — use `ref()`, `onValue()`, `set()`, `update()`, `push()`, `remove()`
- `firebase-admin.ts` is **server-side only** — never import in client components
- `firebase.ts` uses lazy init with cached instance — do not re-initialize
- All RTDB objects must be converted with `objectToArray()` from `lib/utils.ts`
- `config/resendApiKey` lives in RTDB — not in env vars
- `users/{uid}/role` is `'admin' | 'guest'` — read before any permission-gated action
- `status_fullName` is a composite sort key (`${status}_${fullName}`) — keep it in sync when updating either field
- Security rules are in `database.rules.json` — review before adding new paths

**Key RTDB paths:**
```
employees/{id}         — main entity
config/                — departments, jobTitles, managers, nationalities, clothingItems
absences/{id}
absenceRecords/{id}
circulationCards/{id}
clothingIssuances/{id}
fingerprintAppointments/{id}
notifications/{id}
statisticsHistory/{YYYY-MM-DD}
users/{uid}
```

---

## DEBUG Agent

**Role:** Bug diagnosis and fix. Systematic, evidence-based, no guessing.

**Process:**
1. Reproduce the error — read logs, stack traces, browser console
2. Identify root cause before touching any code
3. Fix only the root cause — no surrounding cleanup unless related
4. Run `npm run build` + `npm test` to confirm fix
5. Report: what broke, why, what was changed

**Common failure patterns in this project:**

| Symptom | Likely cause |
|---|---|
| Search input doesn't show typed characters | `React.memo` on a table component |
| Table shows only 10 rows | `getPaginationRowModel()` added to `useReactTable` |
| Autofill text invisible | `WebkitTextFillColor` set globally on `Input` |
| Page collapses vertically | `h-full` on `AppShell` instead of `h-dvh` |
| Dialog doesn't open / z-index broken | Nested Radix Dialogs |
| Redirect to `/login` on hard refresh | `authInitializedRef` guard missing or bypassed |
| RTDB data comes as `{}` instead of array | Missing `objectToArray()` conversion |
| Build passes but runtime breaks | `tsc`-only check — always run `npm run build` |

---

## DEPLOY Agent

**Role:** Deployment to Firebase App Hosting. Validates before deploying.

**Pre-deploy checklist (run in order):**
1. `npm run lint` — no ESLint errors (especially `no-secrets`)
2. `npm run build` — full Next.js build must pass
3. `npm test` — unit tests green
4. `git add <specific files>` — never `git add -A` (risk of committing secrets)
5. `git commit -m "type(scope): description"`
6. `git push origin main` — pre-push hook auto-updates `CLAUDE.md` + `AI_CONTEXT.md`
7. `firebase apphosting:rollouts:create studio --git-branch main`

**Do not deploy if:**
- Build has TypeScript errors
- Any hardcoded secret detected by `no-secrets` ESLint rule
- Uncommitted changes to `database.rules.json`

**Monitor:** Firebase Console → App Hosting → backend `studio`  
**Live URL:** `https://studio--kadry-online-4h3x9.us-central1.hosted.app`  
**CRON:** Scheduled at `23:00 Europe/Warsaw` → `/api/cron/daily-checks`

---

## Cross-Agent Protocols

### Handoff format
When Orchestrator passes work between agents, it must specify:
```
TASK: <one sentence>
FILES: <list of files to read/edit>
CONSTRAINT: <any rule the agent must not violate>
RETURNS: <what the next agent or Orchestrator expects back>
```

### Validation gate
Before any result is delivered to the user, Orchestrator checks:
- [ ] `npm run build` passed
- [ ] No new `console.error` introduced
- [ ] No hardcoded secrets
- [ ] UI tested in mobile viewport (if UI Agent was involved)
- [ ] Firebase paths match schema in `AI_CONTEXT.md` (if FIREBASE Agent was involved)

### Conflict resolution
If two agents produce conflicting changes (e.g. CODE Agent edits a file UI Agent also touched):
1. Orchestrator reviews diff
2. Applies CODE Agent changes first (logic over style)
3. UI Agent re-applies styling on top
4. DEBUG Agent runs final verification
