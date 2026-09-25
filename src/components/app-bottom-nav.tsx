'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users, CalendarDays, UserX,
  LayoutDashboard, Menu,
  CalendarClock,
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
  { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność' },
];

const GUEST_PRIMARY: MenuItem[] = [
  { href: '/harmonogram', icon: CalendarClock, label: 'Harmonogram' },
];

const EDITOR_PRIMARY: MenuItem[] = [
  { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit' },
  { href: '/aktywni', icon: Users, label: 'Pracownicy' },
  { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność' },
];

interface AppBottomNavProps {
  pathname: string;
  onOpenMenu: () => void;
}

const AppBottomNav = ({ pathname, onOpenMenu }: AppBottomNavProps) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { isAdmin, isEditor, notifications } = useAppContext();

  if (!hasMounted || !isMobile) return null;

  // Tryb pełnoekranowy — brak nav podczas edycji pracownika (Android pattern)
  if (pathname.startsWith('/pracownicy/')) return null;

  const primaryItems = isAdmin
    ? ADMIN_PRIMARY
    : isEditor
      ? EDITOR_PRIMARY
      : GUEST_PRIMARY;

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Safe area + background */}
      <div className="bg-background/95 backdrop-blur-md border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex w-full items-stretch justify-around px-1 max-w-md mx-auto">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {/* Android pill indicator (active) */}
                {isActive && (
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-primary" />
                )}
                {/* Icon with active background bubble */}
                <span className={cn(
                  'flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-200',
                  isActive ? 'bg-primary/12' : ''
                )}>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span className={cn(
                  'text-[10px] font-medium tracking-tight transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* "Więcej" button z badge sповіщень */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <span className="relative flex items-center justify-center w-12 h-7 rounded-full">
              <Menu className="h-5 w-5" strokeWidth={1.8} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-0.5 h-4 min-w-4 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium tracking-tight">Więcej</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default AppBottomNav;
