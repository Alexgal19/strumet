import { addDays, endOfDay, endOfWeek, startOfDay, startOfWeek } from 'date-fns';
import { parseMaybeDate } from '@/lib/date';
import type { Employee, FingerprintAppointment } from '@/lib/types';

/** Tydzień roboczy: poniedziałek–niedziela (polski kalendarz). */
const WEEK_OPTIONS = { weekStartsOn: 1 as const };
export const REMINDER_WINDOW_DAYS = 30;

export function weekRange(now: Date = new Date()) {
  return {
    start: startOfDay(startOfWeek(now, WEEK_OPTIONS)),
    end: endOfDay(endOfWeek(now, WEEK_OPTIONS)),
  };
}

export function isInWeek(dateValue: string | null | undefined, now: Date = new Date()): boolean {
  const date = parseMaybeDate(dateValue);
  if (!date) return false;
  const { start, end } = weekRange(now);
  return date >= start && date <= end;
}

export function isWithinNextDays(
  dateValue: string | null | undefined,
  days: number,
  now: Date = new Date()
): boolean {
  const date = parseMaybeDate(dateValue);
  if (!date) return false;
  const start = startOfDay(now);
  const end = endOfDay(addDays(start, days));
  return date >= start && date <= end;
}

/** Data ostatniego dnia pracy: faktyczna, a gdy jej brak — planowana. */
function effectiveTerminationDate(employee: Employee): string | undefined {
  return employee.terminationDate || employee.plannedTerminationDate;
}

function byDate<T>(items: T[], getDate: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => {
    const left = parseMaybeDate(getDate(a))?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const right = parseMaybeDate(getDate(b))?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

export interface DashboardActions {
  /** Osoby aktywne, których data rozpoczęcia pracy wypada w bieżącym tygodniu. */
  hiresThisWeek: Employee[];
  /** Zwolnienia z ostatnim dniem pracy w bieżącym tygodniu (faktyczne albo planowane). */
  terminationsThisWeek: Employee[];
  /** Aktywne umowy wygasające w ciągu najbliższych 30 dni. */
  expiringContracts: Employee[];
  /** Wizyty na odciski palców w ciągu najbliższych 30 dni. */
  upcomingAppointments: FingerprintAppointment[];
  /** Wszystkie zaplanowane zwolnienia od dziś (aktywni pracownicy). */
  plannedTerminations: Employee[];
}

export function getDashboardActions({
  employees,
  appointments,
  now = new Date(),
}: {
  employees: Employee[];
  appointments: FingerprintAppointment[];
  now?: Date;
}): DashboardActions {
  const activeEmployees = employees.filter((employee) => employee.status === 'aktywny');

  const hiresThisWeek = byDate(
    activeEmployees.filter((employee) => isInWeek(employee.hireDate, now)),
    (employee) => employee.hireDate
  );

  const terminationsThisWeek = byDate(
    employees.filter((employee) => isInWeek(effectiveTerminationDate(employee), now)),
    effectiveTerminationDate
  );

  const expiringContracts = byDate(
    activeEmployees.filter((employee) =>
      isWithinNextDays(employee.contractEndDate, REMINDER_WINDOW_DAYS, now)
    ),
    (employee) => employee.contractEndDate
  );

  const upcomingAppointments = byDate(
    appointments.filter((appointment) =>
      isWithinNextDays(appointment.appointmentDate, REMINDER_WINDOW_DAYS, now)
    ),
    (appointment) => appointment.appointmentDate
  );

  const today = startOfDay(now);
  const plannedTerminations = byDate(
    activeEmployees.filter((employee) => {
      const date = parseMaybeDate(employee.plannedTerminationDate);
      return date ? startOfDay(date) >= today : false;
    }),
    (employee) => employee.plannedTerminationDate
  );

  return {
    hiresThisWeek,
    terminationsThisWeek,
    expiringContracts,
    upcomingAppointments,
    plannedTerminations,
  };
}
