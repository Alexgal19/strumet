# Asystent głosowy na Macu

Asystent działa na komputerze Mac z Apple Silicon i 16 GB pamięci. `whisper.cpp` zamienia polską mowę na tekst, `ffmpeg` konwertuje nagrania, a głos systemowy macOS `Zosia` odczytuje odpowiedź. Lokalny model `qwen3:4b` w Ollama planuje zapytania do danych aplikacji i układa odpowiedzi na podstawie uzyskanych faktów. Jasne pytania o nieobecności mają szybką ścieżkę obliczania faktów bez planowania przez model. Nie jest to asystent ogólnej wiedzy: nie odpowiada wiarygodnie na dowolne pytania ani nie gwarantuje bezbłędnego rozpoznania mowy lub odpowiedzi. Nie ma opłat za tokeny ani wywołań płatnego API AI.

Aplikacja nadal korzysta z sieci do logowania Firebase i pobierania danych. Mac musi być włączony i wybudzony, gdy ktoś korzysta z asystenta. Dostęp z telefonu odbywa się przez prywatny tailnet Tailscale i HTTPS Serve; telefon musi być do niego podłączony. Dostępność cenowa Tailscale zależy od planu i sposobu użycia, szczególnie w firmie.

## Możliwości i dane

- Możesz pytać o listy, liczby, grupowanie i sumy, a także szczegóły dostępnych rekordów. Lokalny model wybiera źródło, pola i filtry z dozwolonego zestawu; zapytanie jest wykonywane deterministycznie na danych, a model układa zwięzłą odpowiedź na podstawie uzyskanych faktów. Tekst może być niepełny lub błędny.
- Źródła obejmują pracowników, nieobecności i zdarzenia obecności, rekrutację i zamówienia, samochody, odciski palców, karty obiegowe, wydania odzieży, historię statystyk, notatki, powiadomienia, szablony i historię e-maili oraz słowniki konfiguracyjne. Dostępne pola zależą od źródła.
- Przykłady: liczba pracowników według działu lub stanowiska, dane wybranej osoby, nieobecności w danym dniu lub przedziale, kończące się umowy, planowane zwolnienia, terminy odcisków palców, zapotrzebowanie rekrutacyjne albo stan zamówień.
- Można też pytać, gdzie znaleźć funkcje aplikacji. Odpowiedzi na takie pytania opierają się na opisanych ekranach aplikacji; jeśli brak potwierdzonej instrukcji, asystent powinien to powiedzieć.

Asystent korzysta z danych wczytanych w bieżącej sesji; jeśli dana lista jest pusta, aplikacja próbuje pobrać jej dane z Firebase. Odpowiedzi nie zmieniają danych. Nieobsługiwane pytania, źródła i filtry mogą zostać odrzucone albo zakończyć się informacją o braku danych. Daty względne, takie jak „ten piątek”, są liczone względem bieżącego tygodnia od poniedziałku do niedzieli.

Podczas nagrywania rozpoznany tekst pojawia się orientacyjnie co 2 sekundy. To podgląd, który może się zmieniać; po zatrzymaniu nagrania całość jest rozpoznawana ponownie i końcowy wynik zastępuje podgląd. Sprawdź tekst, bo `whisper.cpp` może pomylić słowa. Nagranie trwa maksymalnie 30 sekund. Lista może obejmować najwyżej 30 wyników, ale zwięzła odpowiedź może wymienić mniej; synteza mowy może dodatkowo skrócić długi tekst.

## Prywatność

Mowa, pytanie i dane używane do odpowiedzi trafiają do lokalnego serwera na Macu. Serwer wymaga zalogowania Firebase i dopuszcza tylko UID-y z `LOCAL_VOICE_ALLOWED_UIDS`; Ollama musi wskazywać pobrany model lokalny. Audio jest przetwarzane przez lokalne `ffmpeg` i `whisper.cpp`, a pliki tymczasowe są usuwane po przetworzeniu. Pytania, audio i odpowiedzi nie są wysyłane do płatnego API AI.

Aplikacja nadal łączy się z Firebase w celu logowania i pobierania danych. Snapshot asystenta ogranicza pola do jawnej listy, ale może zawierać dane osobowe, treść notatek, szablony wiadomości i adresy z historii e-maili. Nie udostępniaj dostępu do Maca ani tailnetu osobom, które nie powinny widzieć tych danych. Przy dostępie z telefonu połączenie prowadzi przez HTTPS Serve w prywatnym tailnecie Tailscale.

