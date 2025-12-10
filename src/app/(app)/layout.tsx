'use client';

import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import type { ActiveView } from '@/lib/types';
import { AppProvider, useAppContext } from '@/context/app-context';

// Static imports for ultra-fast navigation
import AktywniPage from '@/app/(app)/aktywni/page';
import ZwolnieniPage from '@/app/(app)/zwolnieni/page';
import PlanowaniePage from '@/app/(app)/planowanie/page';
import StatystykiPage from '@/app/(app)/statystyki/page';
import KartyObiegowePage from '@/app/(app)/karty-obiegowe/page';
import OdciskiPalcowPage from '@/app/(app)/odciski-palcow/page';
import BrakLogowaniaPage from '@/app/(app)/brak-logowania/page';
import KonfiguracjaPage from '@/app/(app)/konfiguracja/page';
import WydawanieOdziezyPage from '@/app/(app)/wydawanie-odziezy/page';
import WydawanieOdziezyNowiPage from '@/app/(app)/wydawanie-odziezy-nowi/page';
import OdwiedzalnoscPage from '@/app/(app)/odwiedzalnosc/page';


const viewComponents: Record<ActiveView, React.ComponentType<any>> = {
  aktywni: AktywniPage,
  zwolnieni: ZwolnieniPage,
  planowanie: PlanowaniePage,
  statystyki: StatystykiPage,
  'karty-obiegowe': KartyObiegowePage,
  'odciski-palcow': OdciskiPalcowPage,
  'brak-logowania': BrakLogowaniaPage,
  konfiguracja: KonfiguracjaPage,
  'wydawanie-odziezy': WydawanieOdziezyPage,
  'wydawanie-odziezy-nowi': WydawanieOdziezyNowiPage,
  odwiedzalnosc: OdwiedzalnoscPage,
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
                <SidebarInset className="m-0 flex flex-1 flex-col min-w-0 md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-lg shadow-inner-border bg-card/80">
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
