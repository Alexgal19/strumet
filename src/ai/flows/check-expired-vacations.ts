'use server';
/**
 * Checks for expired vacations and clears vacation fields automatically.
 * When vacationEndDate is before today, both vacationStartDate and vacationEndDate are cleared (set to null).
 */

import { getAdminApp, adminDb } from '@/lib/firebase-admin';
import { startOfDay, isBefore } from 'date-fns';
import type { Employee } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export async function checkExpiredVacations(): Promise<{ clearedCount: number }> {
  console.log('Starting to check for expired vacations...');
  getAdminApp();
  const db = adminDb();

  const employeesSnapshot = await db.ref('employees').get();
  const allEmployees: Employee[] = objectToArray(employeesSnapshot.val());

  if (!allEmployees.length) {
    console.log('No employees found.');
    return { clearedCount: 0 };
  }

  const today = startOfDay(new Date());

  const employeesToClear = allEmployees.filter(emp => {
    if (!emp.vacationEndDate) return false;
    const endDate = parseMaybeDate(emp.vacationEndDate);
    if (!endDate) return false;
    // Clear only when end date is strictly before today (yesterday or earlier)
    // If vacation ends today, employee is still considered on vacation today (endOfDay inclusive)
    return isBefore(startOfDay(endDate), today);
  });

  if (!employeesToClear.length) {
    console.log('No expired vacations found.');
    return { clearedCount: 0 };
  }

  const updates: Record<string, any> = {};
  employeesToClear.forEach(emp => {
    updates[`/employees/${emp.id}/vacationStartDate`] = null;
    updates[`/employees/${emp.id}/vacationEndDate`] = null;
  });

  await db.ref().update(updates);
  console.log(`Cleared expired vacations for ${employeesToClear.length} employees: ${employeesToClear.map(e => e.fullName).join(', ')}`);

  return { clearedCount: employeesToClear.length };
}
