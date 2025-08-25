import type { Employee, Department, JobTitle, Manager, Nationality, ClothingItem } from './types';

export const departments: Department[] = [
  { id: 'd1', name: 'Produkcja' },
  { id: 'd2', name: 'Logistyka' },
  { id: 'd3', name: 'Jakość' },
  { id: 'd4', name: 'Administracja' },
];

export const jobTitles: JobTitle[] = [
  { id: 'jt1', name: 'Operator Maszyn' },
  { id: 'jt2', name: 'Magazynier' },
  { id: 'jt3', name: 'Kontroler Jakości' },
  { id: 'jt4', name: 'Specjalista ds. Kadr' },
];

export const managers: Manager[] = [
  { id: 'm1', name: 'Janusz Kowalski' },
  { id: 'm2', name: 'Grażyna Nowak' },
  { id: 'm3', name: 'Andrzej Wiśniewski' },
];

export const nationalities: Nationality[] = [
  { id: 'n1', name: 'Polska' },
  { id: 'n2', name: 'Ukraina' },
  { id: 'n3', name: 'Białoruś' },
  { id: 'n4', name: 'Niemcy' },
];

export const clothingItems: ClothingItem[] = [
    { id: 'c1', name: 'Koszula robocza' },
    { id: 'c2', name: 'Spodnie robocze' },
    { id: 'c3', name: 'Buty ochronne' },
    { id: 'c4', name: 'Kask' },
    { id: 'c5', name: 'Rękawice' },
];

export const activeEmployees: Employee[] = [
  {
    id: 'e1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    hireDate: '2022-01-15',
    jobTitle: 'Operator Maszyn',
    department: 'Produkcja',
    manager: 'Janusz Kowalski',
    cardNumber: 'K12345',
    nationality: 'Polska',
    lockerNumber: '101',
    departmentLockerNumber: 'P-1',
    sealNumber: 'S1A',
    status: 'aktywny',
  },
  {
    id: 'e2',
    firstName: 'Anna',
    lastName: 'Nowak',
    hireDate: '2021-07-20',
    jobTitle: 'Magazynier',
    department: 'Logistyka',
    manager: 'Grażyna Nowak',
    cardNumber: 'K67890',
    nationality: 'Polska',
    lockerNumber: '102',
    departmentLockerNumber: 'L-5',
    sealNumber: 'S2B',
    status: 'aktywny',
  },
  {
    id: 'e3',
    firstName: 'Piotr',
    lastName: 'Wiśniewski',
    hireDate: '2023-03-10',
    jobTitle: 'Kontroler Jakości',
    department: 'Jakość',
    manager: 'Andrzej Wiśniewski',
    cardNumber: 'K11223',
    nationality: 'Polska',
    lockerNumber: '103',
    departmentLockerNumber: 'J-2',
    sealNumber: 'S3C',
    status: 'aktywny',
  },
  {
    id: 'e4',
    firstName: 'Olena',
    lastName: 'Kovalenko',
    hireDate: '2022-11-01',
    jobTitle: 'Operator Maszyn',
    department: 'Produkcja',
    manager: 'Janusz Kowalski',
    cardNumber: 'K44556',
    nationality: 'Ukraina',
    lockerNumber: '201',
    departmentLockerNumber: 'P-2',
    sealNumber: 'S4D',
    status: 'aktywny',
  },
];

export const terminatedEmployees: Employee[] = [
  {
    id: 'e5',
    firstName: 'Marek',
    lastName: 'Zieliński',
    hireDate: '2020-05-01',
    terminationDate: '2023-12-31',
    jobTitle: 'Magazynier',
    department: 'Logistyka',
    manager: 'Grażyna Nowak',
    cardNumber: 'K98765',
    nationality: 'Polska',
    lockerNumber: '301',
    departmentLockerNumber: 'L-10',
    sealNumber: 'S5E',
    status: 'zwolniony',
  },
  {
    id: 'e6',
    firstName: 'Svetlana',
    lastName: 'Ivanova',
    hireDate: '2021-02-12',
    terminationDate: '2024-03-15',
    jobTitle: 'Operator Maszyn',
    department: 'Produkcja',
    manager: 'Janusz Kowalski',
    cardNumber: 'K54321',
    nationality: 'Białoruś',
    lockerNumber: '302',
    departmentLockerNumber: 'P-15',
    sealNumber: 'S6F',
    status: 'zwolniony',
  },
];
