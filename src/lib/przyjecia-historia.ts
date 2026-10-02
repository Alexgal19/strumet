import { format, startOfDay } from 'date-fns';
import { parseMaybeDate, toYmd as normalizeToYmd } from '@/lib/date';

/**
 * Historia minionych przyjęć + heurystyka weryfikacji,
 * czy na dział faktycznie doszły osoby (po dacie zatrudnienia).
 *
 * Przeszłe = data < dziś (porównanie na yyyy-mm-dd).
 * Dopasowanie: ten sam dział + stanowisko, hireDate w oknie
 * [data - 7 dni, data + 14 dni]. Pokrycie hireDate w bazie: ~100%.
 */

export interface HistoriaArrival {
  id: string;
  department: string;
  jobTitle: string;
  date: string;
  count: number;
}

export interface HistoriaEmployee {
  fullName: string;
  department: string;
  jobTitle: string;
  hireDate?: string;
}

export interface HireMatch {
  fullName: string;
  hireDate: string;
}

/** pending = okno weryfikacji jeszcze trwa (brak dopasowań, ale osoby mogą jeszcze dojść). */
export type ArrivalStatus = 'done' | 'partial' | 'pending' | 'missing';

export const HIRE_WINDOW_BEFORE_DAYS = 7;
export const HIRE_WINDOW_AFTER_DAYS = 14;

