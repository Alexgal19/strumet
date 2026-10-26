'use client';

import type { RecruitmentPosition } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import { formatHeadcount } from './format';

export const RecruitmentDepartmentStats = ({
  jobTitleStats,
  departmentHeadcount,
  positions,
}: {
  jobTitleStats: { jobTitle: string; count: number; toRecruit: number; terminations: number }[];
  departmentHeadcount: number;
  positions: RecruitmentPosition[];
}) => {
  if (jobTitleStats.length === 0) return null;

  return (
    <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Briefcase className="h-3.5 w-3.5 shrink-0" />
        Stanowiska w dziale ({departmentHeadcount} os.):
      </p>
      <div className="space-y-1">
        {jobTitleStats.map(s => (
          <div
            key={s.jobTitle}
            className={[
              'flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs',
              positions.some(p => p.jobTitle === s.jobTitle) && 'font-semibold text-foreground',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span>
              {s.jobTitle} — {formatHeadcount(s.count)}
              {s.terminations > 0 && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">
                  (zwalnia się: {s.terminations})
                </span>
              )}
            </span>
            {s.toRecruit > 0 && (
              <Badge variant="destructive" className="tabular-nums">
                Rekrutacja: {s.toRecruit}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
