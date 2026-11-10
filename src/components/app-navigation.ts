import type React from 'react';
import {
  Users, BarChart3, CalendarClock, UserX, CalendarDays, Shirt,
  CreditCard, Fingerprint, FileWarning, Settings, LayoutDashboard,
  Mail, History, LayoutGrid, Car, NotebookPen, CalendarRange,
  CalendarCheck, UserPlus, ArrowLeftRight,
} from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';

export interface MenuItem {
  href: string;
  icon: React.ElementType;
  /** Klucz tłumaczenia — wyświetlaj przez t(item.label). */
  label: TranslationKey;
  shortLabel?: TranslationKey;
  primary?: boolean;
}

export interface NavSection {
  /** Klucz tłumaczenia — wyświetlaj przez t(section.title). */
  title: TranslationKey;
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
  { title: 'nav.sectionMain', items: [
    { href: '/pulpit', icon: LayoutDashboard, label: 'nav.pulpit', primary: true },
    { href: '/aktywni', icon: Users, label: 'nav.aktywni', shortLabel: 'nav.aktywniShort', primary: true },
    { href: '/zwolnieni', icon: UserX, label: 'nav.zwolnieni', primary: true },
    { href: '/odwiedzalnosc', icon: CalendarDays, label: 'nav.odwiedzalnosc', primary: true },
  ] },
  { title: 'nav.sectionMore', items: [
    { href: '/harmonogram', icon: CalendarClock, label: 'nav.harmonogram' },
    { href: '/statystyki', icon: BarChart3, label: 'nav.statystyki' },
    { href: '/rekrutacja', icon: UserPlus, label: 'nav.rekrutacja' },
    { href: '/kalendarz', icon: CalendarRange, label: 'nav.kalendarz' },
    { href: '/terminy', icon: CalendarCheck, label: 'nav.terminy' },
    { href: '/szafki', icon: LayoutGrid, label: 'nav.szafki' },
    { href: '/notatki', icon: NotebookPen, label: 'nav.notatki' },
    { href: '/auta', icon: Car, label: 'nav.auta' },
    { href: '/karty-obiegowe', icon: CreditCard, label: 'nav.kartyObiegowe' },
    { href: '/odciski-palcow', icon: Fingerprint, label: 'nav.odciskiPalcow' },
    { href: '/brak-logowania', icon: FileWarning, label: 'nav.brakLogowania' },
    { href: '/wydawanie-odziezy', icon: Shirt, label: 'nav.odziez' },
    { href: '/wydawanie-odziezy-nowi', icon: Shirt, label: 'nav.odziezNowi' },
  ] },
  { title: 'nav.sectionSystem', adminOnly: true, items: [
    { href: '/konfiguracja', icon: Settings, label: 'nav.konfiguracja' },
    { href: '/szablony-email', icon: Mail, label: 'nav.szablonyEmail' },
    { href: '/historia-email', icon: History, label: 'nav.historiaEmail' },
    { href: '/kolejnosc-nazwisk', icon: ArrowLeftRight, label: 'nav.kolejnoscNazwisk' },
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
/** Klucz tłumaczenia tytułu strony; null = brak pozycji w menu (pokaż nazwę aplikacji). */
export function getPageTitleKey(pathname: string): TranslationKey | null {
  return ALL_NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href))?.label ?? null;
}
