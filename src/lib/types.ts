
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
  terminationDate?: string; // ISO string format will be present for 'zwolniony'
  plannedTerminationDate?: string; // ISO string format
  vacationStartDate?: string; // ISO string format
  vacationEndDate?: string; // ISO string format
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

export interface ClothingIssuance {
  id: string;
  employeeId: string;
  date: string; // ISO string format
  items: string[];
  signature: string;
}

export interface FingerprintAppointment {
  id: string;
  employeeId: string;
  appointmentDate: string; // ISO string format
}

export interface Absence {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
}

export interface AbsenceRecord {
  id: string;
  employeeId: string;
  incidentDate: string; // ISO string format
  managerSignature: string;
}
