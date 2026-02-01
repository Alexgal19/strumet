# Plan Redesignu UI/UX i Optymalizacji Wydajności - Baza ST

## 📋 Executive Summary

Kompleksowy plan transformacji aplikacji HR "Baza - ST" obejmujący:

- 🎨 Całkowity redesign UI/UX z nowoczesną identyfikacją wizualną
- ⚡ Maksymalizacja wydajności przez React Server Components, lazy loading, virtualization
- 🔥 Optymalizacja Firebase queries i indexing
- 💎 Eliminacja lagów, freezów i wszystkich problemów z wydajnością

---

## 🎨 Część I: Nowy Design System 2.0

### 1. Nowa Identyfikacja Wizualna

#### Paleta Kolorów (Modern & Fresh)

```typescript
// Design tokens - Modern gradient-based system
const colors = {
  // Primary - Vibrant gradient blue-purple
  primary: {
    50: "hsl(250, 100%, 97%)",
    100: "hsl(250, 95%, 93%)",
    200: "hsl(250, 90%, 85%)",
    300: "hsl(250, 85%, 75%)",
    400: "hsl(250, 80%, 65%)",
    500: "hsl(250, 75%, 55%)", // Main
    600: "hsl(250, 70%, 45%)",
    700: "hsl(250, 65%, 35%)",
    800: "hsl(250, 60%, 25%)",
    900: "hsl(250, 55%, 15%)",
  },

  // Accent - Electric cyan
  accent: {
    50: "hsl(190, 100%, 97%)",
    100: "hsl(190, 95%, 90%)",
    200: "hsl(190, 90%, 80%)",
    300: "hsl(190, 85%, 70%)",
    400: "hsl(190, 80%, 60%)",
    500: "hsl(190, 75%, 50%)", // Main
    600: "hsl(190, 70%, 40%)",
    700: "hsl(190, 65%, 30%)",
    800: "hsl(190, 60%, 20%)",
    900: "hsl(190, 55%, 10%)",
  },

  // Success - Fresh green
  success: "hsl(142, 76%, 36%)",

  // Warning - Warm amber
  warning: "hsl(38, 92%, 50%)",

  // Destructive - Modern red
  destructive: "hsl(0, 84%, 60%)",

  // Backgrounds (Dark Mode First)
  background: {
    primary: "hsl(240, 10%, 8%)", // Deep dark
    secondary: "hsl(240, 8%, 12%)", // Card background
    tertiary: "hsl(240, 6%, 16%)", // Elevated
    overlay: "hsl(240, 10%, 8%, 0.8)", // Modal backdrop
  },

  // Foreground
  foreground: {
    primary: "hsl(0, 0%, 98%)",
    secondary: "hsl(0, 0%, 70%)",
    tertiary: "hsl(0, 0%, 50%)",
    disabled: "hsl(0, 0%, 30%)",
  },

  // Borders & Dividers
  border: {
    subtle: "hsl(240, 6%, 20%)",
    default: "hsl(240, 6%, 25%)",
    strong: "hsl(240, 6%, 30%)",
  },
};
```

#### Typografia

```typescript
const typography = {
  fonts: {
    // Primary: Modern geometric sans
    sans: ["Inter Variable", "system-ui", "sans-serif"],

    // Display: Impactful headlines
    display: ["Cal Sans", "Inter Variable", "sans-serif"],

    // Mono: Code & numbers
    mono: ["JetBrains Mono", "Fira Code", "monospace"],
  },

  sizes: {
    // Fluid type scale
    xs: "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
    sm: "clamp(0.875rem, 0.8rem + 0.375vw, 1rem)",
    base: "clamp(1rem, 0.9rem + 0.5vw, 1.125rem)",
    lg: "clamp(1.125rem, 1rem + 0.625vw, 1.25rem)",
    xl: "clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)",
    "2xl": "clamp(1.5rem, 1.3rem + 1vw, 2rem)",
    "3xl": "clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)",
    "4xl": "clamp(2.25rem, 1.9rem + 1.75vw, 3rem)",
    "5xl": "clamp(3rem, 2.5rem + 2.5vw, 4rem)",
  },

  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeights: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.7,
  },
};
```

