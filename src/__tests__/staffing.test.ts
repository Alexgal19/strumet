import { describe, it, expect } from 'vitest';
import { addDays, formatISO, startOfDay, subDays } from 'date-fns';
import type { Employee, Order } from '@/lib/types';
import {
  buildPlannedTerminations,
  buildRecentTerminations,
  buildStaffingHints,
  buildVacationPeople,
  filterCurrentlyOnVacation,
  filterUpcomingVacations,
} from '@/lib/staffing';
import { isWithinVacation, vacationHasStarted, vacationIsOver } from '@/lib/date';

const NOW = startOfDay(new Date(2026, 5, 15)); // 2026-06-15 00:00 local

const emp = (overrides: Partial<Employee> & { id: string }): Employee => ({
  fullName: `Pan ${overrides.id}`,
  hireDate: '2020-01-01',
  jobTitle: 'Spawacz',
  department: 'Produkcja',
  manager: 'Kierownik',
  cardNumber: '',
  nationality: 'PL',
  lockerNumber: '',
  departmentLockerNumber: '',
  sealNumber: '',
  status: 'aktywny',
  ...overrides,
});

const iso = (d: Date) => formatISO(d, { representation: 'date' });

describe('date vacation helpers', () => {
  it('vacationHasStarted — true when start is today or earlier', () => {
    expect(vacationHasStarted(iso(subDays(NOW, 1)), NOW)).toBe(true);
    expect(vacationHasStarted(iso(NOW), NOW)).toBe(true);
    expect(vacationHasStarted(iso(addDays(NOW, 1)), NOW)).toBe(false);
    expect(vacationHasStarted(undefined, NOW)).toBe(false);
  });

  it('vacationIsOver — true only when end date fully passed', () => {
    expect(vacationIsOver(iso(subDays(NOW, 1)), NOW)).toBe(true);
    expect(vacationIsOver(iso(NOW), NOW)).toBe(false); // end date = last vacation day
    expect(vacationIsOver(undefined, NOW)).toBe(false);
  });

  it('isWithinVacation — inclusive on both ends', () => {
    expect(isWithinVacation(iso(subDays(NOW, 2)), iso(addDays(NOW, 2)), NOW)).toBe(true);
    expect(isWithinVacation(iso(NOW), iso(NOW), NOW)).toBe(true);
    expect(isWithinVacation(iso(addDays(NOW, 1)), iso(addDays(NOW, 5)), NOW)).toBe(false);
    expect(isWithinVacation(iso(subDays(NOW, 5)), iso(subDays(NOW, 1)), NOW)).toBe(false);
  });
});

describe('buildVacationPeople', () => {
  it('includes everyone with a start date — also after end date (manual removal)', () => {
    const people = buildVacationPeople(
      [
        emp({ id: '1', vacationStartDate: iso(subDays(NOW, 5)), vacationEndDate: iso(subDays(NOW, 2)) }),
        emp({ id: '2', vacationStartDate: iso(NOW), vacationEndDate: iso(addDays(NOW, 5)) }),
        emp({ id: '3', vacationStartDate: iso(addDays(NOW, 3)), vacationEndDate: iso(addDays(NOW, 10)) }),
        emp({ id: '4' }), // no vacation
        emp({ id: '5', status: 'zwolniony', vacationStartDate: iso(NOW) }), // terminated
      ],
      NOW
    );
    expect(people.map(p => p.employee.id)).toEqual(['1', '2', '3']);
    expect(people.map(p => p.phase)).toEqual(['zakończony', 'na-urlopie', 'planowany']);
  });
});

