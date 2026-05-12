'use client';

import React from 'react';
import Link from 'next/link';
import { Users, BarChart3, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const AppBottomNav = ({ pathname }: { pathname: string }) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { isAdmin } = useAppContext();

  const allMenuItems: MenuItem[] = [
    { href: '/aktywni', icon: Users, label: 'Pracownicy' },
    { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
    { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
  ];

  const guestViews = ['/statystyki', '/planowanie'];
  const menuItems = isAdmin ? allMenuItems : allMenuItems.filter(item => guestViews.includes(item.href));

  if (!hasMounted || !isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 border-t border-gray-200 bg-white md:hidden">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-700'
            )}
          >
            <div className={cn(
              'flex h-7 w-9 items-center justify-center rounded-lg transition-colors',
              isActive ? 'bg-emerald-50' : ''
            )}>
              <Icon className="h-5 w-5" />
            </div>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default AppBottomNav;