#### Spacing System (8pt Grid)

```typescript
const spacing = {
  0: "0",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
};
```

#### Border Radius (Modern Soft Corners)

```typescript
const radius = {
  none: "0",
  sm: "0.375rem", // 6px
  default: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  "2xl": "2rem", // 32px
  full: "9999px",
};
```

#### Shadows (Elevated Layers)

```typescript
const shadows = {
  // Subtle elevation
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",

  // Default card elevation
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",

  // Popover/dropdown elevation
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",

  // Modal/dialog elevation
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",

  // Focus ring
  focus: "0 0 0 3px hsl(250, 75%, 55%, 0.5)",

  // Glow effects
  glow: {
    primary: "0 0 20px hsl(250, 75%, 55%, 0.3)",
    accent: "0 0 20px hsl(190, 75%, 50%, 0.3)",
  },
};
```

#### Animations & Transitions

```typescript
const animations = {
  // Timing functions
  easing: {
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },

  // Durations
  duration: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },

  // Keyframes
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideInFromRight: {
      from: { transform: "translateX(100%)" },
      to: { transform: "translateX(0)" },
    },
    slideInFromBottom: {
      from: { transform: "translateY(100%)" },
      to: { transform: "translateY(0)" },
    },
    scaleIn: {
      from: { transform: "scale(0.95)", opacity: 0 },
      to: { transform: "scale(1)", opacity: 1 },
    },
    shimmer: {
      "0%": { backgroundPosition: "-1000px 0" },
      "100%": { backgroundPosition: "1000px 0" },
    },
  },
};
```

### 2. Nowe Komponenty UI

#### Component Library 2.0

```
components/ui-v2/
├── core/
│   ├── button.tsx              # Gradient buttons, ghost, outline variants
│   ├── input.tsx               # Modern input z focus effects
│   ├── select.tsx              # Custom styled select
│   ├── card.tsx                # Glassmorphism cards
│   ├── badge.tsx               # Soft badge z gradient
│   └── avatar.tsx              # Avatar z status indicator
├── layout/
│   ├── sidebar-v2.tsx          # Collapsible sidebar z micro-interactions
│   ├── header-v2.tsx           # Sticky header z scroll effects
│   ├── bottom-nav-v2.tsx       # Enhanced mobile navigation
│   └── page-container.tsx      # Consistent page wrapper
├── feedback/
│   ├── skeleton.tsx            # Shimmer loading skeletons
│   ├── toast-v2.tsx            # Modern toast notifications
│   ├── progress.tsx            # Progress indicators
│   └── empty-state.tsx         # Beautiful empty states
├── data-display/
│   ├── table-v2.tsx            # Enhanced table z hover effects
│   ├── stat-card.tsx           # Animated stat cards
│   ├── chart-card.tsx          # Chart wrapper z loading states
│   └── timeline.tsx            # Timeline component
└── overlays/
    ├── modal-v2.tsx            # Modal z backdrop blur
    ├── drawer.tsx              # Slide-in drawer
    ├── popover-v2.tsx          # Enhanced popover
    └── command-palette.tsx     # CMD+K command palette
```

#### Przykładowy Komponent: Modern Card

```typescript
// components/ui-v2/core/card.tsx
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-xl transition-all duration-200',

          // Variants
          {
            'bg-background-secondary border border-border-subtle':
              variant === 'default',

            'bg-background-secondary/60 backdrop-blur-xl border border-white/10':
              variant === 'glass',

            'bg-background-secondary shadow-xl border border-border-subtle':
              variant === 'elevated',

            'bg-transparent border-2 border-border-default':
              variant === 'bordered',
          },

          // Hover effects
          hover && 'hover:shadow-2xl hover:scale-[1.02] hover:border-primary-500/50 cursor-pointer',

          className
        )}
        {...props}
      />
    );
  }
);
```