describe('buildStaffingHints', () => {
  it('groups vacations by department + jobTitle and sums the count', () => {
    const hints = buildStaffingHints(
      [
        emp({ id: '1', vacationStartDate: iso(subDays(NOW, 1)), vacationEndDate: iso(addDays(NOW, 3)) }),
        emp({ id: '2', vacationStartDate: iso(NOW), vacationEndDate: iso(addDays(NOW, 7)) }),
        emp({
          id: '3',
          department: 'Magazyn',
          jobTitle: 'Operator',
          vacationStartDate: iso(addDays(NOW, 2)),
          vacationEndDate: iso(addDays(NOW, 4)),
        }),
      ],
      [],
      NOW
    );
    expect(hints).toHaveLength(2);
    const prod = hints.find(h => h.department === 'Produkcja')!;
    expect(prod.count).toBe(2);
    expect(prod.reason).toBe('urlop');
    expect(prod.from).toBeDefined();
    expect(prod.to).toBeDefined();
    expect(new Date(prod.from).getTime()).toBeLessThanOrEqual(new Date(prod.to!).getTime());
  });

  it('ignores vacations starting beyond the horizon', () => {
    const hints = buildStaffingHints(
      [emp({ id: '1', vacationStartDate: iso(addDays(NOW, 20)), vacationEndDate: iso(addDays(NOW, 25)) })],
      [],
      NOW
    );
    expect(hints).toHaveLength(0);
  });

  it('creates permanent hints for planned terminations and recent terminations', () => {
    const hints = buildStaffingHints(
      [
        emp({ id: '1', plannedTerminationDate: iso(addDays(NOW, 10)) }),
        emp({ id: '2', status: 'zwolniony', terminationDate: iso(subDays(NOW, 5)) }),
        emp({ id: '3', status: 'zwolniony', terminationDate: iso(subDays(NOW, 60)) }), // outside window
      ],
      [],
      NOW
    );
    // id '1' (planned) and id '2' (recent) share department + jobTitle → one merged group
    expect(hints).toHaveLength(1);
    expect(hints[0].reason).toBe('odejście');
    expect(hints[0].count).toBe(2);
    expect(hints[0].to).toBeUndefined(); // permanent — no period
    expect(hints[0].employees.map(e => e.id).sort()).toEqual(['1', '2']);
  });

  it('subtracts outstanding replacement orders from the needed count', () => {
    const orders: Order[] = [
      {
        id: 'o1',
        department: 'Produkcja',
        jobTitle: 'Spawacz',
        quantity: 3,
        realizedQuantity: 1,
        createdAt: iso(NOW),
        type: 'replacement',
      },
    ];
    const hints = buildStaffingHints(
      [
        emp({ id: '1', vacationStartDate: iso(NOW), vacationEndDate: iso(addDays(NOW, 3)) }),
        emp({ id: '2', vacationStartDate: iso(NOW), vacationEndDate: iso(addDays(NOW, 5)) }),
      ],
      orders,
      NOW
    );
    expect(hints).toHaveLength(1);
    expect(hints[0].orderedOutstanding).toBe(2);
    expect(hints[0].count).toBe(0); // 2 absent - 2 outstanding orders
  });

  it('ignores fully realized orders', () => {
    const orders: Order[] = [
      {
        id: 'o1',
        department: 'Produkcja',
        jobTitle: 'Spawacz',
        quantity: 2,
        realizedQuantity: 2,
        createdAt: iso(NOW),
        type: 'replacement',
      },
    ];
    const hints = buildStaffingHints(
      [emp({ id: '1', vacationStartDate: iso(NOW), vacationEndDate: iso(addDays(NOW, 3)) })],
      orders,
      NOW
    );
    expect(hints).toHaveLength(1);
    expect(hints[0].count).toBe(1);
  });
});

describe('summary helpers', () => {
  it('buildPlannedTerminations — only active employees with a future date', () => {
    const result = buildPlannedTerminations(
      [
        emp({ id: '1', plannedTerminationDate: iso(addDays(NOW, 3)) }),
        emp({ id: '2', status: 'zwolniony', plannedTerminationDate: iso(addDays(NOW, 3)) }),
        emp({ id: '3', plannedTerminationDate: iso(subDays(NOW, 3)) }),
        emp({ id: '4' }),
      ],
      NOW
    );
    expect(result.map(e => e.id)).toEqual(['1']);
  });

  it('buildRecentTerminations — terminated within the window, newest first', () => {
    const result = buildRecentTerminations(
      [
        emp({ id: '1', status: 'zwolniony', terminationDate: iso(subDays(NOW, 10)) }),
        emp({ id: '2', status: 'zwolniony', terminationDate: iso(subDays(NOW, 2)) }),
        emp({ id: '3', status: 'zwolniony', terminationDate: iso(subDays(NOW, 90)) }),
        emp({ id: '4', terminationDate: iso(subDays(NOW, 1)) }),
      ],
      NOW
    );
    expect(result.map(e => e.id)).toEqual(['2', '1']);
  });

  it('filterCurrentlyOnVacation / filterUpcomingVacations', () => {
    const employees = [
      emp({ id: '1', vacationStartDate: iso(NOW), vacationEndDate: iso(addDays(NOW, 3)) }),
      emp({ id: '2', vacationStartDate: iso(addDays(NOW, 5)), vacationEndDate: iso(addDays(NOW, 8)) }),
      emp({ id: '3', vacationStartDate: iso(addDays(NOW, 40)), vacationEndDate: iso(addDays(NOW, 45)) }),
      emp({ id: '4', vacationStartDate: iso(subDays(NOW, 5)), vacationEndDate: iso(subDays(NOW, 1)) }),
    ];
    expect(filterCurrentlyOnVacation(employees, NOW).map(e => e.id)).toEqual(['1']);
    expect(filterUpcomingVacations(employees, NOW).map(e => e.id)).toEqual(['2']);
  });
});
