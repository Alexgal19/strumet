
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Users,
  UserX,
  Settings,
  BarChart3,
  Fingerprint,
  FileText,
  Database,
  LogOut,
  CalendarClock,
  Bell,
  Trash2,
  Shirt,
  PackagePlus,
  RefreshCw,
  Loader2,
  CalendarCheck,
  ClipboardList,
} from 'lucide-react';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import type { ActiveView, AppNotification } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { db } from '@/lib/firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { runManualChecks } from '@/ai/flows/run-manual-checks';
import { useToast } from '@/hooks/use-toast';


const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};


const Notifications = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const { toast } = useToast();
    
    useEffect(() => {
        const notificationsRef = ref(db, 'notifications');
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
            const data = objectToArray<AppNotification>(snapshot.val() || {});
            setNotifications(data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        });
        return () => unsubscribe();
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = (id: string) => {
        const updates: Record<string, any> = {};
        updates[`/notifications/${id}/read`] = true;
        update(ref(db), updates);
    };
    
    const handleClearAll = () => {
        if (window.confirm('Czy na pewno chcesz usunąć wszystkie powiadomienia?')) {
            const notifsRef = ref(db, 'notifications');
            remove(notifsRef);
        }
    }

    const handleManualCheck = async () => {
        setIsChecking(true);
        try {
            const result = await runManualChecks();
            let description = `Utworzono ${result.totalNotifications} nowych powiadomień. Wysłano ${result.totalEmails} e-maili.`;

            toast({
                title: 'Sprawdzanie zakończone',
                description: description,
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Błąd',
                description: 'Nie udało się uruchomić sprawdzania.',
            });
        } finally {
            setIsChecking(false);
        }
    };
    
    return (
       <Popover>
            <PopoverTrigger asChild>
                <button className="relative rounded-full p-2 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4">
                    <h4 className="font-medium text-sm">Powiadomienia</h4>
                </div>
                <Separator />
                <ScrollArea className="h-96">
                    {notifications.length > 0 ? (
                        notifications.map(notif => (
                            <div key={notif.id} className="p-4 border-b text-sm" onClick={() => !notif.read && handleMarkAsRead(notif.id)}>
                               <div className="flex items-start gap-3">
                                 {!notif.read && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0"></div>}
                                 <div className="flex-grow">
                                     <p className="font-medium leading-tight">{notif.title}</p>
                                     <p className="text-muted-foreground mt-1">{notif.message}</p>
                                     <p className="text-xs text-muted-foreground/70 mt-2">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: pl })}</p>
                                 </div>
                               </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            <p>Brak nowych powiadomień</p>
                        </div>
                    )}
                </ScrollArea>
                 <Separator />
                 <div className="p-2 space-y-1">
                    <Button variant="ghost" size="sm" className="w-full" onClick={handleManualCheck} disabled={isChecking}>
                        {isChecking ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
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
    )
}

interface AppSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

const AppSidebar = ({ activeView, setActiveView }: AppSidebarProps) => {
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();

  const menuItems: { view: ActiveView, icon: React.ReactNode, label: string }[] = [
    { view: 'aktywni', icon: <Users />, label: 'Pracownicy aktywni' },
    { view: 'zwolnieni', icon: <UserX />, label: 'Pracownicy zwolnieni' },
    { view: 'zamowienia', icon: <ClipboardList />, label: 'Zamówienia' },
    { view: 'planowanie', icon: <CalendarClock />, label: 'Planowanie' },
    { view: 'odwiedzalnosc', icon: <CalendarCheck />, label: 'Odliczenia' },
    { view: 'statystyki', icon: <BarChart3 />, label: 'Statystyki' },
    { view: 'wydawanie-odziezy', icon: <Shirt />, label: 'Wydawanie odzieży' },
    { view: 'wydawanie-odziezy-nowi', icon: <PackagePlus />, label: 'Wydawanie dla nowych'},
    { view: 'karty-obiegowe', icon: <FileText />, label: 'Karty obiegowe' },
    { view: 'odciski-palcow', icon: <Fingerprint />, label: 'Terminy na odciski' },
    { view: 'brak-logowania', icon: <FileText />, label: 'Brak logowania' },
    { view: 'konfiguracja', icon: <Settings />, label: 'Konfiguracja' },
  ];

  if (!hasMounted || isMobile) {
    return null;
  }

  return (
    <Sidebar variant="floating" collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarHeader>
        <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Database className="h-7 w-7" />
            </div>
            <span className="font-bold text-lg text-sidebar-accent-foreground">Baza - ST</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
             <SidebarMenuItem key={item.view} className="p-0">
                <SidebarMenuButton 
                  onClick={() => setActiveView(item.view)} 
                  isActive={activeView === item.view}
                  className="h-12 justify-start"
                  size="lg"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-1">
            <Notifications />
        </div>
        <SidebarMenu>
          <SidebarMenuItem className="p-0">
             <Link href="/login">
                <SidebarMenuButton className="h-12 justify-start" size="lg">
                    <LogOut />
                    <span>Wyloguj</span>
                </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
