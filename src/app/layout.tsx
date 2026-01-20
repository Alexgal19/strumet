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
    <div className="relative flex h-full flex-col md:flex-row bg-transparent overflow-hidden">
      {/* Animated Background Blobs for Dashboard */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse pointer-events-none z-[-1]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] animate-pulse delay-1000 pointer-events-none z-[-1]" />

      <div className={cn(isAuthPage && 'hidden')}>
        <AppSidebar pathname={pathname} />
      </div>

      <SidebarInset
        className={cn(
          'm-0 flex flex-1 flex-col min-w-0',
          !isAuthPage &&
          'md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-2xl bg-card/40 backdrop-blur-sm border border-white/5 shadow-2xl'
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
      <body className="font-body antialiased bg-background text-foreground">
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
