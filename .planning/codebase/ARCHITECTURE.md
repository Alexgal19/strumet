# Architecture

**Analysis Date:** 2026-05-20

## Pattern Overview

**Overall:** Modular Monolith

**Key Characteristics:**
- Centralized state management via `app-context.tsx`
- Component-based UI with React and Next.js
- Firebase Realtime Database for backend operations

## Layers

**UI Layer:**
- Purpose: Handles user interaction and rendering
- Location: `src/components/`
- Contains: React components, TailwindCSS styling
- Depends on: Context for state, Firebase for data
- Used by: Pages and AppShell

**State Management:**
- Purpose: Centralized state and Firebase listeners
- Location: `src/context/app-context.tsx`
- Contains: Global state, CRUD handlers
- Depends on: Firebase SDK
- Used by: All components

**Routing Layer:**
- Purpose: Defines application routes
- Location: `src/app/`
- Contains: Page components, layouts
- Depends on: Next.js App Router
- Used by: Entire app

**Backend Integration:**
- Purpose: Firebase operations
- Location: `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`
- Contains: Firebase initialization, admin SDK
- Depends on: Firebase SDK
- Used by: Context, server actions

## Data Flow

**State Updates:**

1. Firebase triggers `onValue` listeners in `app-context.tsx`
2. Context updates global state
3. Components re-render based on state changes

**Form Submission:**

1. User submits form in UI
2. Context handler updates Firebase
3. Firebase triggers listeners to sync state

**State Management:**
- Context API with Firebase listeners

## Key Abstractions

**App Context:**
- Purpose: Centralized state management
- Examples: `src/context/app-context.tsx`
- Pattern: Context API with Firebase integration

**UI Components:**
- Purpose: Reusable UI elements
- Examples: `src/components/app-shell.tsx`, `src/components/app-bottom-nav.tsx`
- Pattern: Functional components with TailwindCSS

## Entry Points

**App Entry:**
- Location: `src/app/layout.tsx`
- Triggers: Next.js App Router
- Responsibilities: Layout, metadata

**Error Boundary:**
- Location: `src/app/global-error.tsx`
- Triggers: Runtime errors
- Responsibilities: Error display, recovery

## Error Handling

**Strategy:** Centralized error boundaries

**Patterns:**
- `global-error.tsx` for runtime errors
- `console.error` for logging

## Cross-Cutting Concerns

**Logging:** `console.error` in error boundary
**Validation:** Form-level validation in components
**Authentication:** Firebase Auth with `onAuthStateChanged`

---

*Architecture analysis: 2026-05-20*