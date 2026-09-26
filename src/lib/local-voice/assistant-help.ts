/** Verified routes and visible actions. Model may explain these facts but must not invent steps. */
export const APP_GUIDE = `Strumet to aplikacja kadrowa. Ekrany:
/pulpit — podsumowanie i wskaźniki.
/aktywni — lista aktywnych pracowników, przycisk „Dodaj pracownika”, formularz dodawania i edycji. Na telefonie przycisk dodawania jest okrągły w prawym dolnym rogu.
/zwolnieni — lista zwolnionych pracowników.
/harmonogram — harmonogram pracowników i nieobecności.
/odwiedzalnosc — ewidencja obecności i nieobecności.
/rekrutacja — zapotrzebowania na pracowników według działów i stanowisk.
/terminy — terminy związane z pracownikami.
/kalendarz — widok kalendarza.
/statystyki — statystyki i raporty kadrowe.
/szafki — szafki i ich przypisania.
/wydawanie-odziezy oraz /wydawanie-odziezy-nowi — ewidencja odzieży roboczej.
/karty-obiegowe — karty obiegowe.
/odciski-palcow — terminy odcisków palców.
/brak-logowania — zdarzenia braku odbicia karty.
/auta — samochody.
/notatki — notatki.
/konfiguracja — działy, stanowiska, kierownicy i ustawienia.
/szablony-email i /historia-email — szablony oraz historia wiadomości.
Zakres widocznych ekranów zależy od roli użytkownika. Asystent nie zmienia danych. Jeśli instrukcji nie ma w tych faktach, powiedz, że nie masz potwierdzonej procedury.`;

export function isAppHelpQuestion(question: string): boolean {
  const q = question.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  if (/\b(?:pomoc|instrukcj\w*|co robi|do czego sluzy)\b/.test(q)) return true;
  if (/\bjak\b/.test(q) && /\b(?:dodac|dodaje|edytowac|usunac|otworzyc|przejsc|znalezc|wlaczyc|uzywac|obslugiwac|skonfigurowac)\b/.test(q)) return true;
  return /\bgdzie\b.*\b(?:znajde|jest|otworze)\b.*\b(?:ekran|zakladk\w*|menu|harmonogram|rekrutacj\w*|statystyk\w*|notatk\w*|auta|samochod\w*|aplikacj\w*)\b/.test(q);
}

/** Fallback when the local model cannot answer a help question. */
export function appHelpAnswer(question: string): string | null {
  const q = question.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  if (!isAppHelpQuestion(question)) return null;
  if (/dodac|dodaje|utworzyc|nowego/.test(q) && /pracownik/.test(q)) return 'Otwórz ekran „Aktywni” i wybierz „Dodaj pracownika”. W formularzu uzupełnij dane osoby i zapisz je. Na telefonie przycisk dodawania jest okrągły i znajduje się w prawym dolnym rogu.';
  if (/pracownik/.test(q) && /aktywn/.test(q)) return 'Listę aktywnych pracowników znajdziesz na ekranie „Aktywni”.';
  if (/samochod|auta|auto/.test(q)) return 'Dane samochodów znajdziesz na ekranie „Auta”.';
  if (/rekrutacj/.test(q)) return 'Zapotrzebowania na pracowników znajdziesz na ekranie „Rekrutacja”.';
  if (/statystyk/.test(q)) return 'Zestawienia znajdziesz na ekranie „Statystyki”.';
  if (/notatk/.test(q)) return 'Notatki znajdziesz na ekranie „Notatki”.';
  return 'Nie mam potwierdzonej instrukcji dla tej funkcji aplikacji.';
}
