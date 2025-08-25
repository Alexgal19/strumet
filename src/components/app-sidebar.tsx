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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserX,
  UserPlus,
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/aktywni')}>
              <Link href="/aktywni">
                <Users />
                <span>Pracownicy aktywni</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/zwolnieni')}>
              <Link href="/zwolnieni">
                <UserX />
                <span>Pracownicy zwolnieni</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/statystyki')}>
              <Link href="/statystyki">
                <BarChart3 />
                <span>Statystyki</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/wydawanie-odziezy')}>
              <Link href="/wydawanie-odziezy">
                <Shirt />
                <span>Wydawanie odzieży</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/odciski-palcow')}>
              <Link href="/odciski-palcow">
                <Fingerprint />
                <span>Terminy na odciski</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/brak-logowania')}>
              <Link href="/brak-logowania">
                <FileText />
                <span>Brak logowania</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/konfiguracja')}>
              <Link href="/konfiguracja">
                <Settings />
                <span>Konfiguracja</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
