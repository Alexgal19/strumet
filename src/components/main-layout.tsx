'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import { AllConfig } from '@/lib/types';


export type ActiveView = 
  | 'aktywni' 
  | 'zwolnieni' 
  | 'statystyki' 
  | 'wydawanie-odziezy' 
  | 'odciski-palcow' 
  | 'brak-logowania' 
  | 'konfiguracja'
  | 'planowanie'
  | 'odwiedzalnosc';

const viewComponents: Record<ActiveView, React.ComponentType<any>> = {
  aktywni: dynamic(() => import('./active-employees-page'), { loading: () => <LoadingComponent /> }),
  zwolnieni: dynamic(() => import('../app/(app)/zwolnieni/page'), { loading: () => <LoadingComponent /> }),
  planowanie: dynamic(() => import('../app/(app)/planowanie/page'), { loading: () => <LoadingComponent /> }),
  odwiedzalnosc: dynamic(() => import('../app/(app)/odwiedzalnosc/page'), { loading: () => <LoadingComponent /> }),
  statystyki: dynamic(() => import('../app/(app)/statystyki/page'), { loading: () => <LoadingComponent /> }),
  'wydawanie-odziezy': dynamic(() => import('../app/(app)/wydawanie-odziezy/page'), { loading: () => <LoadingComponent /> }),
  'odciski-palcow': dynamic(() => import('../app/(app)/odciski-palcow/page'), { loading: () => <LoadingComponent /> }),
  'brak-logowania': dynamic(() => import('../app/(app)/brak-logowania/page'), { loading: () => <LoadingComponent /> }),
  konfiguracja: dynamic(() => import('../app/(app)/konfiguracja/page'), { loading: () => <LoadingComponent /> }),
};

const LoadingComponent = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);


export default function MainLayout() {
  const [activeView, setActiveView] = useState<ActiveView>('aktywni');
  
  const ActiveViewComponent = viewComponents[activeView] || viewComponents.aktywni;

  return (
    <SidebarProvider>
      <div className="flex h-full flex-col md:flex-row bg-transparent">
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <SidebarInset className="m-2 flex flex-col p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 backdrop-blur-3xl bg-background/50 rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
          <React.Suspense fallback={<LoadingComponent />}>
            <ActiveViewComponent />
          </React.Suspense>
        </SidebarInset>
        <AppBottomNav activeView={activeView} setActiveView={setActiveView} />
      </div>
    </SidebarProvider>
  );
}
