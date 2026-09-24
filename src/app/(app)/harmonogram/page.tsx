'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Briefcase, UserPlus, CalendarPlus } from 'lucide-react';
import { startOfDay, format } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HarmonogramView } from '@/components/harmonogram-view';
import type { HarmonogramData } from '@/lib/harmonogram';

export default function PlanowaniePage() {
  const { isLoading: isAuthLoading } = useAppContext();
  if (isAuthLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  // /harmonogram zawsze otwiera harmonogram obsady — dla gości i zalogowanych
  return <PublicPlanowanieView />;
}

/** Widok publiczny (bez logowania): tylko do odczytu — zapotrzebowania + harmonogram */
function PublicPlanowanieView() {
  const [data, setData] = useState<HarmonogramData | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'harmonogram' | 'zapotrzebowania'>('harmonogram');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/harmonogram', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(json => {
        if (!cancelled) setData(json as HarmonogramData);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {error ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nie udało się pobrać danych harmonogramu.
        </div>
      ) : !data ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Obsada"
            description="Zaplanuj, ile osób trzeba zrekrutować do każdego działu i kiedy mają przyjść."
          />

          <div className="flex flex-col gap-4 overflow-y-auto pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-border">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'harmonogram' ? 'default' : 'ghost'}
                  className="rounded-none border-0"
                  onClick={() => setView('harmonogram')}
                >
                  Harmonogram obsady
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'zapotrzebowania' ? 'default' : 'ghost'}
                  className="rounded-none border-0"
                  onClick={() => setView('zapotrzebowania')}
                >
                  Zapotrzebowania
                </Button>
              </div>
            </div>

            {view === 'harmonogram' ? (
              <HarmonogramView data={data} showExport />
            ) : (
              <PublicZapotrzebowaniaView data={data} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

type JobTitleStat = { jobTitle: string; count: number; toRecruit: number; terminations: number };

function usePublicZapotrzebowaniaStats(data: HarmonogramData) {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const headcountByDept = new Map<string, number>();
    const headcountByDeptJob = new Map<string, number>();
    const terminationsByDeptJob = new Map<string, number>();
    const jobTitlesByDept = new Map<string, JobTitleStat[]>();
    const ensure = (dept: string) => {
      let entries = jobTitlesByDept.get(dept);
      if (!entries) {
        entries = [];
        jobTitlesByDept.set(dept, entries);
      }
      return entries;
    };
    const isPlannedTerm = (date?: string) => {
      const planned = date ? startOfDay(new Date(date)) : null;
      return (
        !!planned && !Number.isNaN(planned.getTime()) && planned.getTime() >= today.getTime()
      );
    };
    data.employees.forEach(e => {
      headcountByDept.set(e.department, (headcountByDept.get(e.department) ?? 0) + 1);
      const key = `${e.department}|${e.jobTitle}`;
      headcountByDeptJob.set(key, (headcountByDeptJob.get(key) ?? 0) + 1);
      const terminating = isPlannedTerm(e.plannedTerminationDate);
      if (terminating) terminationsByDeptJob.set(key, (terminationsByDeptJob.get(key) ?? 0) + 1);
      if (!e.department || !e.jobTitle) return;
      const entries = ensure(e.department);
      const existing = entries.find(x => x.jobTitle === e.jobTitle);
      if (existing) {
        existing.count += 1;
        if (terminating) existing.terminations += 1;
      } else {
        entries.push({
          jobTitle: e.jobTitle,
          count: 1,
          toRecruit: 0,
          terminations: terminating ? 1 : 0,
        });
      }
    });
    data.recruitments.forEach(r => {
      if (!r.department) return;
      r.positions.forEach(p => {
        const entries = ensure(r.department);
        const jobTitle = p.jobTitle?.trim() || '—';
        const existing = entries.find(x => x.jobTitle === jobTitle);
        if (existing) existing.toRecruit += Number(p.toRecruit) || 0;
        else
          entries.push({
            jobTitle,
            count: 0,
            toRecruit: Number(p.toRecruit) || 0,
            terminations: 0,
          });
      });
    });
    jobTitlesByDept.forEach(entries =>
      entries.sort((a, b) => b.count - a.count || a.jobTitle.localeCompare(b.jobTitle, 'pl'))
    );
    return { headcountByDept, headcountByDeptJob, terminationsByDeptJob, jobTitlesByDept };
  }, [data]);
}

