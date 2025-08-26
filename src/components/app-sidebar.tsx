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
  Component,
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
    <Sidebar variant="floating" collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarHeader>
        <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Component className="h-7 w-7" />
            </div>
            <span className="font-bold text-lg text-sidebar-accent-foreground">HOL manager</span>
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
      <SidebarFooter className="p-4">
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
