'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useIsMobile } from '@/hooks/use-mobile';
import { AbsentOverview } from '@/components/absent-overview';
import { AbsenceDateSearchCard } from '@/components/absence-date-search-card';
import { parseMaybeDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import {
  Users,
  Building,
  Briefcase,
  TrendingUp,
  CalendarClock,
  ArrowRight,
  Bell,
  LayoutDashboard,
  BarChart3,
  Settings,
  UserX,
  Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const DashboardPieChart = dynamic(() => import('@/components/dashboard-pie-chart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] w-full items-center justify-center rounded-xl border border-border-subtle bg-background-secondary p-6">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});
import {
  format,
  startOfDay,
  endOfDay,
  addDays,
  isWithinInterval,
  subDays,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  EmployeeCard,
} from '@/components/planning-cards';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1) / 0.7)',
  'hsl(var(--chart-2) / 0.7)',
];

// CustomTooltip moved to dashboard-pie-chart component

export default function DashboardPage() {
  const {
    isLoading: isContextLoading,
    notifications,
    statsHistory,
    absences,
    isAdmin,
  } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } =
    useEmployees('aktywny');
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dzis');
  const isLoading = isContextLoading || isEmployeesLoading;

  const today = useMemo(() => startOfDay(new Date()), []);

  // --- Stats ---
  const { stats, departmentData, nationalityData } = useMemo(() => {
    const deptCounts: { [key: string]: number } = {};
    const nationCounts: { [key: string]: number } = {};

    activeEmployees.forEach((employee) => {
      if (employee.department)
        deptCounts[employee.department] =
          (deptCounts[employee.department] || 0) + 1;
      if (employee.nationality)
        nationCounts[employee.nationality] =
          (nationCounts[employee.nationality] || 0) + 1;
    });

    const totalActiveEmployees = activeEmployees.length;

    const formatData = (counts: { [key: string]: number }) =>
      Object.entries(counts)
        .map(([name, value], index) => ({
          name,
          value,
          percentage:
            totalActiveEmployees > 0
              ? (value / totalActiveEmployees) * 100
              : 0,
          fill: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);

    return {
      stats: {
        totalActiveEmployees,
        totalDepartments: Object.keys(deptCounts).length,
        totalJobTitles: Object.keys(
          activeEmployees.reduce((acc, e) => {
            if (e.jobTitle) acc[e.jobTitle] = true;
            return acc;
          }, {} as Record<string, boolean>)
        ).length,
      },
      departmentData: formatData(deptCounts),
      nationalityData: formatData(nationCounts),
    };
  }, [activeEmployees]);

  // --- Turnover ---
  const turnoverRate = useMemo(() => {
    if (!Array.isArray(statsHistory) || statsHistory.length < 2) return null;
    const thirtyDaysAgo = subDays(today, 30);
    const data = statsHistory.filter((s) => {
      const d = parseMaybeDate(s.id);
      return d ? d >= thirtyDaysAgo : false;
    });
    if (data.length === 0) return null;
    const totalTerminations = data.reduce(
      (sum, s) => sum + (s.terminations || 0),
      0
    );
    const avgHeadcount =
      data.reduce((sum, s) => sum + (s.totalActive || 0), 0) / data.length;
    if (avgHeadcount === 0) return null;
    return {
      rate: ((totalTerminations / avgHeadcount) * 100).toFixed(1),
      totalTerminations,
      avgHeadcount: Math.round(avgHeadcount),
    };
  }, [statsHistory, today]);

  const onVacation = useMemo(() => {
    return activeEmployees
      .filter((e) => {
        if (!e.vacationStartDate || !e.vacationEndDate) return false;
        const start = parseMaybeDate(e.vacationStartDate);
        const end = parseMaybeDate(e.vacationEndDate);
        if (!start || !end) return false;
        return isWithinInterval(today, {
          start: startOfDay(start),
          end: endOfDay(end),
        });
      })
      .sort(
        (a, b) =>
          new Date(a.vacationEndDate!).getTime() -
          new Date(b.vacationEndDate!).getTime()
      );
  }, [activeEmployees, today]);

  const upcomingVacations = useMemo(() => {
    return activeEmployees
      .filter((e) => {
        if (!e.vacationStartDate) return false;
        const startDate = parseMaybeDate(e.vacationStartDate);
        if (!startDate) return false;
        return (
          startOfDay(startDate) >= today &&
          !onVacation.some((onVac) => onVac.id === e.id)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.vacationStartDate!).getTime() -
          new Date(b.vacationStartDate!).getTime()
      );
  }, [activeEmployees, today, onVacation]);

  // --- Notifications (last 5) ---
  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-full w-full space-y-8 pb-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[118px] rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[360px] rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[360px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-[360px] rounded-3xl" />
        </div>
      </div>
    );
  }

  const renderPieChart = (
    data: any[],
    title: string,
    description: string
  ) => (
    <DashboardPieChart
      data={data}
      title={title}
      description={description}
    />
  );

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

  const vacationItems = [
    ...onVacation.map((e) => ({
      key: `vac-${e.id}`,
      employee: e,
      type: 'vacation' as const,
    })),
    ...upcomingVacations.map((e) => ({
      key: `upv-${e.id}`,
      employee: e,
      type: 'vacation-planned' as const,
    })),
  ];

  const vacationsCard = (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
          <CardTitle className="text-base">
            Urlopy ({onVacation.length + upcomingVacations.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {vacationItems.length > 0 ? (
          <>
            <div className="hidden lg:block">
              <ScrollArea className="h-[280px]">
                <div className="space-y-3 pr-4">
                  {onVacation.map((employee) => (
                    <EmployeeCard
                      key={`vac-${employee.id}`}
                      employee={employee}
                      type="vacation"
                    />
                  ))}
                  {upcomingVacations.map((employee) => (
                    <EmployeeCard
                      key={`upv-${employee.id}`}
                      employee={employee}
                      type="vacation-planned"
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:hidden">
              <ExpandableList
                items={vacationItems}
                renderItem={(item) => (
                  <EmployeeCard
                    key={item.key}
                    employee={item.employee}
                    type={item.type}
                  />
                )}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Brak pracowników na urlopie i zaplanowanych urlopów.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );


  const chartsSection = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {renderPieChart(
        departmentData,
        'Rozkład wg Działów',
        'Liczba pracowników w poszczególnych działach.'
      )}
      {renderPieChart(
        nationalityData,
        'Rozkład wg Narodowości',
        'Struktura pracowników z podziałem na narodowości.'
      )}
    </div>
  );

  const notificationsCard = (
    <Card className="glass-card lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Powiadomienia</CardTitle>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {unreadCount} nowych
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentNotifications.length > 0 ? (
          <>
            <div className="hidden lg:block">
              <ScrollArea className="h-[280px]">
                <div className="space-y-3 pr-4">
                  {recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                        !notif.read
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card/50 border-border/50'
                      )}
                    >
                      {!notif.read && (
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1.5">
                          {format(new Date(notif.createdAt), 'dd.MM.yyyy HH:mm', {
                            locale: pl,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:hidden">
              <ExpandableList
                items={recentNotifications}
                renderItem={(notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                      !notif.read
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card/50 border-border/50'
                    )}
                  >
                    {!notif.read && (
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1.5">
                        {format(new Date(notif.createdAt), 'dd.MM.yyyy HH:mm', {
                          locale: pl,
                        })}
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Brak nowych powiadomień.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const quickLinksCard = (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base">Szybkie linki</CardTitle>
        <CardDescription>
          Przejdź do najczęściej używanych sekcji.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <QuickLink
          href="/aktywni"
          icon={<Users className="h-4 w-4" />}
          label="Pracownicy aktywni"
        />
        <QuickLink
          href="/statystyki"
          icon={<BarChart3 className="h-4 w-4" />}
          label="Statystyki"
        />
        <QuickLink
          href="/planowanie"
          icon={<CalendarClock className="h-4 w-4" />}
          label="Planowanie"
        />
        {isAdmin && (
          <QuickLink
            href="/konfiguracja"
            icon={<Settings className="h-4 w-4" />}
            label="Konfiguracja"
          />
        )}
      </CardContent>
    </Card>
  );

  const summarySection = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {notificationsCard}
      {quickLinksCard}
    </div>
  );

  const mobileTabs = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-2">
        <TabsTrigger value="dzis" className="min-h-[44px] text-xs sm:text-sm">
          Dziś
        </TabsTrigger>
        <TabsTrigger
          value="statystyki"
          className="min-h-[44px] text-xs sm:text-sm"
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
          {quickLinksCard}
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

      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-0 p-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Aktywni pracownicy
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gradient-primary">
              {stats.totalActiveEmployees}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Całkowita liczba pracowników
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 p-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Liczba działów
            </CardTitle>
            <Building className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktywne działy w firmie
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 p-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Liczba stanowisk
            </CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalJobTitles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Liczba unikalnych stanowisk
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 p-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Rotacja miesięczna
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {turnoverRate ? `${turnoverRate.rate}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {turnoverRate
                ? `${turnoverRate.totalTerminations} zwolnień / średnio ${turnoverRate.avgHeadcount} prac.`
                : 'Brak wystarczających danych'}
            </p>
          </CardContent>
        </Card>
      </div>

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

function ExpandableList<T>({
  items,
  renderItem,
  limit = 3,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > limit;
  const visibleItems = expanded || !hasMore ? items : items.slice(0, limit);

  return (
    <div>
      <div className="space-y-3">
        {visibleItems.map((item, index) => renderItem(item, index))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 w-full min-h-[44px] rounded-xl text-sm text-primary hover:bg-primary/5"
        >
          {expanded ? 'Pokaż mniej' : `Pokaż więcej (+${items.length - limit})`}
        </Button>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} prefetch>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-primary/5"
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
        <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
      </Button>
    </Link>
  );
}
