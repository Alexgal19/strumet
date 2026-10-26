# Optymizacja UI aplikacji Baza-ST (plan MVP)

Cel: aplikacja prosta, czytelna, wygodna na telefonie i spójna wizualnie. Zakres: cała aplikacja, etapami.
Priorytety wybrane przez właściciela: **prostota**, **czytelność i kontrast**, **telefon i szybkość**, **spójny wygląd**.

Zasada pracy: jeden etap = jeden commit (lub kilka małych) + `npm run verify` (mobile check, lint, tsc) + testy + podgląd w przeglądarce. Każdy etap robimy po akceptacji.

---

## Stan wyjściowy (audyt)

| # | Obserwacja | Dowód |
|---|---|---|
| 1 | Menu ma ponad 20 pozycji w 5 sekcjach, a na co dzień używane są 4 | `src/components/app-navigation.ts` |
| 2 | Strona `design-system-demo` (532 linie) jest dostępnym adresem w produkcji | `src/app/(app)/design-system-demo/page.tsx` |
| 3 | Dużo drobnego tekstu (`text-xs`, 9–11 px) | `director-report-card` 24×, `rekrutacja` 21×, `statystyki` 20×, `pulpit` 12× |
| 4 | Dużo szarego tekstu `text-muted-foreground` | `statystyki` 34×, `harmonogram-view` 29×, `rekrutacja` 24×, `pulpit` 16× |
| 5 | Małe przyciski (`h-6/h-7/h-8`) niewygodne na telefonie | `harmonogram` 25×, `statystyki` 11×, `rekrutacja` 6× |
| 6 | Tabele bez przewijania poziomego / szeroki stały rozmiar | `scripts/check-mobile-ui.mjs`: 14× `UNWRAPPED_TABLE` (`car-table`, `employee-table`, `konfiguracja`), 1× `FIXED_LARGE_WIDTH` (`kolejnosc-nazwisk`) |
| 7 | Bardzo duże pliki stron | `harmonogram` 1489, `rekrutacja` 1413, `statystyki` 1287, `szafki` 912, `konfiguracja` 858, `pulpit` 707 linii |
| 8 | Cztery motywy (latte, mocha, frappe, macchiato) i dużo łatek koloru w `globals.css` | `src/app/globals.css` |
| 9 | Błąd hydracji `<html className="light">` (mignięcie motywu) | konsola przeglądarki |
| 10 | Komentarze przy tokenach kolorów nie zgadzają się z wartościami | `globals.css` (`--foreground`, `--muted-foreground`) |

Stan techniczny: `button.tsx` ma rozmiary `sm: h-9`, `icon: h-10 w-10`; `tailwind.config.ts` ma `fontSize.xs = 12px`; `--muted-foreground` w jasnym motywie = `240 8% 18%`, w ciemnych `240 5% 62%`.

---

## Etap 1. Czytelność i kontrast (ryzyko: niskie)

Cel: żaden tekst roboczy poniżej 13 px, tekst drugoplanowy ma kontrast jak tekst główny, przyciski wygodne dla palca.

1. **Tokeny kolorów** (`globals.css`)
   - Podnieść `--muted-foreground` we wszystkich motywach: jasny → bliżej `--foreground` (np. `240 8% 12%`), ciemne → jaśniejszy (np. `240 5% 78%`).
   - Poprawić komentarze przy tokenach, żeby odpowiadały wartościom.
   - Zachować łatki kolorów semantycznych (zielony/czerwony) tylko tam, gdzie są potrzebne; usunąć duplikaty po poprawie tokenów.
2. **Skala typografii** (`tailwind.config.ts`)
   - `text-xs` z 12 px na 13 px (`0.8125rem`, line-height `1.15rem`) — jedna zmiana poprawia całą aplikację.
   - Zamienić arbitralne `text-[9px]`, `text-[10px]`, `text-[11px]` na `text-xs` (poza formularzami do druku, które mają style inline).
3. **Rozmiary dotykowe** (`src/components/ui/button.tsx`)
   - `sm`: `h-10 sm:h-9`; `icon`: `h-10 w-10` (bez zmian na telefonie, zostaje); dodać wariant `icon-sm` dla gęstych tabel na desktopie (`h-8 w-8 md:h-8`, na telefonie `h-10 w-10`).
   - Przejrzeć strony z ręcznym `h-6/h-7/h-8` (`harmonogram`, `statystyki`, `rekrutacja`, `konfiguracja`, `car-table`) i zamienić na warianty z komponentu.
4. **Tabele na telefonie**
   - Owinąć tabele z raportu skryptu `check-mobile-ui` w `overflow-x-auto` (`car-table`, `employee-table`, `konfiguracja`) albo dać widok kart na telefonie.
   - `kolejnosc-nazwisk`: stała szerokość tylko od `md:` (`md:min-w-[640px]`).
5. **Błąd hydracji motywu**
   - Ustalić, kto dopisuje klasę `light` do `<html>`; ustawić ją po stronie serwera albo użyć `suppressHydrationWarning` i skryptu inicjalizującego motyw przed renderem, żeby nie było mignięcia.

