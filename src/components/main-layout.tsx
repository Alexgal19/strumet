
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';

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

const LoadingComponent = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const ActiveViewComponent = dynamic(
  (props: { view: ActiveView }) => {
    switch (props.view) {
      case 'aktywni':
        return import('./active-employees-page');
      case 'zwolnieni':
        return import('../app/(app)/zwolnieni/page');
      case 'planowanie':
        return import('../app/(app)/planowanie/page');
      case 'odwiedzalnosc':
        return import('../app/(app)/odwiedzalnosc/page');
      case 'statystyki':
        return import('../app/(app)/statystyki/page');
      case 'wydawanie-odziezy':
        return import('../app/(app)/wydawanie-odziezy/page');
      case 'odciski-palcow':
        return import('../app/(app)/odciski-palcow/page');
      case 'brak-logowania':
        return import('../app/(app)/brak-logowania/page');
      case 'konfiguracja':
        return import('../app/(app)/konfiguracja/page');
      default:
        return import('./active-employees-page');
    }
  },
  {
    loading: LoadingComponent,
    ssr: false, // Useful for components that are client-side only
  }
);


export default function MainLayout() {
  const [activeView, setActiveView] = useState<ActiveView>('aktywni');

  return (
    <SidebarProvider>
      <div className="flex h-full flex-col md:flex-row bg-transparent">
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <SidebarInset className="m-2 flex flex-col p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 backdrop-blur-3xl bg-background/50 rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
          <ActiveViewComponent view={activeView} />
        </SidebarInset>
        <AppBottomNav activeView={activeView} setActiveView={setActiveView} />
      </div>
    </SidebarProvider>
  );
}
