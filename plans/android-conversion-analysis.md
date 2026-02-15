# Analiza konwersji aplikacji PWA na natywną aplikację Android

Dokument ten przedstawia szczegółową analizę i plan konwersji obecnej aplikacji PWA "Baza-ST" na w pełni natywną aplikację Android (lub hybrydową z wykorzystaniem React Native/Capacitor, zachowując natywne funkcjonalności).

## 1. Analiza obecnych funkcjonalności

Obecna aplikacja jest zbudowana jako PWA (Progressive Web App) przy użyciu Next.js i Firebase. Główne moduły to:

*   **Zarządzanie Pracownikami (`/employees`)**: Lista, dodawanie, edycja, archiwizacja.
*   **Obecność i Czas Pracy (`/odwiedzalnosc`)**: Ewidencja wejść/wyjść.
*   **Wydawanie Odzieży (`/wydawanie-odziezy`)**: Rejestracja wydanej odzieży, zestawy dla stanowisk.
*   **Karty Obiegowe (`/karty-obiegowe`)**: Proces obiegówek przy zwolnieniach.
*   **Odciski Palców / Biometria (`/odciski-palcow`)**: Zarządzanie wizytami na pobranie odcisków.
*   **Planowanie (`/planowanie`)**: Urlopy, planowane zwolnienia.
*   **Skaner Paszportów (`PassportScanner`)**: OCR danych z dokumentów (obecnie Tesseract.js w przeglądarce).

**Technologia:**
*   Frontend: Next.js, React, Tailwind CSS.
*   Backend/Baza: Firebase (Realtime Database, Auth, Storage).
*   AI: Genkit (automatyzacja procesów).

## 2. Potencjał Natywnych API (Native Features)

Przejście na aplikację natywną otworzy dostęp do sprzętowych funkcji urządzenia, które są ograniczone lub niedostępne w PWA:

### A. NFC (Near Field Communication)
*   **Zastosowanie:** Odczyt kart pracowniczych (kart dostępu/RCP) bezpośrednio przez telefon kierownika/ochrony.
*   **Scenariusz:** Zamiast ręcznie wpisywać numer karty lub szukać pracownika na liście, przyłożenie karty pracownika do telefonu automatycznie otwiera jego profil lub rejestruje wydanie odzieży.

### B. Biometria (Fingerprint / Face ID)
*   **Zastosowanie:** Bezpieczne logowanie do aplikacji oraz autoryzacja kluczowych operacji (np. zatwierdzenie usunięcia pracownika, edycja danych wrażliwych).
*   **Scenariusz:** Szybkie logowanie dla kierowników bez konieczności wpisywania hasła przy każdym uruchomieniu.

### C. Zaawansowana Kamera i ML Kit
*   **Zastosowanie:** Zastąpienie `Tesseract.js` natywnym Google ML Kit Text Recognition.
*   **Scenariusz:** Skanowanie paszportów/dowodów będzie działać znacznie szybciej (w czasie rzeczywistym), bez konieczności przesyłania zdjęć do chmury czy ciężkiego przetwarzania w JS.
*   **Dodatkowo:** Skanowanie kodów QR/kreskowych na wyposażeniu lub odzieży.

### D. Bluetooth Low Energy (BLE)
*   **Zastosowanie:** Integracja z zewnętrznymi czytnikami biometrycznymi lub drukarkami etykiet (np. do wydruku potwierdzeń wydania odzieży).

## 3. Strategia Powiadomień i Pracy w Tle

W PWA Service Workers mają ograniczone możliwości działania w tle na iOS i niektórych Androidach. Aplikacja natywna pozwoli na:

*   **Lokalne Powiadomienia (Local Notifications):**
    *   Przypomnienie o zaplanowanej wizycie na odciski palców (np. 15 minut przed).
    *   Codzienne przypomnienie o sprawdzeniu kończących się umów (jeśli nie zrobiono tego w panelu).
*   **Push Notifications (FCM):**
    *   Natychmiastowe powiadomienie o nowym pracowniku dodanym przez innego rekrutera.
    *   Alerty o incydentach (np. brak odbicia karty przez dużą grupę osób).
*   **Background Fetch / Sync:**
    *   Synchronizacja danych o pracownikach w tle, nawet gdy aplikacja jest wyłączona, aby po otwarciu dane były aktualne.
    *   Wysyłanie raportów offline w momencie odzyskania połączenia.

## 4. Architektura Offline-First

Obecnie Firebase oferuje wsparcie offline, ale w aplikacji natywnej można to wynieść na wyższy poziom:

*   **Baza Danych:** Wykorzystanie **WatermelonDB** lub **Realm** jako lokalnego cache'a, który synchronizuje się z Firebase. Zapewni to błyskawiczne działanie UI niezależnie od sieci.
*   **Kolejkowanie Akcji:** Wszystkie mutacje (dodanie pracownika, wydanie odzieży) trafiają do lokalnej kolejki (`Queue`). Jeśli brak internetu, kolejka jest przetwarzana automatycznie po odzyskaniu połączenia (Persistent Queue).
*   **Zasoby:** Pre-caching zdjęć pracowników i dokumentów.

## 5. Ulepszenia UX (Material Design 3 / Native Feel)

*   **Nawigacja:** Zastąpienie bocznego menu (Sidebar) dolnym paskiem nawigacyjnym (Bottom Navigation Bar) dla najczęstszych akcji, co jest bardziej ergonomiczne na mobile.
*   **Gesty:**
    *   "Swipe to Action" na listach pracowników (przesuń w lewo, aby zwolnić; w prawo, aby edytować).
    *   "Pull to Refresh" do odświeżania danych.
*   **Animacje:** Płynne przejścia między ekranami (Shared Element Transitions) – np. kliknięcie w pracownika na liście płynnie powiększa jego avatar i przenosi do szczegółów.
*   **Haptic Feedback:** Delikatne wibracje przy sukcesie operacji (np. zeskanowaniu paszportu) lub błędzie.

## 6. "Killer Features" - Co wyróżni wersję natywną?

1.  **"Tap-to-Identify"**: Przyłóż kartę pracownika do telefonu, aby natychmiast zobaczyć jego status, historię odzieży i obecność.
2.  **Skaner Dokumentów w 50ms**: Błyskawiczny OCR paszportów wykorzystujący natywne biblioteki ML, działający offline.
3.  **Tryb "Brak Sieci"**: Pełna funkcjonalność wydawania odzieży i sprawdzania obecności w piwnicach/magazynach bez zasięgu GSM.
4.  **Widgety na Ekran Główny**: Szybki podgląd statystyk (np. "Obecni dzisiaj: 145") bez otwierania aplikacji.

## 7. Rekomendowana Ścieżka Technologiczna

Biorąc pod uwagę obecny stack (React/Next.js), najbardziej efektywną drogą jest:

**React Native (z Expo)**
*   **Dlaczego?** Pozwala zachować ~80% logiki biznesowej (hooks, utilities, funkcja Firebase).
*   **UI:** Przeniesienie komponentów UI na `react-native-paper` lub `tamagui` (dla lepszej wydajności).
*   **Integracja:** Łatwy dostęp do natywnych modułów (Camera, NFC, Biometrics) przez Expo SDK.

Alternatywnie: **Capacitor** (jeśli chcemy zachować 100% kodu webowego), ale stracimy na płynności i "native feel", szczególnie przy animacjach i gestach. **Rekomenduję React Native dla długoterminowej jakości.**
