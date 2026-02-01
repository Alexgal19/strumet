# Project Architecture Analysis

## Overview

This project is a modern employee management system built with **Next.js 15+** (App Router) and **TypeScript**, hosted on **Firebase App Hosting**. It leverages **Genkit** for AI-powered automation and **Firebase** services for backend functionality.

## Core Stack

- **Frontend Framework:** Next.js 15.5.9 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, PostCSS, Radix UI (shadcn/ui components)
- **State Management:** Zustand, React Context
- **Backend/Infrastructure:** Firebase (App Hosting, Realtime Database, Firestore, Storage, Auth)
- **AI/Automation:** Genkit (Google AI SDK)
- **Email:** Resend
- **Testing:** Vitest (Unit/Integration), Playwright (E2E)

## Architecture Components

### 1. Application Structure (`src/app`)

The application follows the Next.js App Router pattern:

- **Root Layout (`src/app/layout.tsx`):** Handles global providers (`AppProvider`, `SidebarProvider`, `Toaster`) and authentication protection. It redirects unauthenticated users to `/login`.
- **Protected Routes (`src/app/(app)/`):** Contains the main application views, accessible only after login.
  - `aktywni`, `zwolnieni`: Employee lists.
  - `planowanie`: Scheduling/Planning.
  - `statystyki`: Analytics.
  - `konfiguracja`: System configuration.
- **API Routes (`src/app/api/`):** Server-side logic, primarily for cron jobs and report generation.

### 2. Data Layer

- **Firebase Integration:**
  - **Client:** `src/lib/firebase.ts` initializes Firebase services (Auth, Database, Storage) for the client.
  - **Admin:** `src/lib/firebase-admin.ts` provides server-side access with privileged permissions.
- **Data Models (`src/lib/types.ts`):** Strictly typed interfaces for:
  - `Employee` (Core entity)
  - `ConfigItem` (Departments, Job Titles, etc.)
  - `Absence`, `CirculationCard`, `ClothingIssuance` (Operational data)
  - `StatsSnapshot` (Analytical data)

### 3. AI & Automation (`src/ai`)

The project uses **Genkit** to define flows and tools for automation:

- **Configuration:** `src/ai/genkit.ts` configures the Genkit instance with the Google AI plugin.
- **Flows:** Encapsulate business logic, often triggered by cron jobs.
  - `runDailyChecksFlow`: Orchestrates daily tasks.
  - `checkExpiringContracts`: Identifies and notifies about contract expiries.
  - `checkAppointments`: Manages fingerprinting appointments.
  - `checkPlannedTerminations`: Handles scheduled employee terminations.
- **Tools:** Custom tools available to LLMs or flows.
  - `sendEmailTool`: Wraps the Resend API to send notifications.

### 4. Infrastructure & DevOps

- **Hosting:** Configured via `apphosting.yaml`. Includes scheduled jobs (Cron) targeting `/api/cron/daily-checks`.
- **CI/CD:** Scripts in `package.json` for linting, testing, and building.
- **Environment:** Relies on `NEXT_PUBLIC_` variables for Firebase config and server-side keys (like `RESEND_API_KEY`).

## Key Workflows

1.  **Daily Maintenance:**
    - A cron job triggers `/api/cron/daily-checks`.
    - The `runDailyChecks` Genkit flow executes.
    - Sub-flows check for expiring contracts, appointments, and terminations.
    - Notifications are sent via email using the `sendEmail` tool (Resend).

2.  **User Authentication:**
    - Handled by Firebase Auth.
    - `AppContent` in the root layout monitors `currentUser` state.
    - Redirects to `/login` if no user is present (except on auth pages).

3.  **Data Management:**
    - Realtime Database seems to be the primary store for dynamic configuration and likely employee status (inferred from usage of `database.rules.json`).
    - Firestore rules are present, suggesting hybrid usage or migration.

## Recommendations

1.  **Type Safety:** Continue enforcing strictly typed interfaces in `src/lib/types.ts` to maintain data integrity across the frontend and Firebase interactions.
2.  **AI Flows:** The separation of flows into distinct files in `src/ai/flows` is a good practice. Maintain this modularity as complexity grows.
3.  **Security:** Ensure `database.rules.json` and `firestore.rules` are tightly configured, especially since client-side access is initialized.
