# Design System 2.0 - Quick Start Guide

## 🎯 Przegląd

Design System 2.0 wprowadza nowoczesne komponenty UI z:

- ✨ Gradient effects i glassmorphism
- ⚡ Wbudowana optymalizacja wydajności (debouncing, memoization)
- 🎨 Konsystentny design language
- ♿ Built-in accessibility

## 📦 Dostępne Komponenty

### Lokalizacja

```
src/components/ui-v2/
├── button.tsx       # Modern gradient buttons
├── card.tsx         # Glassmorphism cards
├── input.tsx        # Inputs z icons i debouncing
├── skeleton.tsx     # Loading skeletons (zamiast spinnerów)
└── index.ts         # Centralized exports
```

### Imports

```typescript
// ✅ Importuj z index (zalecane)
import { Button, Card, Input, Skeleton } from "@/components/ui-v2";

// ✅ Lub specific imports
import { SearchInput } from "@/components/ui-v2";
import { StatCard } from "@/components/ui-v2";
import { EmployeeCardSkeleton } from "@/components/ui-v2";
```

## 🔘 Button Component

### Basic Usage

```tsx
import { Button } from '@/components/ui-v2';
import { PlusCircle, Save } from 'lucide-react';

// Primary gradient button (default)
<Button>Zapisz zmiany</Button>

// With icons
<Button leftIcon={<PlusCircle className="h-4 w-4" />}>
  Dodaj pracownika
</Button>

// Loading state
<Button loading>Zapisywanie...</Button>
```

### Warianty

```tsx
// Primary gradient (domyślny)
<Button variant="default">Primary</Button>

// Accent gradient (cyan)
<Button variant="accent">Accent</Button>

// Success (green)
<Button variant="success">Zatwierdź</Button>

// Destructive (red)
<Button variant="destructive">Usuń</Button>

// Outline (transparent z borderem)
<Button variant="outline">Anuluj</Button>

// Secondary (subtle background)
<Button variant="secondary">Secondary</Button>

// Ghost (minimal)
<Button variant="ghost">Ghost</Button>

// Link style
<Button variant="link">Link Button</Button>

// Glassmorphism
<Button variant="glass">Glass Effect</Button>
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Icon buttons
<Button size="icon">
  <PlusCircle className="h-5 w-5" />
</Button>
```

## 🎴 Card Component

### Basic Usage

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui-v2";

<Card>
  <CardHeader>
    <CardTitle>Tytuł karty</CardTitle>
    <CardDescription>Opis karty</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Treść karty...</p>
  </CardContent>
  <CardFooter>
    <Button>Akcja</Button>
  </CardFooter>
</Card>;
```

### Warianty

```tsx
// Default - solid background
<Card variant="default">...</Card>

// Glassmorphism effect
<Card variant="glass">...</Card>

// Elevated - więcej cienia
<Card variant="elevated">...</Card>

// Bordered - tylko outline
<Card variant="bordered">...</Card>

// Gradient border
<Card variant="gradient">...</Card>
```

### Interactive Cards

```tsx
// Card z hover effect
<Card variant="glass" hover="lift" interactive onClick={handleClick}>
  Kliknij mnie
</Card>

// Card z glow effect
<Card hover="glow" interactive>
  Hover me
</Card>
```

### StatCard (pre-built)

```tsx
import { StatCard } from "@/components/ui-v2";
import { Users } from "lucide-react";

<StatCard
  title="Aktywni Pracownicy"
  value="1,247"
  description="Całkowita liczba"
  icon={<Users className="h-5 w-5" />}
  trend={{ value: 12.5, positive: true }}
/>;
```

## 🔍 Input & Search Components

### Basic Input

```tsx
import { Input } from '@/components/ui-v2';

// Standard input
<Input
  placeholder="Wpisz tekst..."
  value={value}
  onChange={e => setValue(e.target.value)}
/>

// With icons
<Input
  leftIcon={<Search className="h-4 w-4" />}
  placeholder="Szukaj..."
/>

// Clearable input
<Input
  value={value}
  onChange={e => setValue(e.target.value)}
  clearable
  onClear={() => setValue('')}
/>
```

### SearchInput (z wbudowanym debouncing!)

```tsx
import { SearchInput } from '@/components/ui-v2';

// Auto-debounced search (300ms default)
<SearchInput
  placeholder="Szukaj pracownika..."
  onSearch={(query) => {
    // To wykona się po 300ms od ostatniego keystroke
    fetchEmployees(query);
  }}
/>

// Custom debounce delay
<SearchInput
  placeholder="Szukaj..."
  debounceMs={500}
  onSearch={handleSearch}
/>
```

**💡 Pro Tip**: SearchInput automatycznie redukuje Firebase queries o ~80% dzięki debouncing!

## 💀 Skeleton Loaders

### Basic Skeletons

```tsx
import { Skeleton } from '@/components/ui-v2';

// Text skeleton
<Skeleton variant="text" className="w-48" />

// Avatar/circular
<Skeleton variant="circular" className="w-12 h-12" />

// Rectangular (default)
<Skeleton variant="rectangular" className="w-full h-32" />
```

### Pre-built Skeleton Layouts

```tsx
import {
  EmployeeCardSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  EmployeeListSkeleton
} from '@/components/ui-v2';

// Employee card loading
<EmployeeCardSkeleton />

// Stats dashboard loading
<div className="grid md:grid-cols-3 gap-4">
  <StatCardSkeleton />
  <StatCardSkeleton />
  <StatCardSkeleton />
