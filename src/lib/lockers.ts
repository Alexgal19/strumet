import type { Employee } from './types';
import { startOfDay } from 'date-fns';
import { isActiveEmployee } from './employee-status';
import { parseMaybeDate } from './date';

/** Wszystkie pola pracownika, w których zapisany jest numer szafki. */
export const EMPLOYEE_LOCKER_FIELDS = [
  'lockerNumber',
  'lockerNumber2',
  'lockerNumber3',
  'departmentLockerNumber',
] as const satisfies readonly (keyof Employee)[];

export type EmployeeLockerField = (typeof EMPLOYEE_LOCKER_FIELDS)[number];

/** "k206 " i "K206" to ta sama szafka. */
export const normalizeLockerLabel = (value?: string | null): string =>
  (value ?? '').trim().toUpperCase();

/**
 * Czy pracownik nadal zajmuje swoje szafki: aktywny jak na liście „Aktywni” (status „aktywny”
 * i nie minęła planowana data zwolnienia) oraz bez daty zwolnienia z przeszłości
 * (np. data wpisana w formularzu bez zmiany statusu).
 */
export function holdsLocker(emp: Employee, today = startOfDay(new Date())): boolean {
  if (!isActiveEmployee(emp, today)) return false;
  const terminated = parseMaybeDate(emp.terminationDate);
  return !(terminated && startOfDay(terminated) < today);
}

/**
 * Mapa: numer szafki (znormalizowany) → nazwiska pracowników, którzy ją mają.
 * Liczymy tylko osoby, które nadal pracują — szafki pozostałych są wolne.
 */
export function buildLockerOccupancy(employees: Employee[], today?: Date): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const emp of employees) {
    if (!holdsLocker(emp, today)) continue;
    const seen = new Set<string>();
    for (const field of EMPLOYEE_LOCKER_FIELDS) {
      const key = normalizeLockerLabel(emp[field]);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      (map[key] ??= []).push(emp.fullName);
    }
  }
  return map;
}
