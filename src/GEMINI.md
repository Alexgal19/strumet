
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
]]></content>
  </change>
</changes>
Wymagania:

Używaj ścieżek absolutnych od korzenia repozytorium (np. /CONTRIBUTING.md, /src/components/Button.tsx).

Nie pomijaj fragmentów (brak elizji). Zawsze podawaj pełną zawartość.

Nie dodawaj komentarzy poza strukturą XML, które mogłyby zakłócić parser.

6. TypeScript, Lint, Format, and Build (Quality Requirements)
TypeScript:

Preferuj: "strict": true, noImplicitAny, noUncheckedIndexedAccess, exactOptionalPropertyTypes.

Dodaj typy dla środowiska (np. env.d.ts) i dla modułów serwerowych, jeśli używane.

ESLint:

Zgodność z eslint-config-next oraz @typescript-eslint.

Wyklucz .next, node_modules, dist, .turbo, coverage.

Sugerowane Skrypty:

JSON

"typecheck": "tsc --noEmit"
"format": "prettier . --write"
"format:check": "prettier . --check"
"lint:ci": "eslint . --max-warnings=0"
Build:

Kod musi przejść npm run build bez błędów i krytycznych ostrzeżeń.

Nie dopuszczaj do importu bibliotek serwerowych po stronie klienta.

7. SSR/CSR/Server Actions and Secret Security
Sekrety i biblioteki serwerowe (np. do uwierzytelniania, baz danych) – tylko w środowisku serwerowym (API routes, Server Actions, route handlers).

Nigdy nie używaj NEXT_PUBLIC_* dla sekretów.

Waliduj dane wejściowe po stronie serwera (zod) i zwracaj kontrolowane błędy (status, message).

Rozważ retry/backoff dla błędów 429/5xx. Loguj błędy z kontekstem (bez danych wrażliwych).

8. UI/UX, A11y, and Tailwind
Core Principles & Layout:
Mobile-First: Cały rozwój UI musi być zgodny z podejściem Mobile-First. Projektuj najpierw dla małych ekranów, a następnie używaj zapytań mediów min-width (np. md:, lg: w Tailwind) dla większych widoków.

Modern Layout: Domyślnie używaj CSS Grid i Flexbox dla głównych struktur układu i wyrównania komponentów. Unikaj przestarzałych metod układu (np. float).

A11y:
Semantic HTML5: Używaj poprawnych elementów (header, main, nav, footer).

ARIA: Używaj ról ARIA tylko tam, gdzie jest to konieczne. Używaj aria-live dla dynamicznych komunikatów (toast/status).

Radix UI: Zadbaj o poprawne role, atrybuty aria-* i zarządzanie fokusem. Korzystaj z dostępnych wzorców.

Responsiveness & Modern CSS:
Fluid Design: Używaj płynnej typografii i odstępów (np. clamp(), min(), max()) tam, gdzie jest to stosowne.

Relative Units: Preferuj jednostki względne (rem, em) nad statycznym px dla skalowalności i dostępności.

CSS Variables: Aktywnie używaj niestandardowych właściwości CSS (Variables) do tematyzowania (np. var(--primary-color)), jeśli nie jest to obsługiwane przez Tailwind's theme().

Logical Properties: Używaj Logical Properties (np. margin-inline-start zamiast margin-left) dla automatycznego wsparcia RTL.

Tailwind:
Stosuj utility-first, ale zachowaj czytelność komponentów i SRP (Single Responsibility Principle).

Upewnij się, że tailwind.config content obejmuje wszystkie źródła (app/, src/, components/**/).

Unikaj FOUC/CLS (Flash of Unstyled Content / Cumulative Layout Shift).

Animations & Microinteractions:
Purpose: Animacje muszą być subtelne i celowe (dostarczać feedback, prowadzić użytkownika, potwierdzać akcje) i poprawiać UX, a nie odwracać od niego uwagi.

