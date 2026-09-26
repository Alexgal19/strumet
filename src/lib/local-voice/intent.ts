import { z } from 'zod';

export const intentSchema = z.object({
  kind: z.enum(['active_count', 'absences', 'contracts', 'terminations', 'fingerprints', 'unsupported']),
  department: z.string().nullable(),
  employeeName: z.string().nullable(),
  date: z.string().nullable(),
  dateFrom: z.string().nullable(),
  dateTo: z.string().nullable(),
}).strict();

export type VoiceIntent = z.infer<typeof intentSchema>;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
export function validDate(value: string): boolean {
  if (!isoDate.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateIntent(input: unknown): VoiceIntent {
  const intent = intentSchema.parse(input);
  const { kind, department, employeeName, date, dateFrom, dateTo } = intent;
  const clean = (value: string | null) => value?.trim() || null;
  const values = { kind, department: clean(department), employeeName: clean(employeeName), date, dateFrom, dateTo };
  if ([date, dateFrom, dateTo].some(value => value !== null && !validDate(value))) throw new Error('Nieprawidłowa data');
  if (kind === 'unsupported') return values;
  if (kind === 'active_count' && (employeeName || date || dateFrom || dateTo)) throw new Error('Nieobsługiwany filtr');
  if (kind === 'absences' && (!date || department || employeeName || dateFrom || dateTo)) throw new Error('Nieobsługiwany filtr');
  if (['contracts', 'terminations'].includes(kind) && (!dateFrom || !dateTo || date || department || employeeName)) throw new Error('Nieobsługiwany filtr');
  if (kind === 'fingerprints' && (date || department || (!!dateFrom !== !!dateTo))) throw new Error('Nieobsługiwany filtr');
  if (dateFrom && dateTo && dateFrom > dateTo) throw new Error('Odwrócony zakres dat');
  return values;
}
