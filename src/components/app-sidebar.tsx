'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users, BarChart3, CalendarClock, UserX, CalendarDays,
  Shirt, CreditCard, Fingerprint, FileWarning, Settings,
  LayoutDashboard,
  Mail,
  History,
  LayoutGrid,
  Car,
  NotebookPen,
  CalendarRange,
} from 'lucide-react';

export interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

export interface NavSection {
  title: string;
  items: MenuItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Przegląd',
    items: [
      { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit' },
      { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
    ],
  },
  {
    title: 'Kadry',
    items: [
      { href: '/aktywni', icon: Users, label: 'Pracownicy aktywni' },
      { href: '/zwolnieni', icon: UserX, label: 'Zwolnieni' },
      { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
      { href: '/kalendarz', icon: CalendarRange, label: 'Kalendarz' },
      { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność' },
      { href: '/notatki', icon: NotebookPen, label: 'Notatki' },
    ],
  },
  {
    title: 'Majątek i obieg',
    items: [
      { href: '/szafki', icon: LayoutGrid, label: 'Szafki' },
      { href: '/wydawanie-odziezy', icon: Shirt, label: 'Wydawanie odzieży' },
      { href: '/wydawanie-odziezy-nowi', icon: Shirt, label: 'Odzież — nowi' },
      { href: '/karty-obiegowe', icon: CreditCard, label: 'Karty obiegowe' },
      { href: '/odciski-palcow', icon: Fingerprint, label: 'Odciski palców' },
      { href: '/brak-logowania', icon: FileWarning, label: 'Brak logowania' },
      { href: '/auta', icon: Car, label: 'Auta' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/konfiguracja', icon: Settings, label: 'Konfiguracja' },
      { href: '/szablony-email', icon: Mail, label: 'Szablony email' },
      { href: '/historia-email', icon: History, label: 'Historia email' },
    ],
  },
];

export const ALL_NAV_ITEMS: MenuItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export const GUEST_VIEWS = ['/pulpit', '/statystyki', '/planowanie', '/notatki'];

/** Widoki dodatkowe dla roli 'kolega' (editor) */
export const EDITOR_VIEWS = [...GUEST_VIEWS, '/kalendarz', '/odwiedzalnosc'];

const SIDEBAR_COLLAPSED_KEY = 'baza-st-sidebar-collapsed';

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin, isEditor } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(
        window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
      );
    } catch {
      // localStorage niedostępny — zostaje stan domyślny
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // ignorujemy brak dostępu do localStorage
      }
      return next;
    });
  };

  const allowedViews = isAdmin ? null : isEditor ? EDITOR_VIEWS : GUEST_VIEWS;
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: allowedViews
      ? section.items.filter((item) => allowedViews.includes(item.href))
      : section.items,
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 h-dvh border-r border-sidebar-border/30 bg-sidebar text-sidebar-foreground py-5 transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex-none mb-6 flex h-10 items-center gap-3 overflow-hidden px-4',
          collapsed && 'justify-center px-0'
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-[0_0_15px_hsl(var(--primary)_/_0.3)]">
          <span className="text-sm font-black text-white">S</span>
        </div>
        {!collapsed && (
          <span className="whitespace-nowrap text-base font-bold tracking-tight">
            Baza<span className="text-primary">-ST</span>
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 w-full" type="scroll">
        <nav className="flex flex-col gap-4 px-3">
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'relative flex h-10 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Icon
                      className="h-5 w-5 shrink-0"
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    {!collapsed && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="flex-none border-t border-sidebar-border/30 px-3 pt-3">
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
          className={cn(
            'flex h-9 w-full items-center gap-3 rounded-xl px-3 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap text-sm font-medium">
                Zwiń menu
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