## Pierwsze uruchomienie

Wymagany jest macOS na Apple Silicon, Node.js 22 lub nowszy, npm, Ollama, `ffmpeg`, `whisper-cli` z whisper.cpp, Tailscale CLI i głos systemowy `Zosia`. Zależności Homebrew używane przez ten zestaw to `ffmpeg`, `whisper-cpp` i `tailscale`.

1. W katalogu projektu zachowaj istniejący `.env.local`. Sprawdź, czy zawiera konfigurację klienta Firebase (`NEXT_PUBLIC_FIREBASE_*`); można ją skopiować z `apphosting.yaml`. Nie zastępuj całego pliku, bo mogą być w nim potrzebne inne ustawienia.
2. Pobierz model Ollama: `ollama pull qwen3:4b`. Ollama musi działać lokalnie.
3. Pobierz wielojęzyczny model Whisper `small` (obsługuje polski) do `.local-voice/models/`:

   ```bash
   mkdir -p .local-voice/models
   curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin -o .local-voice/models/ggml-small.bin
   ```

4. W `.env.local` ustaw `LOCAL_VOICE_ENABLED=true`, `LOCAL_VOICE_OLLAMA_MODEL=qwen3:4b` i `LOCAL_VOICE_WHISPER_MODEL=.local-voice/models/ggml-small.bin`. Ścieżka jest liczona od katalogu projektu. Pozostałe ścieżki są opcjonalne: `LOCAL_VOICE_WHISPER_PATH` domyślnie wskazuje `whisper-cli`, `LOCAL_VOICE_FFMPEG_PATH` — `ffmpeg`, a `LOCAL_VOICE_SAY_VOICE` — `Zosia`.
5. Zainstaluj zależności i zbuduj aplikację:

   ```bash
   npm ci
   npm run build
   ```

   Budowanie wykonaj ponownie po każdej zmianie kodu.
6. Uruchom `Uruchom-Strumet.command` z Findera albo w terminalu wykonaj `bash scripts/local-voice-mac.sh start`. Skrypt uruchamia produkcyjny serwer na `127.0.0.1:3100` i używa `caffeinate -i`, aby Mac nie zasnął. Pozostaw okno terminala otwarte; `Ctrl+C` zatrzymuje serwer.
7. Otwórz aplikację lokalnie, zaloguj się, otwórz „Zapytaj o dane” i rozwiń „Informacje dla właściciela komputera”, aby odczytać UID. Dodaj go do `LOCAL_VOICE_ALLOWED_UIDS` w `.env.local`, po czym zatrzymaj i uruchom serwer ponownie. Można podać kilka UID rozdzielonych przecinkami. Serwer weryfikuje token Firebase i dopuszcza wyłącznie UID z tej listy.
8. Aby udostępnić aplikację w prywatnym tailnecie, wykonaj jednorazowo `bash scripts/local-voice-mac.sh connect`. Skrypt uruchamia userspace daemon Tailscale w `.local-voice/tailscale`, łączy Maca z tailnetem i włącza HTTPS Serve dla lokalnego serwera. Jeśli Tailscale poprosi o uwierzytelnienie, dokończ je zgodnie z komunikatem CLI.
9. Sprawdź adres dostępu poleceniem `bash scripts/local-voice-mac.sh status`. Dołącz Androida do tego samego tailnetu, otwórz wskazany adres HTTPS w Chrome i zaloguj się do aplikacji.

Po zmianie `.env.local` zrestartuj serwer. Pliki modeli, stan Tailscale i tymczasowe zasoby znajdują się w ignorowanym przez Git katalogu `.local-voice/`.

## Polecenia skryptu

```bash
bash scripts/local-voice-mac.sh start       # serwer aplikacji; zatrzymanie: Ctrl+C
bash scripts/local-voice-mac.sh connect     # połączenie Tailscale i HTTPS Serve
bash scripts/local-voice-mac.sh status      # stan Tailscale i Serve
bash scripts/local-voice-mac.sh disconnect  # reset Serve i rozłączenie Tailscale
```

Więcej informacji: [Ollama: structured outputs](https://docs.ollama.com/capabilities/structured-outputs), [whisper.cpp](https://github.com/ggml-org/whisper.cpp), [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve).
