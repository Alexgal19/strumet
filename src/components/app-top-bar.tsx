'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  Bell, RefreshCw, Trash2, Loader2, LogOut, ChevronRight,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFirebaseServices } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { runManualChecks } from '@/ai/flows/run-manual-checks';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { useHasMounted, useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

function Notifications() {
  const { notifications } = useAppContext();
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const services = getFirebaseServices();
  const db = services?.db;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = useCallback(async (id: string) => {
    if (!db) return;
    await update(ref(db, `notifications/${id}`), { read: true });
  }, [db]);

  const handleClearAll = useCallback(async () => {
    if (!db) return;
    if (window.confirm('Czy na pewno chcesz usunąć wszystkie powiadomienia?')) {
      const updates: Record<string, null> = {};
      notifications.forEach(n => { updates[`/notifications/${n.id}`] = null; });
      await update(ref(db), updates);
    }
  }, [db, notifications]);

  const handleManualCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await runManualChecks();
      toast({
        title: 'Sprawdzanie zakończone',
        description: `Utworzono ${result.totalNotifications} nowych powiadomień. Wysłano ${result.totalEmails} e-maili.`,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się uruchomić sprawdzania.' });
    } finally {
      setIsChecking(false);
    }
  }, [toast]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-md p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-700 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-[10px] bg-emerald-500 text-white border-0">
              {unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <h4 className="font-semibold text-sm">Powiadomienia</h4>
        </div>
        <Separator />
        <ScrollArea className="h-80">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                className="p-4 border-b text-sm cursor-pointer hover:bg-muted/50"
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  {!notif.read && <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                  <div className="flex-grow">
                    <p className="font-medium leading-tight">{notif.title}</p>
                    <p className="text-muted-foreground mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: pl })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground p-8 text-sm">Brak nowych powiadomień</div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2 space-y-1">
          <Button variant="ghost" size="sm" className="w-full" onClick={handleManualCheck} disabled={isChecking}>
            {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Uruchom sprawdzanie
          </Button>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Wyczyść wszystkie
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface AppTopBarProps {
  pathname: string;
}

const ALL_NAV_ITEMS = [
  { href: '/aktywni', label: 'Pracownicy aktywni' },
  { href: '/zwolnieni', label: 'Zwolnieni' },
  { href: '/planowanie', label: 'Planowanie' },
  { href: '/odwiedzalnosc', label: 'Obecność' },
  { href: '/statystyki', label: 'Statystyki' },
  { href: '/wydawanie-odziezy', label: 'Wydawanie odzieży' },
  { href: '/wydawanie-odziezy-nowi', label: 'Odzież — nowi' },
  { href: '/karty-obiegowe', label: 'Karty obiegowe' },
  { href: '/odciski-palcow', label: 'Odciski palców' },
  { href: '/brak-logowania', label: 'Brak logowania' },
  { href: '/konfiguracja', label: 'Konfiguracja' },
];

const GUEST_VIEWS = ['/statystyki', '/planowanie'];

// Returns the breadcrumb label for detail pages (e.g. /pracownicy/[id])
function getBreadcrumb(pathname: string): { parent: string; parentHref: string; current: string } | null {
  if (pathname.startsWith('/pracownicy/')) {
    return { parent: 'Pracownicy aktywni', parentHref: '/aktywni', current: 'Edytuj pracownika' };
  }
  return null;
}

export function AppTopBar({ pathname }: AppTopBarProps) {
  const hasMounted = useHasMounted();
  const isMobile = useIsMobile();
  const { isAdmin } = useAppContext();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    const services = getFirebaseServices();
    if (services?.auth) {
      await signOut(services.auth);
    }
    router.push('/login');
  }, [router]);

  if (!hasMounted || isMobile) return null;

  const navItems = isAdmin ? ALL_NAV_ITEMS : ALL_NAV_ITEMS.filter(item => GUEST_VIEWS.includes(item.href));
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-11 items-center border-b border-gray-800 bg-gray-900 px-4 gap-0">
      <span className="text-xs font-black tracking-widest text-gray-100 mr-5 shrink-0">
        STRUMET HR
      </span>

      {breadcrumb ? (
        // Detail page: show breadcrumb instead of tabs
        <nav className="flex items-center gap-1.5 text-sm flex-1">
          <Link href={breadcrumb.parentHref} className="text-gray-400 hover:text-gray-100 transition-colors">
            {breadcrumb.parent}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
          <span className="text-emerald-400 font-semibold">{breadcrumb.current}</span>
        </nav>
      ) : (
        // List pages: show tab navigation
        <nav className="flex items-stretch h-11 flex-1 overflow-x-auto scrollbar-none">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  'flex items-center px-3 text-sm whitespace-nowrap transition-colors border-b-2 h-full',
                  isActive
                    ? 'text-emerald-400 font-semibold border-emerald-500'
                    : 'text-gray-400 hover:text-gray-100 border-transparent'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="flex items-center gap-2 ml-auto shrink-0">
        {isAdmin && <Notifications />}
        <button
          onClick={handleLogout}
          className="rounded-md p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-700 transition-colors"
          title="Wyloguj"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
