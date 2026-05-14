'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  Users, BarChart3, CalendarClock, UserX, CalendarDays,
  Shirt, CreditCard, Fingerprint, FileWarning, Settings, LogOut, Menu,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';
import { getFirebaseServices } from '@/lib/firebase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const ADMIN_PRIMARY: MenuItem[] = [
  { href: '/aktywni', icon: Users, label: 'Pracownicy' },
  { href: '/zwolnieni', icon: UserX, label: 'Zwolnieni' },
  { href: '/odwiedzalnosc', icon: CalendarDays, label: 'Obecność' },
  { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
];

const ADMIN_MORE: MenuItem[] = [
  { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
  { href: '/wydawanie-odziezy', icon: Shirt, label: 'Odzież' },
  { href: '/wydawanie-odziezy-nowi', icon: Shirt, label: 'Odzież — nowi' },
  { href: '/karty-obiegowe', icon: CreditCard, label: 'Karty obiegowe' },
  { href: '/odciski-palcow', icon: Fingerprint, label: 'Odciski palców' },
  { href: '/brak-logowania', icon: FileWarning, label: 'Brak logowania' },
  { href: '/konfiguracja', icon: Settings, label: 'Konfiguracja' },
];

const GUEST_PRIMARY: MenuItem[] = [
  { href: '/statystyki', icon: BarChart3, label: 'Statystyki' },
  { href: '/planowanie', icon: CalendarClock, label: 'Planowanie' },
];

const AppBottomNav = ({ pathname }: { pathname: string }) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { isAdmin } = useAppContext();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    setMoreOpen(false);
    const services = getFirebaseServices();
    if (services?.auth) {
      await signOut(services.auth);
    }
    router.push('/login');
  };

  if (!hasMounted || !isMobile) return null;

  const primaryItems = isAdmin ? ADMIN_PRIMARY : GUEST_PRIMARY;
  const moreItems = isAdmin ? ADMIN_MORE : [];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 h-20 pointer-events-none flex justify-center md:hidden">
      <nav className="pointer-events-auto flex w-full max-w-md items-center justify-around gap-1 px-2 glass-morphism rounded-3xl shadow-xl border border-white/20">
        {primaryItems.map((item) => {
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
                <Icon className={cn('h-6 w-6 transition-transform duration-300', isActive && 'scale-110')} />
                <span className="text-xs font-bold tracking-tight">{item.label}</span>
              </div>
              {isActive && (
                <div className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl transition-all duration-300" />
              )}
            </Link>
          );
        })}

        {/* Więcej / Menu */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-300 rounded-2xl overflow-hidden',
                moreOpen ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Menu className={cn('h-6 w-6 transition-transform duration-300', moreOpen && 'scale-110')} />
                <span className="text-xs font-bold tracking-tight">Więcej</span>
              </div>
              {moreOpen && (
                <div className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl transition-all duration-300" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="glass-morphism rounded-t-3xl pb-8">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-lg">Menu</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all',
                      isActive
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border/60 bg-white/50 dark:bg-black/30 text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-6 w-6" />
                <span className="text-xs font-semibold text-center leading-tight">Wyloguj</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default AppBottomNav;
