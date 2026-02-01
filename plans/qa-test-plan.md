# Plan Testów QA - Interaktywne Elementy Aplikacji "Baza - ST"

## Wstęp

Dokument zawiera szczegółowe przypadki testowe dla interaktywnych przycisków w aplikacji. Plan pokrywa weryfikację funkcjonalną (Happy Path, Negative Path) oraz stany wizualne.

**Legenda Priorytetów:**

- **P0 (Krytyczny):** Blokuje główne funkcje aplikacji (np. logowanie, dodawanie pracownika).
- **P1 (Wysoki):** Ważna funkcjonalność, obejścia są trudne lub niemożliwe.
- **P2 (Średni):** Funkcjonalność poboczna lub kosmetyczna, istnieją obejścia.
- **P3 (Niski):** Drobne błędy UI, literówki.

## Tabela Przypadków Testowych

### 1. Uwierzytelnianie (Login Page)

| ID           | Nazwa Elementu                  | Cel testu                       | Warunki wstępne                              | Kroki do wykonania                                                                                     | Oczekiwany rezultat                                                                                                  | Priorytet |
| ------------ | ------------------------------- | ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --------- |
| **AUTH-001** | Przycisk "Zaloguj się"          | Logowanie poprawne (Happy Path) | Użytkownik wylogowany, poprawne dane w bazie | 1. Wejdź na `/login`<br>2. Wpisz poprawny email<br>3. Wpisz poprawne hasło<br>4. Kliknij "Zaloguj się" | 1. Spinner ładowania na przycisku<br>2. Toast "Sukces"<br>3. Przekierowanie do `/`                                   | P0        |
| **AUTH-002** | Przycisk "Zaloguj się"          | Logowanie błędne (Błędne hasło) | Użytkownik wylogowany                        | 1. Wpisz poprawny email<br>2. Wpisz błędne hasło<br>3. Kliknij "Zaloguj się"                           | 1. Komunikat błędu "Nieprawidłowy email lub hasło"<br>2. Brak przekierowania<br>3. Przycisk wraca do stanu aktywnego | P1        |
| **AUTH-003** | Przycisk "Zaloguj się"          | Walidacja pustych pól           | Użytkownik wylogowany                        | 1. Pozostaw pola puste<br>2. Spróbuj kliknąć "Zaloguj się"                                             | 1. Przeglądarka blokuje submit (HTML5 `required`)<br>2. Brak akcji sieciowej                                         | P2        |
| **AUTH-004** | Przycisk "Zainstaluj aplikację" | Instalacja PWA                  | Przeglądarka wspiera PWA, nie zainstalowano  | 1. Kliknij "Zainstaluj aplikację" (jeśli widoczny)                                                     | 1. Otwarcie natywnego promptu instalacji<br>2. Po akceptacji Toast "Sukces"                                          | P3        |
| **AUTH-005** | Link "Zarejestruj się"          | Nawigacja do rejestracji        | Użytkownik wylogowany                        | 1. Kliknij "Zarejestruj się"                                                                           | Przekierowanie do widoku `/register`                                                                                 | P2        |

### 2. Nawigacja (Sidebar & Bottom Nav)

| ID          | Nazwa Elementu      | Cel testu                  | Warunki wstępne                  | Kroki do wykonania                              | Oczekiwany rezultat                                                                              | Priorytet |
| ----------- | ------------------- | -------------------------- | -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- |
| **NAV-001** | Sidebar Menu Linki  | Nawigacja Desktop          | Zalogowany jako Admin, Desktop   | 1. Kliknij w link (np. "Aktywni", "Statystyki") | 1. Przycisk otrzymuje styl `active` (tło/kolor)<br>2. URL zmienia się<br>3. Widok ładuje się     | P1        |
| **NAV-002** | Bottom Nav Linki    | Nawigacja Mobile           | Zalogowany, Mobile View (<768px) | 1. Kliknij w ikonę (np. "Planowanie")           | 1. Ikona podświetla się i unosi<br>2. Widok zmienia się                                          | P1        |
| **NAV-003** | Przycisk "Wyloguj"  | Wylogowanie                | Zalogowany                       | 1. Kliknij "Wyloguj" w Sidebarze                | 1. Przekierowanie do `/login`<br>2. Sesja wyczyszczona                                           | P1        |
| **NAV-004** | Dzwonek powiadomień | Otwarcie listy powiadomień | Zalogowany jako Admin            | 1. Kliknij ikonę dzwonka w sidebarze            | 1. Otwarcie Popovera z listą powiadomień<br>2. Jeśli są nowe, badge licznika znika po odczytaniu | P2        |

