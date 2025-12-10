'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import type { ActiveView } from '@/lib/types';
import { AppProvider, useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';

const viewComponents: Record<ActiveView, React.ComponentType<any>> = {
  aktywni: dynamic(() => import('@/app/(app)/aktywni/page'), { loading: () => <LoadingComponent /> }),
  zwolnieni: dynamic(() => import('@/app/(app)/zwolnieni/page'), { loading: () => <LoadingComponent /> }),
  planowanie: dynamic(() => import('@/app/(app)/planowanie/page'), { loading: () => <LoadingComponent /> }),
  statystyki: dynamic(() => import('@/app/(app)/statystyki/page'), { loading: () => <LoadingComponent /> }),
  'karty-obiegowe': dynamic(() => import('@/app/(app)/karty-obiegowe/page'), { loading: () => <LoadingComponent /> }),
  'odciski-palcow': dynamic(() => import('@/app/(app)/odciski-palcow/page'), { loading: () => <LoadingComponent /> }),
  'brak-logowania': dynamic(() => import('@/app/(app)/brak-logowania/page'), { loading: () => <LoadingComponent /> }),
  konfiguracja: dynamic(() => import('@/app/(app)/konfiguracja/page'), { loading: () => <LoadingComponent /> }),
  'wydawanie-odziezy': dynamic(() => import('@/app/(app)/wydawanie-odziezy/page'), { loading: () => <LoadingComponent /> }),
  'wydawanie-odziezy-nowi': dynamic(() => import('@/app/(app)/wydawanie-odziezy-nowi/page'), { loading: () => <LoadingComponent /> }),
  odwiedzalnosc: dynamic(() => import('@/app/(app)/odwiedzalnosc/page'), { loading: () => <LoadingComponent /> }),
};

const LoadingComponent = () => (
  <div className="flex h-full w-full items-center justify-center">
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
    const { activeView, setActiveView, isLoading } = useAppContext();
    const ActiveViewComponent = viewComponents[activeView] || viewComponents.aktywni;

    return (
        <SidebarProvider>
            <div className="flex h-full flex-col md:flex-row bg-transparent">
                <AppSidebar activeView={activeView} setActiveView={setActiveView} />
                <SidebarInset className="m-0 flex flex-1 flex-col min-w-0 md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-2xl border-white/10 md:border bg-card shadow-lg w-full">
                    <React.Suspense fallback={<LoadingComponent />}>
                        {isLoading ? <LoadingComponent /> : (
                            <ViewTransitionWrapper viewKey={activeView}>
                                <ActiveViewComponent />
                            </ViewTransitionWrapper>
                        )}
                    </React.Suspense>
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
