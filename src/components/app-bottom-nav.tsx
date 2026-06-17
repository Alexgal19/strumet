'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  Users, BarChart3, CalendarClock, UserX, CalendarDays,
  Shirt, CreditCard, Fingerprint, FileWarning, Settings, LogOut, Menu,
  LayoutDashboard,
  LayoutGrid,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const ADMIN_PRIMARY: MenuItem[] = [
  { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit' },
  { href: '/aktywni', icon: Users, label: 'Pracownicy' },
  { href: '/zwolnieni', icon: UserX, label: 'Zwolnieni' },
  { href: '/szafki', icon: LayoutGrid, label: 'Szafki' },
  { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność' },
];



const GUEST_PRIMARY: MenuItem[] = [
  { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit' },
  { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
];

const AppBottomNav = ({ pathname }: { pathname: string }) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { isAdmin } = useAppContext();

  if (!hasMounted || !isMobile) return null;

  const primaryItems = isAdmin ? ADMIN_PRIMARY : GUEST_PRIMARY;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 pointer-events-none flex justify-center md:hidden bg-background border-t shadow-md">
      <nav className="pointer-events-auto flex w-full max-w-md items-center justify-around px-2">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center py-2 transition-all duration-300 rounded-xl overflow-hidden',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className={cn('px-4 py-0.5 rounded-full transition-colors', isActive && 'bg-primary/15')}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AppBottomNav;
