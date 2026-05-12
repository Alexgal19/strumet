# Strumet HR — Redesign Specyfikacja

**Data:** 2026-05-12  
**Status:** Zatwierdzony przez użytkownika  
**Zakres:** Pełny redesign UI/UX — layout, kolory, nawigacja, formularz pracownika, mobile

---

## 1. Decyzje projektowe

### 1.1 Kierunek designu: Compact Pro

Odejście od obecnego glassmorphism (rozmyte tła, animowane blobs, białe gradienty tekstu) na rzecz czystego, gęstego układu w stylu GitHub/Jira.

**Co zostaje usunięte:**
- `blob-bg` / `blob-primary` / `blob-accent` w `app-shell.tsx`
- `glass-panel` klasa na `SidebarInset`
- `bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent` w `page-header.tsx`
- Framer Motion animacje (`motion.header`, `fade-in-up`) w `page-header.tsx`
- Shadcn `Sidebar` / `SidebarInset` komponent jako główna nawigacja desktop

### 1.2 Kolory

| Token | Wartość | Zastosowanie |
|-------|---------|--------------|
| `--primary` | `#10b981` (Emerald 500) | Aktywna zakładka, przyciski CTA, avatar |
| `--primary-dark` | `#059669` (Emerald 600) | Hover, gradient avatar |
| `--topbar-bg` | `#111827` (Gray 900) | Górny pasek nawigacji |
| `--topbar-border` | `#1f2937` (Gray 800) | Dolna krawędź top bara |
| `--background` | `#f9fafb` (Gray 50) | Tło treści |
| `--surface` | `#ffffff` | Karty, tabela, formularze |
| `--border` | `#e5e7eb` (Gray 200) | Obramowania |
| `--text-primary` | `#111827` (Gray 900) | Tytuły, dane w tabeli |
| `--text-secondary` | `#6b7280` (Gray 500) | Opisy, etykiety |
| `--text-muted` | `#9ca3af` (Gray 400) | Placeholder, akcje drugorzędne |

**Kolory statusów legalizacji:**
- Uregulowana: `bg #d1fae5`, text `#065f46`
- W trakcie: `bg #fef3c7`, text `#92400e`
- Wygasła: `bg #fee2e2`, text `#991b1b`
- Nie dotyczy: `bg #dbeafe`, text `#1e40af`

### 1.3 Typografia

Bez zmian (Geist/system-ui). Usunąć letter-spacing: -0.03em z nagłówków stron — zastąpić `tracking-tight` (`-0.02em`).

---

## 2. Architektura nawigacji

### 2.1 Desktop (≥ 768px)

