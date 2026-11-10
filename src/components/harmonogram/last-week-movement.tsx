'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { getDateLocale } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, UserMinus, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatYmdPl } from '@/lib/date';
import {
  dayRange,
  summarizeRange,
  weekRange,
  type MovementPerson,
  type MovementSummary,
} from '@/lib/weekly-movement';

import { t } from '@/lib/i18n';
type Mode = 'day' | 'week';

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
  const tone$ = TONES[tone];
  return (
    <section className={`min-w-0 rounded-lg border border-l-4 bg-card p-4 text-sm text-foreground shadow-sm ${tone$.border}`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <Icon className={`h-5 w-5 shrink-0 ${tone$.icon}`} />
          {title}
        </h3>
        <span className={`text-3xl font-bold tabular-nums leading-none ${tone$.number}`}>{summary.total}</span>
      </header>
      {summary.total === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {summary.groups.map(g => (
            <li key={g.department} className="rounded-md bg-muted/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2 font-semibold">
                <span className="min-w-0 [overflow-wrap:anywhere]">{g.department}</span>
                <span className="shrink-0 tabular-nums">{t('schedule.countPpl', { count: g.total })}</span>
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

function periodLabel(mode: Mode, back: number, fromYmd: string, toYmd: string): string {
  if (mode === 'day') {
    const name = back === 0 ? t('schedule.today2') : back === 1 ? t('schedule.yesterday') : format(parseISO(fromYmd), 'EEEE', { locale: getDateLocale() });
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return `${capitalized}: ${formatYmdPl(fromYmd)}`;
  }
  const name = back === 0 ? t('schedule.thisWeek') : back === 1 ? t('schedule.lastWeek') : t('schedule.week');
  return `${name}: ${formatYmdPl(fromYmd)} – ${formatYmdPl(toYmd)}`;
}

/**
 * Okienka „Zatrudnieni / Odeszli” z wyborem okresu: dzień (domyślnie wczoraj) albo tydzień pon–niedz
 * (domyślnie zeszły), ze strzałkami do przechodzenia wstecz i do przodu.
 */
export function LastWeekMovement({ employees, hires }: { employees: MovementPerson[]; hires?: MovementPerson[] }) {
  const [mode, setMode] = useState<Mode>('week');
  const [back, setBack] = useState(1); // ile dni/tygodni wstecz (0 = dziś / ten tydzień)
  const todayYmd = format(new Date(), 'yyyy-MM-dd');

  const movement = useMemo(() => {
    const now = new Date();
    const range = mode === 'day' ? dayRange(now, back) : weekRange(now, back);
    return summarizeRange(employees, hires, range, now);
    // todayYmd: przeliczenie po północy
  }, [employees, hires, mode, back, todayYmd]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setBack(1);
  };

  const label = periodLabel(mode, back, movement.fromYmd, movement.toYmd);
  const periodWord = mode === 'day' ? t('schedule.onThisDay') : t('schedule.thisWeek2');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-border" role="group" aria-label={t('schedule.period')}>
          <Button
            type="button"
            size="sm"
            variant={mode === 'day' ? 'default' : 'ghost'}
            className="rounded-none border-0"
            aria-pressed={mode === 'day'}
            onClick={() => switchMode('day')}
          >
            {t('schedule.day')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'week' ? 'default' : 'ghost'}
            className="rounded-none border-0"
            aria-pressed={mode === 'week'}
            onClick={() => switchMode('week')}
          >
            {t('schedule.week')}
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9"
            aria-label={mode === 'day' ? t('schedule.previousDay') : t('schedule.previousWeek')}
            onClick={() => setBack(b => b + 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9"
            aria-label={mode === 'day' ? t('schedule.nextDay') : t('schedule.nextWeek')}
            disabled={back === 0}
            onClick={() => setBack(b => Math.max(0, b - 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm font-semibold text-foreground" aria-live="polite">{label}</p>
      </div>
      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
        <MovementCard
          title={t('schedule.hired')}
          summary={movement.hired}
          tone="emerald"
          icon={UserPlus}
          emptyText={t('schedule.noOneWasHiredPeriod', { period: periodWord })}
        />
        <MovementCard
          title={t('schedule.left')}
          summary={movement.left}
          tone="red"
          icon={UserMinus}
          emptyText={t('schedule.noOneLeftPeriod', { period: periodWord })}
        />
      </div>
    </div>
  );
}
