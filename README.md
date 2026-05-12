# Baza - ST

Baza - ST to zaawansowany system do zarządzania zasobami ludzkimi (HR), zaprojektowany w celu kompleksowej digitalizacji i automatyzacji procesów w firmie. Aplikacja obejmuje pełen cykl życia pracownika – od rekrutacji i onboardingu, przez ewidencję czasu pracy i planowanie, aż po proces zwolnienia. System jest zoptymalizowany pod kątem urządzeń mobilnych i działa jako Progresywna Aplikacja Webowa (PWA).

## 🚀 Stos Technologiczny

Projekt wykorzystuje nowoczesne technologie w celu zapewnienia wydajności, skalowalności i doskonałego doświadczenia deweloperskiego.

| Kategoria | Technologia |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router) |
| **Język** | [TypeScript](https://www.typescriptlang.org/) |
| **Backend i Baza Danych** | Firebase (Realtime Database, Authentication, Storage) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) (Ikony) |
| **AI i Automatyzacja** | [Genkit](https://firebase.google.com/docs/genkit) (Google AI SDK), [Resend](https://resend.com/) (Powiadomienia Email) |
| **Formularze i Tabele** | React Hook Form, TanStack Table & Virtual |
| **Wizualizacja Danych** | Recharts |
| **Narzędzia** | date-fns, xlsx (Import/Eksport), Zod, Framer Motion |
| **Testowanie** | [Vitest](https://vitest.dev/) (Testy jednostkowe/integracyjne), [Playwright](https://playwright.dev/) (Testy E2E) |
| **Deployment** | Firebase App Hosting |


## ✨ Kluczowe Funkcjonalności

Aplikacja jest modularna i pokrywa szeroki zakres procesów HR:

*   **Zarządzanie Pracownikami (`/aktywni`, `/zwolnieni`)**: Pełny CRUD (tworzenie, odczyt, aktualizacja, usuwanie) profili pracowników, archiwizacja oraz przywracanie do statusu aktywnego.
*   **Planowanie (`/planowanie`)**: Zarządzanie planowanymi zwolnieniami i urlopami z przejrzystym widokiem nadchodzących wydarzeń.
*   **Ewidencja Obecności (`/odwiedzalnosc`)**: Interaktywny kalendarz do śledzenia i zarządzania nieobecnościami pracowników.
*   **Statystyki i Raporty (`/statystyki`)**: Generowanie raportów bieżących i historycznych, analiza rotacji w działach i na stanowiskach, eksport danych do formatu Excel.
*   **Wydawanie Odzieży (`/wydawanie-odziezy`, `/wydawanie-odziezy-nowi`)**: Ewidencja wydanej odzieży roboczej z możliwością drukowania potwierdzeń.
*   **Procesy On/Offboardingowe**:
    *   **Karty Obiegowe (`/karty-obiegowe`)**: Automatyczne generowanie i drukowanie kart obiegowych przy zwolnieniach.
    *   **Odciski Palców (`/odciski-palcow`)**: Zarządzanie terminami wizyt w celu pobrania danych biometrycznych.
    *   **Brak Logowania (`/brak-logowania`)**: Rejestrowanie i raportowanie incydentów braku odbicia karty na wejściu/wyjściu.
*   **Konfiguracja Systemu (`/konfiguracja`)**: Dynamiczne zarządzanie listami (działy, stanowiska, kierownicy), uprawnieniami użytkowników oraz kluczami API do usług zewnętrznych.

## 🤖 AI & Automatyzacja

System wykorzystuje Genkit oraz zadania cron do automatyzacji kluczowych procesów:

*   **Codzienne Kontrole**: Automatyczne zadania (cron jobs) uruchamiane przez Firebase App Hosting codziennie sprawdzają:
    *   Wygasające umowy o pracę.
    *   Nadchodzące terminy na odciski palców.
    *   Planowane daty zwolnień w celu automatycznej archiwizacji profili.
*   **Powiadomienia Email**: System automatycznie wysyła alerty i codzienne podsumowania do działu HR za pomocą integracji z Resend.
*   **Generowanie Treści (AI)**: Wykorzystanie Genkit i modeli AI do generowania profesjonalnych podsumowań profili pracowników na żądanie.
*   **Archiwizacja Danych**: Możliwość ręcznego lub automatycznego archiwizowania danych o pracownikach do plików Excel i zapisywania ich w Firebase Storage.

## 📋 Wymagania Wstępne

Przed uruchomieniem projektu upewnij się, że masz zainstalowane:

*   **Node.js:** v22 lub nowszy
*   **npm:** v10 lub nowszy
*   **Konto Firebase:** Projekt skonfigurowany w Firebase Console.

## 🛠️ Instalacja i Konfiguracja

1.  **Klonowanie Repozytorium**

    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Instalacja Zależności**

    ```bash
    npm install
    ```

3.  **Konfiguracja Środowiska**

    Utwórz plik `.env` w głównym katalogu projektu i dodaj następujące zmienne środowiskowe:

    ```env
    # Firebase Client Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

    # Firebase Admin SDK (Server-side)
    FIREBASE_PROJECT_ID=your_project_id
    FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

    # Other Services
    RESEND_API_KEY=re_...
    ```

    *Uwaga: Upewnij się, że w konsoli Firebase włączone są usługi Realtime Database, Authentication i Storage.*

## ▶️ Uruchamianie Aplikacji

Dostępne są następujące skrypty `npm`:

*   **Serwer deweloperski:**
    ```bash
    npm run dev
    ```
    Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce.

*   **Budowanie wersji produkcyjnej:**
    ```bash
    npm run build
    ```

*   **Uruchamianie wersji produkcyjnej:**
    ```bash
    npm run start
    ```

*   **Analiza kodu (linting):**
    ```bash
    npm run lint
    ```

*   **Uruchamianie testów:**
    ```bash
    # Testy jednostkowe i integracyjne
    npm run test

    # Testy End-to-End (wymaga uruchomionego serwera deweloperskiego)
    npm run test:e2e
    ```

*   **Wypełnianie bazy danych:**
    Wypełnia bazę danych przykładowymi danymi pracowników.
    ```bash
    npm run seed
    ```

## 📌 Status Projektu

**Status:** 🚧 **Aktywny Rozwój**

Ten projekt jest w trakcie aktywnego rozwoju. Nowe funkcjonalności i ulepszenia są regularnie wdrażane.
