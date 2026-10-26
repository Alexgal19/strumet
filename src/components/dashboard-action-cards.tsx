'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Fingerprint,
  FileClock,
  UserPlus,
  UserX,
} from 'lucide-react';

import { getDashboardActions } from '@/lib/dashboard-actions';
import { buildHarmonogram, type HarmonogramData } from '@/lib/harmonogram';
import type { Employee, FingerprintAppointment } from '@/lib/types';

interface DashboardActionCardsProps {
  employees: Employee[];
  fingerprintAppointments: FingerprintAppointment[];
  isLoading?: boolean;
}

interface ShortageSummary {
  missing: number;
  positions: number;
}

const cardClass =
  'glass-card group flex min-w-0 flex-col justify-between gap-3 rounded-3xl p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function namesPreview(items: { fullName: string }[]): string {
  if (items.length === 0) return 'Brak w tym tygodniu';
  const preview = items.slice(0, 2).map((item) => item.fullName).join(', ');
  return items.length > 2 ? `${preview} +${items.length - 2}` : preview;
}

export function DashboardActionCards({
  employees,
  fingerprintAppointments,
  isLoading = false,
}: DashboardActionCardsProps) {
  const actions = useMemo(
    () => getDashboardActions({ employees, appointments: fingerprintAppointments }),
    [employees, fingerprintAppointments]
  );

  const [shortage, setShortage] = useState<ShortageSummary | null>(null);
  const [shortageFailed, setShortageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/harmonogram', { cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<HarmonogramData>;
      })
      .then((data) => {
        const summary = buildHarmonogram(data).rows.reduce<ShortageSummary>(
          (acc, row) => {
            row.positions.forEach((position) => {
              const missing = Math.max(0, position.potrzeby - position.obecnie);
              if (missing > 0) {
                acc.missing += missing;
                acc.positions += 1;
              }
            });
            return acc;
          },
          { missing: 0, positions: 0 }
        );
        setShortage(summary);
      })
      .catch(() => {
        if (!controller.signal.aborted) setShortageFailed(true);
      });
    return () => controller.abort();
  }, []);

  const shortageValue = isLoading ? '—' : shortage ? String(shortage.missing) : '—';
  const shortageHint = isLoading
    ? 'Wczytywanie…'
    : shortageFailed
      ? 'Otwórz Obsadę, aby zobaczyć braki'
      : shortage === null
        ? 'Liczę braki…'
        : shortage.missing === 0
          ? 'Komplet obsady'
          : `${shortage.positions} ${plural(shortage.positions, 'stanowisko', 'stanowiska', 'stanowisk')} bez pełnej obsady`;
  const hasShortage = !isLoading && !!shortage && shortage.missing > 0;

  const terminationsCount = isLoading ? '—' : String(actions.terminationsThisWeek.length);
  const hiresCount = isLoading ? '—' : String(actions.hiresThisWeek.length);

  const reminderRows = [
    {
      href: '/terminy?tab=umowy',
      label: 'Umowy do 30 dni',
      count: actions.expiringContracts.length,
      icon: FileClock,
    },
    {
      href: '/terminy?tab=odciski',
      label: 'Odciski palców',
      count: actions.upcomingAppointments.length,
      icon: Fingerprint,
    },
    {
      href: '/terminy?tab=zwolnienia',
      label: 'Zaplanowane zwolnienia',
      count: actions.plannedTerminations.length,
      icon: CalendarClock,
    },
  ];
  const remindersTotal = reminderRows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="space-y-3" aria-labelledby="dashboard-actions-title">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="dashboard-actions-title" className="text-xl font-bold tracking-tight">
          Wymaga działania
        </h2>
        <p className="text-xs text-muted-foreground">
          Kliknij kafel, aby otworzyć listę z włączonym filtrem.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/harmonogram?braki=1"
          className={cardClass}
          aria-label={`Braki dziś: ${shortageValue}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">Braki dziś</span>
            <AlertTriangle
              className={hasShortage ? 'h-5 w-5 shrink-0 text-destructive' : 'h-5 w-5 shrink-0 text-emerald-600'}
            />
          </div>
          <div>
            <span
              className={
                hasShortage
                  ? 'text-3xl font-bold tabular-nums text-destructive'
                  : 'text-3xl font-bold tabular-nums'
              }
            >
              {shortageValue}
            </span>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">{shortageHint}</p>
          </div>
        </Link>

        <Link
          href="/terminy?tab=zwolnienia"
          className={cardClass}
          aria-label={`Zwolnienia w tym tygodniu: ${terminationsCount}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Zwolnienia w tym tygodniu
            </span>
            <UserX className="h-5 w-5 shrink-0 text-amber-600" />
          </div>
          <div>
            <span className="text-3xl font-bold tabular-nums">{terminationsCount}</span>
            <p className="mt-1 truncate text-xs leading-snug text-muted-foreground">
              {isLoading ? 'Wczytywanie…' : namesPreview(actions.terminationsThisWeek)}
            </p>
          </div>
        </Link>

        <Link
          href="/aktywni?zatrudnienie=tydzien"
          className={cardClass}
          aria-label={`Przyjęcia w tym tygodniu: ${hiresCount}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Przyjęcia w tym tygodniu
            </span>
            <UserPlus className="h-5 w-5 shrink-0 text-emerald-600" />
          </div>
          <div>
            <span className="text-3xl font-bold tabular-nums">{hiresCount}</span>
            <p className="mt-1 truncate text-xs leading-snug text-muted-foreground">
              {isLoading ? 'Wczytywanie…' : namesPreview(actions.hiresThisWeek)}
            </p>
          </div>
        </Link>

        <div className={cardClass}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">Przypomnienia</span>
            <Bell className="h-5 w-5 shrink-0 text-primary" />
          </div>
          <ul className="space-y-1">
            {reminderRows.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.href}>
                  <Link
                    href={row.href}
                    className="-mx-2 flex min-h-9 items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{row.label}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {isLoading ? '—' : row.count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Łącznie {isLoading ? '—' : remindersTotal} w najbliższych 30 dniach
          </p>
        </div>
      </div>
    </section>
  );
}
