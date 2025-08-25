'use client';

import React from 'react';
import {
  Users,
  UserX,
  Settings,
  BarChart3,
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
    { view: 'aktywni', icon: <Users className="h-5 w-5" />, label: 'Aktywni' },
    { view: 'zwolnieni', icon: <UserX className="h-5 w-5" />, label: 'Zwolnieni' },
    { view: 'statystyki', icon: <BarChart3 className="h-5 w-5" />, label: 'Statystyki' },
    { view: 'wydawanie-odziezy', icon: <Shirt className="h-5 w-5" />, label: 'Odzież' },
    { view: 'konfiguracja', icon: <Settings className="h-5 w-5" />, label: 'Ustawienia' },
  ];
  
  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/10 bg-background/80 backdrop-blur-sm md:hidden">
      <nav className="flex h-16 items-center justify-around">
        {menuItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view as ActiveView)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-md transition-colors w-16',
              activeView === item.view
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AppBottomNav;