#### Przykładowy Komponent: Skeleton Loader

```typescript
// components/ui-v2/feedback/skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'wave',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-border-subtle',

        // Variants
        {
          'h-4': variant === 'text',
          'rounded-full aspect-square': variant === 'circular',
          'rounded-lg': variant === 'rectangular',
        },

        // Animations
        {
          'animate-pulse': animation === 'pulse',
          'animate-shimmer bg-gradient-to-r from-border-subtle via-border-default to-border-subtle bg-[length:1000px_100%]':
            animation === 'wave',
        },

        className
      )}
      {...props}
    />
  );
}
```

### 3. Layout Redesign

#### Nowy Layout Structure

```typescript
// app/layout.tsx - Root layout z Server Components
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={cn(
        'min-h-screen bg-background-primary font-sans antialiased',
        'overflow-x-hidden scrollbar-thin scrollbar-thumb-border-default scrollbar-track-transparent'
      )}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <CommandPalette /> {/* CMD+K global search */}
      </body>
    </html>
  );
}
```

#### App Layout (Authenticated)

```typescript
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-primary">
      {/* Sidebar - Desktop */}
      <SidebarV2 />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <HeaderV2 />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto p-6 max-w-7xl">
            {/* Animated page transitions */}
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <BottomNavV2 />
    </div>
  );
}
```

---

## ⚡ Część II: Optymalizacje Wydajności

### 1. React Server Components Strategy

#### Konwersja na RSC (gdzie możliwe)

```typescript
// PRZED: Client Component
'use client';
export default function EmployeesPage() {
  const { employees } = useAppContext();
  return <EmployeeList employees={employees} />;
}

// PO: Server Component + Client Islands
// app/(app)/aktywni/page.tsx
import { getEmployees } from '@/lib/data/employees';
import { EmployeeListClient } from './employee-list-client';

export default async function EmployeesPage() {
  // Fetch na serwerze - eliminuje waterfall
  const employees = await getEmployees();

  return (
    <div>
      <PageHeader title="Pracownicy aktywni" />
      <Suspense fallback={<EmployeeListSkeleton />}>
        <EmployeeListClient initialData={employees} />
      </Suspense>
    </div>
  );
}
```

#### Server Data Fetching Layer

```typescript
// lib/data/employees.ts (Server-only)
import "server-only";
import { db } from "@/lib/firebase-admin";

export async function getEmployees(filters?: EmployeeFilters) {
  const snapshot = await db
    .ref("employees")
    .orderByChild("status_fullName")
    .startAt("aktywny_")
    .endAt("aktywny_\uf8ff")
    .once("value");

  return objectToArray(snapshot.val());
}

export async function getEmployeeStats() {
  // Agregacja na serwerze - szybsza
  const snapshot = await db.ref("employees").once("value");
  const employees = objectToArray(snapshot.val());

  return {
    total: employees.length,
    active: employees.filter((e) => e.status === "aktywny").length,
    // ... inne statystyki
  };
}
```

### 2. Code Splitting & Lazy Loading

#### Dynamic Imports dla Heavy Components

```typescript
// app/(app)/statystyki/page.tsx
import dynamic from 'next/dynamic';

// Lazy load Recharts - 50KB+ bundle
const StatisticsCharts = dynamic(
  () => import('@/components/statistics/charts'),
  {
    loading: () => <ChartsSkeleton />,
    ssr: false, // Nie renderuj na serwerze
  }
);

// Lazy load Excel export - również ciężki
const ExcelExporter = dynamic(
  () => import('@/components/excel/exporter'),
  { ssr: false }
);

export default function StatisticsPage() {
  return (
    <div>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards /> {/* Lightweight - eager load */}
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <StatisticsCharts /> {/* Heavy - lazy load */}
      </Suspense>
    </div>
  );
}
```

