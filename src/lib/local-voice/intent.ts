import { z } from 'zod';

const kinds = ['active_count', 'employees', 'employee_details', 'absences', 'contracts', 'terminations', 'fingerprints', 'unsupported'] as const;
const detailFields = ['department', 'jobTitle', 'status', 'hireDate', 'contractEndDate', 'plannedTerminationDate'] as const;
export const intentSchema = z.object({
  kind: z.enum(kinds),
  department: z.string().nullable(),
  employeeName: z.string().nullable(),
  date: z.string().nullable(),
  dateFrom: z.string().nullable(),
  dateTo: z.string().nullable(),
  jobTitle: z.string().nullable().optional().default(null),
  status: z.enum(['aktywny', 'zwolniony']).nullable().optional().default(null),
  answerMode: z.enum(['count', 'list']).nullable().optional().default(null),
  detailField: z.enum(detailFields).nullable().optional().default(null),
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
  const { kind, date, dateFrom, dateTo } = intent;
  for (const key of ['department', 'employeeName', 'jobTitle'] as const) intent[key] = intent[key]?.trim() || null;
  if ([date, dateFrom, dateTo].some(value => value !== null && !validDate(value))) throw new Error('Nieprawidłowa data');
  if (dateFrom && dateTo && dateFrom > dateTo) throw new Error('Odwrócony zakres dat');
  if (!!dateFrom !== !!dateTo || (date && (dateFrom || dateTo))) throw new Error('Nieprawidłowy zakres dat');
  const { department, employeeName, jobTitle, status, answerMode, detailField } = intent;
  if (kind === 'unsupported') return intent;
  if (kind === 'active_count' && (employeeName || jobTitle || status || answerMode || detailField || date || dateFrom)) throw new Error('Nieobsługiwany filtr');
  if (kind === 'employees' && (employeeName || date || dateFrom || detailField)) throw new Error('Nieobsługiwany filtr');
  if (kind === 'employee_details' && (!employeeName || department || jobTitle || status || answerMode || date || dateFrom)) throw new Error('Nieobsługiwany filtr');
  if (kind === 'absences' && ((!date && !dateFrom) || jobTitle || status || detailField)) throw new Error('Nieobsługiwany filtr');
  if (['contracts', 'terminations'].includes(kind) && (!dateFrom || date || department || employeeName || jobTitle || status || answerMode || detailField)) throw new Error('Nieobsługiwany filtr');
  if (kind === 'fingerprints' && (date || department || jobTitle || status || answerMode || detailField)) throw new Error('Nieobsługiwany filtr');
  return intent;
}
