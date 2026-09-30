/**
 * Czysta (bez zależności od Firebase) walidacja planowanego przyjęcia.
 * Używana przez POST /api/public/przyjecia — ta sama logika jest testowana jednostkowo.
 * Gość może dodawać wyłącznie PRZYSZŁE przyjęcia (data >= dziś, strefa Europe/Warsaw).
 */

export interface PrzyjecieInput {
  department: unknown;
  jobTitle: unknown;
  date: unknown;
  count: unknown;
}

export interface PrzyjecieValid {
  department: string;
  jobTitle: string;
  date: string; // yyyy-mm-dd
  count: number;
}

export type ValidationResult =
  | { ok: true; value: PrzyjecieValid }
  | { ok: false; error: string };

export const MAX_COUNT = 50;

/** Aktualna data (yyyy-mm-dd) w danej strefie czasowej. Serwer stoi w US, użytkownik w PL. */
export function getTodayYmd(timeZone = 'Europe/Warsaw', now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function isValidCalendarDate(ymd: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function validatePrzyjecie(
  input: PrzyjecieInput,
  allowedDepartments: string[],
  allowedJobTitles: string[],
  todayYmd: string
): ValidationResult {
  const department = typeof input.department === 'string' ? input.department.trim() : '';
  if (!department) {
    return { ok: false, error: 'Wybierz dział.' };
  }
  if (!allowedDepartments.includes(department)) {
    return { ok: false, error: 'Wybierz dział z listy.' };
  }

  const jobTitle = typeof input.jobTitle === 'string' ? input.jobTitle.trim() : '';
  if (!jobTitle) {
    return { ok: false, error: 'Wybierz stanowisko.' };
  }
  if (!allowedJobTitles.includes(jobTitle)) {
    return { ok: false, error: 'Wybierz stanowisko z listy.' };
  }

  const date = typeof input.date === 'string' ? input.date.trim() : '';
  if (!isValidCalendarDate(date)) {
    return { ok: false, error: 'Nieprawidłowa data.' };
  }
  if (date < todayYmd) {
    return { ok: false, error: 'Data przyjęcia nie może być z przeszłości.' };
  }

  const count = Number(input.count);
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    return { ok: false, error: `Liczba osób musi wynosić od 1 do ${MAX_COUNT}.` };
  }

  return { ok: true, value: { department, jobTitle, date, count } };
}