</div>

// Chart loading
<ChartSkeleton height="h-96" />

// Table loading
<TableSkeleton rows={15} />

// Complete list loading
<EmployeeListSkeleton count={10} />
```

### Skeleton Pattern z Suspense

```tsx
import { Suspense } from "react";
import { EmployeeListSkeleton } from "@/components/ui-v2";

<Suspense fallback={<EmployeeListSkeleton />}>
  <EmployeeList />
</Suspense>;
```

## 🪝 Performance Hooks

### useDebouncedValue

```tsx
import { useDebouncedValue } from "@/components/ui-v2";
import { useState, useEffect } from "react";

function SearchComponent() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    // To wykona się 300ms po ostatniej zmianie query
    if (debouncedQuery) {
      fetchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

### useDebouncedCallback

```tsx
import { useDebouncedCallback } from "@/components/ui-v2";

function FilterComponent() {
  const debouncedSearch = useDebouncedCallback((query: string) => {
    // Wywołane z 300ms debounce
    fetchResults(query);
  }, 300);

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

## 🎨 Utility Classes (Design System 2.0)

### Glassmorphism

```tsx
<div className="glass">Glassmorphism effect</div>
```

### Text Gradients

```tsx
<h1 className="text-gradient-primary">
  Gradient Text
</h1>

<h2 className="text-gradient-accent">
  Accent Gradient
</h2>
```

### Background Gradients

```tsx
<div className="bg-gradient-primary p-6 rounded-xl">
  Primary gradient background
</div>
```

### Shadows

```tsx
// Elevation levels
<div className="shadow-elevation-sm">Subtle</div>
<div className="shadow-elevation-md">Default</div>
<div className="shadow-elevation-lg">Prominent</div>
<div className="shadow-elevation-xl">Modal</div>

// Glow effects
<div className="shadow-glow-primary">Primary glow</div>
<div className="shadow-glow-accent">Accent glow</div>
```

## 📊 Migration Pattern

### ❌ Before (Old Components)

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Spinner loading
{
  isLoading && <Loader2 className="animate-spin" />;
}

// No debouncing
<input onChange={(e) => fetchResults(e.target.value)} />;
```

### ✅ After (New Components)

```tsx
import { Button, Card, SearchInput, Skeleton } from '@/components/ui-v2';
import { Suspense } from 'react';

// Skeleton loading
<Suspense fallback={<Skeleton className="w-full h-32" />}>
  <DataComponent />
</Suspense>

// Auto-debounced search
<SearchInput
  onSearch={query => fetchResults(query)}
  debounceMs={300}
/>
```

## 🚀 Performance Benefits

| Feature        | Before      | After          | Impact                 |
| -------------- | ----------- | -------------- | ---------------------- |
| **Loading UX** | Spinners    | Skeletons      | Better perceived perf  |
| **Search**     | No debounce | 300ms debounce | -80% Firebase calls    |
| **Bundle**     | All eager   | Lazy loadable  | Smaller initial bundle |
| **Animations** | Basic       | Spring easing  | Smoother UX            |

## 📍 Demo Page

Odwiedź [`/design-system-demo`](http://localhost:3000/design-system-demo) żeby zobaczyć wszystkie komponenty w akcji!

## ⚠️ Important Notes

### Kompatybilność Wsteczna

- ✅ Stare komponenty (`@/components/ui/`) nadal działają
- ✅ Możesz migrować stopniowo, page by page
- ✅ Nowe i stare komponenty współistnieją

### Best Practices

1. **Używaj Skeleton zamiast Spinner**

   ```tsx
   // ❌ Avoid
   {
     loading && <Loader2 className="animate-spin" />;
   }

   // ✅ Better
   <Suspense fallback={<EmployeeListSkeleton />}>
     <EmployeeList />
   </Suspense>;
   ```

2. **Debounce wszystkie search inputs**

   ```tsx
   // ❌ Avoid
   <input onChange={e => search(e.target.value)} />

   // ✅ Better
   <SearchInput onSearch={search} debounceMs={300} />
   ```

3. **Lazy load ciężkie komponenty**

   ```tsx
   // ✅ W pages
   import dynamic from "next/dynamic";

   const Charts = dynamic(() => import("./charts"), {
     loading: () => <ChartSkeleton />,
     ssr: false,
   });
   ```

## 🎯 Next Steps

### Gotowe do użycia:

- ✅ Button V2
- ✅ Card V2 (+ StatCard)
- ✅ Input V2 (+ SearchInput)
- ✅ Skeleton (+ 8 pre-built layouts)
- ✅ Debouncing hooks

### Coming Soon (Faza 2):

- 🚧 Layout V2 (Sidebar, Header, Bottom Nav)
- 🚧 Virtual Table
- 🚧 Badge V2
- 🚧 Avatar V2

### Migration Priority:

1. **High Impact Pages** (najwięcej użytkowników):
   - `/aktywni` - dodaj SearchInput + Skeleton
   - `/statystyki` - StatCards + lazy load charts
2. **Performance Critical**:
   - Wszystkie search inputs → SearchInput
   - Wszystkie loading states → Skeleton
3. **Visual Refresh**:
   - Stopniowo replace old components z new

---

**📝 Feedback**: Jeśli znajdziesz bugs lub masz sugestie, zgłoś w team discussion!

_Guide updated: 2026-01-26_