### 3. Zarządzanie Pracownikami (Widok "Aktywni")

| ID          | Nazwa Elementu                | Cel testu                   | Warunki wstępne                          | Kroki do wykonania                                              | Oczekiwany rezultat                                                                | Priorytet |
| ----------- | ----------------------------- | --------------------------- | ---------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------- |
| **EMP-001** | Przycisk "Dodaj pracownika"   | Otwarcie formularza         | Zalogowany na `/aktywni`                 | 1. Kliknij przycisk "Dodaj pracownika"                          | Otwarcie modala z tytułem "Dodaj nowego pracownika" i pustym formularzem           | P1        |
| **EMP-002** | Przycisk "Więcej opcji" (...) | Dostęp do narzędzi masowych | Zalogowany na `/aktywni`                 | 1. Kliknij przycisk z ikoną trzech kropek w headerze            | Otwarcie Popovera z opcjami: Import, Usuń daty, Usuń wszystkich                    | P2        |
| **EMP-003** | Przycisk "Importuj z Excel"   | Wgranie pliku               | Popover opcji otwarty, plik .xlsx gotowy | 1. Kliknij "Importuj z Excel"<br>2. Wybierz plik z dysku        | 1. Ikona ładowania na przycisku<br>2. Po sukcesie Toast z liczbą dodanych rekordów | P2        |
| **EMP-004** | Przycisk "Wyczyść filtry"     | Resetowanie widoku          | Wybrane filtry (Dział/Stanowisko)        | 1. Kliknij "Wyczyść filtry" (widoczny tylko gdy filtry aktywne) | 1. Wszystkie selecty czyszczą się<br>2. Lista pracowników odświeża się do pełnej   | P2        |
| **EMP-005** | Przycisk Eksportu (Excel)     | Pobieranie danych           | Lista zawiera dane                       | 1. Kliknij przycisk z ikoną Excel w headerze                    | Rozpoczęcie pobierania pliku `aktywni_pracownicy.xlsx`                             | P3        |

### 4. Akcje na Pracowniku (Karta Pracownika)

| ID           | Nazwa Elementu    | Cel testu                | Warunki wstępne      | Kroki do wykonania                          | Oczekiwany rezultat                                                                      | Priorytet |
| ------------ | ----------------- | ------------------------ | -------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| **CARD-001** | Menu Akcji (...)  | Rozwinięcie opcji        | Widok listy/kart     | 1. Kliknij ikonę "..." na karcie pracownika | Rozwinięcie menu: Edytuj, Generuj podsumowanie, Zwolnij, Usuń trwale                     | P1        |
| **CARD-002** | Opcja "Edytuj"    | Edycja danych            | Menu akcji otwarte   | 1. Kliknij "Edytuj"                         | Otwarcie modala z formularzem wypełnionym danymi pracownika                              | P1        |
| **CARD-003** | Opcja "Zwolnij"   | Proces zwolnienia        | Menu akcji otwarte   | 1. Kliknij "Zwolnij" (czerwony tekst)       | Otwarcie Alert Dialog z pytaniem "Czy na pewno chcesz zwolnić...?"                       | P1        |
| **CARD-004** | Confirm "Zwolnij" | Potwierdzenie zwolnienia | Alert Dialog otwarty | 1. Kliknij "Zwolnij" w dialogu              | 1. Zamknięcie dialogu<br>2. Pracownik znika z listy "Aktywni"<br>3. Toast potwierdzający | P1        |
| **CARD-005** | Cancel "Anuluj"   | Anulowanie akcji         | Alert Dialog otwarty | 1. Kliknij "Anuluj"                         | Zamknięcie dialogu, brak zmian w danych                                                  | P2        |

### 5. Formularz Pracownika (Employee Form)

