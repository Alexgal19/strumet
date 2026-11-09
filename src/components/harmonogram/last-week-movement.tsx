'use client';

import { UserMinus, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatYmdPl } from '@/lib/date';
import type { MovementSummary, WeeklyMovement } from '@/lib/weekly-movement';

const TONES = {
  emerald: { border: 'border-l-emerald-500', number: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-600 dark:text-emerald-400' },
  red: { border: 'border-l-red-500', number: 'text-red-700 dark:text-red-400', icon: 'text-red-600 dark:text-red-400' },
} as const;

function MovementCard({ title, summary, tone, icon: Icon, emptyText }: {
  title: string;
  summary: MovementSummary;
  tone: keyof typeof TONES;
  icon: LucideIcon;
  emptyText: string;
}) {
  const t = TONES[tone];
  return (
    <section className={`min-w-0 rounded-lg border border-l-4 bg-card p-4 text-sm text-foreground shadow-sm ${t.border}`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <Icon className={`h-5 w-5 shrink-0 ${t.icon}`} />
          {title}
        </h3>
        <span className={`text-3xl font-bold tabular-nums leading-none ${t.number}`}>{summary.total}</span>
      </header>
      {summary.total === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {summary.groups.map(g => (
            <li key={g.department} className="rounded-md bg-muted/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2 font-semibold">
                <span className="min-w-0 [overflow-wrap:anywhere]">{g.department}</span>
                <span className="shrink-0 tabular-nums">{g.total} os.</span>
              </div>
              <ul className="mt-1 flex flex-col gap-0.5">
                {g.jobs.map(j => (
                  <li key={j.jobTitle} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 [overflow-wrap:anywhere]">• {j.jobTitle}</span>
                    <span className="shrink-0 tabular-nums">{j.count}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Dwa okienka: ilu zatrudniono i ilu odeszło w poprzednim tygodniu, z podziałem na działy i stanowiska. */
export function LastWeekMovement({ movement }: { movement: WeeklyMovement }) {
  const range = `${formatYmdPl(movement.fromYmd)} – ${formatYmdPl(movement.toYmd)}`;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-foreground">Zeszły tydzień: {range}</p>
      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
        <MovementCard
          title="Zatrudnieni"
          summary={movement.hired}
          tone="emerald"
          icon={UserPlus}
          emptyText="Nikt nie został zatrudniony w zeszłym tygodniu."
        />
        <MovementCard
          title="Odeszli"
          summary={movement.left}
          tone="red"
          icon={UserMinus}
          emptyText="Nikt nie odszedł w zeszłym tygodniu."
        />
      </div>
    </div>
  );
}
