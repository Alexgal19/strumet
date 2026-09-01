'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
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

import { ALL_NAV_ITEMS, GUEST_VIEWS, EDITOR_VIEWS, NAV_SECTIONS } from './app-sidebar';

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

  const handleLogout = async () => {
    onOpenChange(false);
    const services = getFirebaseServices();
    if (services?.auth) {
      await signOut(services.auth);
    }
    router.push('/login');
  };

  const allowedViews = isAdmin ? null : isEditor ? EDITOR_VIEWS : GUEST_VIEWS;
  const visibleHrefs = new Set(
    (allowedViews
      ? ALL_NAV_ITEMS.filter((item) => allowedViews.includes(item.href))
      : ALL_NAV_ITEMS
    ).map((item) => item.href)
  );

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => visibleHrefs.has(item.href)),
  })).filter((section) => section.items.length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex flex-col h-[85dvh] bg-background p-0 rounded-t-3xl [&>button]:hidden"
      >
        <SheetHeader className="p-4 border-b text-left flex flex-row items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-sm font-black text-white">S</span>
          </div>
          <SheetTitle className="text-lg font-bold">
            Baza<span className="text-primary">-ST</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {sections.map((section) => (
              <div key={section.title} className="mb-4 last:mb-0">
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-3 min-h-[48px] w-full rounded-2xl text-destructive hover:bg-destructive/10 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Wyloguj</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
