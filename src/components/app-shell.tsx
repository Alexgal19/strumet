'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { AppTopBar } from '@/components/app-top-bar';
import AppBottomNav from '@/components/app-bottom-nav';

export const AppShell = React.memo(function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, currentUser } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!isLoading && !currentUser && !isAuthPage) {
      router.push('/login');
    }
  }, [isLoading, currentUser, isAuthPage, router]);

  if (isAuthPage) {
    return (
      <main className="h-dvh w-full bg-background">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppTopBar pathname={pathname} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
      <AppBottomNav pathname={pathname} />
    </div>
  );
});
