import type { Employee, Order, StaffingHint, StaffingHintReason, VacationPerson } from './types';
import { isWithinVacation, parseMaybeDate, vacationHasStarted, vacationIsOver } from './date';
import { compareAsc, startOfDay } from 'date-fns';

export const UPCOMING_VACATION_HORIZON_DAYS = 14;
export const TERMINATION_WINDOW_DAYS = 30;

const dayDiff = (a: Date, b: Date): number =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);

/**
 * Builds the "Osoby na urlopie" list: everyone with a vacation start date set,
 * regardless of the end date (entries stay until manually ended).
 * phase:
 *  - 'na-urlopie'  — today falls within [start, end]
 *  - 'zakończony'  — end date already passed (waits for manual confirmation)
 *  - 'planowany'   — start date still in the future
 */
export function buildVacationPeople(
  employees: Employee[],
  now: Date = new Date()
): VacationPerson[] {
  return employees
    .filter(e => e.status === 'aktywny' && !!e.vacationStartDate)
    .map(employee => {
      let phase: VacationPerson['phase'];
      if (vacationHasStarted(employee.vacationStartDate, now)) {
        phase = vacationIsOver(employee.vacationEndDate, now) ? 'zakończony' : 'na-urlopie';
      } else {
        phase = 'planowany';
      }
      return { employee, status: employee.status, phase };
    })
    .sort((a, b) => {
      const aDate = parseMaybeDate(a.employee.vacationStartDate)?.getTime() ?? 0;
      const bDate = parseMaybeDate(b.employee.vacationStartDate)?.getTime() ?? 0;
      return aDate - bDate;
    });
}

interface HintGroup {
  key: string;
  department: string;
  jobTitle: string;
  reason: StaffingHintReason;
  employees: Employee[];
  earliest: Date;
  latest?: Date;
}

const groupKey = (department: string, jobTitle: string, reason: StaffingHintReason) =>
  `${department}|${jobTitle}|${reason}`;

const addToGroups = (
  groups: Map<string, HintGroup>,
  employee: Employee,
  reason: StaffingHintReason,
  earliest: Date,
  latest?: Date
) => {
  const key = groupKey(employee.department, employee.jobTitle, reason);
  const existing = groups.get(key);
  if (existing) {
    existing.employees.push(employee);
    if (compareAsc(earliest, existing.earliest) < 0) existing.earliest = earliest;
    if (latest && (!existing.latest || compareAsc(existing.latest, latest) < 0)) existing.latest = latest;
  } else {
    groups.set(key, {
      key,
      department: employee.department,
      jobTitle: employee.jobTitle,
      reason,
      employees: [employee],
      earliest,
      latest,
    });
  }
};

/**
 * Rule-based staffing hints grouped by department + job title:
 *  - 'urlop'    — vacations that already started (incl. ended-but-not-confirmed) or start
 *                 within UPCOMING_VACATION_HORIZON_DAYS; period = vacation range.
 *  - 'odejście' — planned terminations (plannedTerminationDate) plus terminations from the
 *                 last TERMINATION_WINDOW_DAYS; permanent (no period).
 * Outstanding replacement orders for the same department + job title reduce the count.
 */