Performance: Priorytetyzuj 60 FPS. Animuj transform (translate, scale, rotate) i opacity (przyjazne dla GPU).

Avoid: Nie animuj właściwości obciążających układ (np. width, height, margin), ponieważ powodują "reflow".

Modern APIs: Tam, gdzie jest to stosowne, rozważ View Transitions API dla zmian stron/widoków lub Scroll-driven Animations dla efektów opartych na przewijaniu.

Forms:
Używaj react-hook-form + zodResolver po stronie klienta.

Cała walidacja musi być powtórzona na serwerze (np. w Server Actions).

9. Performance and Performance Budget
Code splitting i dynamic import dla ciężkich bibliotek (recharts, xlsx) i rzadko odwiedzanych widoków.

Lazy-load obrazów i komponentów poza viewportem.

Unikaj niepotrzebnych re-renderów (memo, useCallback/useMemo tam, gdzie jest to stosowne).

Kontroluj rozmiar bundla. Eliminuj nieużywane zależności i importy.

Preload/preconnect krytyczne zasoby, gdy jest to uzasadnione.

10. Testing and Observability
Tests:
Przynajmniej smoke tests dla krytycznych komponentów i kluczowych przepływów (np. upload pliku, główne formularze).

Waliduj schematy zod – testuj przykładowe ładunki (dobre/złe).

Observability:
Logowanie po stronie serwera z kontekstem (request id, user id – jeśli dostępne).

Spójny format błędów API (code, message, details?).

Zachowaj ostrożność, aby nie logować sekretów.

11. Checklists
Przed wysłaniem PR
[ ] Zmiany są ograniczone do wymaganych plików.

[ ] Kod przechodzi pomyślnie npm run lint, npm run typecheck, npm run build.

[ ] Brak importów serwerowych w kodzie klienta.

[ ] Zgodność ze standardami importu (aliasy > względne).

[ ] Walidacja danych (zod) dla endpointów/API.

[ ] Sprawdzone UI/A11y (klawiatura, aria, kontrasty).

[ ] Dynamiczny import dla ciężkich modułów, jeśli ma zastosowanie.

Przed wdrożeniem
[ ] Zmienne środowiskowe są ustawione (brak sekretów w NEXT_PUBLIC_*).

[ ] Monitoring/logi działają, błędy są poprawnie raportowane.

[ ] Brak krytycznych ostrzeżeń w buildzie.

[ ] Akceptowalna wydajność i rozmiar bundla.

12. Minimum Scripts (Recommended in package.json)
JSON

"typecheck": "tsc --noEmit",
"format": "prettier . --write",
"format:check": "prettier . --check",
"lint:ci": "eslint . --max-warnings=0"
13. Date Handling Standard (and Excel Export)
Cel: Ujednolicenie formatowania i parsowania dat w całym projekcie oraz uniknięcie błędów typu "formatDate is not defined".

13.1 General Rules
Centralizacja: Wszystkie operacje na datach muszą być wykonywane przez wspólne pomocniki w module: /src/lib/date.ts.

Zabronione: Wywoływanie nieistniejących/niezaimportowanych funkcji typu formatDate w plikach eksportu Excela czy komponentach. Jeśli formatowanie jest potrzebne – użyj funkcji z /src/lib/date.ts.

Biblioteka: Używamy date-fns. Nie wywołuj funkcji, które nie istnieją w date-fns (np. formatDate nie jest funkcją date-fns). Zamiast tego użyj format z date-fns lub pomocników z /src/lib/date.ts.

Typy: Zawsze operuj na obiektach Date lub bezpiecznie parsowanych string/number do Date przed formatowaniem.

13.2 Helper Contract (File /src/lib/date.ts must exist)
Moduł /src/lib/date.ts musi eksportować co najmniej:

formatDate(input: Date | string | number, pattern?: string): string

Domyślny wzorzec: "yyyy-MM-dd"