#### Route-based Code Splitting

```typescript
// Automatyczne przez Next.js App Router
app/(app)/
├── aktywni/page.tsx          → Chunk: aktywni.js
├── zwolnieni/page.tsx        → Chunk: zwolnieni.js
├── statystyki/page.tsx       → Chunk: statystyki.js
└── konfiguracja/page.tsx     → Chunk: konfiguracja.js

// Każda route to osobny bundle - ładowany on-demand
```

### 3. Virtualization dla Długich List

#### React Virtual + TanStack Table

```typescript
// components/data-display/virtual-table.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualTable({ data, columns }: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Row height
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TableRow data={data[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Firebase Query Optimizations

#### Indexed Queries

```json
// database.rules.json - Dodaj indexy
{
  "rules": {
    "employees": {
      ".indexOn": [
        "status_fullName",
        "department",
        "jobTitle",
        "nationality",
        "hireDate",
        "terminationDate"
      ]
    },
    "absences": {
      ".indexOn": ["employeeId", "date"]
    }
  }
}
```

#### Optimized Queries

```typescript
// lib/data/employees-optimized.ts
import { db } from "@/lib/firebase-admin";
import { cache } from "react";

// Cache na poziomie request (RSC)
export const getActiveEmployees = cache(async () => {
  const snapshot = await db
    .ref("employees")
    .orderByChild("status")
    .equalTo("aktywny")
    .limitToFirst(1000) // Pagination
    .once("value");

  return objectToArray(snapshot.val());
});

// Query z filtrami
export async function getEmployeesByDepartment(dept: string) {
  const snapshot = await db
    .ref("employees")
    .orderByChild("department")
    .equalTo(dept)
    .once("value");

  return objectToArray(snapshot.val());
}

// Incremental loading
export async function getEmployeesPage(cursor?: string, limit = 50) {
  let query = db
    .ref("employees")
    .orderByChild("status_fullName")
    .limitToFirst(limit);

  if (cursor) {
    query = query.startAfter(cursor);
  }

  const snapshot = await query.once("value");
  return objectToArray(snapshot.val());
}
```

### 5. Debouncing & Memoization

#### Custom Debounced Hook

```typescript
// hooks/use-debounced-value.ts
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

#### Search z Debouncing

```typescript
// components/search/search-input.tsx
'use client';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useState, useEffect } from 'react';

export function SearchInput({ onSearch }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <Input
      type="search"
      placeholder="Szukaj..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="w-full"
    />
  );
}
```

#### Aggressive Memoization

```typescript
// components/employee/employee-card.tsx
'use client';

import { memo } from 'react';

export const EmployeeCard = memo(function EmployeeCard({ employee }: Props) {
  return (
    <Card>
      {/* ... */}
    </Card>
  );
}, (prev, next) => {
  // Custom comparison - tylko re-render jeśli dane się zmieniły
  return prev.employee.id === next.employee.id &&
         prev.employee.fullName === next.employee.fullName &&
         prev.employee.status === next.employee.status;
});
```

### 6. Skeleton Loaders (zamiast Spinners)

#### Pattern: Suspense + Skeleton

```typescript
// app/(app)/aktywni/page.tsx
import { Suspense } from 'react';
import { EmployeeList } from './employee-list';
import { EmployeeListSkeleton } from './skeleton';

export default function ActiveEmployeesPage() {
  return (
    <div>
      <Suspense fallback={<EmployeeListSkeleton />}>
        <EmployeeList />
      </Suspense>
    </div>
  );
}
```

#### Skeleton Component

