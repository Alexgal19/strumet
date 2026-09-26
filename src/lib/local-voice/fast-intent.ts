import { validDate, validateIntent, type VoiceIntent } from './intent';
import { warsawDay } from './date';

const normalize = (value: string) => value.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
const weekdays: Record<string, number> = { poniedzialek: 0, wtorek: 1, sroda: 2, czwartek: 3, piatek: 4, sobota: 5, niedziela: 6 };
const datePattern = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\.\d{1,2}\.\d{4}\b/g;
function shift(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function resolveSingleDay(question: string, today: string): string | null {
  if (!validDate(today)) return null;
  const q = normalize(question);
  const candidates: string[] = [];
  for (const match of q.matchAll(datePattern)) {
    const raw = match[0];
    const polish = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(raw);
    candidates.push(polish ? `${polish[3]}-${polish[2].padStart(2, '0')}-${polish[1].padStart(2, '0')}` : raw);
  }
  const relative = [...q.matchAll(/\b(ten|ta|w\s+tym|w\s+te|zeszly|zeszla|poprzedni|poprzednia|przyszly|przyszla|nastepny|nastepna)\s+(poniedzialek|poniedzialku|wtorek|wtorku|sroda|srode|czwartek|czwartku|piatek|piatku|sobota|sobote|niedziela|niedziele)\b/g)];
  for (const match of relative) {
    const stem = Object.keys(weekdays).find(key => match[2].startsWith(key.slice(0, 4)));
    if (!stem) return null;
    const current = new Date(`${today}T12:00:00Z`).getUTCDay();
    const mondayOffset = -((current + 6) % 7);
    const modifier = match[1];
    const weeks = /^(zeszl|poprzedn)/.test(modifier) ? -7 : /^(przyszl|nastepn)/.test(modifier) ? 7 : 0;
    candidates.push(shift(today, mondayOffset + weeks + weekdays[stem]));
  }
  for (const [pattern, offset] of [[/\bprzedwczoraj\b/g, -2], [/\bwczoraj\b/g, -1], [/\b(?:dzis|dzisiaj)\b/g, 0], [/\bjutro\b/g, 1], [/\bpojutrze\b/g, 2]] as const) {
    for (const _ of q.matchAll(pattern)) candidates.push(shift(today, offset));
  }
  return candidates.length === 1 && validDate(candidates[0]) ? candidates[0] : null;
}
export function fastAbsenceIntent(question: string, now = new Date()): VoiceIntent | null {
  const q = normalize(question).trim();
  if (!/\b(nieobecn\w*|absencj\w*)\b/.test(q)) return null;
  if (!/\b(kto|ktor\w*|ile|ilu|liczba|wymien\w*|pokaz\w*|nieobecn\w*|absencj\w*)\b/.test(q)) return null;
  const stripped = q.replace(datePattern, ' ').replace(/\b(ten|ta|w\s+tym|w\s+te|zeszly|zeszla|poprzedni|poprzednia|przyszly|przyszla|nastepny|nastepna)\s+(poniedzialek|poniedzialku|wtorek|wtorku|sroda|srode|czwartek|czwartku|piatek|piatku|sobota|sobote|niedziela|niedziele)\b/g, ' ').replace(/\b(przedwczoraj|wczoraj|dzis|dzisiaj|jutro|pojutrze)\b/g, ' ');
  const allowed = new Set(['kto', 'ktorzy', 'ktore', 'z', 'pracownikow', 'pracownicy', 'osob', 'osoby', 'byl', 'byli', 'bylo', 'byla', 'jest', 'sa', 'w', 'dniu', 'na', 'ile', 'ilu', 'liczba', 'wymien', 'pokaz', 'liste', 'lista', 'nieobecny', 'nieobecni', 'nieobecnych', 'nieobecna', 'nieobecne', 'absencja', 'absencji', 'absencje']);
  if (stripped.match(/[a-z]+/g)?.some(word => !allowed.has(word))) return null;
  const date = resolveSingleDay(q, warsawDay(now));
  if (!date) return null;
  return validateIntent({ kind: 'absences', department: null, employeeName: null, date, dateFrom: null, dateTo: null, answerMode: /\b(ile|liczba|ilu)\b/.test(q) ? 'count' : 'list' });
}
