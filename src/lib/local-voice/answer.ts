import type { Absence, Employee, FingerprintAppointment } from '@/lib/types';
import type { VoiceIntent } from './intent';
import { validDate } from './intent';
import { warsawDay } from './date';

export type VoiceSnapshot = { employees: Employee[]; absences: Absence[]; appointments: FingerprintAppointment[] };
export type VoiceAnswer = { text: string; count: number; records: string[] };
const maxRecords = 12;
const norm = (s: string) => s.trim().toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
  if (intent.kind === 'unsupported') return { text: 'Nie obsługuję tego pytania. Mogę podać liczbę aktywnych pracowników, nieobecności, kończące się umowy, planowane zwolnienia i terminy odcisków palców. Nie zmieniam danych.', count: 0, records: [] };
  const { employees, absences, appointments } = snapshot;
  if (intent.kind === 'active_count') {
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const match = intent.department ? departments.filter(d => norm(d) === norm(intent.department!)) : [];
    if (intent.department && match.length !== 1) return { text: `Nie rozpoznaję jednoznacznie działu „${intent.department}”. Doprecyzuj nazwę działu.`, count: 0, records: [] };
    const found = employees.filter(e => e.status === 'aktywny' && (!intent.department || norm(e.department) === norm(match[0])));
    return { text: `Liczba aktywnych pracowników${intent.department ? ` w dziale ${match[0]}` : ''}: ${found.length}.`, count: found.length, records: [] };
  }
  if (intent.kind === 'absences') {
    const absentIds = new Set(absences.filter(a => day(a.date) === intent.date).map(a => a.employeeId));
    const names = employees.filter(e => absentIds.has(e.id)).map(e => e.fullName);
    const unknown = [...absentIds].filter(id => !employees.some(e => e.id === id));
    return result(`Nieobecni ${intent.date}`, [...names, ...unknown.map(id => `Nieznany pracownik (${id})`)]);
  }
  if (intent.kind === 'contracts' || intent.kind === 'terminations') {
    const field = intent.kind === 'contracts' ? 'contractEndDate' : 'plannedTerminationDate';
    const matches = employees.filter(e => e.status === 'aktywny' && within(e[field], intent.dateFrom!, intent.dateTo!));
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
