
'use client';

import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';

import ActiveEmployeesPage from './active-employees-page';
import TerminatedEmployeesPage from '../app/(app)/zwolnieni/page';
import StatisticsPage from '../app/(app)/statystyki/page';
import ClothingIssuancePage from '../app/(app)/wydawanie-odziezy/page';
import FingerprintAppointmentsPage from '../app/(app)/odciski-palcow/page';
import NoLoginPage from '../app/(app)/brak-logowania/page';
import ConfigurationPage from '../app/(app)/konfiguracja/page';
import PlanningPage from '../app/(app)/planowanie/page';
import AttendancePage from '../app/(app)/odwiedzalnosc/page';

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
