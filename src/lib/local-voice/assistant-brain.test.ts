import { describe, expect, it } from 'vitest';
import { executeQueryPlan, fallbackAnswer, fastAbsenceFacts, validateQueryPlan } from './assistant-brain';
import { sanitizeAssistantSnapshot } from './assistant-snapshot';

const snapshot = sanitizeAssistantSnapshot({
  employees: [
    { id: '1', fullName: 'Anna Kowalska', department: 'Produkcja', jobTitle: 'Operator', status: 'aktywny', secretToken: 'NO' },
    { id: '2', fullName: 'Jan Nowak', department: 'Magazyn', jobTitle: 'Kierowca', status: 'aktywny' },
    { id: '3', fullName: 'Ola Lis', department: 'Produkcja', jobTitle: 'Operator', status: 'zwolniony' },
    { id: '4', fullName: 'Ewa Kot', department: 'Magazyn', jobTitle: 'Kierowca', status: 'aktywny', plannedTerminationDate: '2026-09-20' },
  ],
  absences: [
    { id: 'a', employeeId: '1', date: '2026-09-25' },
    { id: 'b', employeeId: '1', date: '2026-09-25' },
    { id: 'c', employeeId: '2', date: '2026-09-25' },
    { id: 'd', employeeId: '1', date: '2026-09-24' },
  ],
  cars: [{ id: 'c', registrationNumber: 'WX 1234', status: 'active', dateFrom: '2026-01-01' }],
  recruitments: [{ id: 'r', department: 'Produkcja', positions: [{ id: 'p', jobTitle: 'Operator', toRecruit: 2 }], arrivals: [], createdAt: '2026-09-01' }],
  config: { departments: [{ id: 'd', name: 'Produkcja' }], gmailAppPassword: 'SECRET' },
  users: [{ password: 'SECRET' }],
});
const plan = (raw: object) => validateQueryPlan(raw);
const base = { filters: [], fields: [], limit: 30 };
describe('assistant query executor', () => {
  it('resolves this Friday on Saturday, joins departments and deduplicates absences', () => {
    const facts = fastAbsenceFacts('kto był nieobecny w ten piątek', snapshot, new Date('2026-09-26T12:00:00Z'))!;
    expect(facts.date).toBe('2026-09-25');
    expect(facts.count).toBe(2);
    expect(facts.rows).toEqual(expect.arrayContaining([expect.objectContaining({ employeeFullName: 'Anna Kowalska', employeeDepartment: 'Produkcja' }), expect.objectContaining({ employeeFullName: 'Jan Nowak', employeeDepartment: 'Magazyn' })]));
    expect(fallbackAnswer(facts)).toContain('Anna Kowalska (Produkcja)');
    expect(fallbackAnswer(facts)).toContain('Jan Nowak (Magazyn)');
  });
  it('counts active employees and groups by department', () => {
    const active = executeQueryPlan(plan({ ...base, source: 'employees', action: 'count', filters: [{ field: 'effectiveActive', op: 'eq', value: true }] }), snapshot, new Date('2026-09-26T12:00:00Z'));
    expect(active.count).toBe(2);
    const grouped = executeQueryPlan(plan({ ...base, source: 'employees', action: 'group', groupBy: 'department' }), snapshot);
    expect(grouped.rows).toContainEqual({ department: 'Produkcja', count: 2 });
  });
  it('lists cars and recruitment and finds employee details', () => {
    expect(executeQueryPlan(plan({ ...base, source: 'cars', action: 'list', fields: ['registrationNumber', 'status'] }), snapshot).rows[0]).toEqual({ registrationNumber: 'WX 1234', status: 'active' });
    expect(executeQueryPlan(plan({ ...base, source: 'departments', action: 'list', fields: ['name'] }), snapshot).rows[0]).toEqual({ name: 'Produkcja' });
    expect(executeQueryPlan(plan({ ...base, source: 'recruitments', action: 'list', filters: [{ field: 'jobTitle', op: 'eq', value: 'Operator' }], fields: ['department', 'jobTitle', 'toRecruit'] }), snapshot).rows[0]).toEqual({ department: 'Produkcja', jobTitle: 'Operator', toRecruit: 2 });
    expect(executeQueryPlan(plan({ ...base, source: 'employees', action: 'detail', filters: [{ field: 'fullName', op: 'contains', value: 'Kowalska' }], fields: ['fullName', 'department', 'jobTitle'] }), snapshot).rows[0]).toEqual({ fullName: 'Anna Kowalska', department: 'Produkcja', jobTitle: 'Operator' });
  });
  it('distinguishes people from person-days in an absence range', () => {
    const filters = [{ field: 'date', op: 'gte' as const, value: '2026-09-24' }, { field: 'date', op: 'lte' as const, value: '2026-09-25' }];
    expect(executeQueryPlan(plan({ ...base, source: 'absences', action: 'count', filters, distinctBy: 'employeeId' }), snapshot).count).toBe(2);
    expect(executeQueryPlan(plan({ ...base, source: 'absences', action: 'count', filters, distinctBy: 'employeeId,date' }), snapshot).count).toBe(3);
  });
  it('does not include secret or private config fields and rejects malicious plans', () => {
    expect(JSON.stringify(snapshot)).not.toMatch(/SECRET|secretToken|users|gmailAppPassword/);
    expect(() => plan({ ...base, source: 'users', action: 'list' })).toThrow();
    expect(() => plan({ ...base, source: 'employees', action: 'list', fields: ['password'] })).toThrow();
    expect(() => plan({ ...base, source: 'employees', action: 'list', filters: [{ field: '__proto__', op: 'eq', value: 'x' }] })).toThrow();
  });
  it('marks missing source data as unavailable', () => {
    expect(executeQueryPlan(plan({ ...base, source: 'emailLogs', action: 'count' }), snapshot).available).toBe(false);
  });
  it('sums recruitment positions when the model omits the redundant sumField', () => {
    const query = plan({ ...base, source: 'recruitments', action: 'sum', filters: [{ field: 'jobTitle', op: 'eq', value: 'operator' }], fields: ['toRecruit'] });
    expect(query.sumField).toBe('toRecruit');
    expect(executeQueryPlan(query, snapshot).total).toBe(2);
  });
});
