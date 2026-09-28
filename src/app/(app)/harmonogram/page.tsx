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
import { getDB } from '@/lib/firebase';
import { ref as dbRef, update } from 'firebase/database';
import { Input } from '@/components/ui/input';

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
  const { isAdmin } = useAppContext();

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

  const handleUpdatePotrzeby = async (dept: string, mgr: string, job: string, newAmount: number) => {
    if (!isAdmin) return;
    const key = (dept + '___' + mgr + '___' + job).replace(/[.#$\[\]]/g, '_');
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, potrzebyByManager: { ...prev.potrzebyByManager, [key]: newAmount } };
    });
    try {
      const db = getDB();
      if (!db) return;
      const posRef = dbRef(db, 'potrzebyObsady');
      await update(posRef, { [key]: newAmount });
    } catch (err) {
      console.error('Failed to update potrzeby:', err);
    }
  };

  return (
    <div className="flex flex-col md:h-full">
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
            description="Sprawdź obsadę i zapotrzebowanie według działu."
          />

          <div className="flex flex-col gap-4 pb-6 md:overflow-y-auto">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex w-full sm:w-auto overflow-hidden rounded-lg border border-border">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'harmonogram' ? 'default' : 'ghost'}
                  className="min-h-12 rounded-none border-0 flex-1 sm:min-h-9 sm:flex-initial"
                  onClick={() => setView('harmonogram')}
                >
                  Harmonogram obsady
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'zapotrzebowania' ? 'default' : 'ghost'}
                  className="min-h-12 rounded-none border-0 flex-1 sm:min-h-9 sm:flex-initial"
                  onClick={() => setView('zapotrzebowania')}
                >
                  Zapotrzebowania
                </Button>
              </div>
            </div>

            {view === 'harmonogram' ? (
              <HarmonogramView 
                data={data} 
                showExport 
                isAdmin={isAdmin} 
                onUpdatePotrzeby={handleUpdatePotrzeby} 
              />
            ) : (
              <PublicZapotrzebowaniaView data={data} setData={setData} />
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
      const potrzebyByDeptJob = new Map<string, number>();
      if (data.potrzebyByManager) {
        Object.entries(data.potrzebyByManager).forEach(([key, val]) => {
          const parts = key.split('___');
          if (parts.length === 3) {
            const deptJobKey = parts[0] + '|' + parts[2];
            potrzebyByDeptJob.set(deptJobKey, (potrzebyByDeptJob.get(deptJobKey) ?? 0) + val);
          }
        });
      }
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
    return { headcountByDept, headcountByDeptJob, terminationsByDeptJob, jobTitlesByDept, potrzebyByDeptJob };
  }, [data]);
}

function PublicZapotrzebowaniaView({ data, setData }: { data: HarmonogramData, setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>> }) {
  const { headcountByDept, headcountByDeptJob, terminationsByDeptJob, jobTitlesByDept, potrzebyByDeptJob } =
    usePublicZapotrzebowaniaStats(data);
  const { isAdmin } = useAppContext();

  const handleUpdateToRecruit = async (recruitmentId: string, positionId: string, newAmount: number) => {
    if (!isAdmin) return;
    
    // Update local data optimistically
    setData(prev => {
      if (!prev) return prev;
      const newRecruitments = prev.recruitments.map(r => {
        if (r.id !== recruitmentId) return r;
        return {
          ...r,
          positions: r.positions.map(p => {
            if (p.id !== positionId) return p;
            return { ...p, toRecruit: newAmount };
          })
        };
      });
      return { ...prev, recruitments: newRecruitments };
    });

    // Update global database
    const db = getDB();
    if (db) {
      try {
        await update(dbRef(db, `recruitment/${recruitmentId}/positions/${positionId}`), {
          toRecruit: newAmount,
        });
      } catch (err) {
        console.error('Failed to update recruitment:', err);
      }
    }
  };

  const totalToRecruit = data.recruitments.reduce(
    (sum, r) => sum + r.positions.reduce((s, p) => { if (potrzebyByDeptJob.has(r.department + '|' + p.jobTitle)) { const obecnie = headcountByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0; const zwalnia = terminationsByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0; return s + Math.max(0, (potrzebyByDeptJob.get(r.department + '|' + p.jobTitle) || 0) - (obecnie - zwalnia)); } return s + (Number(p.toRecruit) || 0); }, 0),
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
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
          <UserPlus className="h-4 w-4" />
          Łącznie brakuje: {totalToRecruit - totalPlanned > 0 ? totalToRecruit - totalPlanned : 0}
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
          .map(r => {
            const positions = r.positions;
            const departmentHeadcount = headcountByDept.get(r.department) ?? 0;
            const sumToRecruit = positions.reduce(
              (s, p) => { if (potrzebyByDeptJob.has(r.department + '|' + p.jobTitle)) { const obecnie = headcountByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0; const zwalnia = terminationsByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0; return s + Math.max(0, (potrzebyByDeptJob.get(r.department + '|' + p.jobTitle) || 0) - (obecnie - zwalnia)); } return s + (Number(p.toRecruit) || 0); },
              0
            );
            const plannedTotal = r.arrivals.reduce(
              (s, a) => s + (Number(a.count) || 0),
              0
            );
            const missing = Math.max(0, sumToRecruit - plannedTotal);
            const surplus = Math.max(0, plannedTotal - sumToRecruit);
            const sumZwalnia = positions.reduce(
              (s, p) =>
                s + (terminationsByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0),
              0
            );
            const jobTitleStats = jobTitlesByDept.get(r.department) ?? [];

            return (
              <Card key={r.department}>
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CardTitle className="text-base truncate">{r.department}</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {missing > 0 ? (
                        <Badge variant="destructive" className="tabular-nums text-xs font-semibold px-2 py-0.5">
                          Brakuje: {missing}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400 text-xs"
                        >
                          Komplet
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
                          headcountByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0;
                        const zwalnia =
                          terminationsByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0;
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
                            
                            {isAdmin ? (
                              <Input
                                type="number"
                                min={0}
                                value={p.toRecruit}
                                onChange={(e) => handleUpdateToRecruit(r.id, p.id, parseInt(e.target.value) || 0)}
                                className="w-20 h-7 text-right tabular-nums text-sm font-medium"
                              />
                            ) : (
                              <span className="tabular-nums font-medium">
                                {Number(p.toRecruit) || 0} os.
                              </span>
                            )}

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
                    {r.arrivals.length === 0 ? (
                      <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
                        Brak zaplanowanych dat przyjęć.
                      </p>
                    ) : (
                      [...r.arrivals]
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


