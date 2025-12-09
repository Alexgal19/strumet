

export type ActiveView =
  | 'aktywni'
  | 'zwolnieni'
  | 'planowanie'
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
  terminationDate?: string; // ISO string format will be present for 'zwolniony'
  plannedTerminationDate?: string; // ISO string format
  vacationStartDate?: string; // ISO string format
  vacationEndDate?: string; // ISO string format
  contractEndDate?: string; // ISO string format
  legalizationStatus?: string;
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
  createdAt: string; // ISO String
}
