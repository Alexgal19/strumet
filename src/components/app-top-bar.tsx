'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  Bell, RefreshCw, Trash2, Loader2, LogOut, ChevronRight, Menu
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
import { AppMobileDrawer } from './app-mobile-drawer';

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
        <button className="relative rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // On server render or before mount, don't show to avoid hydration mismatch
  if (!hasMounted) return null;

  const breadcrumb = getBreadcrumb(pathname);

  return (
    <>
      <div className="sticky top-0 z-30 w-full bg-background border-b shadow-sm">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-16 items-center px-6 gap-6 w-full">
          {/* Logo (kept as requested, though it's also in the sidebar) */}
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)_/_0.3)]">
               <span className="text-[10px] font-black text-white">S</span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 bg-border/50" />

          {breadcrumb ? (
            <nav className="flex items-center gap-2 text-sm flex-1">
              <Link href={breadcrumb.parentHref} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                {breadcrumb.parent}
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-primary font-bold">{breadcrumb.current}</span>
            </nav>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-3 ml-auto shrink-0">
            {isAdmin && <Notifications />}
            <Separator orientation="vertical" className="h-6 bg-border/50" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Wyloguj"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile Top Bar */}
        <header className="flex md:hidden h-16 items-center px-4 w-full">
          <Button variant="ghost" size="icon" onClick={() => setMobileDrawerOpen(true)} className="mr-3 text-foreground rounded-full h-10 w-10">
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-sm font-black text-white">S</span>
            </div>
            <span className="text-base font-bold tracking-tight">
              STRUMET <span className="text-primary">HR</span>
            </span>
          </div>

          <div className="ml-auto flex items-center">
            {isAdmin && <Notifications />}
          </div>
        </header>
      </div>

      {isMobile && (
        <AppMobileDrawer 
          open={mobileDrawerOpen} 
          onOpenChange={setMobileDrawerOpen} 
          pathname={pathname} 
        />
      )}
    </>
  );
}