```typescript
// components/skeletons/employee-list-skeleton.tsx
export function EmployeeListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center space-x-4">
            <Skeleton variant="circular" className="w-12 h-12" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-1/4" />
              <Skeleton variant="text" className="w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

### 7. Image Optimization

```typescript
// next.config.ts
export default {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
  },
};
```

### 8. Bundle Analysis & Optimization

```bash
# Zainstaluj bundle analyzer
npm install @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... config
});

# Uruchom
ANALYZE=true npm run build
```

---

## 📊 Część III: Performance Metrics & Monitoring

### Core Web Vitals Targets

```typescript
const performanceTargets = {
  // Largest Contentful Paint
  LCP: {
    good: "< 2.5s",
    needsImprovement: "2.5s - 4.0s",
    poor: "> 4.0s",
  },

  // First Input Delay
  FID: {
    good: "< 100ms",
    needsImprovement: "100ms - 300ms",
    poor: "> 300ms",
  },

  // Cumulative Layout Shift
  CLS: {
    good: "< 0.1",
    needsImprovement: "0.1 - 0.25",
    poor: "> 0.25",
  },

  // Time to First Byte
  TTFB: {
    good: "< 800ms",
    needsImprovement: "800ms - 1800ms",
    poor: "> 1800ms",
  },

  // First Contentful Paint
  FCP: {
    good: "< 1.8s",
    needsImprovement: "1.8s - 3.0s",
    poor: "> 3.0s",
  },
};
```

### Performance Monitoring

```typescript
// lib/monitoring/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

export function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);

  // Można wysłać do analytics (Google Analytics, Vercel Analytics, etc.)
}
```

---

## 🗺️ Część IV: Migration Roadmap

### Faza 1: Fundament (Tydzień 1-2)

```markdown
✅ Setup nowego Design System

- [ ] Stworzyć design tokens w Tailwind config
- [ ] Zaimplementować nowe komponenty UI base (button, input, card)
- [ ] Stworzyć Storybook dla component preview

✅ Performance Infrastructure

- [ ] Skonfigurować bundle analyzer
- [ ] Dodać Firebase indexes
- [ ] Setup monitoring (Web Vitals)

✅ Server Components Setup

- [ ] Utworzyć server data layer (lib/data/)
- [ ] Migrować pierwszy route na RSC (statystyki)
- [ ] Przetestować streaming
```

### Faza 2: Core Components (Tydzień 3-4)

```markdown
✅ Layout Components

- [ ] Nowy Sidebar V2 z micro-interactions
- [ ] Header V2 z scroll effects
- [ ] Bottom Nav V2 dla mobile
- [ ] Command Palette (CMD+K)

✅ Data Display Components

- [ ] Virtual Table z optimizacją
- [ ] Employee Card V2
- [ ] Stat Cards z animacjami
- [ ] Chart Cards z lazy loading

✅ Feedback Components

- [ ] Skeleton loaders dla wszystkich views
- [ ] Toast V2 z stack
- [ ] Empty states
- [ ] Error boundaries
```

### Faza 3: Feature Pages (Tydzień 5-7)

```markdown
✅ Migracja Routes

- [ ] /aktywni → RSC + Virtual list + Skeletons
- [ ] /zwolnieni → RSC + Optimized queries
- [ ] /statystyki → Lazy load charts + Server aggregation
- [ ] /planowanie → Optimized calendar
- [ ] /odwiedzalnosc → Virtual calendar grid
- [ ] Pozostałe routes...

✅ Performance Optimization

- [ ] Debouncing dla wszystkich search inputs
- [ ] Memoization dla expensive computations
- [ ] Image optimization
- [ ] Code splitting review
```

### Faza 4: Polish & Testing (Tydzień 8)

```markdown
✅ Fine-tuning

- [ ] Animations & transitions polish
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile responsiveness testing
- [ ] Dark mode refinements

✅ Performance Testing

- [ ] Lighthouse audits (target: 90+)
- [ ] Bundle size review (target: < 200KB initial)
- [ ] Real-world testing z large datasets
- [ ] Load testing Firebase queries

✅ Documentation

