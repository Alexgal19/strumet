import type React from 'react';
import {
  Users, BarChart3, CalendarClock, UserX, CalendarDays, Shirt,
  CreditCard, Fingerprint, FileWarning, Settings, LayoutDashboard,
  Mail, History, LayoutGrid, Car, NotebookPen, CalendarRange,
  CalendarCheck, UserPlus,
} from 'lucide-react';

export interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
  shortLabel?: string;
  primary?: boolean;
}

export interface NavSection {
  title: string;
  items: MenuItem[];
}

/** One list powers the sidebar, mobile navigation, search and page titles. */
export const NAV_SECTIONS: NavSection[] = [
  { title: 'Przegląd', items: [
    { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit', primary: true },
    { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
  ] },
  { title: 'Kadry', items: [
    { href: '/aktywni', icon: Users, label: 'Pracownicy aktywni', shortLabel: 'Pracownicy', primary: true },
    { href: '/zwolnieni', icon: UserX, label: 'Zwolnieni', primary: true },
    { href: '/rekrutacja', icon: UserPlus, label: 'Rekrutacja' },
    { href: '/terminy', icon: CalendarCheck, label: 'Terminy' },
    { href: '/kalendarz', icon: CalendarRange, label: 'Kalendarz' },
    { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność', primary: true },
    { href: '/notatki', icon: NotebookPen, label: 'Notatki' },
  ] },
  { title: 'Majątek i obieg', items: [
    { href: '/szafki', icon: LayoutGrid, label: 'Szafki' },
    { href: '/wydawanie-odziezy', icon: Shirt, label: 'Wydawanie odzieży' },
    { href: '/wydawanie-odziezy-nowi', icon: Shirt, label: 'Odzież — nowi' },
    { href: '/karty-obiegowe', icon: CreditCard, label: 'Karty obiegowe' },
    { href: '/odciski-palcow', icon: Fingerprint, label: 'Odciski palców' },
    { href: '/brak-logowania', icon: FileWarning, label: 'Brak logowania' },
    { href: '/auta', icon: Car, label: 'Auta' },
  ] },
  { title: 'System', items: [
    { href: '/konfiguracja', icon: Settings, label: 'Konfiguracja' },
    { href: '/szablony-email', icon: Mail, label: 'Szablony email' },
    { href: '/historia-email', icon: History, label: 'Historia email' },
  ] },
  { title: 'Publiczne', items: [
    { href: '/harmonogram', icon: CalendarClock, label: 'Harmonogram' },
  ] },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);
export const GUEST_VIEWS = ['/harmonogram'];

export type NavRole = 'admin' | 'editor' | 'guest';
export function getNavRole(isAdmin: boolean, isEditor: boolean): NavRole {
  return isAdmin ? 'admin' : isEditor ? 'editor' : 'guest';
}
export function getVisibleSections(role: NavRole): NavSection[] {
  if (role !== 'guest') return NAV_SECTIONS;
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => GUEST_VIEWS.includes(item.href)),
  })).filter((section) => section.items.length > 0);
}
export function getPrimaryItems(role: NavRole): MenuItem[] {
  if (role === 'guest') return ALL_NAV_ITEMS.filter((item) => GUEST_VIEWS.includes(item.href));
  return ALL_NAV_ITEMS.filter((item) => item.primary);
}
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
export function getPageTitle(pathname: string): string {
  return ALL_NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href))?.label ?? 'Baza-ST';
}
