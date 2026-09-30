/**
 * Prognoza braków kadrowych w czasie (per stanowisko).
 * Start: teraz = max(0, potrzeby - obecnie). Dalej krocząco po datach:
 * zwolnienia odejmują obsadę, przyjęcia dodają. Daty grupowane
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

function isValidYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function forecastShortage(
  potrzeby: number,
  obecnie: number,
  leaves: StaffChange[],
  arrivals: StaffChange[]
): ForecastRow[] {
  const p = Number(potrzeby) || 0;
  let staff = Number(obecnie) || 0;
  const rows: ForecastRow[] = [{ kind: 'now', date: '', shortage: Math.max(0, p - staff) }];

  const deltas = new Map<string, number>();
  leaves.forEach(l => {
    if (isValidYmd(l.date)) deltas.set(l.date, (deltas.get(l.date) || 0) - (Number(l.count) || 0));
  });
  arrivals.forEach(a => {
    if (isValidYmd(a.date)) deltas.set(a.date, (deltas.get(a.date) || 0) + (Number(a.count) || 0));
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