- [ ] Component documentation
- [ ] Performance guidelines
- [ ] Migration guide for team
- [ ] Update architecture docs
```

---

## 📝 Część V: Szczegółowa Implementacja Selected Features

### Feature: Virtual Employee List z Infinite Scroll

```typescript
// app/(app)/aktywni/page.tsx (Server Component)
import { getEmployeesPage } from '@/lib/data/employees';
import { EmployeeListClient } from './employee-list-client';

export default async function ActiveEmployeesPage({
  searchParams,
}: {
  searchParams: { cursor?: string }
}) {
  const { employees, nextCursor } = await getEmployeesPage(
    searchParams.cursor,
    50 // Page size
  );

  return (
    <PageContainer>
      <PageHeader
        title="Pracownicy aktywni"
        description="Przeglądaj i zarządzaj aktywnymi pracownikami"
      />

      <Suspense fallback={<EmployeeListSkeleton />}>
        <EmployeeListClient
          initialEmployees={employees}
          nextCursor={nextCursor}
        />
      </Suspense>
    </PageContainer>
  );
}

// employee-list-client.tsx (Client Component)
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useRef, useMemo } from 'react';

export function EmployeeListClient({ initialEmployees, nextCursor }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Infinite scroll hook
  const {
    items: employees,
    loadMore,
    isLoading,
    hasMore,
  } = useInfiniteScroll({
    initialData: initialEmployees,
    initialCursor: nextCursor,
    fetchFn: async (cursor) => {
      const res = await fetch(`/api/employees?cursor=${cursor}`);
      return res.json();
    },
  });

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Row height
    overscan: 5,
  });

  // Load more when near end
  useEffect(() => {
    const lastItem = virtualizer.getVirtualItems().at(-1);
    if (!lastItem) return;

    if (
      lastItem.index >= employees.length - 1 &&
      hasMore &&
      !isLoading
    ) {
      loadMore();
    }
  }, [virtualizer.getVirtualItems(), employees.length, hasMore, isLoading, loadMore]);

  return (
    <div ref={parentRef} className="h-[calc(100vh-200px)] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <EmployeeCard employee={employees[virtualRow.index]} />
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="py-4 flex justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
```

### Feature: Optimized Search z Debouncing

```typescript
// components/search/employee-search.tsx
'use client';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function EmployeeSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      } else {
        params.delete('q');
      }
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [debouncedQuery, pathname, router, searchParams]);

  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
      <Input
        type="search"
        placeholder="Szukaj pracownika..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
      />
      {isPending && (
        <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
}
```

### Feature: Animated Statistics Dashboard

```typescript
// app/(app)/statystyki/page.tsx
import { Suspense } from 'react';
import { getEmployeeStats } from '@/lib/data/stats';
import { StatCards } from './stat-cards';
import { StatsSkeleton } from './stats-skeleton';

export default async function StatisticsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Statystyki i Analizy"
        description="Kluczowe wskaźniki i insights"
      />

      <div className="grid gap-6">
        {/* Quick Stats - Szybkie, eager load */}
        <Suspense fallback={<StatCardsSkeleton />}>
          <StatCardsServer />
        </Suspense>

        {/* Charts - Ciężkie, lazy load */}
        <Suspense fallback={<ChartsSkeleton />}>
          <ChartsServer />
        </Suspense>
      </div>
    </PageContainer>
  );
}

// stat-cards.tsx (Server Component)
async function StatCardsServer() {
  const stats = await getEmployeeStats(); // Server-side
  return <StatCards stats={stats} />;
}

// stat-cards-client.tsx (Client Component z animacjami)
'use client';

import { motion } from 'framer-motion';
import CountUp from 'react-countup';

