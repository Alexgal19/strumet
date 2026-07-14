'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Car
} from 'lucide-react';

export interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

export const ALL_NAV_ITEMS: MenuItem[] = [
  { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit' },
  { href: '/aktywni', icon: Users, label: 'Pracownicy aktywni' },
  { href: '/zwolnieni', icon: UserX, label: 'Zwolnieni' },
  { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
  { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność' },
  { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
  { href: '/szafki', icon: LayoutGrid, label: 'Szafki' },
  { href: '/wydawanie-odziezy', icon: Shirt, label: 'Wydawanie odzieży' },
  { href: '/wydawanie-odziezy-nowi', icon: Shirt, label: 'Odzież — nowi' },
  { href: '/karty-obiegowe', icon: CreditCard, label: 'Karty obiegowe' },
  { href: '/odciski-palcow', icon: Fingerprint, label: 'Odciski palców' },
  { href: '/brak-logowania', icon: FileWarning, label: 'Brak logowania' },
  { href: '/konfiguracja', icon: Settings, label: 'Konfiguracja' },
  { href: '/szablony-email', icon: Mail, label: 'Szablony email' },
  { href: '/historia-email', icon: History, label: 'Historia email' },
  { href: '/auta', icon: Car, label: 'Auta' },
];

export const GUEST_VIEWS = ['/pulpit', '/statystyki', '/planowanie'];

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAppContext();

  const navItems = isAdmin 
    ? ALL_NAV_ITEMS 
    : ALL_NAV_ITEMS.filter(item => GUEST_VIEWS.includes(item.href));

  return (
    <aside className="hidden md:flex flex-col w-24 border-r border-sidebar-border/30 bg-sidebar text-sidebar-foreground h-dvh shrink-0 items-center py-6">
      <div className="flex-none mb-8">
        <div className="w-10 h-10 rounded-full bg-transparent border border-primary/50 flex items-center justify-center relative">
          <div className="absolute w-6 h-6 rounded-full border border-primary left-1"></div>
          <div className="absolute w-6 h-6 rounded-full border border-primary right-1"></div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full" type="scroll">
        <div className="flex flex-col gap-4 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors group',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_hsl(var(--primary)_/_0.5)]" />
                )}
                <Icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)_/_0.4)]")} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
