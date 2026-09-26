import { describe, expect, it } from 'vitest';
import { validateIntent } from './intent';
const base = { kind: 'active_count', department: null, employeeName: null, date: null, dateFrom: null, dateTo: null };
describe('local voice intent validation', () => {
  it('accepts a supported count and rejects extra filters', () => {
    expect(validateIntent(base).kind).toBe('active_count');
    expect(() => validateIntent({ ...base, employeeName: 'Jan' })).toThrow();
    expect(() => validateIntent({ ...base, mystery: 'x' })).toThrow();
  });
  it('requires dates and rejects invalid or reversed ranges', () => {
    expect(() => validateIntent({ ...base, kind: 'absences' })).toThrow();
    expect(() => validateIntent({ ...base, kind: 'absences', date: '2026-02-30' })).toThrow();
    expect(() => validateIntent({ ...base, kind: 'contracts', dateFrom: '2026-10-01', dateTo: '2026-09-01' })).toThrow();
  });
});
describe('expanded local voice intent validation', () => {
  it('accepts employee filters and rejects dates on employee searches', () => {
    expect(validateIntent({ ...base, kind: 'employees', department: 'Produkcja', jobTitle: 'Spawacz', status: 'aktywny', answerMode: 'list' }).jobTitle).toBe('Spawacz');
    expect(() => validateIntent({ ...base, kind: 'employees', date: '2026-09-25' })).toThrow();
  });
  it('accepts absence ranges and rejects incomplete ranges', () => {
    expect(validateIntent({ ...base, kind: 'absences', dateFrom: '2026-09-25', dateTo: '2026-09-26', answerMode: 'count' }).answerMode).toBe('count');
    expect(() => validateIntent({ ...base, kind: 'absences', dateFrom: '2026-09-25' })).toThrow();
  });
  it('limits employee details to supported fields and a named person', () => {
    expect(validateIntent({ ...base, kind: 'employee_details', employeeName: 'Anna Lis', detailField: 'department' }).detailField).toBe('department');
    expect(() => validateIntent({ ...base, kind: 'employee_details', employeeName: 'Anna Lis', detailField: 'salary' })).toThrow();
  });
});
