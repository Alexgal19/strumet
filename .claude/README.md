
# Baza - ST - Dokumentacja Projektu

## 1. Ogólny Opis Projektu

**Baza - ST** to zaawansowana aplikacja internetowa typu CRM (Customer Relationship Management), zaprojektowana specjalnie do kompleksowego zarządzania personelem i procesami HR. System został stworzony w oparciu o nowoczesny stos technologiczny, z naciskiem na wydajność, responsywność i intuicyjność interfejsu.

## 2. Stos Technologiczny

- **Framework:** **Next.js (App Router)** - Gwarantuje szybkie renderowanie po stronie serwera i klienta, optymalizację SEO oraz nowoczesną architekturę.
- **Język:** **TypeScript** - Zapewnia bezpieczeństwo typów, co przekłada się na mniejszą liczbę błędów i łatwiejsze utrzymanie kodu.
- **Komponenty UI:** **shadcn/ui** - Biblioteka gotowych, w pełni stylizowalnych i dostępnych komponentów, która przyspiesza rozwój interfejsu.
- **Stylizacja:** **Tailwind CSS v4** - Nowoczesne podejście do stylizacji (utility-first), które umożliwia szybkie i spójne tworzenie designu bezpośrednio w kodzie.
- **Backend i Baza Danych:** **Firebase**
  - **Realtime Database:** Baza danych NoSQL działająca w czasie rzeczywistym, idealna do dynamicznych aplikacji, gdzie zmiany muszą być widoczne natychmiast.
  - **Firebase Authentication:** Kompletny system do zarządzania uwierzytelnianiem użytkowników (email/hasło).
  - **Firebase Storage:** Służy do przechowywania plików, np. archiwów Excel.
- **Sztuczna Inteligencja:** **Genkit (Google)** - Zintegrowany framework AI do automatyzacji zadań, takich jak generowanie podsumowań, tworzenie awatarów czy proaktywne powiadomienia.
- **Zarządzanie Stanem:** **React Context API** (`AppContext`) - Scentralizowane zarządzanie stanem aplikacji (dane pracowników, konfiguracja, stan ładowania), co zapewnia spójność danych we wszystkich komponentach.
- **Formularze:** **React Hook Form** - Wydajne i elastyczne zarządzanie formularzami i ich walidacją.
- **Wykresy i Wizualizacje:** **Recharts** - Biblioteka do tworzenia interaktywnych wykresów i diagramów.

## 3. Architektura i Kluczowe Koncepcje

### 3.1. System Projektowy (Design System)

Aplikacja wykorzystuje spójny system wizualny w stylu **"Light & Airy Ultra-Modern"**:
- **Paleta Barw:** Jasne tła (`slate-50`), czyste białe karty i stonowane, profesjonalne akcenty (błękit, koral).
- **Glassmorphism:** Efekt "szronionego szkła" (`backdrop-blur`) zastosowany na panelach bocznych i nagłówkach, co dodaje głębi i nowoczesności.
- **Cienie i Interaktywność:** Subtelne, rozproszone cienie pojawiające się przy interakcji (np. `hover` na przyciskach), co daje wrażenie "unoszenia się" elementów.
- **Typografia:** Ciemnoszary tekst zamiast czarnego, aby zmniejszyć zmęczenie oczu.

### 3.2. Responsywność (Responsive Design)

Aplikacja jest w pełni responsywna dzięki połączeniu kilku technik:
- **Tailwind CSS Breakpoints:** Użycie prefiksów `sm:`, `md:`, `lg:` do dynamicznego dostosowywania układu.
- **Hook `useIsMobile`:** Specjalny hook, który pozwala na renderowanie zupełnie innych komponentów w zależności od rozmiaru ekranu (np. `AppSidebar` na desktopie vs `AppBottomNav` na mobile).
- **Wirtualizacja List:** Długie listy (np. pracowników) są wirtualizowane (`@tanstack/react-virtual`), co oznacza, że renderowane są tylko widoczne elementy. Zapewnia to błyskawiczne działanie nawet przy tysiącach rekordów.

### 3.3. Zarządzanie Stanem (`AppContext`)

Sercem aplikacji jest `AppContext`, który pełni rolę centralnego magazynu danych i logiki biznesowej.
- **Dostarcza dane:** Udostępnia wszystkim komponentom aktualne dane o pracownikach, konfiguracji, absencjach itp.
- **Centralizuje logikę:** Zawiera funkcje do modyfikacji danych (np. `handleSaveEmployee`, `addAbsence`), co zapewnia, że logika biznesowa jest w jednym miejscu i łatwa do zarządzania.
- **Zarządza stanem ładowania i uwierzytelniania:** Kontroluje stan ładowania danych oraz informacje o zalogowanym użytkowniku i jego uprawnieniach (`isAdmin`).

