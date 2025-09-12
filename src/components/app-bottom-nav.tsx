
'use client';

import React from 'react';
import {
  Users,
  UserX,
  Settings,
  BarChart3,
  CalendarClock,
  CalendarCheck,
  Shirt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ActiveView } from './main-layout';

interface AppBottomNavProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

const AppBottomNav = ({ activeView, setActiveView }: AppBottomNavProps) => {
  const isMobile = useIsMobile();

  const menuItems = [
    { view: 'aktywni', icon: Users, label: 'Aktywni' },
    { view: 'zwolnieni', icon: UserX, label: 'Zwolnieni' },
    { view: 'planowanie', icon: CalendarClock, label: 'Plan' },
    { view: 'odwiedzalnosc', icon: CalendarCheck, label: 'Obecność' },
    { view: 'wydawanie-odziezy', icon: Shirt, label: 'Odzież' },
    { view: 'konfiguracja', icon: Settings, label: 'Ustawienia' },
  ];
  
  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden">
      <nav className="flex h-16 items-center justify-around rounded-2xl bg-neutral-500/20 shadow-lg border border-white/10 backdrop-blur-md">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view as ActiveView)}
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
              <span className={cn('transition-opacity', isActive ? 'opacity-100' : 'opacity-0')}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
};

export default AppBottomNav;
