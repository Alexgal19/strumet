'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Users,
  UserX,
  Settings,
  BarChart3,
  Shirt,
  Fingerprint,
  FileText,
  Building,
  LogOut,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ActiveView } from './main-layout';

interface AppSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

const AppSidebar = ({ activeView, setActiveView }: AppSidebarProps) => {
  const isMobile = useIsMobile();

  const menuItems: { view: ActiveView, icon: React.ReactNode, label: string }[] = [
    { view: 'aktywni', icon: <Users />, label: 'Pracownicy aktywni' },
    { view: 'zwolnieni', icon: <UserX />, label: 'Pracownicy zwolnieni' },
    { view: 'statystyki', icon: <BarChart3 />, label: 'Statystyki' },
    { view: 'wydawanie-odziezy', icon: <Shirt />, label: 'Wydawanie odzieży' },
    { view: 'odciski-palcow', icon: <Fingerprint />, label: 'Terminy na odciski' },
    { view: 'brak-logowania', icon: <FileText />, label: 'Brak logowania' },
    { view: 'konfiguracja', icon: <Settings />, label: 'Konfiguracja' },
  ];

  if (isMobile) {
    return null;
  }

  return (
    <Sidebar className="backdrop-blur-sm">
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Building className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg">Kadry Online</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-grow">
        <SidebarMenu>
          {menuItems.map((item) => (
             <SidebarMenuItem key={item.view}>
                <SidebarMenuButton 
                  onClick={() => setActiveView(item.view)} 
                  isActive={activeView === item.view}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
                <Link href="/login">
                    <LogOut />
                    <span>Wyloguj</span>
                </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