## 4. Analiza Funkcjonalności Modułów

### `aktywni` / `zwolnieni` (Pracownicy)
- **Logika:** Pełne operacje CRUD (Create, Read, Update, Delete) na danych pracowników. Status `aktywny` lub `zwolniony` decyduje o przynależności do listy. Przywrócenie pracownika (`handleRestoreEmployee`) zmienia status i usuwa datę zwolnienia.
- **Filtrowanie:** Zaawansowane, wielokryterialne filtrowanie odbywa się po stronie klienta (`useMemo`), co zapewnia natychmiastową reakcję interfejsu. Filtry hierarchiczne dla dat pozwalają na precyzyjne zawężanie wyników.
- **Import/Eksport:** Wykorzystanie biblioteki `xlsx` do parsowania i generowania plików Excel. Funkcje te są odizolowane w osobnych komponentach (`ExcelImportButton`, `ExcelExportButton`).

### `planowanie`
- **Logika:** Moduł w pełni oparty na filtrowaniu i sortowaniu istniejących danych pracowników. Wykorzystuje `date-fns` do sprawdzania, czy pracownik jest aktualnie na urlopie (`isWithinInterval`) lub czy jego planowana data zwolnienia jest w przyszłości.

### `odwiedzalnosc`
- **Logika:** Interaktywny kalendarz, gdzie każda komórka dnia jest przyciskiem. Kliknięcie wywołuje funkcję `handleToggleAbsence`, która dodaje lub usuwa wpis w tabeli `absences` w Firebase.
- **Statystyki:** Obliczenia (np. procent nieobecności) są wykonywane w czasie rzeczywistym (`useMemo`) na podstawie aktualnych danych o absencjach, pracownikach i liczbie dni roboczych w miesiącu.

### `statystyki`
- **Wykresy:** Moduł wykorzystuje bibliotekę `Recharts` do tworzenia interaktywnych wykresów kołowych. Kliknięcie na fragment wykresu otwiera okno dialogowe ze szczegółową listą pracowników.
- **Hierarchia:** Okno dialogowe dla działów prezentuje dane w formie zagnieżdżonych akordeonów (Dział -> Kierownik -> Stanowisko), co ułatwia analizę struktury.
- **Analiza historyczna:** Zakładka "Analiza" pozwala generować raporty porównawcze między dwoma datami lub na jeden konkretny dzień, wykorzystując flow Genkit `createStatsSnapshot`.

### `wydawanie-odziezy`
- **Logika:** Tworzenie "aktu wydania" poprzez powiązanie pracownika z listą wybranych ubrań. Każdy akt jest zapisywany jako osobny obiekt w Firebase. Domyślny zestaw odzieży jest pobierany z konfiguracji na podstawie stanowiska pracownika.
- **Drukowanie:** Wygenerowany dokument jest renderowany w specjalnym, ukrytym kontenerze (`print-only`) i stylizowany za pomocą `@media print`, co zapewnia idealne dopasowanie do formatu A4.

### `konfiguracja`
- **Logika:** Moduł pozwala na zarządzanie listami (działy, stanowiska, kierownicy itp.), które są przechowywane w `config` w Firebase.
- **"Inteligentne" edytowanie:** Zmiana nazwy elementu (np. działu) powoduje automatyczną aktualizację tej nazwy we wszystkich obiektach pracowników, którzy mieli przypisaną starą wartość. Jest to realizowane przez `updateConfigItem`, która iteruje po pracownikach i tworzy zbiorczą aktualizację.

### `AI / Genkit`
- **Flows:** Funkcje AI są zdefiniowane jako `flows` w katalogu `src/ai/flows`. Każdy flow to osobna funkcja serwerowa (`'use server'`).
- **Codzienne zadania:** `run-daily-checks` to główny flow, uruchamiany cyklicznie (cron), który odpala pod-flowy do sprawdzania umów, terminów itp. i wysyła powiadomienia (w aplikacji i e-mailem przez Resend).
- **Generowanie treści:** `generate-employee-summary` i `generate-avatar` to przykłady użycia modeli generatywnych do wzbogacania danych.

## 5. Podsumowanie

"Baza - ST" to dobrze zaprojektowana, nowoczesna aplikacja, która efektywnie wykorzystuje swój stos technologiczny. Architektura oparta na komponentach, scentralizowanym zarządzaniu stanem oraz modularnych funkcjach AI sprawia, że system jest elastyczny, skalowalny i łatwy w dalszym rozwoju.
