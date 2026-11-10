'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, Briefcase, TrendingUp, CalendarClock } from 'lucide-react';
import type { DashboardStats, TurnoverRate } from './use-dashboard-data';
import { useI18n } from '@/lib/i18n';

type KpiCardsProps = {
  stats: DashboardStats;
  upcomingHiresNote: string | null;
  turnoverRate: TurnoverRate;
};

export function KpiCards({ stats, upcomingHiresNote, turnoverRate }: KpiCardsProps) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Card className="glass-card border-0 min-w-0">
        <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 px-3 pb-1 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm leading-tight font-medium sm:text-base">
            {t('dashboard.activeEmployees')}
          </CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="text-2xl font-bold sm:text-3xl text-gradient-primary">
            {stats.totalActiveEmployees}
          </div>
          <p className="hidden text-xs text-muted-foreground mt-1 sm:block">
            {t('dashboard.totalEmployees')}
          </p>
          {upcomingHiresNote && (
            <p className="text-xs leading-tight mt-1.5 text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 mt-px shrink-0" />
              <span><span className="sm:hidden">{t('dashboard.laterStart', { count: stats.upcomingHires })}</span><span className="hidden sm:inline">{upcomingHiresNote}</span></span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-0 min-w-0">
        <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 px-3 pb-1 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm leading-tight font-medium sm:text-base">
            {t('dashboard.departments')}
          </CardTitle>
          <Building className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="text-2xl font-bold sm:text-3xl">{stats.totalDepartments}</div>
          <p className="hidden text-xs text-muted-foreground mt-1 sm:block">
            {t('dashboard.departmentsDesc')}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 min-w-0">
        <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 px-3 pb-1 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm leading-tight font-medium sm:text-base">
            {t('dashboard.jobTitles')}
          </CardTitle>
          <Briefcase className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="text-2xl font-bold sm:text-3xl">{stats.totalJobTitles}</div>
          <p className="hidden text-xs text-muted-foreground mt-1 sm:block">
            {t('dashboard.jobTitlesDesc')}
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 min-w-0">
        <CardHeader className="flex flex-row items-start justify-between gap-1 space-y-0 px-3 pb-1 pt-3 sm:px-6 sm:pt-6 sm:pb-2">
          <CardTitle className="text-sm leading-tight font-medium sm:text-base">
            {t('dashboard.turnover')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="text-2xl font-bold sm:text-3xl">
            {turnoverRate ? `${turnoverRate.rate}%` : '—'}
          </div>
          <p className="hidden text-xs text-muted-foreground mt-1 line-clamp-1 sm:block">
            {turnoverRate
              ? t('dashboard.turnoverDetail', { terminations: turnoverRate.totalTerminations, avg: turnoverRate.avgHeadcount })
              : t('dashboard.notEnoughData')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