export function buildStaffingHints(
  employees: Employee[],
  orders: Order[],
  now: Date = new Date(),
  options?: { upcomingHorizonDays?: number; terminationWindowDays?: number }
): StaffingHint[] {
  const horizonDays = options?.upcomingHorizonDays ?? UPCOMING_VACATION_HORIZON_DAYS;
  const terminationWindowDays = options?.terminationWindowDays ?? TERMINATION_WINDOW_DAYS;

  const groups = new Map<string, HintGroup>();

  for (const employee of employees) {
    if (employee.status === 'zwolniony') continue;

    if (employee.vacationStartDate) {
      const start = parseMaybeDate(employee.vacationStartDate);
      if (start) {
        const end = parseMaybeDate(employee.vacationEndDate);
        const started = vacationHasStarted(employee.vacationStartDate, now);
        const startsSoon = dayDiff(start, now) > 0 && dayDiff(start, now) <= horizonDays;
        if (started || startsSoon) {
          addToGroups(groups, employee, 'urlop', start, end ?? undefined);
        }
      }
    }

    const planned = parseMaybeDate(employee.plannedTerminationDate);
    if (planned && compareAsc(startOfDay(now), startOfDay(planned)) <= 0) {
      addToGroups(groups, employee, 'odejście', planned);
    }
  }

  for (const employee of employees) {
    if (employee.status !== 'zwolniony' || !employee.terminationDate) continue;
    const terminated = parseMaybeDate(employee.terminationDate);
    if (!terminated) continue;
    const diffDays = dayDiff(now, terminated);
    if (diffDays >= 0 && diffDays <= terminationWindowDays) {
      addToGroups(groups, employee, 'odejście', terminated);
    }
  }

  const outstandingByKey = new Map<string, number>();
  for (const order of orders) {
    if (order.type !== 'replacement') continue;
    const outstanding = Math.max(0, order.quantity - order.realizedQuantity);
    if (outstanding === 0) continue;
    const key = groupKey(order.department, order.jobTitle, 'odejście');
    outstandingByKey.set(key, (outstandingByKey.get(key) ?? 0) + outstanding);
    // Vacation covers are temporary — an open replacement order for the same
    // department + job title also reduces the temporary need.
    const vacKey = groupKey(order.department, order.jobTitle, 'urlop');
    outstandingByKey.set(vacKey, (outstandingByKey.get(vacKey) ?? 0) + outstanding);
  }

  const hints: StaffingHint[] = [];
  for (const group of groups.values()) {
    const orderedOutstanding = outstandingByKey.get(group.key) ?? 0;
    hints.push({
      id: group.key,
      department: group.department,
      jobTitle: group.jobTitle,
      reason: group.reason,
      count: Math.max(0, group.employees.length - orderedOutstanding),
      from: group.earliest.toISOString(),
      to: group.latest?.toISOString(),
      employees: group.employees,
      orderedOutstanding,
    });
  }

  return hints.sort((a, b) => {
    const aDate = parseMaybeDate(a.from)?.getTime() ?? 0;
    const bDate = parseMaybeDate(b.from)?.getTime() ?? 0;
    if (aDate !== bDate) return aDate - bDate;
    return a.department.localeCompare(b.department, 'pl');
  });
}

/** Employees with a planned termination (still active), sorted by planned date. */
export function buildPlannedTerminations(employees: Employee[], now: Date = new Date()): Employee[] {
  return employees
    .filter(e => {
      if (e.status !== 'aktywny' || !e.plannedTerminationDate) return false;
      const planned = parseMaybeDate(e.plannedTerminationDate);
      return !!planned && compareAsc(startOfDay(now), startOfDay(planned)) <= 0;
    })
    .sort((a, b) => {
      const aDate = parseMaybeDate(a.plannedTerminationDate)?.getTime() ?? 0;
      const bDate = parseMaybeDate(b.plannedTerminationDate)?.getTime() ?? 0;
      return aDate - bDate;
    });
}

/** Employees terminated within the last TERMINATION_WINDOW_DAYS. */
export function buildRecentTerminations(
  employees: Employee[],
  now: Date = new Date(),
  windowDays: number = TERMINATION_WINDOW_DAYS
): Employee[] {
  return employees
    .filter(e => {
      if (e.status !== 'zwolniony' || !e.terminationDate) return false;
      const terminated = parseMaybeDate(e.terminationDate);
      if (!terminated) return false;
      const diffDays = dayDiff(now, terminated);
      return diffDays >= 0 && diffDays <= windowDays;
    })
    .sort((a, b) => {
      const aDate = parseMaybeDate(a.terminationDate)?.getTime() ?? 0;
      const bDate = parseMaybeDate(b.terminationDate)?.getTime() ?? 0;
      return bDate - aDate;
    });
}

/** Active employees currently on vacation (today within [start, end]). */
export function filterCurrentlyOnVacation(employees: Employee[], now: Date = new Date()): Employee[] {
  return employees.filter(e =>
    e.status === 'aktywny' && isWithinVacation(e.vacationStartDate, e.vacationEndDate, now)
  );
}

/** Active employees whose vacation starts within UPCOMING_VACATION_HORIZON_DAYS. */
export function filterUpcomingVacations(employees: Employee[], now: Date = new Date()): Employee[] {
  return employees.filter(e => {
    if (e.status !== 'aktywny' || !e.vacationStartDate) return false;
    if (vacationHasStarted(e.vacationStartDate, now)) return false;
    const start = parseMaybeDate(e.vacationStartDate);
    if (!start) return false;
    const diffDays = dayDiff(start, now);
    return diffDays > 0 && diffDays <= UPCOMING_VACATION_HORIZON_DAYS;
  });
}
