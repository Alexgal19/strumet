
'use client';

import React, { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import type { ActiveView } from '@/lib/types';
import { AppProvider, useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
        // If user is not an admin and tries to access a page other than 'statystyki', redirect them.
        if (!isAdmin && activeView !== 'statystyki') {
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
                    <React.Suspense fallback={<CenteredLoader isLoading={true} />}>
                        <div className={cn('h-full', isLoading && 'opacity-0')}>
                            <ViewTransitionWrapper viewKey={activeView}>
                                <ActiveViewComponent />
                            </ViewTransitionWrapper>
                        </div>
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
