'use server';

import { archiveEmployees as archiveEmployeesFlow } from '@/ai/flows/archive-employees-flow';
import type { ArchiveOutput } from '@/ai/flows/archive-employees-flow';

export async function archiveEmployees(): Promise<ArchiveOutput> {
  return archiveEmployeesFlow();
}
