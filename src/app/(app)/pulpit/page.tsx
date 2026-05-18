'use client';

import React, { useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
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
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
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
  ContractCard,
  FingerprintCard,
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/95 p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          <div className="col-span-2">
            <span className="text-sm font-bold text-foreground">{label}</span>
          </div>
          {payload.map((p: any) => (
            <React.Fragment key={p.dataKey}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.stroke || p.payload.fill }}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {p.name}
                </span>
              </div>
              <span className="text-xs font-bold text-right text-foreground">
                {p.value}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const {
    isLoading: isContextLoading,
    fingerprintAppointments,
    notifications,
    statsHistory,
    isAdmin,
  } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } =
    useEmployees('aktywny');
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

  // --- Planning alerts (top 3 each) ---
  const threshold30 = addDays(today, 30);

  const expiringContracts = useMemo(() => {
    return activeEmployees
      .filter((e) => {
        if (!e.contractEndDate) return false;
        const endDate = parseMaybeDate(e.contractEndDate);
        return endDate
          ? startOfDay(endDate) >= today && startOfDay(endDate) <= threshold30
          : false;
      })
      .sort(
        (a, b) =>
          new Date(a.contractEndDate!).getTime() -
          new Date(b.contractEndDate!).getTime()
      )
  }, [activeEmployees, today, threshold30]);

  const upcomingAppointments = useMemo(() => {
    return fingerprintAppointments
      .filter((a) => {
        const apptDate = parseMaybeDate(a.appointmentDate);
        return apptDate
          ? startOfDay(apptDate) >= today && startOfDay(apptDate) <= threshold30
          : false;
      })
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      );
  }, [fingerprintAppointments, today, threshold30]);

  const plannedTerminations = useMemo(() => {
    return activeEmployees
      .filter((e) => {
        if (!e.plannedTerminationDate) return false;
        const terminationDate = parseMaybeDate(e.plannedTerminationDate);
        return terminationDate ? startOfDay(terminationDate) >= today : false;
      })
      .sort(
        (a, b) =>
          new Date(a.plannedTerminationDate!).getTime() -
          new Date(b.plannedTerminationDate!).getTime()
      )
  }, [activeEmployees, today]);

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
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderPieChart = (
    data: any[],
    title: string,
    description: string
  ) => (
    <Card className="flex flex-col border shadow-sm glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-2 sm:p-6">
        <ChartContainer config={{}} className="h-[240px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={55}
                paddingAngle={2}
                cornerRadius={4}
                isAnimationActive={false}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
                <LabelList
                  dataKey="name"
                  position="outside"
                  className="hidden sm:block"
                  formatter={(value: string, entry: any) =>
                    `${entry?.value ?? ''}`
                  }
                />
              </Pie>
              <Legend
                iconType="circle"
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconSize={10}
                wrapperStyle={{ lineHeight: '1.8em', fontSize: '12px' }}
                className="hidden sm:block"
                formatter={(value, entry: any) => (
                  <span className="text-muted-foreground text-xs pl-1 hover:text-primary transition-colors">
                    {value}{' '}
                    <span className="font-bold text-foreground ml-1">
                      {entry.payload?.value}
                    </span>
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
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
            <p className="text-xs text-muted-foreground mt-1">
              {turnoverRate
                ? `${turnoverRate.totalTerminations} zwolnień / średnio ${turnoverRate.avgHeadcount} prac.`
                : 'Brak wystarczających danych'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Planning Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            Alerty planowania
          </h2>
          <Link
            href="/planowanie"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            Zobacz wszystkie <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contracts */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base">
                  Wygające umowy ({expiringContracts.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {expiringContracts.length > 0 ? (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3 pr-4">
                    {expiringContracts.map((employee) => (
                      <ContractCard key={employee.id} employee={employee} />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Brak umów wygających w ciągu 30 dni.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Fingerprints */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">
                  Odciski palców ({upcomingAppointments.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3 pr-4">
                    {upcomingAppointments.map((appointment) => (
                      <FingerprintCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Brak zaplanowanych wizyt w ciągu 30 dni.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Terminations */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                <CardTitle className="text-base">
                  Planowane zwolnienia ({plannedTerminations.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {plannedTerminations.length > 0 ? (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3 pr-4">
                    {plannedTerminations.map((employee) => (
                      <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        type="termination"
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Brak zaplanowanych zwolnień.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vacations */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-base">
                  Urlopy ({onVacation.length + upcomingVacations.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {onVacation.length === 0 && upcomingVacations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Brak pracowników na urlopie i zaplanowanych urlopów.
                </p>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
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

      {/* Notifications + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
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
                        <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                          {format(new Date(notif.createdAt), 'dd.MM.yyyy HH:mm', {
                            locale: pl,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Brak nowych powiadomień.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
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
      </div>
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