Kryteria zakończenia etapu 1:
- `npm run verify` bez błędów, `check:mobile` bez ostrzeżeń `UNWRAPPED_TABLE`/`FIXED_LARGE_WIDTH`;
- brak `text-[9|10|11px]` w `src/app` i `src/components`;
- test kontrastu: tekst główny i drugoplanowy ≥ 7:1 w jasnym motywie, ≥ 4.5:1 w ciemnych;
- przegląd w przeglądarce 375 px i 1440 px: Obsada, Pulpit, Aktywni, Statystyki.

---

## Etap 2. Nawigacja (ryzyko: niskie)

Cel: 4–5 pozycji na pierwszym planie, reszta w „Więcej”, brak martwych adresów.

1. **Układ menu** (`src/components/app-navigation.ts`)
   - Pierwszy plan (bez zmian, zgodnie z testem): Pulpit, Pracownicy aktywni, Zwolnieni, Odwiedzalność (+ Obsada dla gościa).
   - Grupa „Więcej”: Statystyki, Rekrutacja, Kalendarz, Terminy, Szafki, Notatki, Auta, Karty obiegowe, Odciski palców, Brak logowania, Wydawanie odzieży.
   - Grupa „System” (tylko admin): Konfiguracja, Szablony email, Historia email, Kolejność nazwisk.
2. **Prostsze nazwy** pozycji (krótkie, bez żargonu), zachować `shortLabel` na dolny pasek telefonu.
3. **Martwe adresy**
   - `design-system-demo`: usunąć albo zwracać 404 w produkcji.
   - Sprawdzić, czy wszystkie strony z `src/app/(app)` są w menu albo świadomie ukryte.
4. **Menu na telefonie**: dolny pasek tylko z 4 głównymi pozycjami + przycisk „Więcej” otwierający arkusz z resztą (zamiast długiej listy).
5. **Testy**: zaktualizować `src/__tests__/app-navigation.test.ts` (unikalność adresów, widoczność dla roli gościa, główne cztery pozycje).

Kryteria zakończenia etapu 2:
- na telefonie dolny pasek ma ≤ 5 pozycji, reszta w „Więcej”;
- gość widzi tylko Obsadę;
- brak adresów w kodzie bez pozycji w menu (poza celowo ukrytymi, opisanymi w komentarzu);
- testy nawigacji przechodzą.

---

## Etap 3. Pulpit „co dziś wymaga działania” (ryzyko: średnie)

1. Jeden ekran: braki dziś (z Obsady), zwolnienia w tym tygodniu, przyjęcia w tym tygodniu, przypomnienia (umowy, odciski, terminy).
2. Każdy kafel prowadzi jednym kliknięciem do właściwej listy z włączonym filtrem.
3. Usunąć wskaźniki, których nikt nie używa (potwierdzić z właścicielem).

## Etap 4. Aktywni / Zwolnieni / formularz pracownika (ryzyko: średnie)

1. Telefon: lista kart zamiast szerokiej tabeli; mniej kolumn domyślnie, reszta w „Kolumny”.
2. Formularz: 3 kroki, tylko pola wymagane na pierwszym kroku; walidacja przy zapisie, jasne błędy.
3. Spójna kolejność „Nazwisko Imię” (już wdrożona) i jedno miejsce poprawy starych danych (`/kolejnosc-nazwisk`).

## Etap 5. Porządek w kodzie (ryzyko: średnie)

1. Podział największych stron na komponenty (`harmonogram`, `rekrutacja`, `statystyki`, `szafki`, `konfiguracja`, `pulpit`), docelowo < 400 linii na plik.
2. Usunięcie nieużywanych komponentów (`ui-v2/`, `lib/actions/employee-actions.ts`, nieużywane skrypty `fix-*.js` w katalogu głównym).
3. Dwa motywy zamiast czterech (jasny i ciemny), usunięcie nadmiarowych łatek w `globals.css`.

---

## Kolejność i ryzyka

| Etap | Zakres | Ryzyko | Sposób cofnięcia |
|---|---|---|---|
| 1 | tokeny, skala tekstu, przyciski, tabele, hydracja | niskie | pojedynczy commit, `git revert` |
| 2 | menu, martwe adresy | niskie | `git revert` |
| 3 | Pulpit | średnie | osobna gałąź i podgląd |
| 4 | listy i formularz | średnie | osobna gałąź i podgląd |
| 5 | refaktoryzacja | średnie | małe commity, testy po każdym |

Uwagi:
- Zmiany tokenów (etap 1) działają globalnie — po wdrożeniu sprawdzić wszystkie główne ekrany w jasnym i ciemnym motywie.
- Wdrożenie: GitHub Action „Deploy to Firebase App Hosting” kończy się błędem na kroku Deploy (prawdopodobnie `FIREBASE_TOKEN`); produkcja i tak się aktualizuje innym torem. Warto naprawić lub usunąć ten workflow, żeby nie wprowadzał w błąd.
- Przed każdym etapem: `git pull` w `strumet`, po etapie: commit, push i aktualizacja wskaźnika sabmodułu w repozytorium głównym.

## Definicja gotowości (cały plan)

- Każdy ekran czytelny na telefonie 375 px bez przewijania poziomego strony.
- Tekst roboczy ≥ 13 px, drugoplanowy w kontraście jak główny.
- Przyciski i pola ≥ 40 px na telefonie.
- Nawigacja: 4–5 pozycji na wierzchu, reszta w „Więcej”.
- `npm run verify` i testy bez błędów.