function PublicZapotrzebowaniaView({ data }: { data: HarmonogramData }) {
  const { headcountByDept, headcountByDeptJob, terminationsByDeptJob, jobTitlesByDept } =
    usePublicZapotrzebowaniaStats(data);

  const totalToRecruit = data.recruitments.reduce(
    (sum, r) => sum + r.positions.reduce((s, p) => s + (Number(p.toRecruit) || 0), 0),
    0
  );
  const totalPositions = data.recruitments.reduce((s, r) => s + r.positions.length, 0);
  const totalPlanned = data.recruitments.reduce(
    (sum, r) => sum + r.arrivals.reduce((s, a) => s + (Number(a.count) || 0), 0),
    0
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <Users className="h-4 w-4" />
          Zapotrzebowania: {data.recruitments.length}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {[...data.recruitments]
          .sort((a, b) => a.department.localeCompare(b.department, 'pl'))
          .map(order => {
            const positions = order.positions;
            const departmentHeadcount = headcountByDept.get(order.department) ?? 0;
            const sumToRecruit = positions.reduce(
              (s, p) => s + (Number(p.toRecruit) || 0),
              0
            );
            const plannedTotal = order.arrivals.reduce(
              (s, a) => s + (Number(a.count) || 0),
              0
            );
            const missing = Math.max(0, sumToRecruit - plannedTotal);
            const surplus = Math.max(0, plannedTotal - sumToRecruit);
            const sumZwalnia = positions.reduce(
              (s, p) =>
                s + (terminationsByDeptJob.get(`${order.department}|${p.jobTitle}`) ?? 0),
              0
            );
            const sumPotrzeby = positions.reduce((s, p) => {
              const obecnie =
                headcountByDeptJob.get(`${order.department}|${p.jobTitle}`) ?? 0;
              const zwalnia =
                terminationsByDeptJob.get(`${order.department}|${p.jobTitle}`) ?? 0;
              return s + Math.max(0, obecnie + (Number(p.toRecruit) || 0) - zwalnia);
            }, 0);
            const jobTitleStats = jobTitlesByDept.get(order.department) ?? [];

            return (
              <Card key={order.department}>
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CardTitle className="text-base truncate">{order.department}</CardTitle>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {positions.length} {positions.length === 1 ? 'stanowisko' : 'stanowiska'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <Badge variant="outline" className="tabular-nums text-xs">
                        Na dziale: {departmentHeadcount} os.
                      </Badge>
                      {sumZwalnia > 0 && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/60 text-amber-700 tabular-nums dark:text-amber-400 text-xs"
                        >
                          Zwalnia się: −{sumZwalnia}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400 text-xs"
                      >
                        Potrzeby: {sumPotrzeby} os.
                      </Badge>
                      {missing > 0 && (
                        <Badge variant="destructive" className="tabular-nums text-xs">
                          Brakuje: {missing}
                        </Badge>
                      )}
                      <Badge variant="outline" className="tabular-nums text-xs">
                        Rekrutacja: {sumToRecruit} os.
                      </Badge>
                      {surplus > 0 && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/60 text-amber-700 tabular-nums dark:text-amber-400 text-xs"
                        >
                          Nadwyżka: +{surplus}
                        </Badge>
                      )}
                      {plannedTotal > 0 && missing === 0 && surplus === 0 && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400 text-xs"
                        >
                          Komplet: {plannedTotal}/{sumToRecruit}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Stanowiska i liczba osób:
                    </p>
                    {positions.length === 0 ? (
                      <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
                        Brak stanowisk.
                      </p>
                    ) : (
                      positions.map((p, i) => {
                        const jobTitle = p.jobTitle?.trim() || '—';
                        const obecnie =
                          headcountByDeptJob.get(`${order.department}|${p.jobTitle}`) ?? 0;
                        const zwalnia =
                          terminationsByDeptJob.get(`${order.department}|${p.jobTitle}`) ?? 0;
                        const potrzeby = Math.max(
                          0,
                          obecnie + (Number(p.toRecruit) || 0) - zwalnia
                        );
                        return (
                          <div
                            key={`${p.jobTitle}-${i}`}
                            className="flex flex-wrap items-center gap-2 rounded-md border bg-background/50 px-3 py-2 text-sm"
                          >
                            <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" />
                            <span>{jobTitle}</span>
                            <span className="tabular-nums font-medium">
                              {Number(p.toRecruit) || 0} os.
                            </span>
                            <div className="w-full sm:w-auto sm:ml-auto text-xs text-muted-foreground">
                              Potrzeby:{' '}
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {potrzeby} os.
                              </span>{' '}
                              (jest {obecnie}, zwalnia {zwalnia})
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {jobTitleStats.length > 0 && (
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
                              positions.some(p => (p.jobTitle?.trim() || '—') === s.jobTitle)
                                ? 'font-semibold text-foreground'
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <span>
                              {s.jobTitle} — {s.count} os.
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
                  )}

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Planowane przyjęcia ({plannedTotal} os.):
                    </p>
                    {order.arrivals.length === 0 ? (
                      <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
                        Brak zaplanowanych dat przyjęć.
                      </p>
                    ) : (
                      [...order.arrivals]
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((a, i) => (
                          <div
                            key={`${a.date}-${i}`}
                            className="flex items-center justify-between gap-2 rounded-md border bg-background/50 px-3 py-2 text-sm"
                          >
                            <span>{format(new Date(a.date), 'dd.MM.yyyy')}</span>
                            <span className="tabular-nums font-medium">
                              {Number(a.count) || 0} os.
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </>
  );
}
