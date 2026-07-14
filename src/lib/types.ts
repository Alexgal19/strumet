

export type ActiveView =
  | 'aktywni'
  | 'zwolnieni'
  | 'planowanie'
  | 'odwiedzalnosc'
  | 'statystyki'
  | 'wydawanie-odziezy'
  | 'wydawanie-odziezy-nowi'
  | 'karty-obiegowe'
  | 'odciski-palcow'
  | 'brak-logowania'
  | 'konfiguracja';

export interface Employee {
  id: string;
  fullName: string;
  hireDate: string; // ISO string format
  jobTitle: string;
  department: string;
  manager: string;
  cardNumber: string;
  nationality: string;
  lockerNumber: string;
  departmentLockerNumber: string;
  sealNumber: string;
  status: 'aktywny' | 'zwolniony';
  status_fullName?: string; // Composite key for queries: `${status}_${fullName}`
  terminationDate?: string; // ISO string format will be present for 'zwolniony'
  plannedTerminationDate?: string; // ISO string format
  vacationStartDate?: string; // ISO string format
  vacationEndDate?: string; // ISO string format
  contractEndDate?: string; // ISO string format
  legalizationStatus?: string;
  welderLicense?: string;
}

export interface ConfigItem {
  id: string;
  name: string;
}

export type Department = ConfigItem;
export type JobTitle = ConfigItem;
export type Manager = ConfigItem;
export type Nationality = ConfigItem;
export type ClothingItem = ConfigItem;

export type ConfigType = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

export interface JobTitleClothingSet {
  id: string; // Corresponds to jobTitleId
  description: string;
}

export interface AllConfig {
  departments: Department[];
  jobTitles: JobTitle[];
  managers: Manager[];
  nationalities: Nationality[];
  clothingItems: ClothingItem[];
  jobTitleClothingSets: JobTitleClothingSet[];
  gmailUser?: string;
  gmailAppPassword?: string;
  recipientEmails?: string[];
}

export interface Absence {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
}

export interface CirculationCard {
  id: string;
  employeeId: string;
  employeeFullName: string;
  date: string; // ISO String
}

export interface FingerprintAppointment {
  id: string;
  employeeId: string;
  employeeFullName: string;
  appointmentDate: string; // ISO string format
}

export interface AbsenceRecord {
  id: string;
  employeeId: string;
  employeeFullName: string;
  incidentDate: string; // ISO string format
  department: string;
  jobTitle: string;
  hours: string;
  reason: 'no_card' | 'forgot_to_scan';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string; // ISO string
  read: boolean;
}

export interface ClothingIssuance {
  id: string;
  employeeId: string;
  employeeFullName: string;
  date: string; // ISO String
  items: {
    id: string;
    name: string;
    quantity: number;
  }[];
}

export interface Order {
  id: string;
  department: string;
  jobTitle: string;
  quantity: number;
  realizedQuantity: number;
  createdAt: string; // ISO String
  type: 'new' | 'replacement';
}

export interface StatsSnapshot {
  id: string; // date in YYYY-MM-DD format
  totalActive: number;
  departments: Record<string, number>;
  jobTitles: Record<string, number>;
  nationalities: Record<string, number>;
  newHires: number;
  terminations: number;
}

export interface OptionType {
  label: string;
  value: string;
}

export interface HierarchicalOption {
  label: string;
  value: string;
  children?: HierarchicalOption[];
}

export interface Stats {
  totalActiveEmployees: number;
  totalDepartments: number;
  totalJobTitles: number;
}

export type UserRole = 'admin' | 'guest';

export interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Email Templates
export type EmailTriggerType = 'scheduled' | 'manual' | 'event';
export type EmailTriggerEvent =
  | 'contractExpiry'
  | 'fingerprintReminder'
  | 'newHire'
  | 'plannedTermination'
  | 'legalisationWarning';

export interface EmailTriggerConfig {
  event: EmailTriggerEvent;
  daysBefore?: number;
  active: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  triggerType: EmailTriggerType;
  triggerConfig: EmailTriggerConfig;
  createdAt: string;
  createdBy: string;
}

export interface EmailLog {
  id: string;
  templateId: string;
  templateName: string;
  employeeId: string;
  employeeFullName: string;
  recipientEmail: string;
  sentAt: string;
  status: 'sent' | 'failed';
  errorMessage?: string | null;
}

export interface Car {
  id: string;
  registrationNumber: string;
  makeModel?: string;
  vin?: string;
  insuranceEndDate?: string;
  inspectionEndDate?: string;
  driverId?: string;
  driverFullName?: string;
  dateFrom: string;
  dateTo?: string;
  status: 'active' | 'history';
}

