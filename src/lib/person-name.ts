/**
 * Kolejność w polu `fullName`: "Nazwisko Imię" (np. "Kowalski Jan", "Kowalski Jan Maria").
 * Pierwszy wyraz to nazwisko, reszta to imię/imiona — tak samo jak w nagłówkach eksportu/importu
 * ("Nazwisko i imię"), w kopiowaniu danych pracownika i w kolumnach tabeli.
 */

export interface SplitName {
  lastName: string;
  firstName: string;
}

const clean = (s: string) => s.trim().replace(/\s+/g, ' ');

export function splitFullName(fullName: string | undefined | null): SplitName {
  const parts = clean(fullName ?? '').split(' ').filter(Boolean);
  const lastName = parts.shift() ?? '';
  return { lastName, firstName: parts.join(' ') };
}

export function joinFullName(lastName: string, firstName: string): string {
  return clean(`${lastName} ${firstName}`);
}

export type NameOrderGuess = 'lastFirst' | 'firstLast' | 'unclear';

/** Częstość występowania każdego wyrazu (wielkie litery) we wszystkich nazwiskach. */
export function buildTokenFrequency(fullNames: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  fullNames.forEach(name => {
    clean(name).toUpperCase().split(' ').filter(Boolean).forEach(token => {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    });
  });
  return freq;
}

/**
 * Zgadywanie kolejności po częstości wyrazów: imiona powtarzają się w firmie znacznie częściej
 * niż nazwiska. To tylko wskazówka do ręcznej weryfikacji (np. częste nazwisko "Singh" myli test).
 * - 'lastFirst'  = pierwszy wyraz wygląda na nazwisko ("Nazwisko Imię" — docelowo)
 * - 'firstLast'  = pierwszy wyraz wygląda na imię ("Imię Nazwisko" — do odwrócenia)
 */
export function guessNameOrder(fullName: string, freq: Map<string, number>): NameOrderGuess {
  const parts = clean(fullName).toUpperCase().split(' ').filter(Boolean);
  if (parts.length < 2) return 'unclear';
  const first = freq.get(parts[0]) ?? 0;
  const last = freq.get(parts[parts.length - 1]) ?? 0;
  if (first > last) return 'firstLast';
  if (last > first) return 'lastFirst';
  return 'unclear';
}

/**
 * Propozycja odwrócenia "Imię Nazwisko" → "Nazwisko Imię": ostatni wyraz idzie na początek
 * ("Jan Kowalski" → "Kowalski Jan"; "Jan Maria Kowalski" → "Kowalski Jan Maria").
 * Przy nazwiskach dwuczłonowych ("Guilherme Peres Ramalho") propozycję trzeba poprawić ręcznie.
 */
export function suggestReordered(fullName: string): string {
  const parts = clean(fullName).split(' ').filter(Boolean);
  if (parts.length < 2) return clean(fullName);
  const last = parts.pop() as string;
  return [last, ...parts].join(' ');
}
