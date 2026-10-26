import type React from 'react';
import {
  Users, BarChart3, CalendarClock, UserX, CalendarDays, Shirt,
  CreditCard, Fingerprint, FileWarning, Settings, LayoutDashboard,
  Mail, History, LayoutGrid, Car, NotebookPen, CalendarRange,
  CalendarCheck, UserPlus, ArrowLeftRight,
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
  /** Sekcja widoczna tylko dla administratora (np. System). */
  adminOnly?: boolean;
}

/**
 * One list powers the sidebar, mobile navigation, search and page titles.
 *
 * Układ: 4 pozycje na pierwszym planie (dolny pasek telefonu), reszta w „Więcej”,
 * ustawienia w „System” (tylko admin).
 *
 * Adresy celowo bez pozycji w menu (strony szczegółowe, nie są listami):
 *  - /pracownicy/[id]  - karta pracownika, otwierana z listy Aktywni / Zwolnieni.
 *  - /login, /register - ekrany logowania poza układem aplikacji.
 */
export const NAV_SECTIONS: NavSection[] = [
  { title: 'Główne', items: [
    { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit', primary: true },
    { href: '/aktywni', icon: Users, label: 'Pracownicy aktywni', shortLabel: 'Pracownicy', primary: true },
    { href: '/zwolnieni', icon: UserX, label: 'Zwolnieni', primary: true },
    { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność', primary: true },
  ] },
  { title: 'Więcej', items: [
    { href: '/harmonogram', icon: CalendarClock, label: 'Obsada' },
    { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
    { href: '/rekrutacja', icon: UserPlus, label: 'Rekrutacja' },
    { href: '/kalendarz', icon: CalendarRange, label: 'Kalendarz' },
    { href: '/terminy', icon: CalendarCheck, label: 'Terminy' },
    { href: '/szafki', icon: LayoutGrid, label: 'Szafki' },
    { href: '/notatki', icon: NotebookPen, label: 'Notatki' },
    { href: '/auta', icon: Car, label: 'Auta' },
    { href: '/karty-obiegowe', icon: CreditCard, label: 'Karty obiegowe' },
    { href: '/odciski-palcow', icon: Fingerprint, label: 'Odciski palców' },
    { href: '/brak-logowania', icon: FileWarning, label: 'Brak logowania' },
    { href: '/wydawanie-odziezy', icon: Shirt, label: 'Odzież' },
    { href: '/wydawanie-odziezy-nowi', icon: Shirt, label: 'Odzież (nowi)' },
  ] },
  { title: 'System', adminOnly: true, items: [
    { href: '/konfiguracja', icon: Settings, label: 'Konfiguracja' },
    { href: '/szablony-email', icon: Mail, label: 'Szablony email' },
    { href: '/historia-email', icon: History, label: 'Historia email' },
    { href: '/kolejnosc-nazwisk', icon: ArrowLeftRight, label: 'Kolejność nazwisk' },
  ] },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);
export const GUEST_VIEWS = ['/harmonogram'];

export type NavRole = 'admin' | 'editor' | 'guest';
export function getNavRole(isAdmin: boolean, isEditor: boolean): NavRole {
  return isAdmin ? 'admin' : isEditor ? 'editor' : 'guest';
}
export function getVisibleSections(role: NavRole): NavSection[] {
  if (role === 'admin') return NAV_SECTIONS;
  if (role === 'editor') return NAV_SECTIONS.filter((section) => !section.adminOnly);
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
