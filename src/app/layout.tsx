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

function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading, currentUser } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    // If loading is finished and there's no user, and we are not on an auth page, redirect to login
    if (!isLoading && !currentUser && !isAuthPage) {
      router.push('/login');
    }
  }, [isLoading, currentUser, isAuthPage, router]);

  return (
    <div className="flex h-full flex-col md:flex-row bg-transparent">
      {/* The component is always mounted, but its content is hidden on auth pages */}
      <div className={cn(isAuthPage && 'hidden')}>
        <AppSidebar pathname={pathname} />
      </div>

      <SidebarInset
        className={cn(
          'm-0 flex flex-1 flex-col min-w-0',
          !isAuthPage &&
            'md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-lg bg-card/80'
        )}
      >
        {isAuthPage ? (
          children
        ) : isLoading || !currentUser ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          children
        )}
      </SidebarInset>
      
      {/* The component is always mounted, but its content is hidden on auth pages */}
      <div className={cn(isAuthPage && 'hidden')}>
        <AppBottomNav pathname={pathname} />
      </div>
    </div>
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
            <SidebarProvider>
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
