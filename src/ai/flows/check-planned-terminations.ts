'use server';
/**
 * Checks for planned terminations and updates employee status automatically.
 */

import { getAdminApp, adminDb } from '@/lib/firebase-admin';
import { startOfDay, isBefore, isEqual } from 'date-fns';
import type { Employee, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export async function checkPlannedTerminations(): Promise<{ processedCount: number; notificationsCreated: number }> {
  console.log('Starting to check for planned terminations...');
  getAdminApp();
  const db = adminDb();

  const employeesSnapshot = await db.ref('employees').get();
  const allEmployees: Employee[] = objectToArray(employeesSnapshot.val());
  const activeEmployees = allEmployees.filter(e => e.status === 'aktywny');

  if (!activeEmployees.length) {
    console.log('No active employees found.');
    return { processedCount: 0, notificationsCreated: 0 };
  }

  const today = startOfDay(new Date());

  const employeesToProcess = activeEmployees.filter(emp => {
    if (!emp.plannedTerminationDate) return false;
    const terminationDate = parseMaybeDate(emp.plannedTerminationDate);
    if (!terminationDate) return false;
    const terminationDayStart = startOfDay(terminationDate);
    return isBefore(terminationDayStart, today) || isEqual(terminationDayStart, today);
  });

  if (!employeesToProcess.length) return { processedCount: 0, notificationsCreated: 0 };

  const updates: Record<string, any> = {};
  employeesToProcess.forEach(emp => {
    updates[`/employees/${emp.id}/status`] = 'zwolniony';
    updates[`/employees/${emp.id}/terminationDate`] = emp.plannedTerminationDate;
  });
  await db.ref().update(updates);
  console.log(`Processed ${employeesToProcess.length} terminations.`);

  const employeeNames = employeesToProcess.map(e => e.fullName).join(', ');
  const newNotification: Omit<AppNotification, 'id'> = {
    title: `Automatyczne zwolnienie: ${employeesToProcess.length} pracownik(ów)`,
    message: `Następujący pracownicy zostali automatycznie przeniesieni do zwolnionych: ${employeeNames}.`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  await db.ref('notifications').push(newNotification);

  return { processedCount: employeesToProcess.length, notificationsCreated: 1 };
}
