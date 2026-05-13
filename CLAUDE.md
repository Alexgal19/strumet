# CLAUDE.md – Project Reference

> Auto-loaded by Claude Code and other AI agents at session start.
> Sections marked `<!-- AUTO:name -->` are regenerated on every `git push` via `.git/hooks/pre-push`.
> All other content must be updated manually.

**Last updated:** <!-- AUTO:last-updated -->
2026-05-12 22:32
<!-- /AUTO:last-updated -->

---

## Project Overview

**Name:** Strumet – HR Management System
**Language:** Polish UI, TypeScript codebase
**Deployment:** Firebase App Hosting → `studio--kadry-online-4h3x9.us-central1.hosted.app`
**Repository:** https://github.com/Alexgal19/strumet

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Runtime | React 19, TypeScript |
| Database | Firebase Realtime Database (RTDB) |
| Auth | Firebase Auth (email/password) |
| Server | Firebase Admin SDK |
| Styling | TailwindCSS 3.4 + Radix UI + shadcn/ui |
| Tables | TanStack Table v8 + TanStack Virtual |
| Charts | Recharts 2 |
| Excel | XLSX + read-excel-file + write-excel-file |
| OCR | Tesseract.js (passport scanning) |
| Email | Resend API |
| PWA | Service Worker + manifest.json |
| Testing | Vitest (unit), Playwright (e2e) |

---

## App Router Structure

<!-- AUTO:routes -->
```
src/app/
├── layout.tsx                    # Root layout, PWA metadata
├── global-error.tsx
├── not-found.tsx
├── login/page.tsx                # Public – Firebase email/password login
├── register/page.tsx             # Public – user registration
├── (app)/                        # Protected group (requires auth)
│   ├── aktywni/page.tsx
│   ├── brak-logowania/page.tsx
│   ├── design-system-demo/page.tsx
│   ├── employees/
│   │   ├── columns.tsx
│   │   ├── data-table-toolbar.tsx
│   │   ├── employee-actions.tsx
│   │   ├── employee-table.tsx
│   ├── karty-obiegowe/page.tsx
│   ├── konfiguracja/page.tsx
│   ├── odciski-palcow/page.tsx
│   ├── odwiedzalnosc/page.tsx
│   ├── planowanie/page.tsx
│   ├── statystyki/page.tsx
│   ├── wydawanie-odziezy/page.tsx
│   ├── wydawanie-odziezy-nowi/page.tsx
│   ├── zwolnieni/page.tsx
└── api/
    ├── cron/
    │   ├── daily-checks/route.ts
    │   ├── check-contracts/route.ts
    │   └── check-appointments/route.ts
    └── archives/list/route.ts
```
<!-- /AUTO:routes -->

---

## Components

<!-- AUTO:components -->
| File | Purpose |
|------|---------|
| `absence-record-print-form.tsx` | |
| `app-bottom-nav.tsx` | |
| `app-shell.tsx` | |
| `app-sidebar.tsx` | |
| `attendance-excel-export-button.tsx` | |
| `circulation-card-print-form.tsx` | |
| `clothing-issuance-print-form.tsx` | |
| `contract-end-date-import-button.tsx` | |
| `data-table-multi-select-filter.tsx` | |
| `data-table.tsx` | |
| `department-excel-export-button.tsx` | |
| `employee-attendance-card.tsx` | |
| `employee-card.tsx` | |
| `employee-form.tsx` | |
| `employee-summary.tsx` | |
| `excel-export-button.tsx` | |
| `excel-import-button.tsx` | |
| `hire-date-import-button.tsx` | |
| `new-hire-info-print-form.tsx` | |
| `page-header.tsx` | |
| `passport-scanner.tsx` | |
| `providers.tsx` | |
| `query-provider.tsx` | |
| `service-worker-register.tsx` | |
| `statistics-excel-export-button.tsx` | |
| `terminated-excel-import-button.tsx` | |
<!-- /AUTO:components -->

### Component Descriptions