**Nowy komponent: `AppTopBar`** (zastępuje `AppSidebar`)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STRUMET HR  │ Pracownicy aktywni │ Zwolnieni │ Planowanie │ ...  🔔 A │
└─────────────────────────────────────────────────────────────────────┘
```

- Stała wysokość: `h-11` (44px), `bg-[#111827]`
- Brand po lewej, zakładki nawigacyjne, ikony (powiadomienia + avatar) po prawej
- Aktywna zakładka: kolor `#10b981`, podkreślenie `border-b-2 border-emerald-500`
- Nieaktywna: `text-gray-500`, hover: `text-gray-200`
- Pozycja: `sticky top-0 z-30`
- Pozycja: Zakładki z pełnym tekstem, bez ikon (desktop ma miejsce)
- Sekcje z ograniczonym dostępem (guest) ukryte tak samo jak dotychczas

**Kolejność zakładek:**
1. Pracownicy aktywni (`/aktywni`)
2. Zwolnieni (`/zwolnieni`)
3. Planowanie (`/planowanie`)
4. Obecność (`/odwiedzalnosc`)
5. Statystyki (`/statystyki`)
6. Odzież (`/wydawanie-odziezy`) — dropdown: Wydawanie, Nowi
7. Karty obiegowe (`/karty-obiegowe`)
8. Odciski (`/odciski-palcow`)
9. Brak logowania (`/brak-logowania`)
10. Konfiguracja (`/konfiguracja`)

Sekcje 6–10 mogą być schowane za dropdown „Więcej ▾" jeśli nie mieszczą się na ekranie (zależy od szerokości viewportu). Implementacja z `overflow-x: auto` na nav lub dropdown dla nadmiarowych pozycji.

**Toolbar strony** (pod top barem, nad tabelą):
```
Pracownicy aktywni (124)    [🔍 Szukaj...]  [Filtruj ▾]  [↑ Eksport]  [+ Dodaj pracownika]
```

### 2.2 Mobile (< 768px)

**Zachowany `AppBottomNav`** (4 zakładki + „Więcej"):

| Ikona | Etykieta | Trasa |
|-------|----------|-------|
| 👥 | Pracownicy | `/aktywni` |
| 📅 | Planowanie | `/planowanie` |
| 📊 | Statystyki | `/statystyki` |
| ⋯ | Więcej | drawer z pozostałymi |

**Nowy mobilny top bar** (uproszczony, bez zakładek):
```
STRUMET HR                              🔔  [A]
[🔍 Szukaj pracownika...              ]
```
- Wyszukiwarka inline w top barze (nie osobny wiersz z inputem)
- Chipy filtrów poniżej top bara: „Wszyscy", „Legalizacja ⚠", [dział], ...

**Mobilna lista pracowników** — karty zamiast tabeli:
```
┌────────────────────────────────────┐
│ [K]  Kowalski Jan           [OK]   │
│      Produkcja A · Spawacz         │
└────────────────────────────────────┘
```
- Avatar: inicjał imienia + gradient kolorowy (deterministyczny na podstawie indeksu)
- Badge statusu legalizacji po prawej
- Kliknięcie → pełna strona pracownika

---

## 3. Strona listy pracowników (`/aktywni`, `/zwolnieni`)

### Desktop — tabela

Zachowuje TanStack Table + TanStack Virtual (bez `getPaginationRowModel`).

**Kolumny (w tej kolejności):**
Pracownik | Dział | Stanowisko | Kierownik | Legalizacja | Nr karty | Akcje (•••)

**Wygląd tabeli:**
- `bg-white border border-gray-200 rounded-lg overflow-hidden`
- Header: `bg-gray-50 border-b border-gray-200`
- Wiersze: hover `bg-gray-50`, alternating rows opcjonalnie
- Akcje (•••): Popover z opcjami: Edytuj, Drukuj odzież, Zwolnij, Usuń

### Mobile — lista kart

Wirtualizowana lista kart (TanStack Virtual), nie tabela.

---

## 4. Pełna strona pracownika (`/pracownicy/[id]`)

**Nowa trasa:** `src/app/(app)/pracownicy/[id]/page.tsx`

Zastępuje otwieranie `Dialog` z `EmployeeForm` wewnątrz stron list.

### Layout strony

```
Top bar z breadcrumb: STRUMET HR > Pracownicy aktywni > Kowalski Jan

┌────────────────────────────────────────────────────────────┐
│ [K]  Kowalski Jan                   [Drukuj] [Zwolnij] [Zapisz] │
│      Spawacz · Produkcja A · od 01.03.2023 · KR-0042           │
├────────────────────────────────────────────────────────────┤
│ DANE OSOBOWE                                               │
│ [Imię i nazwisko] [Narodowość]  [Data zatrudnienia]        │
├────────────────────────────────────────────────────────────┤
│ STANOWISKO                                                 │
│ [Stanowisko]     [Dział]        [Kierownik]                │
├────────────────────────────────────────────────────────────┤
│ IDENTYFIKACJA                                              │
│ [Nr karty]       [Nr szafki]    [Nr szafki w dziale]       │
│ [Nr pieczęci]    [Licencja spawacza]                        │
├────────────────────────────────────────────────────────────┤
│ PLANOWANIE                                                 │
│ [Planowane zwolnienie] [Urlop od] [Urlop do]               │
├────────────────────────────────────────────────────────────┤
│ LEGALIZACJA                                                │
│ [Status legalizacyjny]                                     │
└────────────────────────────────────────────────────────────┘
```

### Nawigacja do strony pracownika

- Kliknięcie wiersza tabeli (desktop) lub karty (mobile) → `router.push('/pracownicy/' + id)`
- Breadcrumb w top barze wskazuje skąd przyszedł użytkownik (aktywni / zwolnieni)
- Powrót: przycisk „← Wróć" lub breadcrumb klik

### Akcje na stronie pracownika

| Akcja | Zachowanie |
|-------|-----------|
| Zapisz zmiany | `handleSaveEmployee()` z kontekstu, toast potwierdzenia |
| Zwolnij | Alert dialog potwierdzenia → `handleTerminateEmployee()` → redirect do `/zwolnieni` |
| Drukuj | `window.print()` → formularz odzieży w `.print-only` |
| ← Wróć | `router.back()` |

### Refaktoring EmployeeForm

Obecny `EmployeeForm` to komponent z propsami `onSave`, `onCancel`, `onTerminate`, `onPrintClothing`.  
Na nowej stronie:
- Akcje wywoływane bezpośrednio (bez callbacków przez Dialog)
- Komponent może zostać przepisany lub zaadaptowany inline
- Dialog z odzieżą nadal renderowany na poziomie strony (nie w Dialog-in-Dialog)

---

## 5. AppShell — zmiany

**Plik:** `src/components/app-shell.tsx`

Usunąć:
- `<div className="blob-bg blob-primary ...">` i `<div className="blob-bg blob-accent ...">`
- `SidebarInset` jako wrapper głównej treści
- `glass-panel` klasa

Zastąpić:
```tsx
<div className="flex h-dvh flex-col overflow-hidden">
  <AppTopBar pathname={pathname} />           // nowy komponent
  <main className="flex-1 overflow-y-auto bg-gray-50">
    {children}
  </main>
  <AppBottomNav pathname={pathname} />        // istniejący (zaktualizowany)
</div>
```

---

## 6. globals.css — zmiany

### Usunąć
- `.blob-bg`, `.blob-primary`, `.blob-accent`
- `.glass-panel`
- `.text-gradient-primary`, `.bg-gradient-primary`
- `.glow-primary`, `.glow-accent` box-shadow

### Zaktualizować CSS variables

```css
:root {
  --background: 210 20% 98%;        /* #f9fafb */
  --foreground: 220 13% 9%;         /* #111827 */
  --card: 0 0% 100%;
  --primary: 160 84% 39%;           /* #10b981 emerald-500 */
  --primary-foreground: 0 0% 100%;
  --border: 220 9% 90%;             /* #e5e7eb */
  --muted: 220 9% 96%;              /* #f3f4f6 */
  --muted-foreground: 220 9% 44%;   /* #6b7280 */
  --radius: 0.5rem;                  /* 8px — mniej zaokrąglony */
}
```

Dark mode: opcjonalnie zachowany, ale nie priorytet w tej iteracji.

---

## 7. Komponenty do stworzenia / zmodyfikowania

| Komponent | Akcja | Opis |
|-----------|-------|------|
| `AppTopBar` | Nowy | Górna nawigacja desktop z zakładkami |
| `AppShell` | Modyfikacja | Usunięcie blobów, glass-panel, SidebarInset |
| `AppBottomNav` | Modyfikacja | Dostosowanie do nowych kolorów |
| `AppSidebar` | Usunięcie | Zastąpiony przez AppTopBar |
| `PageHeader` | Modyfikacja | Usunięcie gradient tekstu i Framer Motion |
| `src/app/(app)/pracownicy/[id]/page.tsx` | Nowy | Pełna strona pracownika |
| `EmployeeTable` (mobile) | Modyfikacja | Nowy widok kart na mobile |
| `globals.css` | Modyfikacja | Nowe CSS variables, usunięcie klas dekoracyjnych |

---

## 8. Co zostaje bez zmian

- Firebase RTDB, Auth, Admin SDK
- Cała logika biznesowa (`app-context.tsx`, `lib/actions/`)
- TanStack Table + TanStack Virtual (wirtualizacja)
- shadcn/ui komponenty (Dialog, Button, Badge, etc.)
- i18n PL/EN (`pl.ts`, `en.ts`)
- OCR (passport-scanner), eksport Excel, drukowanie
- API routes (`/api/cron/*`, `/api/archives/list`)
- PWA (service worker, manifest)

---

## 9. Kolejność implementacji (wskazówka dla planu)

1. `globals.css` — nowe tokeny kolorów, usunięcie klas dekoracyjnych
2. `AppTopBar` — nowy komponent desktop nawigacji
3. `AppShell` — podmiana struktury layoutu
4. `PageHeader` — uproszczenie (usunięcie gradient, animacji)
5. `AppBottomNav` — aktualizacja kolorów
6. Trasa `/pracownicy/[id]` + pełna strona pracownika
7. Mobilny widok kart w listach pracowników
8. Testy `npm run build`
