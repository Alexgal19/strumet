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
import { t } from '@/lib/i18n';

export type ConfigView = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems' | 'terminationReasons' | 'jobTitleClothingSets';

// Teksty jako gettery — liczone przy odczycie (w trakcie renderu), więc działają po zmianie języka.
export const configLabels: Record<ConfigView, string> = {
  get departments() { return t('settings.labelDepartments'); },
  get jobTitles() { return t('settings.labelJobTitles'); },
  get managers() { return t('settings.labelManagers'); },
  get nationalities() { return t('settings.labelNationalities'); },
  get clothingItems() { return t('settings.labelClothing'); },
  get terminationReasons() { return t('settings.labelTerminationReasons'); },
  get jobTitleClothingSets() { return t('settings.labelClothingSets'); },
};

/** Tytuły okien dodawania/edycji elementu listy (poprawna polska odmiana). */
export const configDialogTitles: Record<ConfigType, { add: string; edit: string }> = {
  departments: { get add() { return t('settings.addDepartment'); }, get edit() { return t('settings.editDepartment'); } },
  jobTitles: { get add() { return t('settings.addJobTitle'); }, get edit() { return t('settings.editJobTitle'); } },
  managers: { get add() { return t('settings.addManager'); }, get edit() { return t('settings.editManager'); } },
  nationalities: { get add() { return t('settings.addNationality'); }, get edit() { return t('settings.editNationality'); } },
  clothingItems: { get add() { return t('settings.addClothingItem'); }, get edit() { return t('settings.editClothingItem'); } },
  terminationReasons: { get add() { return t('settings.addTerminationReason'); }, get edit() { return t('settings.editTerminationReason'); } },
};

export type ConfigCategory = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  { value: 'lists', get label() { return t('settings.catLists'); }, get description() { return t('settings.catListsDesc'); }, icon: List },
  { value: 'clothing_sets', get label() { return t('settings.catClothingSets'); }, get description() { return t('settings.catClothingSetsDesc'); }, icon: Shirt },
  { value: 'api_keys', get label() { return t('settings.catEmail'); }, get description() { return t('settings.catEmailDesc'); }, icon: Mail, adminOnly: true },
  { value: 'emails', get label() { return t('settings.catRecipients'); }, get description() { return t('settings.catRecipientsDesc'); }, icon: AtSign, adminOnly: true },
  { value: 'users', get label() { return t('settings.catUsers'); }, get description() { return t('settings.catUsersDesc'); }, icon: Users, adminOnly: true },
  { value: 'audit', get label() { return t('settings.catAudit'); }, get description() { return t('settings.catAuditDesc'); }, icon: History, adminOnly: true },
  { value: 'backup', get label() { return t('settings.catBackup'); }, get description() { return t('settings.catBackupDesc'); }, icon: Database, adminOnly: true },
];
