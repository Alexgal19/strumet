'use client';

import React from 'react';
import Link from 'next/link';
import { Users, BarChart3, CalendarClock, UserX } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { href: '/aktywni', icon: Users, label: 'Pracownicy' },
  { href: '/zwolnieni', icon: UserX, label: 'Zwolnieni' },
  { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
  { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
];

const GUEST_VIEWS = ['/statystyki', '/planowanie'];

const AppBottomNav = ({ pathname }: { pathname: string }) => {

  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { isAdmin } = useAppContext();

  const menuItems = isAdmin ? ALL_MENU_ITEMS : ALL_MENU_ITEMS.filter(item => GUEST_VIEWS.includes(item.href));

  if (!hasMounted || !isMobile) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 h-16 pointer-events-none flex justify-center md:hidden">
      <nav className="pointer-events-auto flex w-full max-w-md items-center justify-around gap-1 px-2 glass-morphism rounded-3xl shadow-xl border border-white/20">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-300 rounded-2xl overflow-hidden',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "scale-110")} />
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </div>
              {isActive && (
                <div className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl transition-all duration-300" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};


export default AppBottomNav;
