'use client';

import { UserPlus, Users, CalendarPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { t } from '@/lib/i18n';
export function DemandSummary({
  totalMissingToday,
  totalTerminations,
  totalPlanned,
}: {
  totalMissingToday: number;
  totalTerminations: number;
  totalPlanned: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="secondary"
        className="gap-1.5 px-3 py-1.5 text-sm tabular-nums"
        title={t('schedule.todaySGapsNeededHave')}
      >
        <UserPlus className="h-4 w-4" />
        {t('schedule.totalShortTodayCount', { count: totalMissingToday })}
      </Badge>
      {totalTerminations > 0 && (
        <Badge
          variant="outline"
          className="gap-1.5 border-red-500/60 px-3 py-1.5 text-sm text-red-700 tabular-nums dark:text-red-400"
        >
          <Users className="h-4 w-4" />
          {t('schedule.plannedTerminationsCount', { count: totalTerminations })}
        </Badge>
      )}
      <Badge
        variant="outline"
        className="gap-1.5 border-blue-500/60 px-3 py-1.5 text-sm text-blue-700 tabular-nums dark:text-blue-400"
      >
        <CalendarPlus className="h-4 w-4" />
        {t('schedule.plannedArrivalsCount', { count: totalPlanned })}
      </Badge>
    </div>
  );
}
