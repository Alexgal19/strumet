# Technology Stack

**Analysis Date:** 2026-05-20

## Languages

**Primary:**
- TypeScript 5.x - Application code

**Secondary:**
- JavaScript - Legacy or configuration files

## Runtime

**Environment:**
- Node.js 18.x

**Package Manager:**
- npm 9.x
- Lockfile: Present

## Frameworks

**Core:**
- Next.js 13.x - React framework with App Router

**Testing:**
- Vitest 1.x - Unit testing
- Playwright 1.x - End-to-end testing

**Build/Dev:**
- Vite - Development server
- TailwindCSS 3.x - Styling

## Key Dependencies

**Critical:**
- `firebase` - Realtime database and authentication
- `@radix-ui/react-*` - UI components

**Infrastructure:**
- `firebase-admin` - Server-side Firebase operations
- `lucide-react` - Icons

## Configuration

**Environment:**
- Firebase configuration in `src/lib/firebase.ts`
- `.env` files not detected

**Build:**
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS configuration

## Platform Requirements

**Development:**
- Node.js 18.x

**Production:**
- Firebase Hosting

---

*Stack analysis: 2026-05-20*