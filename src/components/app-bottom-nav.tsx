'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Settings,
  BarChart3,
  CalendarClock,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';
import type { ActiveView } from '@/lib/types';


interface AppBottomNavProps {
  pathname: string;
}

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const AppBottomNav = ({ pathname }: AppBottomNavProps) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { isAdmin } = useAppContext();

  const allMenuItems: MenuItem[] = [
    { href: '/aktywni', icon: Users, label: 'Aktywni' },
    { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
    { href: '/odwiedzalnosc', icon: CalendarCheck, label: 'Obecność' },
    { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
    { href: '/konfiguracja', icon: Settings, label: 'Ustawienia' },
  ];

  const guestViews: string[] = ['/statystyki', '/planowanie'];
  const menuItems = isAdmin ? allMenuItems : allMenuItems.filter(item => guestViews.includes(item.href));

  if (!hasMounted || !isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 md:hidden pb-safe">
      <nav className="flex h-16 items-center justify-around rounded-2xl bg-card/90 backdrop-blur-xl shadow-lg border border-white/10 ring-1 ring-black/5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-xs font-medium rounded-xl transition-all flex-1 h-14',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-9 h-7 rounded-lg transition-colors',
                isActive ? 'bg-primary/15' : ''
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] leading-tight truncate w-full text-center">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
};

export default AppBottomNav;
