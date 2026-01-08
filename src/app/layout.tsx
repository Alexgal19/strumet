
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider, useAppContext } from '@/context/app-context';
import React, { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

import AktywniPage from './(app)/aktywni/page';
import ZwolnieniPage from './(app)/zwolnieni/page';
import PlanowaniePage from './(app)/planowanie/page';
import OdwiedzalnoscPage from './(app)/odwiedzalnosc/page';
import StatystykiPage from './(app)/statystyki/page';
import WydawanieOdziezyPage from './(app)/wydawanie-odziezy/page';
import WydawanieOdziezyNowiPage from './(app)/wydawanie-odziezy-nowi/page';
import KartyObiegowePage from './(app)/karty-obiegowe/page';
import OdciskiPalcowPage from './(app)/odciski-palcow/page';
import BrakLogowaniaPage from './(app)/brak-logowania/page';
import KonfiguracjaPage from './(app)/konfiguracja/page';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading, currentUser } = useAppContext();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAuthPage || !currentUser) {
    return <>{children}</>;
  }

  const renderPage = () => {
    switch (pathname) {
      case '/aktywni': return <AktywniPage />;
      case '/zwolnieni': return <ZwolnieniPage />;
      case '/planowanie': return <PlanowaniePage />;
      case '/odwiedzalnosc': return <OdwiedzalnoscPage />;
      case '/statystyki': return <StatystykiPage />;
      case '/wydawanie-odziezy': return <WydawanieOdziezyPage />;
      case '/wydawanie-odziezy-nowi': return <WydawanieOdziezyNowiPage />;
      case '/karty-obiegowe': return <KartyObiegowePage />;
      case '/odciski-palcow': return <OdciskiPalcowPage />;
      case '/brak-logowania': return <BrakLogowaniaPage />;
      case '/konfiguracja': return <KonfiguracjaPage />;
      default: return children;
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-full flex-col md:flex-row bg-transparent">
        <AppSidebar pathname={pathname} />
        <SidebarInset className="m-0 flex flex-1 flex-col min-w-0 md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-lg bg-card/80">
          {renderPage()}
        </SidebarInset>
        <AppBottomNav pathname={pathname} />
      </div>
    </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="pl" className="dark" suppressHydrationWarning>
      <head>
        <title>Baza - ST</title>
        <meta name="description" content="System do zarządzania pracownikami" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/font-geist/latest/geist.css" />
        <meta name="theme-color" content="#209cee" />
      </head>
      <body className="font-body antialiased">
          <AppProvider>
            <AppContent>
              {children}
            </AppContent>
          </AppProvider>
          <Toaster />
      </body>
    </html>
  );
}
