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
