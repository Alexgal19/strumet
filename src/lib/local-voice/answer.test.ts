import { describe, expect, it } from 'vitest';
import { answerVoiceIntent } from './answer';
import type { Employee } from '@/lib/types';
import { validateIntent } from './intent';
const employee = (id: string, name: string, extra: Partial<Employee> = {}): Employee => ({ id, fullName: name, hireDate: '2025-01-01', jobTitle: 'Pracownik', department: 'Produkcja', manager: '', cardNumber: '', nationality: '', lockerNumber: '', departmentLockerNumber: '', sealNumber: '', status: 'aktywny', ...extra });
const employees = [employee('1', 'Jan Kowalski', { contractEndDate: '2026-10-01', plannedTerminationDate: '2026-11-01' }), employee('2', 'Jan Nowak', { contractEndDate: '02.10.2026' }), employee('3', 'Anna Lis', { status: 'zwolniony', contractEndDate: '2026-10-01' })];
const snapshot = { employees, absences: [{ id: 'a', employeeId: '1', date: '2026-09-26' }, { id: 'b', employeeId: '1', date: '2026-09-26' }, { id: 'c', employeeId: '2', date: '2026-09-27' }], appointments: [{ id: 'x', employeeId: '1', employeeFullName: 'Jan Kowalski', appointmentDate: '2026-09-26T10:00:00+02:00' }] };
const query = (kind: string, more: Record<string, string | null> = {}) => validateIntent({ kind, department: null, employeeName: null, date: null, dateFrom: null, dateTo: null, ...more });
describe('local voice snapshot answers', () => {
  it('counts active staff and departments', () => expect(answerVoiceIntent(query('active_count', { department: 'produkcja' }), snapshot).count).toBe(2));
  it('deduplicates absences by employee', () => expect(answerVoiceIntent(query('absences', { date: '2026-09-26' }), snapshot).count).toBe(1));
  it('uses inclusive date ranges and excludes terminated staff', () => expect(answerVoiceIntent(query('contracts', { dateFrom: '2026-10-01', dateTo: '2026-10-02' }), snapshot).count).toBe(2));
  it('clarifies ambiguous employee names', () => expect(answerVoiceIntent(query('fingerprints', { employeeName: 'Jan' }), snapshot).text).toContain('kilku'));
  it('matches Warsaw appointment day', () => expect(answerVoiceIntent(query('fingerprints', { dateFrom: '2026-09-26', dateTo: '2026-09-26' }), snapshot).count).toBe(1));
});
