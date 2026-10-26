'use client';

import { UserPlus, Users, CalendarPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
        title="Braki na dziś: Potrzeby − Jest (bez przyszłych zwolnień i przyjęć)"
      >
        <UserPlus className="h-4 w-4" />
        Łącznie brakuje dziś: {totalMissingToday}
      </Badge>
      {totalTerminations > 0 && (
        <Badge
          variant="outline"
          className="gap-1.5 border-red-500/60 px-3 py-1.5 text-sm text-red-700 tabular-nums dark:text-red-400"
        >
          <Users className="h-4 w-4" />
          Planowane zwolnienia: {totalTerminations}
        </Badge>
      )}
      <Badge
        variant="outline"
        className="gap-1.5 border-blue-500/60 px-3 py-1.5 text-sm text-blue-700 tabular-nums dark:text-blue-400"
      >
        <CalendarPlus className="h-4 w-4" />
        Zaplanowane przyjęcia: {totalPlanned}
      </Badge>
    </div>
  );
}
