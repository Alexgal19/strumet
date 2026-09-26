'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';

import { getNavRole, getPrimaryItems, isNavItemActive } from './app-navigation';

interface AppBottomNavProps {
  pathname: string;
  onOpenMenu: () => void;
}

const AppBottomNav = ({ pathname, onOpenMenu }: AppBottomNavProps) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { isAdmin, isEditor } = useAppContext();

  if (!hasMounted || !isMobile) return null;

  // Tryb pełnoekranowy — brak nav podczas edycji pracownika (Android pattern)
  if (pathname.startsWith('/pracownicy/') || pathname.startsWith('/szablony-email/')) return null;

  const role = getNavRole(isAdmin, isEditor);
  const primaryItems = getPrimaryItems(role);
  const moreActive = !primaryItems.some((item) => isNavItemActive(pathname, item.href));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Safe area + background */}
      <div className="bg-background/95 backdrop-blur-md border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
        <nav aria-label="Nawigacja dolna" className="flex w-full items-stretch justify-around px-1 max-w-md mx-auto">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {/* Icon with active background bubble */}
                <span className={cn(
                  'flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-200',
                  isActive ? 'bg-primary/12' : ''
                )}>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span className={cn(
                  'text-xs font-medium tracking-tight transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {item.shortLabel ?? item.label}
                </span>
              </Link>
            );
          })}

          {role === 'guest' ? (
            <Link href="/login" className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-muted-foreground">
              <span className="flex h-7 w-12 items-center justify-center rounded-full"><LogIn className="h-5 w-5" /></span>
              <span className="text-xs font-medium tracking-tight">Zaloguj</span>
            </Link>
          ) : (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Więcej sekcji"
            className={cn('relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] hover:text-foreground transition-colors duration-200', moreActive ? 'text-primary' : 'text-muted-foreground')}
          >
            <span className={cn("relative flex items-center justify-center w-12 h-7 rounded-full", moreActive && "bg-primary/12")}>
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="text-xs font-medium tracking-tight">Więcej</span>
          </button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default AppBottomNav;
