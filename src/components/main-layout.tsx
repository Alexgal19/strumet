
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';

const LoadingComponent = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const ActiveEmployeesPage = dynamic(() => import('./active-employees-page'), { loading: LoadingComponent });
const TerminatedEmployeesPage = dynamic(() => import('../app/(app)/zwolnieni/page'), { loading: LoadingComponent });
const StatisticsPage = dynamic(() => import('../app/(app)/statystyki/page'), { loading: LoadingComponent });
const ClothingIssuancePage = dynamic(() => import('../app/(app)/wydawanie-odziezy/page'), { loading: LoadingComponent });
const FingerprintAppointmentsPage = dynamic(() => import('../app/(app)/odciski-palcow/page'), { loading: LoadingComponent });
const NoLoginPage = dynamic(() => import('../app/(app)/brak-logowania/page'), { loading: LoadingComponent });
const ConfigurationPage = dynamic(() => import('../app/(app)/konfiguracja/page'), { loading: LoadingComponent });
const PlanningPage = dynamic(() => import('../app/(app)/planowanie/page'), { loading: LoadingComponent });
const AttendancePage = dynamic(() => import('../app/(app)/odwiedzalnosc/page'), { loading: LoadingComponent });


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


export default function MainLayout() {
  const [activeView, setActiveView] = useState<ActiveView>('aktywni');

  const renderContent = () => {
    switch (activeView) {
      case 'aktywni':
        return <ActiveEmployeesPage />;
      case 'zwolnieni':
        return <TerminatedEmployeesPage />;
      case 'planowanie':
        return <PlanningPage />;
      case 'odwiedzalnosc':
        return <AttendancePage />;
      case 'statystyki':
        return <StatisticsPage />;
      case 'wydawanie-odziezy':
        return <ClothingIssuancePage />;
      case 'odciski-palcow':
        return <FingerprintAppointmentsPage />;
      case 'brak-logowania':
        return <NoLoginPage />;
      case 'konfiguracja':
        return <ConfigurationPage />;
      default:
        return <ActiveEmployeesPage />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-full flex-col md:flex-row bg-transparent">
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <SidebarInset className="m-2 flex flex-col p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 backdrop-blur-3xl bg-background/50 rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
          {renderContent()}
        </SidebarInset>
        <AppBottomNav activeView={activeView} setActiveView={setActiveView} />
      </div>
    </SidebarProvider>
  );
}
