import { startOfDay } from 'date-fns';
import type { Employee } from './types';
import { parseMaybeDate } from './date';

export function isEffectivelyTerminated(employee: Employee, today = startOfDay(new Date())): boolean {
  const planned = parseMaybeDate(employee.plannedTerminationDate);
  return planned !== null && startOfDay(planned) < today;
}

export function isActiveEmployee(employee: Employee, today = startOfDay(new Date())): boolean {
  return employee.status === 'aktywny' && !isEffectivelyTerminated(employee, today);
}

/**
 * Data zwolnienia do pokazania/eksportu. Gdy osoba jest już zwolniona (status "zwolniony" albo minęła
 * planowana data zwolnienia), a faktycznej daty brak — przyjmujemy planowaną datę zwolnienia.
 */
export function getEffectiveTerminationDate(employee: Employee, today = startOfDay(new Date())): string | undefined {
  if (employee.terminationDate) return employee.terminationDate;
  const isGone = employee.status === 'zwolniony' || isEffectivelyTerminated(employee, today);
  return isGone && employee.plannedTerminationDate ? employee.plannedTerminationDate : undefined;
}

/** Kopia pracownika z uzupełnioną datą zwolnienia (jak getEffectiveTerminationDate); bez zmian, gdy nie trzeba. */
export function withEffectiveTerminationDate(employee: Employee, today = startOfDay(new Date())): Employee {
  if (employee.terminationDate) return employee;
  const effective = getEffectiveTerminationDate(employee, today);
  return effective ? { ...employee, terminationDate: effective } : employee;
}

/**
 * Pola do zapisania przy przywróceniu pracownika do aktywnych — tak, jakby zwolnienia nie było.
 * Czyści status, datę i powód zwolnienia. Planowaną datę zwolnienia usuwa tylko wtedy, gdy już minęła
 * (to ona sama przenosi osobę do zwolnionych); przyszłą planowaną datę zostawia bez zmian.
 */
export function getRestoreUpdates(
  employee: Pick<Employee, 'fullName' | 'plannedTerminationDate'>,
  today = startOfDay(new Date())
): Record<string, string | null> {
  const updates: Record<string, string | null> = {
    status: 'aktywny',
    terminationDate: null,
    terminationReason: null,
    status_fullName: `aktywny_${(employee.fullName || '').toLowerCase()}`,
  };
  const planned = parseMaybeDate(employee.plannedTerminationDate);
  if (planned !== null && startOfDay(planned) < today) {
    updates.plannedTerminationDate = null;
  }
  return updates;
}

/** Czy pracownik jest na liście zwolnionych (status "zwolniony" albo minęła planowana data zwolnienia). */
export function isFormerEmployee(employee: Employee, today = startOfDay(new Date())): boolean {
  return employee.status === 'zwolniony' || isEffectivelyTerminated(employee, today);
}
