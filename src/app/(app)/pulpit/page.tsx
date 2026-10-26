'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useIsMobile } from '@/hooks/use-mobile';
import { AbsentOverview } from '@/components/absent-overview';
import { AbsenceDateSearchCard } from '@/components/absence-date-search-card';
import { DashboardActionCards } from '@/components/dashboard-action-cards';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DashboardSkeleton } from '@/components/pulpit/dashboard-skeleton';
import { KpiCards } from '@/components/pulpit/kpi-cards';
import { VacationsCard } from '@/components/pulpit/vacations-card';
import { NotificationsCard } from '@/components/pulpit/notifications-card';
import { QuickLinksCard } from '@/components/pulpit/quick-links-card';
import { ChartsSection } from '@/components/pulpit/charts-section';
import { useDashboardData } from '@/components/pulpit/use-dashboard-data';

export default function DashboardPage() {
  const {
    isLoading: isContextLoading,
    employees,
    notifications,
    statsHistory,
    absences,
    fingerprintAppointments,
    isAdmin,
  } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } =
    useEmployees('aktywny');
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dzis');
  const isLoading = isContextLoading || isEmployeesLoading;

  const {
    stats,
    departmentData,
    nationalityData,
    upcomingHiresNote,
    turnoverRate,
    onVacation,
    upcomingVacations,
    recentNotifications,
    unreadCount,
  } = useDashboardData({ activeEmployees, notifications, statsHistory });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // --- Sekcje pulpitu (wspólne dla desktopu i mobile) ---
  const absenceSearchCard = (
    <AbsenceDateSearchCard employees={activeEmployees} absences={absences} />
  );

  const absentSection = (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight">Nieobecni</h2>
        <p className="text-xs text-muted-foreground">
          Dane zapisują się na stałe — historia pozostaje dostępna po zmianie
          miesiąca.
        </p>
      </div>
      <AbsentOverview
        employees={activeEmployees}
        absences={absences}
        isLoading={isLoading}
      />
    </div>
  );

  const vacationsCard = (
    <VacationsCard
      onVacation={onVacation}
      upcomingVacations={upcomingVacations}
    />
  );

  const chartsSection = (
    <ChartsSection
      departmentData={departmentData}
      nationalityData={nationalityData}
    />
  );

  const notificationsCard = (
    <NotificationsCard
      recentNotifications={recentNotifications}
      unreadCount={unreadCount}
    />
  );

  const summarySection = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {notificationsCard}
      <QuickLinksCard isAdmin={isAdmin} />
    </div>
  );

  const mobileTabs = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-2">
        <TabsTrigger value="dzis" className="min-h-[48px] text-xs sm:text-sm">
          Dziś
        </TabsTrigger>
        <TabsTrigger
          value="statystyki"
          className="min-h-[48px] text-xs sm:text-sm"
        >
          Statystyki
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dzis" className="mt-6">
        <div className="space-y-6">
          {absentSection}
          {absenceSearchCard}
          {vacationsCard}
          {notificationsCard}
        </div>
      </TabsContent>
      <TabsContent value="statystyki" className="mt-6">
        <div className="space-y-6">
          {chartsSection}
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="min-h-full flex flex-col w-full space-y-8 pb-8">
      {/* Header */}
      <PageHeader
        title={`Dzień dobry — ${format(new Date(), 'EEEE, d MMMM', {
          locale: pl,
        })}`}
        description="Podsumowanie dnia, kluczowe wskaźniki i nadchodzące zdarzenia."
      />

      <DashboardActionCards
        employees={employees}
        fingerprintAppointments={fingerprintAppointments}
        isLoading={isLoading}
      />

      <KpiCards
        stats={stats}
        upcomingHiresNote={upcomingHiresNote}
        turnoverRate={turnoverRate}
      />

      {isMobile ? (
        /* Mobile: 3 zakładki */
        mobileTabs
      ) : (
        /* Desktop: jeden scroll, wszystkie sekcje */
        <>
          {absentSection}
          {absenceSearchCard}
          {vacationsCard}
          {chartsSection}
          {summarySection}
        </>
      )}
    </div>
  );
}
