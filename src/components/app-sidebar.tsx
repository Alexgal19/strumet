'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger as SidebarTriggerButton,
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

const AppSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/aktywni', icon: <Users />, label: 'Pracownicy aktywni' },
    { href: '/zwolnieni', icon: <UserX />, label: 'Pracownicy zwolnieni' },
    { href: '/statystyki', icon: <BarChart3 />, label: 'Statystyki' },
    { href: '/wydawanie-odziezy', icon: <Shirt />, label: 'Wydawanie odzieży' },
    { href: '/odciski-palcow', icon: <Fingerprint />, label: 'Terminy na odciski' },
    { href: '/brak-logowania', icon: <FileText />, label: 'Brak logowania' },
    { href: '/konfiguracja', icon: <Settings />, label: 'Konfiguracja' },
  ];

  return (
    <Sidebar>
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
             <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
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

export const SidebarTrigger = SidebarTriggerButton;
export default AppSidebar;
