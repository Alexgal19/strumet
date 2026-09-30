'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Briefcase, UserPlus, CalendarPlus, Trash2, Pencil, Check, X, ChevronDown, Plus, History } from 'lucide-react';
import { startOfDay, format } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HarmonogramView } from '@/components/harmonogram-view';
import { type HarmonogramData, buildHarmonogram } from '@/lib/harmonogram';
import { getDB } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ref as dbRef, update, push, set, remove } from 'firebase/database';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { commentKey, MAX_COMMENT_LEN } from '@/lib/komentarze-validation';
import { arrivalStatus, matchHires, matchTransfers, splitArrivals, type HistoriaEmployee, type TransferRecord } from '@/lib/przyjecia-historia';

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
  const [view, setView] = useState<'harmonogram' | 'zapotrzebowania' | 'historia'>('harmonogram');
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
    const key = (dept + '___' + mgr + '___' + job).replace(/[.#$\[\]\/]/g, '_');
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
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'historia' ? 'default' : 'ghost'}
                  className="min-h-12 rounded-none border-0 flex-1 sm:min-h-9 sm:flex-initial"
                  onClick={() => setView('historia')}
                >
                  Historia{(() => {
                    const t = format(new Date(), 'yyyy-MM-dd');
                    const n = data ? Object.values(data.planowanePrzyjecia || {}).filter(p => p.date && p.date < t).length : 0;
                    return n > 0 ? ` (${n})` : '';
                  })()}
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
            ) : view === 'zapotrzebowania' ? (
              <PublicZapotrzebowaniaView data={data} setData={setData} />
            ) : (
              <HistoriaPrzyjec data={data} setData={setData} />
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
    const result = buildHarmonogram(data, 0);
    const jobTitlesByDept = new Map<string, { jobTitle: string; obecnie: number; potrzeby: number; zwalnia: number; zwalniani: { date: string; count: number; names: string[] }[] }[]>();
    const today = startOfDay(new Date()).getTime();

    result.rows.forEach(deptRow => {
      const jobsMap = new Map<string, { obecnie: number; potrzeby: number; zwalnia: number; zwalnianiMap: Map<string, { count: number; names: string[] }> }>();
      
      deptRow.managers.forEach(mgrRow => {
         mgrRow.positions.forEach(posRow => {
            const jobTitle = posRow.jobTitle;
            const current = jobsMap.get(jobTitle) || { obecnie: 0, potrzeby: 0, zwalnia: 0, zwalnianiMap: new Map() };
            current.obecnie += posRow.obecnie;
            current.potrzeby += posRow.potrzeby;
            
            posRow.employees.forEach(empRow => {
               const emp = empRow;
               let termDateStr = '';

               if (emp.terminationDate) {
                 const t = new Date(emp.terminationDate).getTime();
                 if (!isNaN(t) && t >= today) {
                   termDateStr = emp.terminationDate;
                 }
               }
               if (!termDateStr && emp.plannedTerminationDate) {
                 const t = new Date(emp.plannedTerminationDate).getTime();
                 if (!isNaN(t) && t >= today) {
                   termDateStr = emp.plannedTerminationDate;
                 }
               }

                if (termDateStr) {
                  current.zwalnia += 1;
                  const entry = current.zwalnianiMap.get(termDateStr) || { count: 0, names: [] as string[] };
                  entry.count += 1;
                  const empName = (emp.fullName || '').trim();
                  if (empName && !entry.names.includes(empName)) entry.names.push(empName);
                  current.zwalnianiMap.set(termDateStr, entry);
                }
            });
            
            jobsMap.set(jobTitle, current);
         });
      });
      
      const arr = Array.from(jobsMap.entries()).map(([jobTitle, stats]) => {
         const zwalniani = Array.from(stats.zwalnianiMap.entries()).map(([date, entry]) => ({ date, count: entry.count, names: [...entry.names].sort((a, b) => a.localeCompare(b, 'pl')) })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
         return {
           jobTitle, 
           obecnie: stats.obecnie, 
           potrzeby: stats.potrzeby, 
           zwalnia: stats.zwalnia, 
           zwalniani 
         };
      }).sort((a, b) => a.jobTitle.localeCompare(b.jobTitle, 'pl'));
      
      jobTitlesByDept.set(deptRow.dept, arr);
    });

    return { jobTitlesByDept };
  }, [data]);
}

