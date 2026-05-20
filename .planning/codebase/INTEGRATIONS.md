# External Integrations

**Analysis Date:** 2026-05-20

## APIs & External Services

**UI Components:**
- Radix UI - Accessible React components
  - SDK/Client: `@radix-ui/react-*`

**Icons:**
- Lucide React - Icon library
  - SDK/Client: `lucide-react`

## Data Storage

**Databases:**
- Firebase Realtime Database
  - Connection: Configured in `src/lib/firebase.ts`
  - Client: Firebase SDK

**File Storage:**
- Firebase Hosting

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Firebase Auth
  - Implementation: `onAuthStateChanged` in `app-context.tsx`

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- `console.error` in error boundary

## CI/CD & Deployment

**Hosting:**
- Firebase Hosting

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- Firebase configuration

**Secrets location:**
- Firebase

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

---

*Integration audit: 2026-05-20*