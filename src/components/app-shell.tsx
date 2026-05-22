'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { AppTopBar } from '@/components/app-top-bar';
import AppBottomNav from '@/components/app-bottom-nav';

function BackgroundDecorations() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden hidden md:block">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
}

// Render nav only on client to avoid SSR/client hydration mismatch
function ClientNavigation({ pathname }: { pathname: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <>
      <AppTopBar pathname={pathname} />
      <AppBottomNav pathname={pathname} />
    </>
  );
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
    <div className="flex h-dvh flex-col w-full overflow-x-hidden md:mesh-gradient bg-background">
      <BackgroundDecorations />
      
      <ClientNavigation pathname={pathname} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0 z-0 relative w-full">
        {children}
      </main>
    </div>
  );
});

