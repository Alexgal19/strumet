'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { AppTopBar } from '@/components/app-top-bar';
import AppBottomNav from '@/components/app-bottom-nav';
import { AppSidebar } from '@/components/app-sidebar';

function ClientSidebar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AppSidebar />;
}

function ClientTopBar({ pathname }: { pathname: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AppTopBar pathname={pathname} />;
}

function ClientBottomNav({ pathname }: { pathname: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AppBottomNav pathname={pathname} />;
}

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
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <ClientSidebar />

      <div className="flex flex-col flex-1 w-full md:pl-64 h-dvh">
        <ClientTopBar pathname={pathname} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 pb-16 md:pb-4 z-0 relative w-full">
          {children}
        </main>
        <ClientBottomNav pathname={pathname} />
      </div>
    </div>
  );
});


