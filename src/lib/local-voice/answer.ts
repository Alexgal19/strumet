import type { Absence, Employee, FingerprintAppointment } from '@/lib/types';
import type { VoiceIntent } from './intent';
import { validDate } from './intent';
import { warsawDay } from './date';
import { isActiveEmployee } from '@/lib/employee-status';

export type VoiceSnapshot = { employees: Employee[]; absences: Absence[]; appointments: FingerprintAppointment[] };
export type VoiceAnswer = { text: string; count: number; records: string[] };
const maxRecords = 12;
const norm = (s: string) => s.trim().toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
const day = (value?: string) => {
  if (!value) return null;
  if (validDate(value)) return value;
  const polish = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (polish) {
    const normalized = `${polish[3]}-${polish[2]}-${polish[1]}`;
    return validDate(normalized) ? normalized : null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return warsawDay(parsed);
};
const within = (value: string | undefined, from: string, to: string) => {
  const d = day(value);
  return d !== null && d >= from && d <= to;
};
const result = (intro: string, records: string[]): VoiceAnswer => ({
  text: `${intro}: ${records.length}.${records.length ? ` ${records.slice(0, maxRecords).join('; ')}${records.length > maxRecords ? `; i ${records.length - maxRecords} więcej.` : '.'}` : ''}`,
  count: records.length,
  records: records.slice(0, maxRecords),
});
export function answerVoiceIntent(intent: VoiceIntent, snapshot: VoiceSnapshot): VoiceAnswer {
  if (intent.kind === 'unsupported') return { text: 'Nie mogę jednoznacznie odpowiedzieć na to pytanie na podstawie danych w tej sesji. Mogę odczytać pracowników, nieobecności, umowy, planowane zwolnienia i terminy odcisków palców. Doprecyzuj pytanie.', count: 0, records: [] };
  const { employees, absences, appointments } = snapshot;
  const resolveEmployee = (name: string) => {
    const people = employees.filter(e => norm(e.fullName).includes(norm(name)));
    return people.length === 1 ? people[0] : null;
  };
  if (intent.kind === 'employees') {
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const positions = [...new Set(employees.map(e => e.jobTitle).filter(Boolean))];
    const department = intent.department ? departments.find(d => norm(d) === norm(intent.department!)) : null;
    const jobTitle = intent.jobTitle ? positions.find(t => norm(t) === norm(intent.jobTitle!)) : null;
    if (intent.department && !department) return { text: `Nie rozpoznaję działu „${intent.department}”. Doprecyzuj nazwę działu.`, count: 0, records: [] };
    if (intent.jobTitle && !jobTitle) return { text: `Nie rozpoznaję stanowiska „${intent.jobTitle}”. Doprecyzuj nazwę stanowiska.`, count: 0, records: [] };
    const found = employees.filter(e => (!department || norm(e.department) === norm(department)) && (!jobTitle || norm(e.jobTitle) === norm(jobTitle)) && (!intent.status || (intent.status === 'aktywny' ? isActiveEmployee(e) : e.status === 'zwolniony')));
    if (intent.answerMode === 'count') return { text: `Liczba pracowników spełniających kryteria: ${found.length}.`, count: found.length, records: [] };
    return result('Pracownicy spełniający kryteria', found.map(e => `${e.fullName} — ${e.jobTitle}, ${e.department}`));
  }
  if (intent.kind === 'employee_details') {
    const person = resolveEmployee(intent.employeeName!);
    if (!person) return { text: 'Nie znalazłem jednoznacznie tego pracownika. Podaj pełne imię i nazwisko.', count: 0, records: [] };
    const labels = { department: 'dział', jobTitle: 'stanowisko', status: 'status', hireDate: 'data zatrudnienia', contractEndDate: 'koniec umowy', plannedTerminationDate: 'planowane zwolnienie' } as const;
    const fields = intent.detailField ? [intent.detailField] : ['department', 'jobTitle', 'status', 'hireDate'] as const;
    const facts = fields.map(field => `${labels[field]}: ${person[field] || 'brak danych'}`);
    return { text: `${person.fullName} — ${facts.join('; ')}.`, count: 1, records: [person.fullName] };
  }
  if (intent.kind === 'active_count') {
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const match = intent.department ? departments.filter(d => norm(d) === norm(intent.department!)) : [];
    if (intent.department && match.length !== 1) return { text: `Nie rozpoznaję jednoznacznie działu „${intent.department}”. Doprecyzuj nazwę działu.`, count: 0, records: [] };
    const found = employees.filter(e => isActiveEmployee(e) && (!intent.department || norm(e.department) === norm(match[0])));
    return { text: `Liczba aktywnych pracowników${intent.department ? ` w dziale ${match[0]}` : ''}: ${found.length}.`, count: found.length, records: [] };
  }
  if (intent.kind === 'absences') {
    if (intent.department && !employees.some(e => norm(e.department) === norm(intent.department!))) return { text: `Nie rozpoznaję działu „${intent.department}”. Doprecyzuj nazwę działu.`, count: 0, records: [] };
    if (intent.employeeName && !resolveEmployee(intent.employeeName)) return { text: 'Nie znalazłem jednoznacznie tego pracownika. Podaj pełne imię i nazwisko.', count: 0, records: [] };
    const from = intent.date || intent.dateFrom!;
    const to = intent.date || intent.dateTo!;
    const absentIds = new Set(absences.filter(a => within(a.date, from, to)).map(a => a.employeeId));
    const matched = employees.filter(e => absentIds.has(e.id) && (!intent.department || norm(e.department) === norm(intent.department)) && (!intent.employeeName || norm(e.fullName).includes(norm(intent.employeeName))));
    const unknown = intent.department || intent.employeeName ? [] : [...absentIds].filter(id => !employees.some(e => e.id === id)).map(id => `Nieznany pracownik (${id})`);
    const names = [...matched.map(e => e.fullName), ...unknown];
    const period = from === to ? from : `od ${from} do ${to}`;
    if (intent.answerMode === 'count') return { text: `Liczba nieobecnych ${period}: ${names.length}.`, count: names.length, records: [] };
    return result(`Nieobecni ${period}`, names);
  }
  if (intent.kind === 'contracts' || intent.kind === 'terminations') {
    const field = intent.kind === 'contracts' ? 'contractEndDate' : 'plannedTerminationDate';
    const matches = employees.filter(e => isActiveEmployee(e) && within(e[field], intent.dateFrom!, intent.dateTo!));
    return result(`${intent.kind === 'contracts' ? 'Umowy kończące się' : 'Planowane zwolnienia'} od ${intent.dateFrom} do ${intent.dateTo}`, matches.map(e => `${e.fullName} — ${day(e[field])}`));
  }
  let matches = appointments.filter(a => !intent.dateFrom || within(a.appointmentDate, intent.dateFrom, intent.dateTo!));
  if (intent.employeeName) {
    const people = employees.filter(e => norm(e.fullName).includes(norm(intent.employeeName!)));
    if (people.length !== 1) return { text: people.length ? 'Pasuje kilku pracowników. Podaj pełne imię i nazwisko.' : 'Nie znalazłem tego pracownika. Podaj pełne imię i nazwisko.', count: 0, records: [] };
    matches = matches.filter(a => a.employeeId === people[0].id);
  }
  return result('Terminy odcisków palców', matches.map(a => `${a.employeeFullName} — ${day(a.appointmentDate) ?? a.appointmentDate}`));
}
