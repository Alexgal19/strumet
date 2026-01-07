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
    { href: '/planowanie', icon: CalendarClock, label: 'Planowanie'},
    { href: '/odwiedzalnosc', icon: CalendarCheck, label: 'Obecność'},
    { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
    { href: '/konfiguracja', icon: Settings, label: 'Ustawienia' },
  ];
  
  const guestViews: string[] = ['/statystyki', '/planowanie'];
  const menuItems = isAdmin ? allMenuItems : allMenuItems.filter(item => guestViews.includes(item.href));
  
  if (!hasMounted || !isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 md:hidden">
      <nav className="flex h-16 items-center justify-around rounded-2xl bg-card shadow-lg border border-white/10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-lg transition-all w-16 h-16 transform',
                isActive ? 'text-primary -translate-y-2' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                 isActive ? 'bg-primary/10' : ''
              )}>
                 <Icon className="h-5 w-5" />
              </div>
              <span className={cn('transition-opacity text-xs', isActive ? 'opacity-100' : 'opacity-0')}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
};

export default AppBottomNav;
