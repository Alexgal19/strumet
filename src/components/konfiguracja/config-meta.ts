import type { ConfigType } from '@/lib/types';
import {
  List,
  Shirt,
  Mail,
  AtSign,
  Users,
  History,
  Database,
  type LucideIcon,
} from 'lucide-react';

export type ConfigView = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems' | 'terminationReasons' | 'jobTitleClothingSets';

export const configLabels: Record<ConfigView, string> = {
  departments: 'Działy',
  jobTitles: 'Stanowiska',
  managers: 'Kierownicy',
  nationalities: 'Narodowości',
  clothingItems: 'Odzież',
  terminationReasons: 'Powody zwolnienia',
  jobTitleClothingSets: 'Zestawy odzieży'
};

/** Tytuły okien dodawania/edycji elementu listy (poprawna polska odmiana). */
export const configDialogTitles: Record<ConfigType, { add: string; edit: string }> = {
  departments: { add: 'Dodaj nowy dział', edit: 'Edytuj dział' },
  jobTitles: { add: 'Dodaj nowe stanowisko', edit: 'Edytuj stanowisko' },
  managers: { add: 'Dodaj nowego kierownika', edit: 'Edytuj kierownika' },
  nationalities: { add: 'Dodaj nową narodowość', edit: 'Edytuj narodowość' },
  clothingItems: { add: 'Dodaj nowy element odzieży', edit: 'Edytuj element odzieży' },
  terminationReasons: { add: 'Dodaj nowy powód zwolnienia', edit: 'Edytuj powód zwolnienia' },
};

export type ConfigCategory = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  { value: 'lists', label: 'Listy i słowniki', description: 'Działy, stanowiska, kierownicy, narodowości, powody zwolnienia', icon: List },
  { value: 'clothing_sets', label: 'Zestawy odzieży', description: 'Przypisanie odzieży do stanowisk', icon: Shirt },
  { value: 'api_keys', label: 'Powiadomienia e-mail', description: 'SMTP i Gmail do wysyłki', icon: Mail, adminOnly: true },
  { value: 'emails', label: 'Adresy odbiorców', description: 'Skrzynki otrzymujące powiadomienia', icon: AtSign, adminOnly: true },
  { value: 'users', label: 'Użytkownicy', description: 'Role i uprawnienia', icon: Users, adminOnly: true },
  { value: 'audit', label: 'Historia zmian', description: 'Kto, kiedy i co zmienił', icon: History, adminOnly: true },
  { value: 'backup', label: 'Dane i kopia zapasowa', description: 'Eksport i przywracanie danych', icon: Database, adminOnly: true },
];
