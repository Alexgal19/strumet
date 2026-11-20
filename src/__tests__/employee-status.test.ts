import { getEffectiveTerminationDate, withEffectiveTerminationDate, getRestoreUpdates, isActiveEmployee, isFormerEmployee } from '@/lib/employee-status';
import type { Employee } from '@/lib/types';

describe('getEffectiveTerminationDate', () => {
  const today = new Date(2026, 9, 3); // 2026-10-03
  const emp = (over: Partial<Employee>) => ({ id: 'x', fullName: 'A B', status: 'aktywny', ...over }) as Employee;

  it('zachowuje faktyczną datę zwolnienia', () => {
    expect(getEffectiveTerminationDate(emp({ status: 'zwolniony', terminationDate: '2026-09-21', plannedTerminationDate: '2026-09-18' }), today)).toBe('2026-09-21');
  });

  it('po minięciu planowanej daty (status aktywny) bierze planowaną datę jako datę zwolnienia', () => {
    expect(getEffectiveTerminationDate(emp({ plannedTerminationDate: '2026-09-30' }), today)).toBe('2026-09-30');
  });

  it('zwolniony bez daty zwolnienia dostaje planowaną', () => {
    expect(getEffectiveTerminationDate(emp({ status: 'zwolniony', plannedTerminationDate: '2026-08-01' }), today)).toBe('2026-08-01');
  });

  it('planowana data w przyszłości nie jest datą zwolnienia', () => {
    expect(getEffectiveTerminationDate(emp({ plannedTerminationDate: '2026-10-10' }), today)).toBeUndefined();
  });

  it('withEffectiveTerminationDate nie zmienia osoby, która nie odeszła', () => {
    const e = emp({ plannedTerminationDate: '2026-10-10' });
    expect(withEffectiveTerminationDate(e, today)).toBe(e);
    expect(withEffectiveTerminationDate(emp({ plannedTerminationDate: '2026-09-30' }), today).terminationDate).toBe('2026-09-30');
  });
});

describe('getRestoreUpdates', () => {
  const today = new Date(2026, 9, 3); // 2026-10-03
  const emp = (over: Partial<Employee>) => ({ id: 'x', fullName: 'Kowalski Jan', status: 'zwolniony', ...over }) as Employee;
  const apply = (e: Employee) => {
    const next: any = { ...e };
    for (const [k, v] of Object.entries(getRestoreUpdates(e, today))) next[k] = v === null ? undefined : v;
    return next as Employee;
  };

  it('czyści status, datę i powód zwolnienia', () => {
    expect(getRestoreUpdates(emp({ terminationDate: '2026-10-01', terminationReason: 'Pomyłka' }), today)).toEqual({
      status: 'aktywny',
      terminationDate: null,
      terminationReason: null,
      status_fullName: 'aktywny_kowalski jan',
    });
  });

  it('usuwa minioną planowaną datę zwolnienia, żeby osoba wróciła do aktywnych', () => {
    const e = emp({ status: 'aktywny', plannedTerminationDate: '2026-09-30' });
    expect(isFormerEmployee(e, today)).toBe(true);
    expect(getRestoreUpdates(e, today).plannedTerminationDate).toBeNull();
    expect(isActiveEmployee(apply(e), today)).toBe(true);
  });

  it('zostawia przyszłą planowaną datę zwolnienia', () => {
    const e = emp({ plannedTerminationDate: '2026-10-10' });
    expect('plannedTerminationDate' in getRestoreUpdates(e, today)).toBe(false);
    expect(isActiveEmployee(apply(e), today)).toBe(true);
  });
});
