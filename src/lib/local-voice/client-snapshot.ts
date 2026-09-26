import { get, ref } from 'firebase/database';
import { getFirebaseServices } from '@/lib/firebase';
import type {
  Absence, AbsenceRecord, AllConfig, AppNotification, Car, CirculationCard,
  ClothingIssuance, EmailLog, EmailTemplate, Employee, FingerprintAppointment,
  Note, StatsSnapshot,
} from '@/lib/types';
import { sanitizeAssistantSnapshot, type AssistantSnapshot } from './assistant-snapshot';

export type AssistantSessionData = {
  employees: Employee[];
  absences: Absence[];
  absenceRecords: AbsenceRecord[];
  cars: Car[];
  circulationCards: CirculationCard[];
  clothingIssuances: ClothingIssuance[];
  fingerprintAppointments: FingerprintAppointment[];
  statsHistory: StatsSnapshot[];
  notes: Note[];
  notifications: AppNotification[];
  emailTemplates: EmailTemplate[];
  emailLogs: EmailLog[];
  config: AllConfig;
};

function rows(raw: unknown): Record<string, unknown>[] {
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw).filter((entry): entry is [string, Record<string, unknown>] =>
    !!entry[1] && typeof entry[1] === 'object' && !Array.isArray(entry[1])
  ).map(([id, value]) => ({ ...value, id: typeof value.id === 'string' ? value.id : id }));
}

async function readRows(path: string): Promise<Record<string, unknown>[] | undefined> {
  const db = getFirebaseServices()?.db;
  if (!db) return undefined;
  try { return rows((await get(ref(db, path))).val()); }
  catch { return undefined; }
}

async function ensureRows<T>(path: string, current: T[]): Promise<T[] | Record<string, unknown>[] | undefined> {
  return current.length ? current : readRows(path);
}

/** Builds a read-only, allowlisted snapshot; private mail settings never enter the request. */
export async function collectAssistantSnapshot(data: AssistantSessionData): Promise<AssistantSnapshot> {
  const [orders, recruitment, employees, absences, absenceRecords, cars, circulationCards,
    clothingIssuances, fingerprintAppointments, statsHistory, notes, notifications,
    emailTemplates, emailLogs] = await Promise.all([
    readRows('orders'), readRows('recruitment'),
    ensureRows('employees', data.employees), ensureRows('absences', data.absences),
    ensureRows('absenceRecords', data.absenceRecords), ensureRows('cars', data.cars),
    ensureRows('circulationCards', data.circulationCards), ensureRows('clothingIssuances', data.clothingIssuances),
    ensureRows('fingerprintAppointments', data.fingerprintAppointments),
    ensureRows('statisticsHistory', data.statsHistory), ensureRows('notes', data.notes),
    ensureRows('notifications', data.notifications), ensureRows('emailTemplates', data.emailTemplates),
    ensureRows('emailLogs', data.emailLogs),
  ]);
  const recruitments = recruitment?.map(item => ({
    ...item,
    positions: item.positions ? rows(item.positions) : item.jobTitle
      ? [{ id: 'legacy', jobTitle: item.jobTitle, toRecruit: item.toRecruit }]
      : [],
    arrivals: rows(item.arrivals),
  }));
  return sanitizeAssistantSnapshot({
    employees,
    absences,
    absenceRecords,
    cars,
    circulationCards,
    clothingIssuances,
    fingerprintAppointments,
    orders,
    recruitments,
    statsHistory,
    notes,
    notifications,
    emailTemplates,
    emailLogs,
    config: {
      departments: data.config.departments,
      jobTitles: data.config.jobTitles,
      managers: data.config.managers,
      nationalities: data.config.nationalities,
      clothingItems: data.config.clothingItems,
    },
  });
}
