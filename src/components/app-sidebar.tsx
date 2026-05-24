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
  History
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
  { href: '/wydawanie-odziezy', icon: Shirt, label: 'Wydawanie odzieży' },
  { href: '/wydawanie-odziezy-nowi', icon: Shirt, label: 'Odzież — nowi' },
  { href: '/karty-obiegowe', icon: CreditCard, label: 'Karty obiegowe' },
  { href: '/odciski-palcow', icon: Fingerprint, label: 'Odciski palców' },
  { href: '/brak-logowania', icon: FileWarning, label: 'Brak logowania' },
  { href: '/konfiguracja', icon: Settings, label: 'Konfiguracja' },
  { href: '/szablony-email', icon: Mail, label: 'Szablony email' },
  { href: '/historia-email', icon: History, label: 'Historia email' },
];

export const GUEST_VIEWS = ['/pulpit', '/statystyki', '/planowanie'];

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAppContext();

  const navItems = isAdmin 
    ? ALL_NAV_ITEMS 
    : ALL_NAV_ITEMS.filter(item => GUEST_VIEWS.includes(item.href));

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background h-dvh fixed top-0 left-0 z-40">
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)_/_0.3)] group-hover:scale-110 transition-transform duration-300">
             <span className="text-sm font-black text-white">S</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground/90">
            STRUMET <span className="text-primary">HR</span>
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                  isActive 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