| File | Purpose |
|------|---------|
| `app-shell.tsx` | Root layout wrapper, auth guard. Root div uses `h-dvh` (NOT `h-full`) |
| `app-top-bar.tsx` | Desktop tab navigation (sticky dark header, replaces AppSidebar) |
| `app-bottom-nav.tsx` | Mobile bottom navigation |
| `employee-form.tsx` | Add/edit form. Props: `employee`, `onSave`, `onCancel`, `onTerminate?`, `onPrintClothing?`, `config` |
| `clothing-issuance-print-form.tsx` | A4 print form. Inline styles + `@media print`. Class: `clothing-print-sheet` |
| `employee-table.tsx` | Virtualized table (TanStack Virtual). Do NOT add `getPaginationRowModel` |
| `data-table-toolbar.tsx` | Filters, search, column visibility, export |

> `components/ui/` – shadcn/ui (primary). `components/ui-v2/` – legacy, **do not use**.

---

## Hooks

<!-- AUTO:hooks -->
- `hooks/use-debounced-value.ts`
- `hooks/use-employee-mutations.ts`
- `hooks/use-employees.ts`
- `hooks/use-mobile.tsx`
- `hooks/use-toast.ts`
<!-- /AUTO:hooks -->

---

## Lib Utilities

<!-- AUTO:lib -->
- `lib/attendance-actions.ts`
- `lib/date.ts`
- `lib/firebase-admin.ts`
- `lib/firebase.ts`
- `lib/holidays.ts`
- `lib/legalization-statuses.ts`
- `lib/mock-data.ts`
- `lib/types.ts`
- `lib/utils.ts`
<!-- /AUTO:lib -->

| File | Notes |
|------|-------|
| `lib/types.ts` | All TypeScript interfaces – always read this first |
| `lib/firebase.ts` | Client Firebase init (lazy, cached) |
| `lib/firebase-admin.ts` | Admin SDK – server-side only |
| `lib/utils.ts` | `cn()`, `objectToArray()` |
| `lib/date.ts` | `formatDate()`, `parseMaybeDate()` |
| `lib/legalization-statuses.ts` | Status colors + badge logic |
| `lib/actions/employee-actions.ts` | Server actions – **NOT used**, context handlers replace these |

---

## AI / Automation Flows

<!-- AUTO:ai-flows -->
- `ai/flows/archive-employees-flow.ts`
- `ai/flows/archive-employees-flow.tsx`
- `ai/flows/check-expiring-contracts.ts`
- `ai/flows/check-fingerprint-appointments.ts`
- `ai/flows/check-planned-terminations.ts`
- `ai/flows/create-stats-snapshot.ts`
- `ai/flows/run-daily-checks.ts`
- `ai/flows/run-manual-checks.ts`
<!-- /AUTO:ai-flows -->

CRON endpoint: `/api/cron/daily-checks` → runs all flows. Checks: contract expiry (7 days), fingerprint reminders, planned terminations, daily stats snapshot.

---

## Data Layer

### Context (`src/context/app-context.tsx`)
Global state provider. Firebase `onValue()` real-time listeners. CRUD handlers: `saveEmployee`, `terminateEmployee`, `restoreEmployee`, `deleteEmployee`. Auth via `onAuthStateChanged` + `authInitializedRef` guard.

Exposes: `employees`, `absences`, `config`, `notifications`, `statsHistory`, `currentUser`, `isLoading`

### Firebase Collections (RTDB)

