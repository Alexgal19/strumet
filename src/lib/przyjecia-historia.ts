import { format, startOfDay } from 'date-fns';
import { parseMaybeDate } from '@/lib/date';

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

export type ArrivalStatus = 'done' | 'partial' | 'missing';

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
    if (!a.date || a.date >= todayYmd) upcoming.push(a);
    else past.push(a);
  });
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  past.sort((a, b) => b.date.localeCompare(a.date));
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

export function arrivalStatus(arrival: HistoriaArrival, matchedCount: number): ArrivalStatus {
  if (matchedCount >= arrival.count) return 'done';
  if (matchedCount > 0) return 'partial';
  return 'missing';
}

/**
 * Czy osoba faktycznie DOPINGO odejdzie (liczy się do "zwalnia")?
 * Już zwolniony = już odszedł — nie liczy się, nawet gdy terminationDate == dziś.
 */
export function isPendingTermination(
  status: string | undefined,
  terminationDate: string | undefined,
  plannedTerminationDate: string | undefined,
  todayMs: number
): boolean {
  if (status === 'zwolniony') return false;
  const day = (s?: string) => {
    const d = s ? parseMaybeDate(s) : null;
    return d ? startOfDay(d).getTime() : NaN;
  };
  const t = day(terminationDate);
  const p = day(plannedTerminationDate);
  return (!Number.isNaN(t) && t >= todayMs) || (!Number.isNaN(p) && p >= todayMs);
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
