'use client';

import { useMemo } from 'react';
import { startOfDay, endOfDay, isWithinInterval, subDays } from 'date-fns';
import { parseMaybeDate } from '@/lib/date';
import type { AppNotification, Employee, StatsSnapshot } from '@/lib/types';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1) / 0.7)',
  'hsl(var(--chart-2) / 0.7)',
];

export type ChartDatum = {
  name: string;
  value: number;
  percentage: number;
  fill: string;
};

export type DashboardStats = {
  totalActiveEmployees: number;
  upcomingHires: number;
  totalDepartments: number;
  totalJobTitles: number;
};

export type TurnoverRate = {
  rate: string;
  totalTerminations: number;
  avgHeadcount: number;
} | null;

type UseDashboardDataArgs = {
  activeEmployees: Employee[];
  notifications: AppNotification[];
  statsHistory: StatsSnapshot[];
};

export function useDashboardData({ activeEmployees, notifications, statsHistory }: UseDashboardDataArgs) {
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

    // Osoby już zaliczone do "aktywnych", których data rozpoczęcia pracy jest jeszcze w przyszłości
    const upcomingHires = activeEmployees.filter((employee) => {
      const hire = parseMaybeDate(employee.hireDate);
      return hire ? startOfDay(hire) > today : false;
    }).length;

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
        upcomingHires,
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
  }, [activeEmployees, today]);

  // Notatka: ile osób z "aktywnych" zaczyna dopiero od wskazanej daty rozpoczęcia pracy
  const upcomingHiresNote = useMemo(() => {
    const count = stats.upcomingHires;
    if (count <= 0) return null;
    const mod10 = count % 10;
    const mod100 = count % 100;
    const few = mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20);
    const verb = count === 1 || !few ? 'zaczyna' : 'zaczynają';
    const noun =
      count === 1
        ? '1 osoba'
        : few
          ? `${count} osoby`
          : `${count} osób`;
    return `W tym ${noun} ${verb} dopiero od wskazanej w firmie daty rozpoczęcia pracy`;
  }, [stats.upcomingHires]);

  // --- Turnover ---
  const turnoverRate: TurnoverRate = useMemo(() => {
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

  return {
    stats,
    departmentData,
    nationalityData,
    upcomingHiresNote,
    turnoverRate,
    onVacation,
    upcomingVacations,
    recentNotifications,
    unreadCount,
  };
}