```
employees/{id}
  fullName, hireDate, jobTitle, department, manager
  cardNumber, nationality, lockerNumber, departmentLockerNumber, sealNumber
  status ('aktywny'|'zwolniony'), status_fullName (composite key)
  terminationDate?, plannedTerminationDate?, vacationStartDate?, vacationEndDate?
  contractEndDate?, legalizationStatus?, welderLicense?

config/
  departments/{id}/{ name }
  jobTitles/{id}/{ name }
  managers/{id}/{ name }
  nationalities/{id}/{ name }
  clothingItems/{id}/{ name }
  jobTitleClothingSets/{jobTitleId}/{ id, description }
  resendApiKey

absences/{id}/{ employeeId, date }
absenceRecords/{id}/{ employeeId, employeeFullName, incidentDate, department, jobTitle, hours, reason }
circulationCards/{id}/{ employeeId, employeeFullName, date }
clothingIssuances/{id}/{ employeeId, employeeFullName, date, items:[{id,name,quantity}] }
fingerprintAppointments/{id}/{ employeeId, employeeFullName, appointmentDate }
orders/{id}/{ department, jobTitle, quantity, realizedQuantity, createdAt, type }
notifications/{id}/{ title, message, createdAt, read }
statisticsHistory/{YYYY-MM-DD}/{ totalActive, departments, jobTitles, nationalities, newHires, terminations }
users/{uid}/{ email, role ('admin'|'guest') }
```

### Key Types (`src/lib/types.ts`)
`Employee`, `AllConfig`, `ClothingIssuance`, `CirculationCard`, `FingerprintAppointment`, `AbsenceRecord`, `Order`, `StatsSnapshot`, `AppNotification`, `AuthUser`, `User`, `UserRole`

---

## Employee Form Fields

| Section | Fields |
|---------|--------|
| Dane osobowe | fullName, nationality, hireDate, welderLicense (Tak/Nie) |
| Stanowisko | jobTitle, department, manager |
| Identyfikacja | cardNumber, lockerNumber, departmentLockerNumber, sealNumber |
| Planowanie | plannedTerminationDate, vacationStartDate, vacationEndDate |
| Legalizacja | legalizationStatus |

> `contractEndDate` **removed from form** (still in DB type for legacy data).

## Active Employees Table Columns

Nazwisko | Imię | Data zatrudnienia | Umowa do | Stanowisko | Dział | Kierownik | Nr karty | Narodowość | Licencja spraw. | Status legalizacyjny | Akcje

---

## Important Architectural Decisions

### Layout Height
`AppShell` uses `h-dvh` on root div. Parent `SidebarProvider` (shadcn) has no explicit height → `h-full` would collapse. `h-dvh` = absolute `100dvh`, independent of parent.

### Table Virtualization
`employee-table.tsx` uses `@tanstack/react-virtual`.
**Do NOT add `getPaginationRowModel()`** to `useReactTable` – it limits `getRowModel()` to 10 rows, breaking virtualization.

### Auth State Guard
`authInitializedRef` in `app-context.tsx` prevents `isLoading=false` before `onAuthStateChanged` fires (would redirect to /login on page refresh).

### Print / PDF Pattern
- `window.print()` triggered from page level only (never inside a Dialog)
- `@media print` in `globals.css` hides UI, shows only `.print-only` div
- **Do NOT nest Dialog inside Dialog** (Radix UI portal conflict)
- Lift print/clothing dialogs to page level; pass data via `onPrintClothing` callback prop

### Clothing Issuance Dialog
- `EmployeeForm` prop: `onPrintClothing?: (employee, issuance) => void`
- Dialog rendered at page level in `aktywni/page.tsx` and `zwolnieni/page.tsx`
- Clothing sets resolved from `config.jobTitleClothingSets` by `jobTitleId`

---

## Deployment

```bash
git add <files>
git commit -m "description"
git push origin main
# Hook auto-updates CLAUDE.md before push

firebase apphosting:rollouts:create studio --git-branch main
```

**Monitor:** https://console.firebase.google.com/project/kadry-online-4h3x9/apphosting
**Live URL:** https://studio--kadry-online-4h3x9.us-central1.hosted.app

---

## Known Issues / Do Not Break

1. `ui-v2/` folder – legacy, do not use
2. `lib/actions/employee-actions.ts` – unused server actions; context handlers are authoritative
3. `objectToArray()` duplicated in `app-context.tsx` and `lib/utils.ts` – prefer `lib/utils.ts`
4. Resend API key stored in Firebase RTDB under `config/resendApiKey`
5. No server-side PDF – `window.print()` only
