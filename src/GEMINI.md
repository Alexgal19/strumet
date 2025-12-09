

Note: This document defines working standards for stability, security, accessibility, and code quality with minimal scope changes.

Uwaga: Ten dokument definiuje standardy pracy w zakresie stabilności, bezpieczeństwa, dostępności i jakości kodu przy minimalnej zmianie zakresu.

Tabela Treści
General Rules (Stability and Minimal Scope)

Project Structure and Responsibilities

Import Standards (Absolute Aliases vs. Relative Paths)

AI Operating Rules

AI Output Contract (XML)

TypeScript, Lint, Format, and Build (Quality Requirements)

SSR/CSR/Server Actions and Secret Security

UI/UX, A11y, and Tailwind

Performance and Performance Budget

Testing and Observability

Checklists (Pre-PR and Pre-Deployment)

Minimum Scripts (Recommended)

Date Handling Standard (and Excel Export)

Empty/Nullable Field Handling Rules

1. General Rules (Stability and Minimal Scope)
Traktuj każdą zmianę jako krytyczną. Ogranicz zakres do absolutnego minimum wymaganego przez zadanie.

Nie modyfikuj niepowiązanych komponentów, konfiguracji ani zależności bez wyraźnej konieczności.

Każda zmiana musi przejść pomyślnie: lint, typecheck, build oraz lokalną walidację czasu wykonania (dev runtime validation).

Preferuj małe, czytelne PR-y z jasnym opisem i pełnym diffem.

2. Project Structure and Responsibilities
Logika Biznesowa:

src/lib/actions.ts – Server Actions/handlery.

Usunięto: src/lib/sheets.ts – Google Sheets integration.

Uwaga: Moduły te są "server-only" i nie mogą być importowane w kodzie po stronie klienta.

UI:

General Components: src/components/ui

Functional Components: src/components

Global State:

src/components/main-layout.tsx – MainLayoutContext (dostarczenie danych i operacji, np. handleUpdateSettings, handleAddEmployee).

Routing:

Zgodnie z konwencjami Next.js (app/ lub pages/ – dostosować do faktycznej struktury repozytorium).

3. Import Standards (Absolute Aliases vs. Relative Paths)
Priorytety:

Absolute Aliases (Preferowane): np. import { Foo } from '@/utils/Foo'

Relative (Lokalne): Tylko dla importów z tego samego folderu lub bliskiej odległości (max 1–2 poziomy ../).

Nigdy: Długie łańcuchy ../../../ – używaj aliasów.

Zasady Klarowności:

Jeśli w katalogu istnieje index.ts/tsx, importuj katalog (bez /index).

Pomiń rozszerzenia plików, jeśli bundler na to pozwala.

Zmieniaj ścieżki importu tylko, gdy to konieczne (np. przeniesienie pliku). Zweryfikuj, że plik docelowy istnieje i wszystkie testy przechodzą.

4. AI Operating Rules
Minimal Scope:

Nie dotykaj plików poza zakresem zadania.

Nie wykonuj szerokiego refactoringu bez wyraźnej prośby.

Full Files:

Modyfikując plik, zwracaj całą finalną zawartość pliku (bez diffów), w formacie XML opisanym w Sekcji 5.

No Import Errors:

Nie generuj kodu, który spowoduje błędy "Module not found" lub błędy rozdzielczości typów.

Internal Validation:

Przed wysłaniem odpowiedzi, mentalnie "uruchom" npm run lint, npm run typecheck, npm run build. Kod musi przejść.

Strict Types:

Używaj jawnych typów i interfejsów. Unikaj any, chyba że jest to świadoma, uzasadniona decyzja z komentarzem.

Client/Server Boundary:

Nie importuj bibliotek serwerowych (np. do uwierzytelniania, baz danych) w komponentach klienta ("use client").

Cała praca z sekretami – tylko na serwerze.

Stability and Compliance:

Szanuj istniejące API komponentów i kontrakty typów. Wprowadzaj zmiany łamiące wsteczną kompatybilność tylko z uzasadnieniem i krokami migracji.

Performance-First:

Używaj dynamic import dla ciężkich bibliotek (np. recharts, xlsx) i ładuj je tylko na kliencie, gdy są potrzebne.

A11y-First:

Używaj semantycznego HTML, poprawnych ról ARIA i zarządzania fokusem (szczególnie przy użyciu Radix UI).

5. AI Output Contract (XML)
Każda proponowana zmiana pliku MUSI zostać zwrócona w poniższym formacie XML. Każdy modyfikowany plik jest oddzielnym węzłem <change>. Zawartość pliku musi być kompletna (cały plik), otoczona CDATA.

XML

<changes>
  <description>[Krótki opis wprowadzanych zmian]</description>
  <change>
    <file>[ABSOLUTNA, PEŁNA ścieżka do pliku, np. /src/components/Button.tsx]</file>
    <content><![CDATA[
[PEŁNA, FINALNA ZAWARTOŚĆ PLIKU TUTAJ - bez skrótów, bez diffów]
