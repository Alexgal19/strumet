'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider, useAppContext } from '@/context/app-context';
import React, { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useHasMounted } from '@/hooks/use-mobile';
import { usePWA } from '@/hooks/use-pwa';
import { GeistSans } from 'geist/font/sans';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading, currentUser } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const hasMounted = useHasMounted();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    // If loading is finished and there's no user, and we are not on an auth page, redirect to login
    if (!isLoading && !currentUser && !isAuthPage) {
      router.push('/login');
    }
  }, [isLoading, currentUser, isAuthPage, router]);

  if (isAuthPage) {
    return (
      <main className="h-full w-full bg-background">
        {children}
      </main>
    )
  }

  return (
    <div className="relative flex h-full flex-col md:flex-row bg-background overflow-hidden">
      <div className={cn(isAuthPage && 'hidden')}>
        <AppSidebar pathname={pathname} />
      </div>

      <SidebarInset
        className={cn(
          'm-0 flex flex-1 flex-col min-w-0',
          !isAuthPage &&
          'md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-2xl bg-background border border-border shadow-lg'
        )}
      >
        {/*
          Always render children to keep the component tree stable.
          The loading state is now an overlay, which doesn't replace the component,
          thus preventing the "Rendered more hooks than during the previous render" error.
        */}
        {children}

        {hasMounted && !isAuthPage && (isLoading || !currentUser) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </SidebarInset>

      <div className={cn(isAuthPage && 'hidden')}>
        <AppBottomNav pathname={pathname} />
      </div>
    </div>
  );
}

function PWAInitializer() {
  'use client';
  usePWA();
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Baza - ST</title>
        <meta name="description" content="System do zarządzania pracownikami" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#209cee" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Baza-ST" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={cn(
          "font-body antialiased bg-background text-foreground",
          GeistSans.className
      )}>
        <AppProvider>
          <SidebarProvider>
            <PWAInitializer />
            <AppContent>
              {children}
            </AppContent>
          </SidebarProvider>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
