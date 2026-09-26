import type { Absence, AbsenceRecord, AppNotification, Car, CirculationCard, ClothingIssuance, ConfigItem, EmailLog, EmailTemplate, Employee, FingerprintAppointment, Note, Order, Recruitment, StatsSnapshot } from '@/lib/types';

export interface AssistantSnapshot {
  employees?: Employee[];
  absences?: Absence[];
  absenceRecords?: AbsenceRecord[];
  cars?: Car[];
  circulationCards?: CirculationCard[];
  clothingIssuances?: ClothingIssuance[];
  fingerprintAppointments?: FingerprintAppointment[];
  orders?: Order[];
  recruitments?: Recruitment[];
  statsHistory?: StatsSnapshot[];
  notes?: Note[];
  notifications?: AppNotification[];
  emailTemplates?: EmailTemplate[];
  emailLogs?: EmailLog[];
  config?: {
    departments?: ConfigItem[];
    jobTitles?: ConfigItem[];
    managers?: ConfigItem[];
    nationalities?: ConfigItem[];
    clothingItems?: ConfigItem[];
  };
}

export const SOURCE_FIELDS = {
  employees: ['id', 'fullName', 'hireDate', 'jobTitle', 'department', 'manager', 'cardNumber', 'nationality', 'lockerNumber', 'departmentLockerNumber', 'sealNumber', 'status', 'terminationDate', 'plannedTerminationDate', 'vacationStartDate', 'vacationEndDate', 'contractEndDate', 'legalizationStatus', 'welderLicense'],
  absences: ['id', 'employeeId', 'date'],
  absenceRecords: ['id', 'employeeId', 'employeeFullName', 'incidentDate', 'department', 'jobTitle', 'hours', 'reason'],
  cars: ['id', 'registrationNumber', 'makeModel', 'vin', 'insuranceEndDate', 'inspectionEndDate', 'driverId', 'driverFullName', 'dateFrom', 'dateTo', 'status'],
  circulationCards: ['id', 'employeeId', 'employeeFullName', 'date'],
  clothingIssuances: ['id', 'employeeId', 'employeeFullName', 'date', 'items'],
  fingerprintAppointments: ['id', 'employeeId', 'employeeFullName', 'appointmentDate'],
  orders: ['id', 'department', 'jobTitle', 'quantity', 'realizedQuantity', 'createdAt', 'type', 'neededUntil'],
  recruitments: ['id', 'department', 'positions', 'arrivals', 'createdAt'],
  statsHistory: ['id', 'totalActive', 'departments', 'jobTitles', 'nationalities', 'newHires', 'terminations'],
  notes: ['id', 'title', 'content', 'dueDate', 'dueTime', 'createdAt', 'read'],
  notifications: ['id', 'title', 'message', 'createdAt', 'read'],
  emailTemplates: ['id', 'name', 'subject', 'body', 'triggerType', 'triggerConfig', 'createdAt', 'createdBy'],
  emailLogs: ['id', 'templateId', 'templateName', 'employeeId', 'employeeFullName', 'recipientEmail', 'sentAt', 'status', 'errorMessage'],
  departments: ['id', 'name'],
  jobTitles: ['id', 'name'],
  managers: ['id', 'name'],
  nationalities: ['id', 'name'],
  clothingItems: ['id', 'name'],
} as const;
export type AssistantSource = keyof typeof SOURCE_FIELDS;
export const MAX_RECORDS_PER_SOURCE = 5000;
const MAX_TEXT = 1000;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function cleanScalar(value: unknown): string | number | boolean | null | undefined {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') return value.slice(0, MAX_TEXT);
  return undefined;
}
const nestedFields: Record<string, readonly string[]> = {
  items: ['id', 'name', 'quantity'],
  positions: ['id', 'jobTitle', 'toRecruit'],
  arrivals: ['id', 'date', 'count'],
  triggerConfig: ['event', 'daysBefore', 'active'],
};
function cleanField(field: string, value: unknown): unknown {
  if (field in nestedFields) {
    const fields = nestedFields[field];
    const cleanObject = (item: unknown): Record<string, unknown> | undefined => {
      if (!object(item)) return undefined;
      const result: Record<string, unknown> = {};
      for (const key of fields) {
        const clean = cleanScalar(item[key]);
        if (clean !== undefined) result[key] = clean;
      }
      return result;
    };
    if (Array.isArray(value)) return value.slice(0, 100).map(cleanObject).filter((item): item is Record<string, unknown> => !!item);
    return cleanObject(value);
  }
  if (['departments', 'jobTitles', 'nationalities'].includes(field) && object(value)) {
    const result: Record<string, number> = {};
    for (const [key, count] of Object.entries(value).slice(0, 100)) if (typeof count === 'number' && Number.isFinite(count)) result[key.slice(0, 100)] = count;
    return result;
  }
  return cleanScalar(value);
}
function cleanRows(value: unknown, fields: readonly string[]): Record<string, unknown>[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.slice(0, MAX_RECORDS_PER_SOURCE).filter(object).map(row => {
    const clean: Record<string, unknown> = {};
    for (const field of fields) {
      const value = cleanField(field, row[field]);
      if (value !== undefined) clean[field] = value;
    }
    return clean;
  });
}
/** Shared client/server allowlist. Never send raw Firebase config through this helper. */
export function sanitizeAssistantSnapshot(raw: unknown): AssistantSnapshot {
  if (!object(raw)) return {};
  const result: Record<string, unknown> = {};
  for (const [source, fields] of Object.entries(SOURCE_FIELDS)) {
    if (['departments', 'jobTitles', 'managers', 'nationalities', 'clothingItems'].includes(source)) continue;
    const rows = cleanRows(raw[source], fields);
    if (rows) result[source] = rows;
  }
  if (object(raw.config)) {
    const config: Record<string, unknown> = {};
    for (const key of ['departments', 'jobTitles', 'managers', 'nationalities', 'clothingItems']) {
      const rows = cleanRows(raw.config[key], ['id', 'name']);
      if (rows) config[key] = rows;
    }
    result.config = config;
  }
  return result as unknown as AssistantSnapshot;
}
export function snapshotHasData(snapshot: AssistantSnapshot): boolean {
  return Object.values(snapshot).some(value => Array.isArray(value) ? value.length > 0 : object(value) && Object.values(value).some(rows => Array.isArray(rows) && rows.length > 0));
}
