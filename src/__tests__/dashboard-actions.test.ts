import { describe, expect, it } from 'vitest';
import { getDashboardActions, isInWeek, weekRange } from '@/lib/dashboard-actions';
import type { Employee, FingerprintAppointment } from '@/lib/types';

// Środa 21.10.2026 — tydzień pon. 19.10 – nd. 25.10.
const NOW = new Date('2026-10-21T10:00:00');

function employee(overrides: Partial<Employee> & { fullName: string }): Employee {
  return {
    id: overrides.fullName,
    fullName: overrides.fullName,
    hireDate: '',
    jobTitle: '',
    department: '',
    manager: '',
    cardNumber: '',
    nationality: '',
    lockerNumber: '',
    departmentLockerNumber: '',
    sealNumber: '',
    status: 'aktywny',
    ...overrides,
  };
}

function appointment(fullName: string, appointmentDate: string): FingerprintAppointment {
  return { id: fullName, employeeId: fullName, employeeFullName: fullName, appointmentDate };
}

describe('dashboard-actions', () => {
  it('liczy tydzień od poniedziałku do niedzieli', () => {
    const { start, end } = weekRange(NOW);
    expect(start.getDate()).toBe(19);
    expect(end.getDate()).toBe(25);
  });

  it('rozpoznaje daty w bieżącym tygodniu', () => {
    expect(isInWeek('2026-10-19', NOW)).toBe(true);
    expect(isInWeek('2026-10-25', NOW)).toBe(true);
    expect(isInWeek('2026-10-18', NOW)).toBe(false);
    expect(isInWeek('2026-10-26', NOW)).toBe(false);
    expect(isInWeek('', NOW)).toBe(false);
  });

  it('przyjęcia to aktywni z datą rozpoczęcia pracy w tym tygodniu', () => {
    const actions = getDashboardActions({
      employees: [
        employee({ fullName: 'Sunday', hireDate: '2026-10-25' }),
        employee({ fullName: 'Monday', hireDate: '2026-10-19' }),
        employee({ fullName: 'Previous', hireDate: '2026-10-18' }),
        employee({ fullName: 'Dismissed', hireDate: '2026-10-20', status: 'zwolniony' }),
      ],
      appointments: [],
      now: NOW,
    });
    expect(actions.hiresThisWeek.map((e) => e.fullName)).toEqual(['Monday', 'Sunday']);
  });

  it('zwolnienia liczy po faktycznej, a gdy jej brak — planowanej dacie', () => {
    const actions = getDashboardActions({
      employees: [
        employee({ fullName: 'Planned', plannedTerminationDate: '2026-10-20' }),
        employee({
          fullName: 'Actual',
          status: 'zwolniony',
          terminationDate: '2026-10-22',
        }),
        employee({ fullName: 'NextWeek', plannedTerminationDate: '2026-10-26' }),
        employee({ fullName: 'LastWeek', plannedTerminationDate: '2026-10-18' }),
      ],
      appointments: [],
      now: NOW,
    });
    expect(actions.terminationsThisWeek.map((e) => e.fullName)).toEqual(['Planned', 'Actual']);
  });

  it('przypomnienia o umowach obejmują 30 dni włącznie', () => {
    const actions = getDashboardActions({
      employees: [
        employee({ fullName: 'Today', contractEndDate: '2026-10-21' }),
        employee({ fullName: 'Day30', contractEndDate: '2026-11-20' }),
        employee({ fullName: 'Day31', contractEndDate: '2026-11-21' }),
        employee({ fullName: 'Past', contractEndDate: '2026-10-20' }),
        employee({ fullName: 'Dismissed', contractEndDate: '2026-10-25', status: 'zwolniony' }),
      ],
      appointments: [],
      now: NOW,
    });
    expect(actions.expiringContracts.map((e) => e.fullName)).toEqual(['Today', 'Day30']);
  });

  it('odciski palców obejmują 30 dni i są sortowane rosnąco', () => {
    const actions = getDashboardActions({
      employees: [],
      appointments: [
        appointment('Later', '2026-11-10'),
        appointment('Sooner', '2026-10-22'),
        appointment('TooLate', '2026-11-21'),
        appointment('Invalid', ''),
      ],
      now: NOW,
    });
    expect(actions.upcomingAppointments.map((a) => a.employeeFullName)).toEqual([
      'Sooner',
      'Later',
    ]);
  });

  it('zaplanowane zwolnienia to aktywne osoby od dziś włącznie', () => {
    const actions = getDashboardActions({
      employees: [
        employee({ fullName: 'Today', plannedTerminationDate: '2026-10-21' }),
        employee({ fullName: 'Future', plannedTerminationDate: '2026-12-01' }),
        employee({ fullName: 'Past', plannedTerminationDate: '2026-10-01' }),
        employee({
          fullName: 'Dismissed',
          status: 'zwolniony',
          plannedTerminationDate: '2026-12-01',
        }),
      ],
      appointments: [],
      now: NOW,
    });
    expect(actions.plannedTerminations.map((e) => e.fullName)).toEqual(['Today', 'Future']);
  });
});
