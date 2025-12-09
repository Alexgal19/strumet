
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  UserX,
  Settings,
  CalendarClock,
  FileText,
  Shirt,
  BarChart3,
  LogOut,
  PackagePlus,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import type { ActiveView } from '@/lib/types';

interface AppBottomNavProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

interface MenuItem {
    view?: ActiveView;
    href?: string;
    icon: React.ElementType;
    label: string;
}

const AppBottomNav = ({ activeView, setActiveView }: AppBottomNavProps) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();

  const menuItems: MenuItem[] = [
    { view: 'aktywni', icon: Users, label: 'Aktywni' },
    { view: 'zwolnieni', icon: UserX, label: 'Zwolnieni' },
    { view: 'odwiedzalnosc', icon: CalendarCheck, label: 'Obecność'},
    { view: 'statystyki', icon: BarChart3, label: 'Statystyki' },
    { view: 'konfiguracja', icon: Settings, label: 'Ustawienia' },
  ];
  
  if (!hasMounted || !isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 md:hidden">
      <nav className="flex h-16 items-center justify-around rounded-2xl bg-card/80 shadow-lg border border-border/80 backdrop-blur-md">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.view ? activeView === item.view : false;
          
          const commonProps = {
              className: cn(
                'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-lg transition-all w-16 h-16 transform',
                isActive ? 'text-primary -translate-y-2' : 'text-muted-foreground hover:text-primary'
              )
          };

          const content = (
             <>
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                 isActive ? 'bg-primary/10' : ''
              )}>
                 <Icon className="h-5 w-5" />
              </div>
              <span className={cn('transition-opacity text-xs', isActive ? 'opacity-100' : 'opacity-0')}>{item.label}</span>
             </>
          );

          if (item.href) {
              return (
                <Link key={item.label} href={item.href} {...commonProps}>
                    {content}
                </Link>
              );
          }

          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view as ActiveView)}
              {...commonProps}
            >
             {content}
            </button>
          )
        })}
      </nav>
    </div>
  );
};

export default AppBottomNav;
