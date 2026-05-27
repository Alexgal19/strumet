'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Users, BarChart3, CalendarClock, UserX, CalendarDays,
  Shirt, CreditCard, Fingerprint, FileWarning, Settings, LogOut,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { getFirebaseServices } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ALL_NAV_ITEMS, GUEST_VIEWS } from './app-sidebar';

interface AppMobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}

export function AppMobileDrawer({ open, onOpenChange, pathname }: AppMobileDrawerProps) {
  const { isAdmin } = useAppContext();
  const router = useRouter();

  const handleLogout = async () => {
    onOpenChange(false);
    const services = getFirebaseServices();
    if (services?.auth) {
      await signOut(services.auth);
    }
    router.push('/login');
  };

  const navItems = isAdmin 
    ? ALL_NAV_ITEMS 
    : ALL_NAV_ITEMS.filter(item => GUEST_VIEWS.includes(item.href));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex flex-col w-4/5 sm:w-80 bg-background border-r p-0 [&>button]:hidden">
        <SheetHeader className="p-4 border-b text-left flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-sm font-black text-white">S</span>
          </div>
          <div>
            <SheetTitle className="text-lg font-bold">STRUMET <span className="text-primary">HR</span></SheetTitle>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 py-2">
          <div className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-4 px-3 py-3 rounded-full transition-colors',
                    isActive 
                      ? 'bg-primary/15 text-primary font-bold' 
                      : 'text-foreground hover:bg-muted font-medium'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-3 py-3 w-full rounded-full text-destructive hover:bg-destructive/10 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Wyloguj</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
