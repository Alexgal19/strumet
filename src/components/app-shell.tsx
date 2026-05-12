'use client';

import React, { useEffect } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';

export const AppShell = React.memo(function AppShell({ children }: { children: React.ReactNode }) {
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

  if (isAuthPage) {
    return (
      <main className="h-full w-full bg-background">
        {children}
      </main>
    )
  }

  return (
    <div className="relative flex h-[100dvh] flex-col md:flex-row bg-background overflow-hidden">
      {/* Background Blobs for modern aesthetic */}
      <div className="blob-bg blob-primary w-[30rem] h-[30rem] top-[-10rem] left-[-5rem]"></div>
      <div className="blob-bg blob-accent w-[40rem] h-[40rem] bottom-[-20rem] right-[-10rem]"></div>

      <div className={cn(isAuthPage && 'hidden', 'z-10')}>
        <AppSidebar pathname={pathname} />
      </div>

      <SidebarInset
        className={cn(
          'm-0 flex flex-1 flex-col min-w-0 overflow-y-auto z-10',
          !isAuthPage &&
          'p-3 md:m-2 md:p-4 lg:p-8 pb-20 md:pb-8 md:rounded-3xl glass-panel'
        )}
      >
        {children}
      </SidebarInset>

      <div className={cn(isAuthPage && 'hidden', 'z-20')}>
        <AppBottomNav pathname={pathname} />
      </div>
    </div>
  );
});
