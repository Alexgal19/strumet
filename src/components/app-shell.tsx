'use client';

import React, { useEffect } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';

export function AppShell({ children }: { children: React.ReactNode }) {
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
        {children}
      </SidebarInset>

      <div className={cn(isAuthPage && 'hidden')}>
        <AppBottomNav pathname={pathname} />
      </div>
    </div>
  );
}
