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

// Mock data is no longer the primary source of truth.
// It can be used for initial seeding if the database is empty.
export const activeEmployees: Employee[] = [];
export const terminatedEmployees: Employee[] = [];
