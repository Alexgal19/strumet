'use client';

import { Badge } from '@/components/ui/badge';
import { Briefcase, CalendarPlus, UserPlus, Users } from 'lucide-react';

export const RecruitmentStatsBar = ({
  recruitmentsCount,
  totalPositions,
  totalToRecruit,
  totalPlanned,
}: {
  recruitmentsCount: number;
  totalPositions: number;
  totalToRecruit: number;
  totalPlanned: number;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
        <Users className="h-4 w-4" />
        Zapotrzebowania: {recruitmentsCount}
      </Badge>
      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
        <Briefcase className="h-4 w-4" />
        Stanowiska: {totalPositions}
      </Badge>
      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
        <UserPlus className="h-4 w-4" />
        Do rekrutacji łącznie: {totalToRecruit}
      </Badge>
      <Badge
        variant="outline"
        className="gap-1.5 border-blue-500/60 px-3 py-1.5 text-sm text-blue-700 tabular-nums dark:text-blue-400"
      >
        <CalendarPlus className="h-4 w-4" />
        Zaplanowane przyjęcia: {totalPlanned}
      </Badge>
    </div>
  );
};
