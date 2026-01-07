'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider, useAppContext } from '@/context/app-context';
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

// Ta funkcja jest komponentem klienckim, który opakowuje logikę
// zależną od hooków klienckich (usePathname, useAppContext)
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

  // Jeśli użytkownik jest na stronie logowania/rejestracji, nie pokazuj nawigacji
  if (isAuthPage || !currentUser) {
    return <>{children}</>;
  }

  // Jeśli użytkownik jest zalogowany, pokazuj pełny layout aplikacji
  return (
    <SidebarProvider>
      <div className="flex h-full flex-col md:flex-row bg-transparent">
        <AppSidebar pathname={pathname} />
        <SidebarInset className="m-0 flex flex-1 flex-col min-w-0 md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-lg bg-card/80">
          {children}
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
        <link rel="manifest" href="/manifest.json" />
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