Zasady: Jeśli input jest stringiem – spróbuj parseISO, w przeciwnym razie new Date(input). Jeśli data jest nieprawidłowa, zwróć pusty string lub rzuć kontrolowany błąd (w zależności od przypadku użycia).

formatDateTime(input: Date | string | number, pattern?: string): string

Domyślny wzorzec: "yyyy-MM-dd HH:mm"

parseMaybeDate(input: Date | string | number): Date | null

Zwraca Date lub null, bez rzucania wyjątków.

isValidDate(input: unknown): boolean

true, jeśli jest to prawidłowy obiekt Date (i nie NaN).

Wszyscy konsumenci (UI, API, eksport Excela) muszą importować wyłącznie z @/lib/date.

13.3 Usage Rules in Excel Export (xlsx)
Formatting before saving:

Daty do Excela muszą być zapisywane jako sformatowane stringi za pomocą formatDate lub formatDateTime. Sugerowane formaty w UI: "dd.MM.yyyy" dla dat, "dd.MM.yyyy HH:mm" dla dat z czasem.

Input Validation:

Jeśli źródło daty jest stringiem (np. z API), zawsze używaj parseMaybeDate i sprawdzaj isValidDate przed formatowaniem. Jeśli data jest nieprawidłowa – zapisz pusty string lub oznacz w raporcie jako "Invalid Date".

Imports:

Zabronione: Lokalna definicja funkcji o nazwie formatDate w plikach eksportu. Zawsze importuj z @/lib/date.

Column Consistency:

Kolumny dat w raporcie muszą używać jednego spójnego formatu (np. "dd.MM.yyyy").

13.4 AI Rules (Date and Excel)
Jeśli zobaczysz wywołanie formatDate bez importu z @/lib/date, dodaj poprawny import i użyj pomocnika.

Jeśli pomocnik nie istnieje – najpierw utwórz /src/lib/date.ts zgodnie z kontraktem w sekcji 13.2, a dopiero potem modyfikuj pliki eksportu.

Nie zastępuj formatDate nieistniejącymi funkcjami date-fns. date-fns używa funkcji format. Pomocnicy opakowują format i parsowanie.

Przed zwróceniem zmian, mentalnie zweryfikuj, że import @/lib/date jest poprawny (aliasy) i że kod przejdzie lint/typecheck/build.

13.5 Checklist (Dates/Excel)
[ ] Plik /src/lib/date.ts istnieje i eksportuje: formatDate, formatDateTime, parseMaybeDate, isValidDate.

[ ] Wszędzie, gdzie formatuję daty (UI, API, Excel), używam pomocników z @/lib/date.

[ ] Stringi dat są zawsze parsowane (parseMaybeDate), a nieparowalne traktowane są jako puste.

[ ] W Excelu używany jest spójny format ("dd.MM.yyyy" lub "dd.MM.yyyy HH:mm").

[ ] Brak lokalnych, ad-hoc funkcji formatDate w innych plikach.

14. Empty/Nullable Field Handling Rules
14.1 Definitions and General Rules
Dozwolone puste stany: null, undefined, pusty string "" (po trim: "" jest traktowane jako puste).

Brak błędu: Puste pole nie generuje błędu walidacji, chyba że pole jest oznaczone jako wymagane.

Normalizacja: Przed dalszym przetwarzaniem, wszystkie pola tekstowe są przycinane (trim). Puste wartości są normalizowane do null lub "" zgodnie z kontekstem.

Spójność: Ten sam atrybut (np. nazwisko, data) musi mieć spójne zasady pustości w całej aplikacji (UI, API, Excel).

14.2 Validation (zod) – Contract
Pola opcjonalne:

Użyj z.string().optional().transform(v => (v?.trim() ? v.trim() : "")), gdy chcesz przechowywać "".

Lub z.string().optional().transform(v => (v?.trim() ? v.trim() : null)), gdy chcesz przechowywać null.

Pola wymagane:

Użyj z.string().min(1, "Required Field"), ale zastosuj transform/trim wcześniej.

