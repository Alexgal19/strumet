'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users, BarChart3, CalendarClock, UserX, CalendarDays,
  LayoutDashboard, Menu,
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
  { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit' },
  { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
  { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
];

const EDITOR_PRIMARY: MenuItem[] = [
  { href: '/pulpit', icon: LayoutDashboard, label: 'Pulpit' },
  { href: '/aktywni', icon: Users, label: 'Pracownicy' },
  { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność' },
  { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
];

interface AppBottomNavProps {
  pathname: string;
  onOpenMenu: () => void;
}

const AppBottomNav = ({ pathname, onOpenMenu }: AppBottomNavProps) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { isAdmin, isEditor } = useAppContext();

  if (!hasMounted || !isMobile) return null;

  const primaryItems = isAdmin
    ? ADMIN_PRIMARY
    : isEditor
      ? EDITOR_PRIMARY
      : GUEST_PRIMARY;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center md:hidden bg-background border-t shadow-md pb-[env(safe-area-inset-bottom)]">
      <nav className="pointer-events-auto flex w-full max-w-md items-stretch justify-around px-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[60px] transition-all duration-300 rounded-xl overflow-hidden',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className={cn('px-4 py-0.5 rounded-full transition-colors', isActive && 'bg-primary/15')}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMenu}
          title="Więcej"
          className={cn(
            'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[60px] transition-all duration-300 rounded-xl overflow-hidden text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="px-4 py-0.5 rounded-full transition-colors">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium tracking-tight">Więcej</span>
        </button>
      </nav>
    </div>
  );
};

export default AppBottomNav;