| ID           | Nazwa Elementu                | Cel testu                    | Warunki wstępne                       | Kroki do wykonania                                                            | Oczekiwany rezultat                                                                                | Priorytet |
| ------------ | ----------------------------- | ---------------------------- | ------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| **FORM-001** | Przycisk "Zapisz"             | Zapis poprawnego rekordu     | Formularz otwarty, dane wpisane       | 1. Wypełnij wymagane pola (Imię, Nazwisko, Dział itp.)<br>2. Kliknij "Zapisz" | 1. Zamknięcie modala<br>2. Odświeżenie listy (nowy pracownik widoczny)<br>3. Brak błędów walidacji | P0        |
| **FORM-002** | Przycisk "Zapisz"             | Walidacja brakujących danych | Formularz otwarty, puste pola         | 1. Wyczyść pole "Nazwisko"<br>2. Kliknij "Zapisz"                             | 1. Modal nie zamyka się<br>2. Komunikat "Nazwisko jest wymagane" pod polem                         | P1        |
| **FORM-003** | Przycisk "Anuluj"             | Porzucenie zmian             | Formularz otwarty, wprowadzone zmiany | 1. Zmień imię<br>2. Kliknij "Anuluj"                                          | Zamknięcie modala, zmiany nie są zapisane                                                          | P2        |
| **FORM-004** | Przycisk "Skanuj Paszport"    | Interakcja z OCR             | Formularz otwarty                     | 1. Kliknij "Skanuj Paszport"                                                  | Otwarcie komponentu `PassportScanner` (kamera/upload)                                              | P3        |
| **FORM-005** | Date Picker (Przycisk z datą) | Wybór daty                   | Formularz otwarty                     | 1. Kliknij przycisk z ikoną kalendarza<br>2. Wybierz datę z popovera          | 1. Popover zamyka się<br>2. Wybrana data wyświetla się na przycisku                                | P2        |
| **FORM-006** | Przycisk "Wyczyść datę"       | Usunięcie daty               | Data wybrana w pickerze               | 1. Otwórz Date Picker<br>2. Kliknij "Wyczyść datę" (ikona kosza)              | Data resetuje się, placeholder wraca na przycisk                                                   | P3        |

---

## Sugestie Automatyzacji

### 1. Narzędzia

Projekt posiada już skonfigurowane środowisko testowe, które należy wykorzystać:

- **Playwright** (`e2e/`): Do testów end-to-end symulujących zachowanie użytkownika w przeglądarce.
- **Vitest** (`tests/`): Do testów jednostkowych i integracyjnych komponentów React.

### 2. Strategia Automatyzacji (Playwright)

Dla testów E2E (katalog `e2e/`) zaleca się stworzenie obiektów stron (Page Object Model), aby uprościć utrzymanie testów.

**Struktura testów:**

- `e2e/auth.spec.ts`: Testy logowania (AUTH-001, AUTH-002).
- `e2e/employees.spec.ts`: CRUD pracownika (EMP-001, FORM-001, CARD-002).
- `e2e/navigation.spec.ts`: Weryfikacja linków w sidebarze (NAV-001).

**Przykład testu (Playwright):**

```typescript
// e2e/employees.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Zarządzanie pracownikami", () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie przed każdym testem (można przenieść do global setup)
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
  });

  test("Powinien dodać nowego pracownika", async ({ page }) => {
    await page.click('button:has-text("Dodaj pracownika")');

    // Wypełnianie formularza
    await page.fill("input#firstName", "Jan");
    await page.fill("input#lastName", "Automat");
    await page.click('button:has-text("Wybierz dział")');
    await page.click('div[role="option"]:has-text("Produkcja")');

    // Zapis
    await page.click('button[type="submit"]');

    // Weryfikacja
    await expect(page.locator("text=Automat Jan")).toBeVisible();
  });
});
```

### 3. Strategia Automatyzacji (Vitest)

Dla testów komponentów (katalog `src/__tests__` lub obok komponentów), warto skupić się na logice formularza.

**Co testować w Vitest:**

- Czy `EmployeeForm` wyświetla błędy walidacji po kliknięciu "Zapisz" z pustymi polami.
- Czy `EmployeeCard` renderuje odpowiedni Badge w zależności od statusu (Aktywny/Zwolniony).
- Czy funkcje pomocnicze (np. formatowanie dat) działają poprawnie dla skrajnych przypadków.