Opcjonalne daty:

Użyj z.union([z.string(), z.date()]).optional().transform(v => { /* ... */ }) (logika wewnątrz transform musi obsługiwać null i parsowanie stringów).

Nigdy nie rzucaj błędu wyłącznie dlatego, że pole jest puste, jeśli jest ono oznaczone jako opcjonalne w schemacie.

14.3 UI (Forms and Views)
Forms:

Dla pól opcjonalnych, nie pokazuj błędu walidacji dla pustej wartości.

Wyświetlaj puste wartości jako placeholder lub pusty input.

Table/Lists:

Renderuj puste wartości jako "—", "N/A" lub pustą komórkę, spójnie z design systemem.

Nie używaj czerwonych toastów/alertów tylko z powodu brakującej wartości.

A11y:

Dla elementów opisowych (np. aria-label), nie wstawiaj "undefined" ani "null". Używaj sensownych fallbacków, np. "Brak dostępnych danych".

14.4 Excel Export (xlsx) – Empty Fields
Text:

Jeśli wartość jest pusta po normalizacji → zapisz "" (pusta komórka) lub "—" (jeśli wymagany jest wizualny placeholder).

Dates:

Jeśli parseMaybeDate zwraca null → zapisz pusty string "" (nie formatuj).

Nie rzucaj błędu; eksport musi być stabilny przy danych mieszanych/niekompletnych.

Numbers:

Jeśli pole jest opcjonalne i brakuje wartości → zapisz "" (nie 0, chyba że domena wymaga 0 jako domyślnej).

Required Columns:

Jeśli kolumna jest wymagana domenowo, ale wartość jest pusta → nie przerywaj eksportu. Zapisz "" i zawrzyj ostrzeżenia w raporcie (np. lista w logach/konsoli lub metadata raportu), ale nie traktuj tego jako krytycznego błędu.

14.5 Backend/API
In Endpoints and Server Actions:

Normalizuj puste wejścia: puste stringi → "", null/undefined → null (spójnie z modelem).

Waliduj za pomocą schematu zod: pola opcjonalne nie generują błędów.

Nie zwracaj 4xx wyłącznie dlatego, że pole opcjonalne jest puste.

Logging:

Loguj tylko nieoczekiwane błędy (np. typ niezgodny z kontraktem, błąd parsowania w wymaganym polu). Puste pola opcjonalne nie są błędami.

14.6 AI Rules (Empty Handling)
Jeśli widzisz błąd generowany przez puste pole, a pole nie jest wymagane – usuń błąd i zastosuj normalizację + cichy fallback ("" lub null).

Dla formatu daty: jeśli wartość jest pusta lub nieparowalna → zwróć "" bez błędu typu toast. W UI można pokazać subtelną odznakę "Brak".

W eksporcie Excela nigdy nie przerywaj procesu z powodu pustych pól. Zastosuj fallbacki i kontynuuj.

Przed odpowiedzią, zweryfikuj, że schematy zod dopuszczają pustość dla pól oznaczonych jako opcjonalne.

14.7 Checklist (Empty/Nullable)
[ ] Schematy Zod rozróżniają required vs optional i nie zwracają błędów dla pustych pól opcjonalnych.

[ ] UI nie pokazuje błędów typu toast dla pustych pól opcjonalnych – używa placeholderów.

[ ] Excel Export zapisuje "" dla pustych pól opcjonalnych (tekst/liczby/daty).

[ ] parseMaybeDate zwraca null dla pustych/nieparowalnych wartości; formatDate zwraca "" dla null.

[ ] Brak przerwania przepływu (import/export/submit) z powodu pustych pól opcjonalnych.

Final Notes
Jeśli zadanie wymaga zmiany struktur danych lub API, opisz migrację i wpływ na istniejące ekrany/komponenty.

Preferuj klarowność nad "pomysłowością". Kod musi być łatwy w utrzymaniu przez zespół.