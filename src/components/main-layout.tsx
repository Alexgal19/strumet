
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import type { AllConfig, Employee, AbsenceRecord, CirculationCard, FingerprintAppointment, ClothingIssuance, AppNotification } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export type ActiveView = 
  | 'aktywni' 
  | 'zwolnieni' 
  | 'statystyki' 
  | 'karty-obiegowe' 
  | 'odciski-palcow' 
  | 'brak-logowania' 
  | 'konfiguracja'
  | 'planowanie'
  | 'wydawanie-odziezy'
  | 'odwiedzalnosc';

const viewComponents: Record<ActiveView, React.ComponentType<any>> = {
  aktywni: dynamic(() => import('../app/(app)/aktywni/page'), { loading: () => <LoadingComponent /> }),
  zwolnieni: dynamic(() => import('../app/(app)/zwolnieni/page'), { loading: () => <LoadingComponent /> }),
  planowanie: dynamic(() => import('../app/(app)/planowanie/page'), { loading: () => <LoadingComponent /> }),
  odwiedzalnosc: dynamic(() => import('../app/(app)/odwiedzalnosc/page'), { loading: () => <LoadingComponent /> }),
  statystyki: dynamic(() => import('../app/(app)/statystyki/page'), { loading: () => <LoadingComponent /> }),
  'karty-obiegowe': dynamic(() => import('../app/(app)/karty-obiegowe/page'), { loading: () => <LoadingComponent /> }),
  'odciski-palcow': dynamic(() => import('../app/(app)/odciski-palcow/page'), { loading: () => <LoadingComponent /> }),
  'brak-logowania': dynamic(() => import('../app/(app)/brak-logowania/page'), { loading: () => <LoadingComponent /> }),
  konfiguracja: dynamic(() => import('../app/(app)/konfiguracja/page'), { loading: () => <LoadingComponent /> }),
  'wydawanie-odziezy': dynamic(() => import('../app/(app)/wydawanie-odziezy/page'), { loading: () => <LoadingComponent /> }),
};

const LoadingComponent = () => (
  <div className="flex h-full w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function MainLayout() {
  const [activeView, setActiveView] = useState<ActiveView>('aktywni');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [config, setConfig] = useState<AllConfig>({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: []});
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [circulationCards, setCirculationCards] = useState<CirculationCard[]>([]);
  const [fingerprintAppointments, setFingerprintAppointments] = useState<FingerprintAppointment[]>([]);
  const [clothingIssuances, setClothingIssuances] = useState<ClothingIssuance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dataRef = ref(db);
    const unsubscribe = onValue(dataRef, (snapshot) => {
        const data = snapshot.val() || {};
        setEmployees(objectToArray(data.employees));
        setConfig({
            departments: objectToArray(data.config?.departments),
            jobTitles: objectToArray(data.config?.jobTitles),
            managers: objectToArray(data.config?.managers),
            nationalities: objectToArray(data.config?.nationalities),
            clothingItems: objectToArray(data.config?.clothingItems),
        });
        setAbsenceRecords(objectToArray(data.absenceRecords));
        setCirculationCards(objectToArray(data.circulationCards));
        setFingerprintAppointments(objectToArray(data.fingerprintAppointments));
        setClothingIssuances(objectToArray(data.clothingIssuances));
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const ActiveViewComponent = viewComponents[activeView] || viewComponents.aktywni;

  const viewProps = {
    employees,
    config,
    absenceRecords,
    circulationCards,
    fingerprintAppointments,
    clothingIssuances,
    isLoading, // Pass loading state for components that might need it
  };

  return (
    <SidebarProvider>
      <div className="flex h-full flex-col md:flex-row bg-transparent">
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <SidebarInset className="m-2 flex flex-col p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 backdrop-blur-xl bg-background/80 rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
          <React.Suspense fallback={<LoadingComponent />}>
            {isLoading ? <LoadingComponent /> : <ActiveViewComponent {...viewProps} />}
          </React.Suspense>
        </SidebarInset>
        <AppBottomNav activeView={activeView} setActiveView={setActiveView} />
      </div>
    </SidebarProvider>
  );
}
