import { fastAbsenceIntent } from './fast-intent';
import { SOURCE_FIELDS, snapshotHasData, type AssistantSnapshot, type AssistantSource } from './assistant-snapshot';
import { isActiveEmployee } from '@/lib/employee-status';

export type QueryFilter = { field: string; op: 'eq' | 'contains' | 'gte' | 'lte'; value: string | number | boolean };
export type QueryPlan = { source: AssistantSource; action: 'list' | 'count' | 'group' | 'sum' | 'detail'; filters: QueryFilter[]; fields: string[]; groupBy?: string; sumField?: string; sort?: { field: string; direction: 'asc' | 'desc' }; distinctBy?: 'employeeId' | 'employeeId,date'; limit: number };
export type QueryFacts = { source: AssistantSource; action: QueryPlan['action']; count: number; rows: Record<string, unknown>[]; total?: number; truncated: boolean; available: boolean; date?: string };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const MAX_LIST = 30;
const joinedFields = ['employeeFullName', 'employeeDepartment', 'employeeJobTitle', 'employeeStatus'];
export function fieldsFor(source: AssistantSource): string[] { return [...SOURCE_FIELDS[source], ...(source === 'absences' ? joinedFields : []), ...(source === 'employees' ? ['effectiveActive'] : []), ...(source === 'recruitments' ? ['jobTitle', 'toRecruit'] : [])]; }
function fieldAllowed(source: AssistantSource, field: unknown): field is string { return typeof field === 'string' && fieldsFor(source).includes(field); }
export function validateQueryPlan(raw: unknown): QueryPlan {
  if (!object(raw) || typeof raw.source !== 'string' || !Object.prototype.hasOwnProperty.call(SOURCE_FIELDS, raw.source)) throw new Error('Nieobsługiwane źródło danych.');
  const source = raw.source as AssistantSource;
  if (!['list', 'count', 'group', 'sum', 'detail'].includes(String(raw.action))) throw new Error('Nieobsługiwana operacja.');
  if (!Array.isArray(raw.filters) || raw.filters.length > 8) throw new Error('Nieprawidłowe filtry.');
  const filters: QueryFilter[] = raw.filters.map(item => {
    if (!object(item) || !fieldAllowed(source, item.field) || !['eq', 'contains', 'gte', 'lte'].includes(String(item.op)) || !['string', 'number', 'boolean'].includes(typeof item.value)) throw new Error('Niedozwolony filtr.');
    if (typeof item.value === 'string' && item.value.length > 100) throw new Error('Za długi filtr.');
    return { field: item.field as string, op: item.op as QueryFilter['op'], value: item.value as QueryFilter['value'] };
  });
  if (!Array.isArray(raw.fields) || raw.fields.length > 20 || !raw.fields.every(field => fieldAllowed(source, field))) throw new Error('Niedozwolona projekcja.');
  if (!Number.isInteger(raw.limit) || (raw.limit as number) < 1 || (raw.limit as number) > MAX_LIST) throw new Error('Niedozwolony limit.');
  if (raw.groupBy !== undefined && !fieldAllowed(source, raw.groupBy)) throw new Error('Niedozwolone grupowanie.');
  const summable = ['quantity', 'realizedQuantity', 'toRecruit', 'totalActive', 'newHires', 'terminations'];
  const projectedSummable = raw.fields.filter(field => summable.includes(field));
  const sumField = raw.sumField ?? (raw.action === 'sum' && projectedSummable.length === 1 ? projectedSummable[0] : undefined);
  if (sumField !== undefined && (!fieldAllowed(source, sumField) || !summable.includes(sumField as string))) throw new Error('Niedozwolone sumowanie.');
  if (raw.action === 'group' && !raw.groupBy || raw.action === 'sum' && !sumField) throw new Error('Niepełny plan.');
  if (raw.distinctBy !== undefined && (source !== 'absences' || !['employeeId', 'employeeId,date'].includes(String(raw.distinctBy)))) throw new Error('Niedozwolona deduplikacja.');
  if (raw.sort !== undefined && (!object(raw.sort) || !fieldAllowed(source, raw.sort.field) || !['asc', 'desc'].includes(String(raw.sort.direction)))) throw new Error('Niedozwolone sortowanie.');
  return { source, action: raw.action as QueryPlan['action'], filters, fields: raw.fields as string[], groupBy: raw.groupBy as string | undefined, sumField: sumField as string | undefined, sort: raw.sort as QueryPlan['sort'], distinctBy: raw.distinctBy as QueryPlan['distinctBy'], limit: raw.limit as number };
}
function rowsFor(snapshot: AssistantSnapshot, plan: QueryPlan, now: Date): Record<string, unknown>[] | null {
  const source = plan.source;
  const value = ['departments', 'jobTitles', 'managers', 'nationalities', 'clothingItems'].includes(source)
    ? snapshot.config?.[source as keyof NonNullable<AssistantSnapshot['config']>]
    : snapshot[source as keyof AssistantSnapshot];
  if (!Array.isArray(value)) return null;
  if (source === 'employees') return (snapshot.employees || []).map(person => ({ ...person, effectiveActive: isActiveEmployee(person, now) }));
  if (source === 'recruitments') {
    const expanded = plan.filters.some(filter => ['jobTitle', 'toRecruit'].includes(filter.field)) || plan.fields.some(field => ['jobTitle', 'toRecruit'].includes(field)) || ['jobTitle', 'toRecruit'].includes(plan.groupBy || '') || plan.sumField === 'toRecruit';
    return (snapshot.recruitments || []).flatMap(item => expanded ? item.positions.map(position => ({ ...item, jobTitle: position.jobTitle, toRecruit: position.toRecruit })) : [{ ...item }]);
  }
  if (source !== 'absences') return value as unknown as Record<string, unknown>[];
  const people = new Map(snapshot.employees?.map(person => [person.id, person]) || []);
  return (value as AssistantSnapshot['absences'] || []).map(row => {
    const person = people.get(row.employeeId);
    return { ...row, employeeFullName: person?.fullName ?? null, employeeDepartment: person?.department ?? null, employeeJobTitle: person?.jobTitle ?? null, employeeStatus: person?.status ?? null };
  });
}
function match(row: Record<string, unknown>, filter: QueryFilter): boolean {
  const left = row[filter.field];
  if (left === undefined || left === null) return false;
  const fold = (value: unknown) => String(value).toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  if (filter.op === 'eq') return fold(left) === fold(filter.value);
  if (filter.op === 'contains') return fold(left).includes(fold(filter.value));
  if (filter.op === 'gte') return String(left) >= String(filter.value);
  return String(left) <= String(filter.value);
}
function project(row: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) if (row[field] !== undefined) out[field] = row[field];
  return out;
}
export function executeQueryPlan(plan: QueryPlan, snapshot: AssistantSnapshot, now = new Date()): QueryFacts {
  const input = rowsFor(snapshot, plan, now);
  if (!input) return { source: plan.source, action: plan.action, count: 0, rows: [], truncated: false, available: false };
  let rows = input.filter(row => plan.filters.every(filter => match(row, filter)));
  if (plan.source === 'absences') {
    const seen = new Set<string>();
    rows = rows.filter(row => { const key = plan.distinctBy === 'employeeId' ? String(row.employeeId) : `${row.employeeId}:${row.date}`; if (seen.has(key)) return false; seen.add(key); return true; });
  }
  if (plan.sort) { const { field, direction } = plan.sort; rows = [...rows].sort((a, b) => String(a[field] ?? '').localeCompare(String(b[field] ?? ''), 'pl', { numeric: true }) * (direction === 'asc' ? 1 : -1)); }
  const count = rows.length;
  if (plan.action === 'count') return { source: plan.source, action: plan.action, count, rows: [], truncated: false, available: true };
  if (plan.action === 'sum') return { source: plan.source, action: plan.action, count, rows: [], total: rows.reduce((sum, row) => sum + (typeof row[plan.sumField!] === 'number' ? row[plan.sumField!] as number : 0), 0), truncated: false, available: true };
  if (plan.action === 'group') {
    const groups = new Map<string, number>();
    for (const row of rows) { const key = String(row[plan.groupBy!] ?? 'Brak danych'); groups.set(key, (groups.get(key) ?? 0) + 1); }
    const grouped = [...groups].map(([value, count]) => ({ [plan.groupBy!]: value, count })).sort((a, b) => b.count - a.count);
    return { source: plan.source, action: plan.action, count, rows: grouped.slice(0, plan.limit), truncated: grouped.length > plan.limit, available: true };
  }
  const defaults = plan.source === 'absences' ? ['employeeFullName', 'employeeDepartment', 'employeeJobTitle', 'date'] : ['id'];
  const fields = plan.fields.length ? plan.fields : defaults;
  return { source: plan.source, action: plan.action, count, rows: rows.slice(0, plan.limit).map(row => project(row, fields)), truncated: count > plan.limit, available: true };
}
export function fastAbsenceFacts(question: string, snapshot: AssistantSnapshot, now = new Date()): QueryFacts | null {
  const intent = fastAbsenceIntent(question, now);
  if (!intent || intent.kind !== 'absences' || !intent.date) return null;
  const plan: QueryPlan = { source: 'absences', action: intent.answerMode === 'count' ? 'count' : 'list', filters: [{ field: 'date', op: 'eq', value: intent.date }], distinctBy: 'employeeId', fields: ['employeeFullName', 'employeeDepartment', 'employeeJobTitle', 'date'], limit: MAX_LIST };
  const facts = executeQueryPlan(plan, snapshot, now);
  return { ...facts, date: intent.date };
}
export function fallbackAnswer(facts: QueryFacts): string {
  if (!facts.available) return `Nie mam wczytanych danych „${facts.source}”, więc nie mogę odpowiedzieć na to pytanie.`;
  const when = facts.date ? ` ${facts.date}` : '';
  if (!facts.count) return `W dostępnych danych nie znalazłem pasujących rekordów${when}.`;
  if (facts.source === 'absences' && facts.action === 'list') {
    const people = facts.rows.map(row => `${row.employeeFullName || 'Nieznana osoba'} (${row.employeeDepartment || 'dział nieznany'})`);
    return `Nieobecnych${when} było ${facts.count}: ${people.join(', ')}.${facts.truncated ? ` Pokazuję ${people.length} z ${facts.count} osób.` : ''}`;
  }
  if (facts.action === 'count') return `Liczba pasujących rekordów${when}: ${facts.count}.`;
  if (facts.action === 'sum') return `Suma dla ${facts.count} pasujących rekordów wynosi ${facts.total}.`;
  const list = facts.rows.map(row => Object.entries(row).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join(', ')).join('; ');
  return `Znalazłem ${facts.count} pasujących rekordów${when}. ${list}.${facts.truncated ? ` Pokazuję ${facts.rows.length} z ${facts.count}.` : ''}`;
}
export function noSnapshotAnswer(snapshot: AssistantSnapshot): string | null { return snapshotHasData(snapshot) ? null : 'Nie mam wczytanych danych aplikacji, więc nie mogę odpowiedzieć na to pytanie.'; }