function PublicZapotrzebowaniaView({ data, setData }: { data: HarmonogramData, setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>> }) {
  const { jobTitlesByDept } = usePublicZapotrzebowaniaStats(data);
  const { isAdmin, currentUser } = useAppContext();
  const { toast } = useToast();
  
  const [newArrivalDate, setNewArrivalDate] = useState<Record<string, string>>({});
  const [newArrivalCount, setNewArrivalCount] = useState<Record<string, string>>({});
  const [expandedTerminations, setExpandedTerminations] = useState<Record<string, boolean>>({});

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<Record<string, boolean>>({});

  const handleSaveComment = async (dept: string, jobTitle: string) => {
    const cKey = commentKey(dept, jobTitle);
    const text = (commentDrafts[cKey] ?? '').trim();
    if (text.length > MAX_COMMENT_LEN) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: `Komentarz może mieć maks. ${MAX_COMMENT_LEN} znaków.` });
      return;
    }
    const applyLocal = (saved: { text: string; author: string; updatedAt: string } | null) => {
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.komentarzeZapotrzebowania || {}) };
        if (saved) current[cKey] = saved;
        else delete current[cKey];
        return { ...prev, komentarzeZapotrzebowania: current };
      });
      setEditingComment(prev => ({ ...prev, [cKey]: false }));
    };

    // Gość — przez publiczny API-rote (walidacja + audit po stronie serwera).
    if (!isAdmin) {
      try {
        const res = await fetch('/api/public/komentarze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ department: dept, jobTitle, text }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({ variant: 'destructive', title: 'Nie zapisano', description: json.error || 'Błąd zapisywania. Spróbuj ponownie.' });
          return;
        }
        if (json.removed) {
          applyLocal(null);
          toast({ title: 'Usunięto komentarz' });
        } else {
          applyLocal({ text, author: 'Gość', updatedAt: new Date().toISOString() });
          toast({ title: 'Zapisano komentarz' });
        }
      } catch (err) {
        console.error('Failed to save comment (guest):', err);
        toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Brak połączenia. Spróbuj ponownie.' });
      }
      return;
    }

    // Admin — przez Client SDK (bez zmian w uprawnieniach).
    const db = getDB();
    if (!db) return;
    try {
      const nodeRef = dbRef(db, `komentarzeZapotrzebowania/${cKey}`);
      if (!text) {
        await remove(nodeRef);
        applyLocal(null);
      } else {
        const saved = { text, author: currentUser?.email || 'admin', updatedAt: new Date().toISOString() };
        await set(nodeRef, saved);
        applyLocal(saved);
      }
    } catch (err) {
      console.error('Failed to save comment:', err);
    }
  };

  const toggleTerminations = (key: string) =>
    setExpandedTerminations(prev => ({ ...prev, [key]: !prev[key] }));

  // Podświetlenie karty działu, gdy zmieni się zapotrzebowanie (potrzeby/obsada/zwolnienia/przyjęcia)
  const [flashDepts, setFlashDepts] = useState<Record<string, boolean>>({});
  const prevDeptSigs = useRef<Map<string, string>>(new Map());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const changed: string[] = [];
    const next = new Map<string, string>();
    jobTitlesByDept.forEach((jobs, dept) => {
      const sig = JSON.stringify({
        jobs: jobs.map(j => [j.jobTitle, j.potrzeby, j.obecnie, j.zwalnia]),
        planned: jobs.map(j => getPlannedTotalForJob(dept, j.jobTitle)),
      });
      next.set(dept, sig);
      if (prevDeptSigs.current.has(dept) && prevDeptSigs.current.get(dept) !== sig) {
        changed.push(dept);
      }
    });
    prevDeptSigs.current = next;
    if (changed.length === 0) return;
    setFlashDepts(prev => {
      const n = { ...prev };
      changed.forEach(d => { n[d] = true; });
      return n;
    });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      setFlashDepts(prev => {
        const n = { ...prev };
        changed.forEach(d => { delete n[d]; });
        return n;
      });
      flashTimer.current = null;
    }, 2800);
  });

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const todayYmd = format(new Date(), 'yyyy-MM-dd');

  const getMissing = (dept: string, jobTitle: string) => {
    const jobs = jobTitlesByDept.get(dept);
    const job = jobs?.find(j => j.jobTitle === jobTitle);
    if (!job) return 0;
    return Math.max(0, job.potrzeby - (job.obecnie - job.zwalnia));
  };

  const getPlannedForJob = (dept: string, jobTitle: string) => {
    if (!data.planowanePrzyjecia) return [];
    // W Zapotrzebowania tylko nadchodzące (data >= dziś); minione trafiają do Historii.
    return Object.values(data.planowanePrzyjecia).filter(p => p.department === dept && p.jobTitle === jobTitle && (!p.date || p.date >= todayYmd));
  };

  const getPlannedTotalForJob = (dept: string, jobTitle: string) => {
    return getPlannedForJob(dept, jobTitle).reduce((sum, p) => sum + p.count, 0);
  };

  let totalMissing = 0;
  let totalTerminations = 0;
  jobTitlesByDept.forEach((jobs, dept) => {
    jobs.forEach(job => {
      totalMissing += getMissing(dept, job.jobTitle);
      totalTerminations += job.zwalnia;
    });
  });

  const totalPlanned = data.planowanePrzyjecia ? Object.values(data.planowanePrzyjecia).filter(p => !p.date || p.date >= todayYmd).reduce((sum, p) => sum + p.count, 0) : 0;

  const handleAddArrival = async (dept: string, jobTitle: string) => {
    const key = `${dept}|${jobTitle}`;
    const date = newArrivalDate[key];
    const count = parseInt(newArrivalCount[key] || '0', 10);
    if (!date || count <= 0) return;

    const arrivalData = {
      department: dept,
      jobTitle,
      date,
      count
    };
    const applyLocal = (id: string) => {
      setData(prev => {
        if (!prev) return prev;
        const current = prev.planowanePrzyjecia || {};
        return {
          ...prev,
          planowanePrzyjecia: {
            ...current,
            [id]: { id, ...arrivalData }
          }
        };
      });
      setNewArrivalDate(prev => ({ ...prev, [key]: '' }));
      setNewArrivalCount(prev => ({ ...prev, [key]: '' }));
    };

    // Gość (także bez logowania) zapisuje przez publiczny API-rote — zapis/client-SDK jest dla niego zablokowany regułami.
    if (!isAdmin) {
      try {
        const res = await fetch('/api/public/przyjecia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(arrivalData),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({
            variant: 'destructive',
            title: 'Nie zapisano',
            description: json.error || 'Błąd zapisywania. Spróbuj ponownie.',
          });
          return;
        }
        applyLocal(json.id as string);
        toast({
          title: 'Zapisano',
          description: `Przyjęcie: ${format(new Date(date), 'dd.MM.yyyy')} — ${count} os.`,
        });
      } catch (err) {
        console.error('Failed to add arrival (guest):', err);
        toast({
          variant: 'destructive',
          title: 'Nie zapisano',
          description: 'Brak połączenia. Spróbuj ponownie.',
        });
      }
      return;
    }

    // Admin — dotychczasowa ścieżka przez Client SDK (bez zmian).
    const db = getDB();
    if (!db) return;

    try {
      const newRef = push(dbRef(db, 'planowanePrzyjecia'));
      await set(newRef, arrivalData);
      applyLocal(newRef.key as string);
    } catch (err) {
      console.error('Failed to add arrival:', err);
    }
  };

  const handleUpdateArrival = async (id: string, newDate: string, newCount: number) => {
    if (!newDate || !Number.isInteger(newCount) || newCount <= 0) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Podaj poprawną datę i liczbę osób.' });
      return;
    }

    // Gość — przez publiczny API-rote (ta sama walidacja co przy dodawaniu).
    if (!isAdmin) {
      try {
        const res = await fetch('/api/public/przyjecia', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, date: newDate, count: newCount }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({
            variant: 'destructive',
            title: 'Nie zapisano',
            description: json.error || 'Błąd zapisywania. Spróbuj ponownie.',
          });
          return;
        }
        setData(prev => {
          if (!prev) return prev;
          const current = { ...(prev.planowanePrzyjecia || {}) };
          if (current[id]) {
            current[id] = { ...current[id], date: json.date, count: json.count };
          }
          return { ...prev, planowanePrzyjecia: current };
        });
        toast({ title: 'Zapisano', description: `Przyjęcie: ${format(new Date(json.date), 'dd.MM.yyyy')} — ${json.count} os.` });
      } catch (err) {
        console.error('Failed to update arrival (guest):', err);
        toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Brak połączenia. Spróbuj ponownie.' });
      }
      return;
    }

    // Admin — dotychczasowa ścieżka przez Client SDK (bez zmian).
    const db = getDB();
    if (!db) return;
    try {
      await update(dbRef(db, `planowanePrzyjecia/${id}`), { date: newDate, count: newCount });
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.planowanePrzyjecia || {}) };
        if (current[id]) {
          current[id] = { ...current[id], date: newDate, count: newCount };
        }
        return { ...prev, planowanePrzyjecia: current };
      });
    } catch (err) {
      console.error('Failed to update arrival:', err);
    }
  };

  const handleRemoveArrival = async (id: string) => {
    const db = getDB();
    if (!db) return;
    try {
      await remove(dbRef(db, `planowanePrzyjecia/${id}`));
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.planowanePrzyjecia || {}) };
        delete current[id];
        return { ...prev, planowanePrzyjecia: current };
      });
    } catch (err) {
      console.error('Failed to remove arrival:', err);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
          <UserPlus className="h-4 w-4" />
          Łącznie brakuje: {Math.max(0, totalMissing - totalPlanned)}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from(jobTitlesByDept.entries())
          .sort(([deptA], [deptB]) => deptA.localeCompare(deptB, 'pl'))
          .map(([dept, jobs]) => {
            const deptMissing = jobs.reduce((sum, job) => sum + getMissing(dept, job.jobTitle), 0);
            const deptPlanned = jobs.reduce((sum, job) => sum + getPlannedTotalForJob(dept, job.jobTitle), 0);
            const netMissing = Math.max(0, deptMissing - deptPlanned);
            
            const visibleJobs = jobs.filter(job => getMissing(dept, job.jobTitle) > 0 || getPlannedForJob(dept, job.jobTitle).length > 0 || job.zwalniani.length > 0);
            if (visibleJobs.length === 0) return null;

            return (
              <Card key={dept} className={flashDepts[dept] ? 'demand-flash' : undefined}>
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CardTitle className="text-base truncate">{dept}</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {netMissing > 0 ? (
                        <Badge variant="destructive" className="tabular-nums text-xs font-semibold px-2 py-0.5">
                          Brakuje: {netMissing}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400 text-xs">
                          Komplet
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Stanowiska i braki:</p>
                    {visibleJobs.length === 0 ? (
                      <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
                        Brak stanowisk.
                      </p>
                    ) : (
                      visibleJobs.map((job, i) => {
                        const jobMissing = getMissing(dept, job.jobTitle);
                        const jobPlanned = getPlannedForJob(dept, job.jobTitle);
                        const jobPlannedTotal = getPlannedTotalForJob(dept, job.jobTitle);
                        const jobNetMissing = Math.max(0, jobMissing - jobPlannedTotal);
                        const key = `${dept}|${job.jobTitle}`;
                        const cKey = commentKey(dept, job.jobTitle);
                        
                        const potrzeby = job.potrzeby;
                        const obecnie = job.obecnie;
                        const zwalnia = job.zwalnia;

                        return (
                          <div key={key} className="flex flex-col gap-2 rounded-md border bg-background/50 px-3 py-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" />
                                <span className="font-medium">{job.jobTitle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Potrzeby: <strong className="text-emerald-600">{potrzeby} os.</strong> (jest {obecnie}, zwalnia {zwalnia})
                                </span>
                                {jobNetMissing > 0 && (
                                  <Badge variant="destructive" className="text-xs px-1.5 py-0">Brakuje {jobNetMissing}</Badge>
                                )}
                              </div>
                            </div>

                            {/* Planowane przyjęcia i zwolnienia — podgląd dla wszystkich, edycja tylko dla admina */}
                            {(jobMissing > 0 || jobPlanned.length > 0 || job.zwalniani.length > 0) && (
                                <div className="mt-2 flex flex-col gap-2 border-t pt-2">
                                  {job.zwalniani.length > 0 && (
                                    <div className="flex flex-col gap-1 mb-1">
                                      <span className="text-xs font-medium text-muted-foreground">Planowane zwolnienia:</span>
                                      {job.zwalniani.map((z, idx) => {
                                        const expKey = `${dept}|${job.jobTitle}|${z.date}`;
                                        const expanded = !!expandedTerminations[expKey];
                                        return (
                                          <div key={idx} className="bg-red-500/10 rounded text-xs">
                                            <button
                                              type="button"
                                              onClick={() => toggleTerminations(expKey)}
                                              aria-expanded={expanded}
                                              title="Pokaż pracowników"
                                              className="flex w-full cursor-pointer items-center justify-between px-2 py-1 text-left text-red-700 dark:text-red-400"
                                            >
                                              <span>📅 {format(new Date(z.date), 'dd.MM.yyyy')} — <strong>{z.count} os.</strong></span>
                                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {expanded && (
                                              <ul className="space-y-0.5 border-t border-red-500/20 px-2 py-1.5 text-red-700 dark:text-red-400">
                                                {z.names.map(name => (
                                                  <li key={name} className="flex items-center gap-1.5">
                                                    <span aria-hidden="true">•</span>
                                                    <span className="font-medium">{name}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {jobPlanned.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs font-medium text-muted-foreground">Zaplanowane przyjęcia:</span>
                                      {jobPlanned.map(p => (
                                        <ArrivalRow
                                          key={p.id}
                                          p={p}
                                          onUpdate={handleUpdateArrival}
                                          onRemove={handleRemoveArrival}
                                          canDelete={isAdmin}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Input
                                      type="date"
                                      min={format(new Date(), 'yyyy-MM-dd')}
                                      className="h-8 text-xs flex-1"
                                      value={newArrivalDate[key] || ''}
                                      onChange={e => setNewArrivalDate(prev => ({ ...prev, [key]: e.target.value }))}
                                    />
                                    <Input
                                      type="number"
                                      min="1"
                                      max="50"
                                      placeholder="Ilość"
                                      className={`h-8 w-20 text-xs ${newArrivalDate[key] && !newArrivalCount[key] ? 'guide-pulse' : ''}`}
                                      value={newArrivalCount[key] || ''}
                                      onChange={e => setNewArrivalCount(prev => ({ ...prev, [key]: e.target.value }))}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => handleAddArrival(dept, job.jobTitle)}
                                      disabled={!newArrivalDate[key] || !newArrivalCount[key]}
                                    >
                                      Dodaj
                                    </Button>
                                    {(newArrivalDate[key] || newArrivalCount[key]) && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        title="Anuluj wpisywanie"
                                        aria-label="Anuluj wpisywanie"
                                        className="h-8 w-8 shrink-0 text-muted-foreground"
                                        onClick={() => {
                                          setNewArrivalDate(prev => ({ ...prev, [key]: '' }));
                                          setNewArrivalCount(prev => ({ ...prev, [key]: '' }));
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  {!isAdmin && (
                                    <p className="text-[11px] text-muted-foreground">
                                      Jako Gość możesz dodawać i edytować przyjęcia oraz komentarze. Usuwanie — dla administratora.
                                    </p>
                                  )}
                                  <PositionComment
                                    saved={data.komentarzeZapotrzebowania?.[cKey]}
                                    draft={commentDrafts[cKey] ?? ''}
                                    isEditing={!!editingComment[cKey]}
                                    onStartEdit={() => {
                                      setCommentDrafts(prev => ({ ...prev, [cKey]: data.komentarzeZapotrzebowania?.[cKey]?.text ?? '' }));
                                      setEditingComment(prev => ({ ...prev, [cKey]: true }));
                                    }}
                                    onDraftChange={v => setCommentDrafts(prev => ({ ...prev, [cKey]: v }))}
                                    onCancel={() => setEditingComment(prev => ({ ...prev, [cKey]: false }))}
                                    onSave={() => handleSaveComment(dept, job.jobTitle)}
                                  />
                                </div>
                            )}
                          </div>
                        );
                      })
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

function ArrivalRow({ p, onUpdate, onRemove, canDelete = true }: { p: any, onUpdate: any, onRemove: any, canDelete?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(p.date);
  const [count, setCount] = useState(p.count);

  const handleSave = () => {
    onUpdate(p.id, date, parseInt(count, 10));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-muted/30 p-1 rounded">
        <Input type="date" min={format(new Date(), 'yyyy-MM-dd')} className="h-7 text-xs px-2 flex-1" value={date} onChange={e => setDate(e.target.value)} />
        <Input type="number" min="1" max="50" className="h-7 w-16 text-xs px-2" value={count} onChange={e => setCount(e.target.value)} />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 shrink-0" onClick={handleSave}><Check className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground shrink-0" onClick={() => { setDate(p.date); setCount(p.count); setIsEditing(false); }}><X className="h-3 w-3" /></Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1 text-xs group">
      <span>📅 {format(new Date(p.date), 'dd.MM.yyyy')} — <strong>{p.count} os.</strong></span>
      <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
         <Button type="button" variant="ghost" size="icon" title="Edytuj" className="h-5 w-5 text-blue-600 hover:text-blue-700" onClick={() => setIsEditing(true)}>
           <Pencil className="h-3 w-3" />
         </Button>
         {canDelete && (
           <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onRemove(p.id)}>
             <Trash2 className="h-3 w-3" />
           </Button>
         )}
      </div>
    </div>
  );
}

function PositionComment({ saved, draft, isEditing, onStartEdit, onDraftChange, onCancel, onSave }: {
  saved?: { text: string; author?: string; updatedAt?: string };
  draft: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onDraftChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (isEditing) {
    return (
      <div className="flex flex-col gap-1.5 mt-1">
        <Textarea
          className="min-h-[60px] text-xs"
          maxLength={MAX_COMMENT_LEN + 1}
          placeholder="Komentarz… (puste + Zapisz = usuń)"
          value={draft}
          onChange={e => onDraftChange(e.target.value)}
        />
        <div className="flex items-center gap-1.5">
          <Button type="button" size="sm" className="h-7 text-xs" onClick={onSave}>Zapisz</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>Anuluj</Button>
        </div>
      </div>
    );
  }
  if (saved?.text) {
    return (
      <div className="rounded-md bg-muted/50 px-2 py-1.5 text-xs mt-1">
        <div className="flex items-start justify-between gap-2">
          <p className="whitespace-pre-wrap text-foreground">💬 {saved.text}</p>
          <Button type="button" variant="ghost" size="icon" title="Edytuj komentarz" className="h-5 w-5 shrink-0 text-blue-600 hover:text-blue-700" onClick={onStartEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        {(saved.author || saved.updatedAt) && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {saved.author}
            {saved.updatedAt ? ` • ${format(new Date(saved.updatedAt), 'dd.MM.yyyy')}` : ''}
          </p>
        )}
      </div>
    );
  }
  return (
    <Button type="button" variant="ghost" size="sm" className="mt-1 h-7 gap-1 text-xs text-muted-foreground" onClick={onStartEdit}>
      <Plus className="h-3 w-3" /> Dodaj komentarz
    </Button>
  );
}

/** Historia minionych przyjęć (data < dziś) z weryfikacją, czy osoby faktycznie doszły. */
function HistoriaPrzyjec({ data, setData }: { data: HarmonogramData, setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>> }) {
  const { isAdmin } = useAppContext();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const todayYmd = format(new Date(), 'yyyy-MM-dd');

  const arrivals = Object.values(data.planowanePrzyjecia || {});
  const { past } = splitArrivals(arrivals, todayYmd);
  const employees: HistoriaEmployee[] = (data.employees || []).map(e => ({
    fullName: e.fullName,
    department: e.department,
    jobTitle: e.jobTitle,
    hireDate: e.hireDate,
  }));
  const transfers: TransferRecord[] = Object.values(data.transfery || {});
  const rows = past.map(a => {
    const hired = matchHires(a, employees);
    const moved = matchTransfers(a, transfers);
    const names = new Set([...hired.map(h => h.fullName), ...moved.map(m => m.fullName)]);
    return { arrival: a, hired, moved, status: arrivalStatus(a, names.size) };
  });

  const doneCount = rows.filter(r => r.status === 'done').length;
  const partialCount = rows.filter(r => r.status === 'partial').length;
  const missingCount = rows.filter(r => r.status === 'missing').length;

  const byDept = new Map<string, typeof rows>();
  rows.forEach(r => {
    const list = byDept.get(r.arrival.department) ?? [];
    list.push(r);
    byDept.set(r.arrival.department, list);
  });

  const handleRemove = async (id: string) => {
    if (!isAdmin) return;
    const db = getDB();
    if (!db) return;
    try {
      await remove(dbRef(db, `planowanePrzyjecia/${id}`));
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.planowanePrzyjecia || {}) };
        delete current[id];
        return { ...prev, planowanePrzyjecia: current };
      });
    } catch (err) {
      console.error('Failed to remove arrival:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
          <History className="h-4 w-4" />
          Minione przyjęcia: {rows.length}
        </Badge>
        {doneCount > 0 && (
          <Badge variant="outline" className="gap-1.5 border-emerald-500/60 px-3 py-1.5 text-sm text-emerald-700 tabular-nums dark:text-emerald-400">
            Zrealizowane: {doneCount}
          </Badge>
        )}
        {partialCount > 0 && (
          <Badge variant="outline" className="gap-1.5 border-amber-500/60 px-3 py-1.5 text-sm text-amber-700 tabular-nums dark:text-amber-400">
            Częściowo: {partialCount}
          </Badge>
        )}
        {missingCount > 0 && (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
            Niezrealizowane: {missingCount}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Weryfikacja po dacie zatrudnienia i transferach (okno −7 / +14 dni od planowanej daty).
      </p>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <History className="mx-auto mb-3 h-8 w-8 opacity-40" />
            Brak historii — minione przyjęcia pojawią się tutaj automatycznie.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from(byDept.entries()).sort(([a], [b]) => a.localeCompare(b, 'pl')).map(([dept, deptRows]) => (
            <Card key={dept}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base truncate">{dept}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {deptRows.map(({ arrival: a, hired, moved, status }) => {
                  const expKey = `hist|${a.id}`;
                  const isOpen = !!expanded[expKey];
                  const totalMatched = new Set([...hired.map(h => h.fullName), ...moved.map(m => m.fullName)]).size;
                  return (
                    <div key={a.id} className="rounded-md border bg-background/50 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setExpanded(prev => ({ ...prev, [expKey]: !prev[expKey] }))}
                          aria-expanded={isOpen}
                          title={totalMatched > 0 ? 'Pokaż zatrudnionych i transfery' : undefined}
                          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                        >
                          <span className="text-xs">
                            📅 {format(new Date(a.date), 'dd.MM.yyyy')} — <strong>{a.jobTitle}</strong> — plan: <strong>{a.count} os.</strong>
                          </span>
                          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="flex items-center gap-1.5">
                          {status === 'done' && (
                            <Badge variant="outline" className="border-emerald-500/60 text-emerald-700 dark:text-emerald-400 text-xs">Zrealizowane</Badge>
                          )}
                          {status === 'partial' && (
                            <Badge variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-400 text-xs">Częściowo {totalMatched}/{a.count}</Badge>
                          )}
                          {status === 'missing' && (
                            <Badge variant="destructive" className="text-xs">Niezrealizowane</Badge>
                          )}
                          {isAdmin && (
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemove(a.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {isOpen && (
                        <ul className="mt-1.5 space-y-0.5 border-t pt-1.5 text-xs">
                          {hired.length === 0 && moved.length === 0 ? (
                            <li className="text-muted-foreground">Brak dopasowanych zatrudnień ani transferów w oknie dat.</li>
                          ) : (
                            <>
                              {hired.map(m => (
                                <li key={`h-${m.fullName}`} className="flex items-center justify-between gap-2">
                                  <span className="font-medium">{m.fullName}</span>
                                  <span className="text-muted-foreground">zatr. {format(new Date(m.hireDate), 'dd.MM.yyyy')}</span>
                                </li>
                              ))}
                              {moved.map(m => (
                                <li key={`t-${m.fullName}-${m.date}`} className="flex items-center justify-between gap-2">
                                  <span className="font-medium">🔀 {m.fullName}</span>
                                  <span className="text-muted-foreground">transfer z {m.fromDepartment} • {format(new Date(m.date), 'dd.MM.yyyy')}</span>
                                </li>
                              ))}
                            </>
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
