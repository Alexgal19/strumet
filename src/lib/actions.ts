'use server';

import { archiveEmployees } from '@/ai/flows/archive-employees-flow';
import type { ArchiveOutput } from '@/ai/flows/archive-employees-flow';

export async function archiveEmployeesAction(): Promise<ArchiveOutput> {
  return archiveEmployees();
}