function toYmd(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function addDaysYmd(ymd: string, days: number): string | null {
  const d = parseMaybeDate(ymd);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

/** Dzieli przyjęcia na nadchodzące (data >= dziś) i przeszłe. Sort: nadchodzące rosnąco, przeszłe malejąco. */
export function splitArrivals(
  arrivals: HistoriaArrival[],
  todayYmd: string
): { upcoming: HistoriaArrival[]; past: HistoriaArrival[] } {
  const upcoming: HistoriaArrival[] = [];
  const past: HistoriaArrival[] = [];
  arrivals.forEach(a => {
    // Uszkodzona data = nie gubimy wpisu, traktujemy jako nadchodzące.
    // Порівнюємо нормалізований YMD, щоб dd.MM.yyyy та ISO-дати працювали однаково.
    if (!a.date) {
      upcoming.push(a);
      return;
    }
    const ymd = normalizeToYmd(a.date);
    if (!ymd || ymd >= todayYmd) upcoming.push(a);
    else past.push(a);
  });
  const sortKey = (a: HistoriaArrival) => normalizeToYmd(a.date) ?? a.date;
  upcoming.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  past.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  return { upcoming, past };
}

/** Osoby zatrudnione na dane stanowisko w oknie wokół daty przyjęcia. */
export function matchHires(
  arrival: HistoriaArrival,
  employees: HistoriaEmployee[],
  windowBeforeDays: number = HIRE_WINDOW_BEFORE_DAYS,
  windowAfterDays: number = HIRE_WINDOW_AFTER_DAYS
): HireMatch[] {
  const from = addDaysYmd(arrival.date, -windowBeforeDays);
  const to = addDaysYmd(arrival.date, windowAfterDays);
  if (!from || !to) return [];
  return employees
    .filter(e => e.department === arrival.department && e.jobTitle === arrival.jobTitle)
    .map(e => {
      const h = e.hireDate ? parseMaybeDate(e.hireDate) : null;
      if (!h) return null;
      const ymd = toYmd(h);
      if (ymd < from || ymd > to) return null;
      return { fullName: e.fullName, hireDate: ymd };
    })
    .filter((m): m is HireMatch => m !== null)
    .sort((a, b) => a.hireDate.localeCompare(b.hireDate) || a.fullName.localeCompare(b.fullName, 'pl'));
}

/** Ostatni dzień okna weryfikacji (yyyy-mm-dd) — po nim brak dopasowań = niezrealizowane. */
export function arrivalWindowEnd(arrival: HistoriaArrival): string | null {
  return addDaysYmd(arrival.date, HIRE_WINDOW_AFTER_DAYS);
}

export function arrivalStatus(
  arrival: HistoriaArrival,
  matchedCount: number,
  todayYmd?: string
): ArrivalStatus {
  if (matchedCount >= arrival.count) return 'done';
  if (matchedCount > 0) return 'partial';
  if (todayYmd) {
    const end = arrivalWindowEnd(arrival);
    if (end && todayYmd <= end) return 'pending';
  }
  return 'missing';
}

/**
 * Czy osoba faktycznie jeszcze odejdzie (liczy się do "zwalnia")?
 * Już zwolniony = już odszedł — nie liczy się, nawet gdy terminationDate == dziś.
 */
export function isPendingTermination(
  status: string | undefined,
  terminationDate: string | undefined,
  plannedTerminationDate: string | undefined,
  todayMs: number
): boolean {
  if (status === 'zwolniony') return false;
  // Нормалізуємо todayMs до початку дня — функція коректна і для Date.now(), і для startOfDay.
  const todayStart = startOfDay(new Date(todayMs)).getTime();
  const day = (s?: string) => {
    const d = s ? parseMaybeDate(s) : null;
    return d ? startOfDay(d).getTime() : NaN;
  };
  const t = day(terminationDate);
  const p = day(plannedTerminationDate);
  return (!Number.isNaN(t) && t >= todayStart) || (!Number.isNaN(p) && p >= todayStart);
}

export interface TransferRecord {
  employeeId: string;
  fullName: string;
  fromDepartment: string;
  fromJobTitle: string;
  toDepartment: string;
  toJobTitle: string;
  date: string; // yyyy-mm-dd
  at?: string;
  by?: string;
}

export interface TransferMatch {
  fullName: string;
  date: string;
  fromDepartment: string;
}

/** Przeniesienia NA dane stanowisko w oknie wokół daty przyjęcia. */
export function matchTransfers(
  arrival: HistoriaArrival,
  transfers: TransferRecord[],
  windowBeforeDays: number = HIRE_WINDOW_BEFORE_DAYS,
  windowAfterDays: number = HIRE_WINDOW_AFTER_DAYS
): TransferMatch[] {
  const from = addDaysYmd(arrival.date, -windowBeforeDays);
  const to = addDaysYmd(arrival.date, windowAfterDays);
  if (!from || !to) return [];
  return transfers
    .filter(t =>
      t.toDepartment === arrival.department &&
      t.toJobTitle === arrival.jobTitle &&
      typeof t.date === 'string' && t.date >= from && t.date <= to
    )
    .map(t => ({ fullName: t.fullName, date: t.date, fromDepartment: t.fromDepartment }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.fullName.localeCompare(b.fullName, 'pl'));
}

export interface ArrivalAllocation {
  hired: HireMatch[];
  moved: TransferMatch[];
}

function dayDistance(aYmd: string, bYmd: string): number {
  const toMs = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.abs(toMs(aYmd) - toMs(bYmd)) / 86_400_000;
}

/**
 * Przydziela zatrudnienia i transfery do przyjęć tak, by ta sama osoba liczyła się tylko raz.
 * Przyjęcia idą chronologicznie; każde bierze najbliższe (w dniach) jeszcze wolne osoby,
 * ale nie więcej niż swoje `count`. Nadwyżka zostaje dostępna dla kolejnych przyjęć.
 */
export function allocateArrivals(
  arrivals: HistoriaArrival[],
  employees: HistoriaEmployee[],
  transfers: TransferRecord[]
): Map<string, ArrivalAllocation> {
  const result = new Map<string, ArrivalAllocation>();
  const claimed = new Set<string>();
  const ordered = [...arrivals].sort(
    (a, b) => (normalizeToYmd(a.date) ?? a.date).localeCompare(normalizeToYmd(b.date) ?? b.date) || a.id.localeCompare(b.id)
  );

  ordered.forEach(a => {
    const ymd = normalizeToYmd(a.date) ?? a.date;
    const byDistance = <T extends { fullName: string }>(items: T[], dateOf: (i: T) => string, keyOf: (name: string) => string) =>
      items
        .filter(i => !claimed.has(keyOf(i.fullName)))
        .sort((x, y) => dayDistance(dateOf(x), ymd) - dayDistance(dateOf(y), ymd) || x.fullName.localeCompare(y.fullName, 'pl'));

    const hired: HireMatch[] = [];
    // Klucz osoby: dział + stanowisko przyjęcia + imię i nazwisko (dopasowania są już zawężone
    // do tego działu/stanowiska), więc tezki z innych działów nie blokują się nawzajem.
    const personKey = (fullName: string) => `${a.department}|${a.jobTitle}|${fullName}`;

    for (const h of byDistance(matchHires(a, employees), h => h.hireDate, personKey)) {
      if (hired.length >= a.count) break;
      if (claimed.has(personKey(h.fullName))) continue;
      claimed.add(personKey(h.fullName));
      hired.push(h);
    }

    const moved: TransferMatch[] = [];
    for (const m of byDistance(matchTransfers(a, transfers), m => m.date, personKey)) {
      if (hired.length + moved.length >= a.count) break;
      if (claimed.has(personKey(m.fullName))) continue;
      claimed.add(personKey(m.fullName));
      moved.push(m);
    }

    hired.sort((x, y) => x.hireDate.localeCompare(y.hireDate) || x.fullName.localeCompare(y.fullName, 'pl'));
    moved.sort((x, y) => x.date.localeCompare(y.date) || x.fullName.localeCompare(y.fullName, 'pl'));
    result.set(a.id, { hired, moved });
  });

  return result;
}
