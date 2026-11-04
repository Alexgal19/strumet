import { calculateDirectorReport, generateDirectorReportText } from '@/lib/director-report';
import type { Employee } from '@/lib/types';

const NOW = new Date(2026, 9, 3); // 2026-10-03

const emp = (over: Partial<Employee>): Employee =>
  ({
    id: Math.random().toString(36).slice(2),
    fullName: 'Jan Kowalski',
    jobTitle: 'Spawacz',
    department: 'Spawalnia',
    status: 'aktywny',
    hireDate: '2026-01-01',
    ...over,
  }) as Employee;

const report = (employees: Employee[], from: Date, to: Date) =>
  calculateDirectorReport({ employees, recruitments: [], from, to, now: NOW });

describe('calculateDirectorReport — liczba aktywnych', () => {
  it('nie liczy jako aktywnych osób z minioną planowaną datą zwolnienia (jak Statystyki)', () => {
    const employees = [
      emp({ fullName: 'A' }),
      emp({ fullName: 'B' }),
      emp({ fullName: 'C', plannedTerminationDate: '2026-09-25' }), // minęła, status nadal aktywny
      emp({ fullName: 'D', plannedTerminationDate: '2026-10-10' }), // jeszcze pracuje
    ];
    const r = report(employees, new Date(2026, 8, 21), new Date(2026, 8, 27));
    expect(r.totalActive).toBe(3);
  });

  it('osoba z minioną planowaną datą trafia do kończących pracę w okresie, a nie znika z raportu', () => {
    const employees = [
      emp({ fullName: 'A' }),
      emp({ fullName: 'C', plannedTerminationDate: '2026-09-25' }),
    ];
    const r = report(employees, new Date(2026, 8, 21), new Date(2026, 8, 27));
    expect(r.totalActive).toBe(1);
    expect(r.terminatedEmployees.map(t => t.fullName)).toEqual(['C']);
  });

  it('planowana data w przyszłości nie wpływa ani na aktywnych, ani na kończących', () => {
    const employees = [emp({ fullName: 'D', plannedTerminationDate: '2026-10-10' })];
    const r = report(employees, new Date(2026, 8, 21), new Date(2026, 8, 27));
    expect(r.totalActive).toBe(1);
    expect(r.terminatedEmployees).toHaveLength(0);
  });
});

describe('calculateDirectorReport — powód zwolnienia', () => {
  const from = new Date(2026, 8, 21);
  const to = new Date(2026, 8, 27);

  it('przenosi powód zwolnienia do listy kończących pracę, gdy uzupełniony', () => {
    const employees = [
      emp({ fullName: 'A', status: 'zwolniony', terminationDate: '2026-09-25', terminationReason: 'Zmiana pracy' }),
      emp({ fullName: 'B', status: 'zwolniony', terminationDate: '2026-09-24' }),
    ];
    const r = report(employees, from, to);
    const byName = Object.fromEntries(r.terminatedEmployees.map(t => [t.fullName, t.terminationReason]));
    expect(byName).toEqual({ A: 'Zmiana pracy', B: undefined });
  });

  it('tekst raportu zawiera powód tylko tam, gdzie jest', () => {
    const employees = [
      emp({ fullName: 'A', status: 'zwolniony', terminationDate: '2026-09-25', terminationReason: 'Zmiana pracy' }),
      emp({ fullName: 'B', status: 'zwolniony', terminationDate: '2026-09-24' }),
    ];
    const text = generateDirectorReportText(report(employees, from, to), { includeEmployeeList: true });
    expect(text).toContain('powód: Zmiana pracy');
    expect(text.match(/powód:/g)).toHaveLength(1);
  });
});
