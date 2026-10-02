/**
 * Prognoza braków kadrowych w czasie (per stanowisko).
 * Start: teraz = max(0, potrzeby - obecnie). Dalej krocząco po datach:
 * zwolnienia odejmują obsadę, przyjęcia dodają. Data zwolnienia = OSTATNI dzień
 * pracy (tak jak w Harmonogramie obsady), więc brak liczymy od dnia następnego.
 * Przyjęcie liczy się od swojej daty. Daty grupowane
 * (ten sam dzień = jedna suma), nieprawidłowe daty pomijane.
 * Wiersz daty emitowany tylko, gdy zmienia braki (bez szumu).
 */

export interface StaffChange {
  date: string;
  count: number;
}

export interface ForecastRow {
  kind: 'now' | 'date';
  date: string;
  shortage: number;
}

import { toYmd } from '@/lib/date';

function isValidYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Нормалізує дату зміни до 'yyyy-MM-dd' (ISO, dd.MM.yyyy, Excel-серіал). Null = пропустити. */
function normalizeChangeDate(s: string): string | null {
  const ymd = toYmd(s);
  return ymd && isValidYmd(ymd) ? ymd : null;
}

/** Następny dzień kalendarzowy (yyyy-MM-dd), bez zależności od strefy czasowej. */
function nextDayYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function forecastShortage(
  potrzeby: number,
  obecnie: number,
  leaves: StaffChange[],
  arrivals: StaffChange[],
  fromYmd?: string
): ForecastRow[] {
  const p = Number(potrzeby) || 0;
  let staff = Number(obecnie) || 0;
  const rows: ForecastRow[] = [{ kind: 'now', date: '', shortage: Math.max(0, p - staff) }];

  const deltas = new Map<string, number>();
  leaves.forEach(l => {
    const ymd = normalizeChangeDate(l.date);
    if (!ymd) return;
    if (fromYmd && ymd < fromYmd) return;
    // Ostatni dzień pracy = l.date → brak widoczny dopiero od następnego dnia.
    const effective = nextDayYmd(ymd);
    deltas.set(effective, (deltas.get(effective) || 0) - (Number(l.count) || 0));
  });
  arrivals.forEach(a => {
    const ymd = normalizeChangeDate(a.date);
    if (!ymd) return;
    if (fromYmd && ymd < fromYmd) return;
    deltas.set(ymd, (deltas.get(ymd) || 0) + (Number(a.count) || 0));
  });

  Array.from(deltas.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, delta]) => {
      staff += delta;
      const shortage = Math.max(0, p - staff);
      if (shortage !== rows[rows.length - 1].shortage) {
        rows.push({ kind: 'date', date, shortage });
      }
    });

  return rows;
}

/** Dodaje n dni do daty yyyy-MM-dd (bez zależności od strefy czasowej). */
export function addDaysToYmd(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Braki na dany dzień wg prognozy: ostatni wiersz o dacie <= ymd (inaczej wartość "teraz"). */
export function shortageAt(rows: ForecastRow[], ymd: string): number {
  let value = rows[0]?.shortage ?? 0;
  for (const r of rows) {
    if (r.kind === 'date' && r.date <= ymd) value = r.shortage;
  }
  return value;
}
