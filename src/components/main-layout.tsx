'use client';

import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';

import ActiveEmployeesPage from './active-employees-page';
import TerminatedEmployeesPage from '../app/(app)/zwolnieni/page';
import StatisticsPage from '../app/(app)/statystyki/page';
import ClothingIssuancePage from '../app/(app)/wydawanie-odziezy/page';
import FingerprintAppointmentsPage from '../app/(app)/odciski-palcow/page';
import NoLoginPage from '../app/(app)/brak-logowania/page';
import ConfigurationPage from '../app/(app)/konfiguracja/page';

export type ActiveView = 
  | 'aktywni' 
  | 'zwolnieni' 
  | 'statystyki' 
  | 'wydawanie-odziezy' 
  | 'odciski-palcow' 
  | 'brak-logowania' 
  | 'konfiguracja';


export default function MainLayout() {
  const [activeView, setActiveView] = useState<ActiveView>('aktywni');

  const renderContent = () => {
    switch (activeView) {
      case 'aktywni':
        return <ActiveEmployeesPage />;
      case 'zwolnieni':
        return <TerminatedEmployeesPage />;
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
      <div className="flex h-full flex-col md:flex-row">
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex flex-1 flex-col overflow-hidden bg-background">
          <div className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            {renderContent()}
          </div>
        </main>
        <AppBottomNav activeView={activeView} setActiveView={setActiveView} />
      </div>
    </SidebarProvider>
  );
}