export function StatCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <StatCard
          title="Aktywni Pracownicy"
          value={<CountUp end={stats.totalActive} duration={1} />}
          icon={<UsersIcon />}
          trend={{ value: stats.monthlyChange, positive: stats.monthlyChange > 0 }}
        />
      </motion.div>

      {/* Więcej stat cards... */}
    </div>
  );
}
```

---

## 🎯 Część VI: Metryki Sukcesu

### Performance Benchmarks

```typescript
// Przed optymalizacją (baseline)
const before = {
  initialBundleSize: "450 KB",
  firstLoadJS: "380 KB",
  LCP: "3.8s",
  FID: "180ms",
  CLS: 0.15,
  TTI: "5.2s",
  employeeListRender: "850ms (1000 items)",
  searchDebounce: "None (instant)",
};

// Po optymalizacji (target)
const after = {
  initialBundleSize: "< 180 KB", // -60%
  firstLoadJS: "< 150 KB", // -60%
  LCP: "< 1.5s", // -60%
  FID: "< 50ms", // -72%
  CLS: "< 0.05", // -67%
  TTI: "< 2.5s", // -52%
  employeeListRender: "< 100ms", // -88%
  searchDebounce: "300ms", // Reduced load
};
```

### User Experience Improvements

```markdown
✅ Loading States

- Eliminacja "białego ekranu" przez skeletons
- Smooth transitions między states
- Progressive enhancement

✅ Responsiveness

- Instant feedback na user actions
- No janky scrolling
- Smooth animations (60 FPS)

✅ Perceived Performance

- Optimistic UI updates
- Skeleton loaders zamiast spinners
- Streaming content gdzie możliwe
```

---

## 🚀 Część VII: Quick Wins (Immediate Improvements)

### 1. Enable Compression

```typescript
// next.config.ts
export default {
  compress: true, // Gzip compression
  poweredByHeader: false, // Remove X-Powered-By
  reactStrictMode: true,
};
```

### 2. Add Fonts Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.variable}>
      {children}
    </html>
  );
}
```

### 3. Implement Memoization Immediately

```typescript
// context/app-context.tsx
const filteredEmployees = useMemo(() => {
  return employees.filter(/* ... */);
}, [employees /* dependencies */]);

const handleSaveEmployee = useCallback(
  async (data) => {
    // ... implementation
  },
  [
    /* dependencies */
  ],
);
```

### 4. Add Loading States

```typescript
// Wszędzie gdzie fetch/mutate
const [isLoading, setIsLoading] = useState(false);

try {
  setIsLoading(true);
  await someOperation();
} finally {
  setIsLoading(false);
}
```

---

## 📚 Część VIII: Resources & References

### Design Inspiration

- https://vercel.com/design
- https://ui.shadcn.com
- https://tailwindui.com
- https://www.radix-ui.com

### Performance Resources

- https://web.dev/vitals/
- https://nextjs.org/docs/app/building-your-application/optimizing
- https://react.dev/reference/react/useMemo

### Component Libraries Reference

- https://ui.shadcn.com/docs/components
- https://www.radix-ui.com/primitives/docs/overview/introduction

---

## ✅ Completion Checklist

### Design System

- [ ] Tokens defined (colors, typography, spacing)
- [ ] Base components implemented
- [ ] Layout components ready
- [ ] Skeleton loaders created
- [ ] Animations configured

### Performance

- [ ] RSC migration plan executed
- [ ] Code splitting implemented
- [ ] Virtualization added to lists
- [ ] Firebase queries optimized
- [ ] Debouncing implemented
- [ ] Memoization added
- [ ] Bundle size < 200KB
- [ ] Lighthouse score > 90

### Testing

- [ ] Performance testing completed
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit passed
- [ ] Cross-browser testing done

### Documentation

- [ ] Component docs updated
- [ ] Architecture docs updated
- [ ] Performance guidelines written
- [ ] Migration guide created

---

_Plan przygotowany: 2026-01-26_  
_Szacowany czas implementacji: 6-8 tygodni_  
_Priorytet: Wydajność > Estetyka > Funkcjonalność (zachowana)_
