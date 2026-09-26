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
