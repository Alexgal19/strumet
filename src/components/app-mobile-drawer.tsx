'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { LogOut, LogIn, Search } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { getFirebaseServices } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';

import { getNavRole, getVisibleSections, isNavItemActive } from './app-navigation';

interface AppMobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}

/**
 * Mobilne menu — dolny sheet (strefa kciuka) z nawigacją pogrupowaną
 * w sekcje, analogicznie do sidebaru na desktopie.
 */
export function AppMobileDrawer({ open, onOpenChange, pathname }: AppMobileDrawerProps) {
  const { isAdmin, isEditor } = useAppContext();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setQuery('');
  };

  const handleLogout = async () => {
    onOpenChange(false);
    const services = getFirebaseServices();
    if (services?.auth) {
      await signOut(services.auth);
    }
    router.push('/login');
  };

  const isGuest = !isAdmin && !isEditor;
  const normalizedQuery = query.trim().toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const sections = getVisibleSections(getNavRole(isAdmin, isEditor))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        `${item.label} ${section.title}`.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedQuery)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex flex-col h-[min(85dvh,760px)] bg-background p-0 rounded-t-3xl [&>button]:flex [&>button]:h-12 [&>button]:w-12 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full"
      >
        <SheetHeader className="p-4 pr-14 border-b text-left flex flex-row items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-sm font-black text-white">S</span>
          </div>
          <SheetTitle className="text-lg font-bold">
            Baza<span className="text-primary">-ST</span>
          </SheetTitle>
        </SheetHeader>

        {!isGuest && (
          <div className="relative px-4 pt-3 shrink-0">
            <Search className="absolute left-7 top-[26px] h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Znajdź sekcję..."
              aria-label="Znajdź sekcję"
              className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {sections.length === 0 && <p className="px-2 py-6 text-sm text-muted-foreground">Nie znaleziono sekcji.</p>}
            {sections.map((section) => (
              <div key={section.title} className="mb-4 last:mb-0">
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavItemActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => { onOpenChange(false); setQuery(''); }}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-2xl border transition-colors',
                          isActive
                            ? 'border-primary/30 bg-primary/10 text-primary font-semibold'
                            : 'border-border/50 bg-card/50 text-foreground font-medium hover:bg-muted'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="text-[13px] leading-tight">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0">
          {isGuest ? (
            <button
              onClick={() => {
                onOpenChange(false);
                router.push('/login');
              }}
              className="flex items-center gap-4 px-3 min-h-[48px] w-full rounded-2xl text-primary hover:bg-primary/10 transition-colors font-medium"
            >
              <LogIn className="h-5 w-5" />
              <span>Zaloguj się</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-3 min-h-[48px] w-full rounded-2xl text-destructive hover:bg-destructive/10 transition-colors font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Wyloguj</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
