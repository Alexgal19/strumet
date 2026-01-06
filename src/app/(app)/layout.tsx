
'use client';

import React, { useEffect, Suspense, lazy } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import type { ActiveView } from '@/lib/types';
import { AppProvider, useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Dynamiczne importy komponentów stron
const viewComponents: Record<ActiveView, React.LazyExoticComponent<React.ComponentType<any>>> = {
  aktywni: lazy(() => import('@/app/(app)/aktywni/page')),
  zwolnieni: lazy(() => import('@/app/(app)/zwolnieni/page')),
  planowanie: lazy(() => import('@/app/(app)/planowanie/page')),
  statystyki: lazy(() => import('@/app/(app)/statystyki/page')),
  'karty-obiegowe': lazy(() => import('@/app/(app)/karty-obiegowe/page')),
  'odciski-palcow': lazy(() => import('@/app/(app)/odciski-palcow/page')),
  'brak-logowania': lazy(() => import('@/app/(app)/brak-logowania/page')),
  konfiguracja: lazy(() => import('@/app/(app)/konfiguracja/page')),
  'wydawanie-odziezy': lazy(() => import('@/app/(app)/wydawanie-odziezy/page')),
  'wydawanie-odziezy-nowi': lazy(() => import('@/app/(app)/wydawanie-odziezy-nowi/page')),
  odwiedzalnosc: lazy(() => import('@/app/(app)/odwiedzalnosc/page')),
};


const CenteredLoader = ({ isLoading }: { isLoading: boolean }) => (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300',
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
);

const ViewTransitionWrapper = ({ children, viewKey }: { children: React.ReactNode, viewKey: string }) => {
  return (
    <div key={viewKey} className="animate-fade-in h-full flex flex-col">
        {children}
    </div>
  );
};

const AppContent = () => {
    const { activeView, setActiveView, isLoading, isAdmin } = useAppContext();
    const router = useRouter();

    useEffect(() => {
        const allowedGuestViews: ActiveView[] = ['statystyki', 'planowanie'];
        if (!isAdmin && !allowedGuestViews.includes(activeView)) {
             router.replace('/statystyki');
        }
    }, [isAdmin, activeView, router]);

    const ActiveViewComponent = viewComponents[activeView] || viewComponents.statystyki;

    return (
        <SidebarProvider>
            <div className="flex h-full flex-col md:flex-row bg-transparent">
                <AppSidebar activeView={activeView} setActiveView={setActiveView} />
                <SidebarInset className="m-0 flex flex-1 flex-col min-w-0 md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-lg bg-card/80">
                   <CenteredLoader isLoading={isLoading} />
                    <Suspense fallback={<CenteredLoader isLoading={true} />}>
                        <div className={cn('h-full', isLoading && 'opacity-0')}>
                            <ViewTransitionWrapper viewKey={activeView}>
                                <ActiveViewComponent />
                            </ViewTransitionWrapper>
                        </div>
                    </Suspense>
                </SidebarInset>
                <AppBottomNav activeView={activeView} setActiveView={setActiveView} />
            </div>
        </SidebarProvider>
    );
};

export default function AppLayout() {
  return (
    <AppProvider>
        <AppContent />
    </AppProvider>
  );
}
