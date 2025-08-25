'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  UserX,
  Settings,
  BarChart3,
  Shirt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const AppBottomNav = () => {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const menuItems = [
    { href: '/aktywni', icon: <Users className="h-5 w-5" />, label: 'Aktywni' },
    { href: '/zwolnieni', icon: <UserX className="h-5 w-5" />, label: 'Zwolnieni' },
    { href: '/statystyki', icon: <BarChart3 className="h-5 w-5" />, label: 'Statystyki' },
    { href: '/wydawanie-odziezy', icon: <Shirt className="h-5 w-5" />, label: 'Odzież' },
    { href: '/konfiguracja', icon: <Settings className="h-5 w-5" />, label: 'Ustawienia' },
  ];
  
  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-sm md:hidden">
      <nav className="flex h-16 items-center justify-around">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium rounded-md transition-colors w-16',
              pathname.startsWith(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AppBottomNav;
