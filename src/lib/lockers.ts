import type { Employee } from './types';

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
 * Mapa: numer szafki (znormalizowany) → nazwiska pracowników, którzy ją mają.
 * Liczymy tylko aktywnych — szafki zwolnionych są wolne.
 */
export function buildLockerOccupancy(employees: Employee[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const emp of employees) {
    if (emp.status !== 'aktywny') continue;
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
