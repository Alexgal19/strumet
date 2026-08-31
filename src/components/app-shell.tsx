'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import AppBottomNav from '@/components/app-bottom-nav';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopBar } from '@/components/app-top-bar';
import { AppMobileDrawer } from '@/components/app-mobile-drawer';
import { useIsMobile } from '@/hooks/use-mobile';

function ClientSidebar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AppSidebar />;
}

function ClientBottomNav({ pathname, onOpenMenu }: { pathname: string; onOpenMenu: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AppBottomNav pathname={pathname} onOpenMenu={onOpenMenu} />;
}

function ClientMobileDrawer({
  pathname,
  open,
  onOpenChange,
}: {
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return (
    <AppMobileDrawer
      open={open}
      onOpenChange={onOpenChange}
      pathname={pathname}
    />
  );
}

export const AppShell = React.memo(function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, currentUser } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex h-dvh w-full overflow-hidden bg-background mesh-gradient text-foreground">
      <ClientSidebar />

      <div className="flex flex-col flex-1 w-full h-dvh min-w-0">
        <AppTopBar pathname={pathname} onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-4 z-0 relative w-full">
          {children}
        </main>
        <ClientBottomNav
          pathname={pathname}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
      </div>

      <ClientMobileDrawer
        pathname={pathname}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
    </div>
  );
});
