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

export type ConfigView = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems' | 'jobTitleClothingSets';

export const configLabels: Record<ConfigView, string> = {
  departments: 'Działy',
  jobTitles: 'Stanowiska',
  managers: 'Kierownicy',
  nationalities: 'Narodowości',
  clothingItems: 'Odzież',
  jobTitleClothingSets: 'Zestawy odzieży'
};

export type ConfigCategory = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  { value: 'lists', label: 'Listy i słowniki', description: 'Działy, stanowiska, kierownicy, narodowości', icon: List },
  { value: 'clothing_sets', label: 'Zestawy odzieży', description: 'Przypisanie odzieży do stanowisk', icon: Shirt },
  { value: 'api_keys', label: 'Powiadomienia e-mail', description: 'SMTP i Gmail do wysyłki', icon: Mail, adminOnly: true },
  { value: 'emails', label: 'Adresy odbiorców', description: 'Skrzynki otrzymujące powiadomienia', icon: AtSign, adminOnly: true },
  { value: 'users', label: 'Użytkownicy', description: 'Role i uprawnienia', icon: Users, adminOnly: true },
  { value: 'audit', label: 'Historia zmian', description: 'Kto, kiedy i co zmienił', icon: History, adminOnly: true },
  { value: 'backup', label: 'Dane i kopia zapasowa', description: 'Eksport i przywracanie danych', icon: Database, adminOnly: true },
];
