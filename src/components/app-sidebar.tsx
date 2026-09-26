'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getNavRole, getVisibleSections, isNavItemActive } from './app-navigation';

const SIDEBAR_COLLAPSED_KEY = 'baza-st-sidebar-collapsed';

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin, isEditor } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(
        window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
      );
    } catch {
      // localStorage niedostępny — zostaje stan domyślny
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // ignorujemy brak dostępu do localStorage
      }
      return next;
    });
  };

  const sections = getVisibleSections(getNavRole(isAdmin, isEditor));

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 h-dvh border-r border-sidebar-border/30 bg-sidebar text-sidebar-foreground py-5 transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex-none mb-6 flex min-h-12 items-center gap-3 overflow-hidden px-4',
          collapsed && 'justify-center px-0'
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-[0_0_15px_hsl(var(--primary)_/_0.3)]">
          <span className="text-sm font-black text-white">S</span>
        </div>
        {!collapsed && (
          <span className="whitespace-nowrap text-base font-bold tracking-tight">
            Baza<span className="text-primary">-ST</span>
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 w-full" type="scroll">
        <nav className="flex flex-col gap-4 px-3" aria-label="Nawigacja główna">
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item.href);
                const inner = (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Icon
                      className="h-5 w-5 shrink-0"
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    {!collapsed && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </>
                );
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="flex-none border-t border-sidebar-border/30 px-3 pt-3">
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
          className={cn(
            'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap text-sm font-medium">
                Zwiń menu
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
