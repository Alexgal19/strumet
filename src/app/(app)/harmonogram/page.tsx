'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Briefcase, UserPlus, CalendarPlus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight, Plus, History, Search } from 'lucide-react';
import { startOfDay, format } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HarmonogramView } from '@/components/harmonogram-view';
import { InstallAppButton } from '@/components/install-app-button';
import { type HarmonogramData, buildHarmonogram, getPotrzebyKey } from '@/lib/harmonogram';
import { getDB } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ref as dbRef, update, push, set, remove } from 'firebase/database';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { commentKey, MAX_COMMENT_LEN } from '@/lib/komentarze-validation';
import { addDaysToYmd, forecastShortage, shortageAt } from '@/lib/braki-prognoza';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { allocateArrivals, arrivalStatus, arrivalWindowEnd, isPendingTermination, splitArrivals, type HistoriaEmployee, type TransferRecord } from '@/lib/przyjecia-historia';
import { formatYmdPl, toYmd } from '@/lib/date';

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
  const { toast } = useToast();

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

  /** Zwraca true tylko po udanym zapisie; przy błędzie cofa wartość w widoku i pokazuje komunikat. */
  const handleUpdatePotrzeby = async (dept: string, mgr: string, job: string, newAmount: number): Promise<boolean> => {
    if (!isAdmin) return false;
    const key = getPotrzebyKey(dept, mgr, job);
    const previous = data?.potrzebyByManager?.[key];
    const setLocal = (value: number | undefined) =>
      setData(prev => {
        if (!prev) return prev;
        const next = { ...prev.potrzebyByManager };
        if (value === undefined) delete next[key];
        else next[key] = value;
        return { ...prev, potrzebyByManager: next };
      });
    setLocal(newAmount);
    try {
      const db = getDB();
      if (!db) throw new Error('Brak połączenia z bazą.');
      await update(dbRef(db, 'potrzebyObsady'), { [key]: newAmount });
      return true;
    } catch (err) {
      console.error('Failed to update potrzeby:', err);
      setLocal(previous);
      toast({ variant: 'destructive', title: 'Nie zapisano potrzeb', description: 'Spróbuj ponownie.' });
      return false;
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
                    const n = splitArrivals(Object.values(data.planowanePrzyjecia || {}), format(new Date(), 'yyyy-MM-dd')).past.length;
                    return n > 0 ? ` (${n})` : '';
                  })()}
                </Button>
              </div>
              <InstallAppButton className="w-full sm:ml-auto sm:w-auto" />
            </div>

            {view === 'harmonogram' ? (
              <HarmonogramView 
                data={data} 
                showExport 
                isAdmin={isAdmin} 
                onUpdatePotrzeby={handleUpdatePotrzeby} 
              />
            ) : view === 'zapotrzebowania' ? (
              <PublicZapotrzebowaniaView data={data} setData={setData} onUpdatePotrzeby={handleUpdatePotrzeby} />
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
    const jobTitlesByDept = new Map<string, { jobTitle: string; obecnie: number; potrzeby: number; zwalnia: number; zwalniani: { date: string; count: number; names: string[] }[]; managers: { manager: string; potrzeby: number; obecnie: number; zwalnia: number }[] }[]>();
    const today = startOfDay(new Date()).getTime();

    result.rows.forEach(deptRow => {
      const jobsMap = new Map<string, { obecnie: number; potrzeby: number; zwalnia: number; zwalnianiMap: Map<string, { count: number; names: string[] }>; managers: { manager: string; potrzeby: number; obecnie: number; zwalnia: number }[] }>();
      
      deptRow.managers.forEach(mgrRow => {
         mgrRow.positions.forEach(posRow => {
            const jobTitle = posRow.jobTitle;
            const current = jobsMap.get(jobTitle) || { obecnie: 0, potrzeby: 0, zwalnia: 0, zwalnianiMap: new Map(), managers: [] as { manager: string; potrzeby: number; obecnie: number; zwalnia: number }[] };
            current.obecnie += posRow.obecnie;
            current.potrzeby += posRow.potrzeby;
            current.managers.push({
              manager: posRow.manager,
              potrzeby: posRow.potrzeby,
              obecnie: posRow.obecnie,
              zwalnia: posRow.employees.filter(e => isPendingTermination(e.status, e.terminationDate, e.plannedTerminationDate, today)).length,
            });
            
             posRow.employees.forEach(empRow => {
                const emp = empRow;

                // Єдина логіка з harmonogram.ts — через isPendingTermination + нормалізацію дат.
                if (!isPendingTermination(emp.status, emp.terminationDate, emp.plannedTerminationDate, today)) return;

                // Вибираємо дату для групування (пріоритет: terminationDate, потім planned), нормалізовану до YMD.
                const todayYmdStr = format(new Date(today), 'yyyy-MM-dd');
                const tYmd = emp.terminationDate ? toYmd(emp.terminationDate) : null;
                const pYmd = emp.plannedTerminationDate ? toYmd(emp.plannedTerminationDate) : null;
                let termDateStr = '';
                if (tYmd && tYmd >= todayYmdStr) termDateStr = tYmd;
                else if (pYmd && pYmd >= todayYmdStr) termDateStr = pYmd;
                else return;

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
          const zwalniani = Array.from(stats.zwalnianiMap.entries()).map(([date, entry]) => ({ date, count: entry.count, names: [...entry.names].sort((a, b) => a.localeCompare(b, 'pl')) })).sort((a,b) => a.date.localeCompare(b.date));
         return {
           jobTitle, 
           obecnie: stats.obecnie, 
           potrzeby: stats.potrzeby, 
           zwalnia: stats.zwalnia, 
           zwalniani,
           managers: stats.managers
         };
      }).sort((a, b) => a.jobTitle.localeCompare(b.jobTitle, 'pl'));
      
      jobTitlesByDept.set(deptRow.dept, arr);
    });

    return { jobTitlesByDept };
  }, [data]);
}

function PublicZapotrzebowaniaView({ data, setData, onUpdatePotrzeby }: { data: HarmonogramData, setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>>, onUpdatePotrzeby?: (dept: string, mgr: string, job: string, newAmount: number) => void | boolean | Promise<boolean | void> }) {
  const { jobTitlesByDept } = usePublicZapotrzebowaniaStats(data);
  const { isAdmin, currentUser, logAudit } = useAppContext();
  const { toast } = useToast();
  
  const [newArrivalDate, setNewArrivalDate] = useState<Record<string, string>>({});
  const [newArrivalCount, setNewArrivalCount] = useState<Record<string, string>>({});
  const [expandedTerminations, setExpandedTerminations] = useState<Record<string, boolean>>({});
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [sortMode, setSortMode] = useState<'deficit' | 'name'>('deficit');
  const [bulkOpen, setBulkOpen] = useState(false);

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
        void logAudit('Usunięto komentarz zapotrzebowania', `${dept} / ${jobTitle}`);
        applyLocal(null);
      } else {
        const saved = { text, author: currentUser?.email || 'admin', updatedAt: new Date().toISOString() };
        await set(nodeRef, saved);
        void logAudit('Zapisano komentarz zapotrzebowania', `${dept} / ${jobTitle}`);
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

  const isUpcomingArrival = (date?: string) => {
    if (!date) return true;
    const ymd = toYmd(date);
    // Пошкоджену дату не губимо — як у splitArrivals.
    if (!ymd) return true;
    return ymd >= todayYmd;
  };

  // Tylko wpisy z poprawną datą liczą się do pokrycia — tak samo jak forecastShortage
  // (pomija nieprawidłowe daty). Wpis bez daty nadal jest widoczny na liście do poprawy.
  const isCountableArrival = (date?: string) => {
    if (!date) return false;
    const ymd = toYmd(date);
    if (!ymd) return false;
    return ymd >= todayYmd;
  };

  // Indeks przyjęć (dział|stanowisko → lista i suma), liczony raz na zmianę danych/daty.
  // W Zapotrzebowania tylko nadchodzące (data >= dziś); minione trafiają do Historii.
  const plannedIndex = useMemo(() => {
    const list = new Map<string, NonNullable<HarmonogramData['planowanePrzyjecia']>[string][]>();
    const total = new Map<string, number>();
    Object.values(data.planowanePrzyjecia || {}).forEach(p => {
      if (!isUpcomingArrival(p.date)) return;
      const k = `${p.department}|${p.jobTitle}`;
      const arr = list.get(k) ?? [];
      arr.push(p);
      list.set(k, arr);
      if (isCountableArrival(p.date)) total.set(k, (total.get(k) ?? 0) + p.count);
    });
    return { list, total };
  }, [data.planowanePrzyjecia, todayYmd]);

  const getPlannedForJob = (dept: string, jobTitle: string) => plannedIndex.list.get(`${dept}|${jobTitle}`) ?? [];
  const getPlannedTotalForJob = (dept: string, jobTitle: string) => plannedIndex.total.get(`${dept}|${jobTitle}`) ?? 0;

  // Braki netto liczymy per stanowisko (nadmiar przyjęć na jednym stanowisku nie pokrywa braków
  // na innym), a sumy działu i ogółu są sumą tych wartości — dzięki temu zgadzają się z kartami.
  const getNetMissing = (dept: string, jobTitle: string) =>
    Math.max(0, getMissing(dept, jobTitle) - getPlannedTotalForJob(dept, jobTitle));

  let totalNetMissing = 0;
  let totalTerminations = 0;
  let totalPlanned = 0;
  jobTitlesByDept.forEach((jobs, dept) => {
    jobs.forEach(job => {
      totalNetMissing += getNetMissing(dept, job.jobTitle);
      totalTerminations += job.zwalnia;
      totalPlanned += getPlannedTotalForJob(dept, job.jobTitle);
    });
  });

  /** Zapis jednego przyjęcia. Zwraca null (sukces) albo komunikat błędu. */
  const addArrival = async (dept: string, jobTitle: string, date: string, count: number, silent = false): Promise<string | null> => {
    const arrivalData = { department: dept, jobTitle, date, count };
    const applyLocal = (id: string) => {
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          planowanePrzyjecia: { ...(prev.planowanePrzyjecia || {}), [id]: { id, ...arrivalData } },
        };
      });
    };
    const fail = (message: string) => {
      if (!silent) toast({ variant: 'destructive', title: 'Nie zapisano', description: message });
      return message;
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
        if (!res.ok) return fail(json.error || 'Błąd zapisywania. Spróbuj ponownie.');
        applyLocal(json.id as string);
        if (!silent) toast({ title: 'Zapisano', description: `Przyjęcie: ${formatYmdPl(date)} — ${count} os.` });
        return null;
      } catch (err) {
        console.error('Failed to add arrival (guest):', err);
        return fail('Brak połączenia. Spróbuj ponownie.');
      }
    }

    // Admin — przez Client SDK.
    const db = getDB();
    if (!db) return fail('Brak połączenia z bazą.');
    try {
      const newRef = push(dbRef(db, 'planowanePrzyjecia'));
      await set(newRef, arrivalData);
      void logAudit('Dodano planowane przyjęcie', `${dept} / ${jobTitle} — ${date} — ${count} os.`);
      applyLocal(newRef.key as string);
      return null;
    } catch (err) {
      console.error('Failed to add arrival:', err);
      return fail('Błąd zapisywania. Spróbuj ponownie.');
    }
  };

  const handleAddArrival = async (dept: string, jobTitle: string) => {
    const key = `${dept}|${jobTitle}`;
    const date = newArrivalDate[key];
    const count = parseInt(newArrivalCount[key] || '0', 10);
    if (!date || count <= 0) return;
    const error = await addArrival(dept, jobTitle, date, count);
    if (error === null) {
      setNewArrivalDate(prev => ({ ...prev, [key]: '' }));
      setNewArrivalCount(prev => ({ ...prev, [key]: '' }));
    }
  };

  const commitPotrzeby = async (dept: string, mgr: string, job: string, amount: number) => {
    if (!isAdmin || !onUpdatePotrzeby) return;
    const saved = await onUpdatePotrzeby(dept, mgr, job, amount);
    if (saved !== false) void logAudit('Zmieniono potrzeby obsady', `${dept} / ${mgr} / ${job} → ${amount}`);
  };

  const handleUpdateArrival = async (id: string, newDate: string, newCount: number): Promise<boolean> => {
    if (!newDate || !Number.isInteger(newCount) || newCount <= 0) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Podaj poprawną datę i liczbę osób.' });
      return false;
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
          return false;
        }
        setData(prev => {
          if (!prev) return prev;
          const current = { ...(prev.planowanePrzyjecia || {}) };
          if (current[id]) {
            current[id] = { ...current[id], date: json.date, count: json.count };
          }
          return { ...prev, planowanePrzyjecia: current };
        });
        toast({ title: 'Zapisano', description: `Przyjęcie: ${formatYmdPl(json.date)} — ${json.count} os.` });
        return true;
      } catch (err) {
        console.error('Failed to update arrival (guest):', err);
        toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Brak połączenia. Spróbuj ponownie.' });
        return false;
      }
    }

    // Admin — dotychczasowa ścieżka przez Client SDK (bez zmian).
    const db = getDB();
    if (!db) return false;
    try {
      await update(dbRef(db, `planowanePrzyjecia/${id}`), { date: newDate, count: newCount });
      const target = data.planowanePrzyjecia?.[id];
      void logAudit('Edytowano planowane przyjęcie', `${target?.department ?? ''} / ${target?.jobTitle ?? ''} — ${newDate} — ${newCount} os.`);
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.planowanePrzyjecia || {}) };
        if (current[id]) {
          current[id] = { ...current[id], date: newDate, count: newCount };
        }
        return { ...prev, planowanePrzyjecia: current };
      });
      return true;
    } catch (err) {
      console.error('Failed to update arrival:', err);
      return false;
    }
  };

  const handleRemoveArrival = async (id: string) => {
    const db = getDB();
    if (!db) return;
    try {
      const target = data.planowanePrzyjecia?.[id];
      await remove(dbRef(db, `planowanePrzyjecia/${id}`));
      void logAudit('Usunięto planowane przyjęcie', `${target?.department ?? ''} / ${target?.jobTitle ?? ''} — ${target?.date ?? ''} — ${target?.count ?? ''} os.`);
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

  // ---- Model tabeli: dział → stanowiska, z prognozą "teraz / za 7 / za 30 dni" ----
  const plus7 = addDaysToYmd(todayYmd, 7);
  const plus30 = addDaysToYmd(todayYmd, 30);
  const q = query.trim().toLowerCase();

  const deptModels = Array.from(jobTitlesByDept.entries()).map(([dept, jobs]) => {
    const all = jobs.map(job => {
      const planned = getPlannedForJob(dept, job.jobTitle);
      const forecast = forecastShortage(job.potrzeby, job.obecnie, job.zwalniani, planned, todayYmd);
      return {
        job,
        planned,
        forecast,
        now: forecast[0].shortage,
        in7: shortageAt(forecast, plus7),
        in30: shortageAt(forecast, plus30),
        plannedTotal: getPlannedTotalForJob(dept, job.jobTitle),
        net: getNetMissing(dept, job.jobTitle),
      };
    });
    const agg = all.reduce(
      (s, j) => ({
        potrzeby: s.potrzeby + j.job.potrzeby,
        obecnie: s.obecnie + j.job.obecnie,
        zwalnia: s.zwalnia + j.job.zwalnia,
        now: s.now + j.now,
        in7: s.in7 + j.in7,
        in30: s.in30 + j.in30,
        planned: s.planned + j.plannedTotal,
        net: s.net + j.net,
      }),
      { potrzeby: 0, obecnie: 0, zwalnia: 0, now: 0, in7: 0, in30: 0, planned: 0, net: 0 }
    );
    const deptMatches = !q || dept.toLowerCase().includes(q);
    const isProblem = (j: (typeof all)[number]) => j.net > 0 || j.now > 0 || j.in30 > 0;
    const visible = all
      .filter(j => (deptMatches || j.job.jobTitle.toLowerCase().includes(q)) && (!onlyProblems || isProblem(j)))
      .sort((x, y) =>
        sortMode === 'deficit'
          ? y.net - x.net || y.in30 - x.in30 || y.now - x.now || x.job.jobTitle.localeCompare(y.job.jobTitle, 'pl')
          : x.job.jobTitle.localeCompare(y.job.jobTitle, 'pl')
      );
    return { dept, agg, jobs: visible };
  })
    .filter(d => d.jobs.length > 0)
    .sort((x, y) =>
      sortMode === 'deficit'
        ? y.agg.net - x.agg.net || y.agg.in30 - x.agg.in30 || y.agg.now - x.agg.now || x.dept.localeCompare(y.dept, 'pl')
        : x.dept.localeCompare(y.dept, 'pl')
    );

  const bulkOptions = new Map<string, { jobTitle: string; net: number }[]>();
  jobTitlesByDept.forEach((jobs, dept) => {
    bulkOptions.set(dept, jobs.map(j => ({ jobTitle: j.jobTitle, net: getNetMissing(dept, j.jobTitle) })));
  });

  const numCell = (v: number, danger = true) => (
    <span className={v > 0 && danger ? 'font-semibold text-red-600 dark:text-red-400' : v === 0 ? 'text-foreground' : ''}>{v}</span>
  );
  const COLS = 9;

  // Stałe szerokości kolumn: każdy dział to osobna tabela, a kolumny mają się zgadzać między działami.
  const columnWidths = (
    <colgroup>
      <col />
      <col className="w-[72px] md:w-[90px]" />
      <col className="hidden md:table-column md:w-[70px]" />
      <col className="hidden md:table-column md:w-[85px]" />
      <col className="w-[56px] md:w-[75px]" />
      <col className="hidden md:table-column md:w-[85px]" />
      <col className="w-[64px] md:w-[95px]" />
      <col className="hidden md:table-column md:w-[95px]" />
      <col className="w-[72px] md:w-[130px]" />
    </colgroup>
  );
  const columnLabels = (
    <tr className="border-b bg-muted/60 text-sm font-semibold text-foreground">
                  <th className="px-3 py-2 text-left font-semibold">Dział / Stanowisko</th>
                  <th className="px-1 md:px-2 py-2 text-right font-semibold" title="Obsada docelowa">Potrzeby</th>
                  <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title="Aktywni pracownicy dziś">Jest</th>
                  <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title="Osoby z datą zwolnienia dziś lub później">Zwalnia</th>
                  <th className="px-1 md:px-2 py-2 text-right font-semibold" title="Potrzeby − Jest, dziś">Teraz</th>
                  <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title={`Prognoza na ${formatYmdPl(plus7)} (po zwolnieniach i przyjęciach)`}>Za 7 dni</th>
                  <th className="px-1 md:px-2 py-2 text-right font-semibold" title={`Prognoza na ${formatYmdPl(plus30)} (po zwolnieniach i przyjęciach)`}>Za 30 dni</th>
                  <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title="Zaplanowane przyjęcia (data od dziś)">Przyjęcia</th>
                  <th className="px-2 md:px-3 py-2 text-right font-semibold" title="Stan docelowy po wszystkich zwolnieniach i zaplanowanych przyjęciach"><span className="md:hidden">Netto</span><span className="hidden md:inline">Brakuje netto</span></th>
                </tr>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
          <UserPlus className="h-4 w-4" />
          Łącznie brakuje: {totalNetMissing}
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-[200px] sm:w-64">
          <Search className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj działu lub stanowiska…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant={onlyProblems ? 'default' : 'outline'}
          className="h-8"
          aria-pressed={onlyProblems}
          onClick={() => setOnlyProblems(v => !v)}
        >
          Tylko z brakami
        </Button>
        <select
          aria-label="Sortowanie"
          value={sortMode}
          onChange={e => setSortMode(e.target.value as 'deficit' | 'name')}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="deficit">Sortuj: największe braki</option>
          <option value="name">Sortuj: nazwa A–Z</option>
        </select>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 sm:ml-auto" onClick={() => setBulkOpen(true)}>
          <CalendarPlus className="h-4 w-4" />
          Dodaj przyjęcia hurtem
        </Button>
      </div>

      {deptModels.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-foreground">
            {onlyProblems || q ? 'Brak wyników dla wybranych filtrów.' : 'Brak stanowisk.'}
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col gap-5">
        {deptModels.map(({ dept, agg, jobs }) => {
          const collapsed = !!collapsedDepts[dept];
          return (
            <Card key={dept} className="overflow-hidden border-2 shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-base md:min-w-[820px]">
                  {columnWidths}
                  <thead>
                      <tr
                        className={`zap-row cursor-pointer border-b bg-primary/15 font-semibold ${flashDepts[dept] ? 'demand-flash-row' : ''}`}
                        onClick={() => setCollapsedDepts(prev => ({ ...prev, [dept]: !prev[dept] }))}
                      >
                        <td className="px-3 py-2">
                          {/* Przycisk bez własnego onClick: klik/Enter/Spacja bąbelkuje do <tr> (jedno przełączenie). */}
                          <button type="button" aria-expanded={!collapsed} className="flex items-start gap-1.5 text-left font-semibold">
                            {collapsed ? <ChevronRight className="h-4 w-4 shrink-0 text-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-foreground" />}
                            <span className="[overflow-wrap:anywhere]">{dept}</span>
                          </button>
                        </td>
                        <td className="px-1 md:px-2 py-2 text-right tabular-nums">{agg.potrzeby}</td>
                        <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{agg.obecnie}</td>
                        <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{numCell(agg.zwalnia, false)}</td>
                        <td className="px-1 md:px-2 py-2 text-right tabular-nums">{numCell(agg.now)}</td>
                        <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{numCell(agg.in7)}</td>
                        <td className="px-1 md:px-2 py-2 text-right tabular-nums">{numCell(agg.in30)}</td>
                        <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{agg.planned}</td>
                        <td className="px-2 md:px-3 py-2 text-right tabular-nums">
                          {agg.net > 0 ? (
                            <Badge variant="destructive" className="text-sm font-semibold">{agg.net}</Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/60 text-sm text-emerald-700 dark:text-emerald-400">Komplet</Badge>
                          )}
                        </td>
                      </tr>

                    {!collapsed && columnLabels}
                  </thead>
                  <tbody>
                      {!collapsed && jobs.map(({ job, planned, forecast, now, in7, in30, plannedTotal, net }) => {
                        const key = `${dept}|${job.jobTitle}`;
                        const cKey = commentKey(dept, job.jobTitle);
                        const open = !!expandedJobs[key];
                        const singleManager = job.managers.length === 1 ? job.managers[0] : null;
                        const hasComment = !!data.komentarzeZapotrzebowania?.[cKey]?.text;
                        return (
                          <React.Fragment key={key}>
                            <tr
                              className="zap-row cursor-pointer border-b"
                              onClick={() => setExpandedJobs(prev => ({ ...prev, [key]: !prev[key] }))}
                            >
                              <td className="py-2 pl-4 pr-2 md:pl-8 md:pr-3">
                                <button type="button" aria-expanded={open} className="flex items-start gap-1.5 text-left">
                                  {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground" />}
                                  <Briefcase className="hidden h-3.5 w-3.5 shrink-0 text-foreground sm:block" />
                                  <span className="font-semibold">{job.jobTitle}</span>
                                  {hasComment && <span title="Jest komentarz" aria-label="Jest komentarz">💬</span>}
                                </button>
                              </td>
                              <td className="px-1 md:px-2 py-1 text-right tabular-nums">
                                {isAdmin && singleManager ? (
                                  <PotrzebyInput
                                    value={job.potrzeby}
                                    onCommit={n => commitPotrzeby(dept, singleManager.manager, job.jobTitle, n)}
                                  />
                                ) : (
                                  job.potrzeby
                                )}
                              </td>
                              <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{job.obecnie}</td>
                              <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{numCell(job.zwalnia, false)}</td>
                              <td className="px-1 md:px-2 py-2 text-right tabular-nums">{numCell(now)}</td>
                              <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{numCell(in7)}</td>
                              <td className="px-1 md:px-2 py-2 text-right tabular-nums">{numCell(in30)}</td>
                              <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{plannedTotal}</td>
                              <td className="px-2 md:px-3 py-2 text-right tabular-nums">
                                {net > 0 ? (
                                  <Badge variant="destructive" className="px-1.5 py-0 text-sm">{net}</Badge>
                                ) : (
                                  <span className="text-sm text-emerald-700 dark:text-emerald-400">Komplet</span>
                                )}
                              </td>
                            </tr>

                            {open && (
                              <tr className="border-b bg-muted/20">
                                <td colSpan={COLS} className="px-4 py-3">
                                  <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                                    {job.managers.length > 1 && (
                                      <PanelBlock title="Obsada wg kierowników" hint="Jest = aktywni dziś" tone="violet">
                                        <div className="flex flex-col gap-1.5">
                                          {job.managers.map(m => {
                                            const lack = Math.max(0, m.potrzeby - m.obecnie);
                                            return (
                                              <div key={m.manager} className="rounded-md bg-muted/60 px-3 py-2">
                                                <div className="mb-1 font-semibold">{m.manager === 'Brak kierownika' ? m.manager : `Kierownik: ${m.manager}`}</div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                  <span>Jest: <strong className="text-base tabular-nums">{m.obecnie}</strong></span>
                                                  <span className="flex items-center gap-1.5">
                                                    Potrzeby:
                                                    {isAdmin ? (
                                                      <PotrzebyInput value={m.potrzeby} onCommit={n => commitPotrzeby(dept, m.manager, job.jobTitle, n)} />
                                                    ) : (
                                                      <strong className="text-base tabular-nums">{m.potrzeby}</strong>
                                                    )}
                                                  </span>
                                                  {m.zwalnia > 0 && (
                                                    <span className="text-red-700 dark:text-red-400">Zwalnia: <strong className="tabular-nums">{m.zwalnia}</strong></span>
                                                  )}
                                                  {lack > 0 ? (
                                                    <Badge variant="destructive" className="px-2 py-0 text-sm tabular-nums">brakuje {lack}</Badge>
                                                  ) : (
                                                    <Badge variant="outline" className="border-emerald-500/60 px-2 py-0 text-sm text-emerald-700 dark:text-emerald-400">komplet</Badge>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 pt-2 font-semibold">
                                            <span>Razem</span>
                                            <span>Jest: <span className="text-base tabular-nums">{job.obecnie}</span></span>
                                            <span>Potrzeby: <span className="text-base tabular-nums">{job.potrzeby}</span></span>
                                          </div>
                                        </div>
                                      </PanelBlock>
                                    )}

                                    <PanelBlock title="Prognoza braków" tone="amber">
                                      {forecast.length > 1 ? (
                                        <div className="flex flex-col gap-1.5">
                                          {forecast.map((r, ri) => (
                                            <div key={ri} className="flex items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-2">
                                              <span className="font-medium">{r.kind === 'now' ? 'Teraz' : `od ${formatYmdPl(r.date)}`}</span>
                                              <span className="flex items-center gap-1.5">
                                                brakuje
                                                {r.shortage > 0 ? (
                                                  <Badge variant="destructive" className="px-2 py-0 text-sm tabular-nums">{r.shortage}</Badge>
                                                ) : (
                                                  <Badge variant="outline" className="border-emerald-500/60 px-2 py-0 text-sm text-emerald-700 dark:text-emerald-400">0</Badge>
                                                )}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p>Brak zmian — nie ma zaplanowanych zwolnień ani przyjęć.</p>
                                      )}
                                    </PanelBlock>

                                    {job.zwalniani.length > 0 && (
                                      <PanelBlock title="Planowane zwolnienia" hint="data = ostatni dzień pracy" count={job.zwalnia} tone="red">
                                        <div className="flex flex-col gap-1.5">
                                          {job.zwalniani.map((z, idx) => {
                                            const expKey = `${dept}|${job.jobTitle}|${z.date}`;
                                            const expanded = !!expandedTerminations[expKey];
                                            return (
                                              <div key={idx} className="rounded-md bg-red-500/10">
                                                <button
                                                  type="button"
                                                  onClick={() => toggleTerminations(expKey)}
                                                  aria-expanded={expanded}
                                                  title="Pokaż pracowników"
                                                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left font-medium text-red-700 dark:text-red-400"
                                                >
                                                  <span>{formatYmdPl(z.date)} — <strong>{z.count} os.</strong></span>
                                                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                                </button>
                                                {expanded && (
                                                  <ul className="space-y-0.5 border-t border-red-500/20 px-3 py-2 text-red-700 dark:text-red-400">
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
                                      </PanelBlock>
                                    )}

                                    <PanelBlock title="Zaplanowane przyjęcia" count={plannedTotal} tone="blue">
                                      <div className="flex flex-col gap-2">
                                        {planned.length > 0 ? (
                                          <div className="flex flex-col gap-1.5">
                                            {planned.map(p => (
                                              <ArrivalRow
                                                key={p.id}
                                                p={p}
                                                onUpdate={handleUpdateArrival}
                                                onRemove={handleRemoveArrival}
                                                canDelete={isAdmin}
                                              />
                                            ))}
                                          </div>
                                        ) : (
                                          <p>Brak zaplanowanych przyjęć.</p>
                                        )}
                                        <div className="mt-1 flex flex-col gap-1.5 border-t pt-2">
                                          <span className="font-semibold">Dodaj przyjęcie</span>
                                          <div className="flex items-center gap-2">
                                            <Input
                                              type="date"
                                              min={todayYmd}
                                              className="h-9 flex-1 text-sm"
                                              value={newArrivalDate[key] || ''}
                                              onChange={e => setNewArrivalDate(prev => ({ ...prev, [key]: e.target.value }))}
                                            />
                                            <Input
                                              type="number"
                                              min="1"
                                              max="50"
                                              placeholder="Ilość"
                                              className={`h-9 w-20 text-sm ${newArrivalDate[key] && !newArrivalCount[key] ? 'guide-pulse' : ''}`}
                                              value={newArrivalCount[key] || ''}
                                              onChange={e => setNewArrivalCount(prev => ({ ...prev, [key]: e.target.value }))}
                                            />
                                            <Button
                                              type="button"
                                              size="sm"
                                              className="h-9 text-sm"
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
                                                className="h-9 w-9 shrink-0 text-foreground"
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
                                            <p className="text-sm">
                                              Jako Gość możesz dodawać i edytować przyjęcia oraz komentarze. Usuwanie i zmiana potrzeb — dla administratora.
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </PanelBlock>

                                    <PanelBlock title="Komentarz" tone="slate">
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
                                    </PanelBlock>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-sm text-foreground">
        Teraz = Potrzeby − Jest. Za 7 / 30 dni = prognoza po zwolnieniach (brak liczony od dnia po ostatnim dniu pracy) i zaplanowanych przyjęciach.
        Brakuje netto = stan docelowy po wszystkich zwolnieniach i przyjęciach. Kliknij stanowisko, aby dodać przyjęcie lub komentarz.
      </p>

      <BulkArrivalsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        options={bulkOptions}
        todayYmd={todayYmd}
        onAdd={(dept, job, date, count) => addArrival(dept, job, date, count, true)}
      />
    </>
  );
}

const PANEL_TONES: Record<string, string> = {
  violet: 'border-l-violet-500',
  amber: 'border-l-amber-500',
  red: 'border-l-red-500',
  blue: 'border-l-blue-500',
  slate: 'border-l-slate-500',
};

/** Osobny blok informacji w panelu stanowiska: nagłówek (+ licznik/podpowiedź) i treść. */
function PanelBlock({ title, hint, count, tone = 'slate', children }: {
  title: string;
  hint?: string;
  count?: number;
  tone?: keyof typeof PANEL_TONES | string;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 rounded-lg border border-l-4 bg-card p-3 text-sm text-foreground shadow-sm ${PANEL_TONES[tone] ?? PANEL_TONES.slate}`}>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
        <h4 className="text-base font-bold">
          {title}
          {count !== undefined && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums">{count}</span>}
        </h4>
        {hint && <span className="text-xs">{hint}</span>}
      </header>
      {children}
    </section>
  );
}

/** Pole potrzeb: zapis dopiero po opuszczeniu pola / Enter (bez zapisu przy każdym znaku). */
function PotrzebyInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!Number.isInteger(n) || n < 0) {
      setDraft(String(value));
      return;
    }
    if (n !== value) onCommit(n);
  };

  return (
    <Input
      type="number"
      min={0}
      aria-label="Potrzeby"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      onClick={e => e.stopPropagation()}
      className="inline-block h-8 w-20 px-1 py-0 text-right text-base font-semibold"
    />
  );
}

type BulkLine = { id: number; dept: string; job: string; count: string };

/** Dodawanie wielu przyjęć naraz (jedna data, wiele stanowisk). */
function BulkArrivalsDialog({ open, onOpenChange, options, todayYmd, onAdd }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: Map<string, { jobTitle: string; net: number }[]>;
  todayYmd: string;
  onAdd: (dept: string, job: string, date: string, count: number) => Promise<string | null>;
}) {
  const { toast } = useToast();
  const [date, setDate] = useState('');
  const [lines, setLines] = useState<BulkLine[]>([]);
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const depts = Array.from(options.keys()).sort((a, b) => a.localeCompare(b, 'pl'));

  const newLine = (dept?: string, job?: string, count = ''): BulkLine => {
    const d = dept ?? depts[0] ?? '';
    return { id: nextId.current++, dept: d, job: job ?? options.get(d)?.[0]?.jobTitle ?? '', count };
  };
  const patch = (id: number, p: Partial<BulkLine>) =>
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...p } : l)));

  const fillShortages = () => {
    const next: BulkLine[] = [];
    depts.forEach(d => (options.get(d) ?? []).forEach(j => {
      if (j.net > 0) next.push(newLine(d, j.jobTitle, String(Math.min(50, j.net))));
    }));
    if (next.length === 0) {
      toast({ title: 'Brak braków do uzupełnienia' });
      return;
    }
    setLines(next);
  };

  const submit = async () => {
    if (!date || date < todayYmd) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Wybierz datę od dziś.' });
      return;
    }
    const valid = lines.filter(l => l.dept && l.job);
    if (valid.length === 0) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Dodaj co najmniej jeden wiersz.' });
      return;
    }
    const parsed = valid.map(l => ({ ...l, n: Number(l.count) }));
    if (parsed.some(l => !Number.isInteger(l.n) || l.n < 1 || l.n > 50)) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Liczba osób w każdym wierszu: 1–50.' });
      return;
    }
    setBusy(true);
    const failed: (BulkLine & { error: string })[] = [];
    let saved = 0;
    for (const l of parsed) {
      const error = await onAdd(l.dept, l.job, date, l.n);
      if (error === null) saved += 1;
      else failed.push({ id: l.id, dept: l.dept, job: l.job, count: l.count, error });
    }
    setBusy(false);
    if (failed.length === 0) {
      toast({ title: 'Zapisano', description: `Dodano przyjęć: ${saved} (${formatYmdPl(date)}).` });
      setLines([]);
      setDate('');
      onOpenChange(false);
    } else {
      setLines(failed.map(({ error: _e, ...line }) => line));
      toast({
        variant: 'destructive',
        title: `Zapisano ${saved}, nie zapisano ${failed.length}`,
        description: failed[0].error,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dodaj przyjęcia hurtem</DialogTitle>
          <DialogDescription>Jedna data, wiele stanowisk. Każdy wiersz zapisuje się jako osobne przyjęcie.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" min={todayYmd} value={date} onChange={e => setDate(e.target.value)} className="h-8 w-44 text-sm" aria-label="Data przyjęcia" />
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={fillShortages} disabled={busy}>Wypełnij brakami</Button>
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={() => setLines(prev => [...prev, newLine()])} disabled={busy || depts.length === 0}>
            <Plus className="h-3.5 w-3.5" /> Dodaj wiersz
          </Button>
        </div>
        <div className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
          {lines.length === 0 && <p className="py-4 text-center text-sm text-foreground">Brak wierszy — użyj „Wypełnij brakami” albo „Dodaj wiersz”.</p>}
          {lines.map(l => (
            <div key={l.id} className="flex items-center gap-2">
              <select
                aria-label="Dział"
                value={l.dept}
                onChange={e => patch(l.id, { dept: e.target.value, job: options.get(e.target.value)?.[0]?.jobTitle ?? '' })}
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
              >
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                aria-label="Stanowisko"
                value={l.job}
                onChange={e => patch(l.id, { job: e.target.value })}
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
              >
                {(options.get(l.dept) ?? []).map(j => <option key={j.jobTitle} value={j.jobTitle}>{j.jobTitle}</option>)}
              </select>
              <Input type="number" min="1" max="50" placeholder="Ilość" value={l.count} onChange={e => patch(l.id, { count: e.target.value })} className="h-8 w-20 text-sm" aria-label="Ilość" />
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-foreground" aria-label="Usuń wiersz" onClick={() => setLines(prev => prev.filter(x => x.id !== l.id))} disabled={busy}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Anuluj</Button>
          <Button type="button" onClick={submit} disabled={busy || lines.length === 0}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Zapisz (${lines.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArrivalRow({ p, onUpdate, onRemove, canDelete = true }: { p: any, onUpdate: any, onRemove: any, canDelete?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(p.date);
  const [count, setCount] = useState(p.count);

  const startEditing = () => {
    setDate(p.date);
    setCount(p.count);
    setIsEditing(true);
  };

  // Tryb edycji zamykamy dopiero po udanym zapisie — przy błędzie walidacji dane zostają w polach.
  const handleSave = async () => {
    const ok = await onUpdate(p.id, date, parseInt(count, 10));
    if (ok) setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-muted/30 p-1 rounded">
        <Input type="date" min={format(new Date(), 'yyyy-MM-dd')} className="h-7 text-sm px-2 flex-1" value={date} onChange={e => setDate(e.target.value)} />
        <Input type="number" min="1" max="50" className="h-7 w-16 text-sm px-2" value={count} onChange={e => setCount(e.target.value)} />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 shrink-0" onClick={handleSave}><Check className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground shrink-0" onClick={() => { setDate(p.date); setCount(p.count); setIsEditing(false); }}><X className="h-3 w-3" /></Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-0.5 text-sm">
      <span>📅 {formatYmdPl(p.date) || 'bez daty'} — <strong>{p.count} os.</strong></span>
      <div className="flex items-center gap-0.5">
         <Button type="button" variant="ghost" size="icon" title="Edytuj" aria-label="Edytuj przyjęcie" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={startEditing}>
           <Pencil className="h-4 w-4" />
         </Button>
         {canDelete && (
           <Button type="button" variant="ghost" size="icon" title="Usuń" aria-label="Usuń przyjęcie" className="h-8 w-8 text-destructive" onClick={() => onRemove(p.id)}>
             <Trash2 className="h-4 w-4" />
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
          className="min-h-[60px] text-sm"
          maxLength={MAX_COMMENT_LEN + 1}
          placeholder="Komentarz… (puste + Zapisz = usuń)"
          value={draft}
          onChange={e => onDraftChange(e.target.value)}
        />
        <div className="flex items-center gap-1.5">
          <Button type="button" size="sm" className="h-7 text-sm" onClick={onSave}>Zapisz</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-sm" onClick={onCancel}>Anuluj</Button>
        </div>
      </div>
    );
  }
  if (saved?.text) {
    return (
      <div className="rounded-md bg-muted/50 px-2 py-1.5 text-sm mt-1">
        <div className="flex items-start justify-between gap-2">
          <p className="whitespace-pre-wrap text-foreground">💬 {saved.text}</p>
          <Button type="button" variant="ghost" size="icon" title="Edytuj komentarz" className="h-5 w-5 shrink-0 text-blue-600 hover:text-blue-700" onClick={onStartEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        {(saved.author || saved.updatedAt) && (
          <p className="mt-0.5 text-sm text-foreground">
            {saved.author}
            {saved.updatedAt ? ` • ${format(new Date(saved.updatedAt), 'dd.MM.yyyy')}` : ''}
          </p>
        )}
      </div>
    );
  }
  return (
    <Button type="button" variant="ghost" size="sm" className="mt-1 h-7 gap-1 text-sm text-foreground" onClick={onStartEdit}>
      <Plus className="h-3 w-3" /> Dodaj komentarz
    </Button>
  );
}

/** Historia minionych przyjęć (data < dziś) z weryfikacją, czy osoby faktycznie doszły. */
function HistoriaPrzyjec({ data, setData }: { data: HarmonogramData, setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>> }) {
  const { isAdmin, logAudit } = useAppContext();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const todayYmd = format(new Date(), 'yyyy-MM-dd');

  // Dopasowanie przyjęć do zatrudnień jest kosztowne (przyjęcia × pracownicy) — liczymy tylko
  // przy zmianie danych, a nie przy każdym rozwinięciu wiersza.
  const rows = useMemo(() => {
    const { past } = splitArrivals(Object.values(data.planowanePrzyjecia || {}), todayYmd);
    // `hires` = wszyscy zatrudnieni (także zwolnieni bez daty) z ostatniego roku; fallback na employees.
    const employees: HistoriaEmployee[] = (data.hires ?? data.employees ?? []).map(e => ({
      fullName: e.fullName,
      department: e.department,
      jobTitle: e.jobTitle,
      hireDate: e.hireDate,
    }));
    const transfers: TransferRecord[] = Object.values(data.transfery || {});
    const allocation = allocateArrivals(past, employees, transfers);
    return past.map(a => {
      const { hired, moved } = allocation.get(a.id) ?? { hired: [], moved: [] };
      return { arrival: a, hired, moved, status: arrivalStatus(a, hired.length + moved.length, todayYmd) };
    });
  }, [data.planowanePrzyjecia, data.hires, data.employees, data.transfery, todayYmd]);

  const doneCount = rows.filter(r => r.status === 'done').length;
  const partialCount = rows.filter(r => r.status === 'partial').length;
  const pendingCount = rows.filter(r => r.status === 'pending').length;
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
      const target = data.planowanePrzyjecia?.[id];
      await remove(dbRef(db, `planowanePrzyjecia/${id}`));
      void logAudit('Usunięto planowane przyjęcie (Historia)', `${target?.department ?? ''} / ${target?.jobTitle ?? ''} — ${target?.date ?? ''} — ${target?.count ?? ''} os.`);
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
        {pendingCount > 0 && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm text-muted-foreground tabular-nums">
            Oczekuje: {pendingCount}
          </Badge>
        )}
        {missingCount > 0 && (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
            Niezrealizowane: {missingCount}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Weryfikacja po dacie zatrudnienia i transferach (okno −7 / +14 dni od planowanej daty); każda osoba liczy się tylko do jednego przyjęcia. W trakcie okna brak dopasowań = „Oczekuje”.
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
                  const totalMatched = hired.length + moved.length;
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
                            📅 {formatYmdPl(a.date)} — <strong>{a.jobTitle}</strong> — plan: <strong>{a.count} os.</strong>
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
                          {status === 'pending' && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Oczekuje do {formatYmdPl(arrivalWindowEnd(a) ?? '')}</Badge>
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
                                  <span className="text-muted-foreground">zatr. {formatYmdPl(m.hireDate)}</span>
                                </li>
                              ))}
                              {moved.map(m => (
                                <li key={`t-${m.fullName}-${m.date}`} className="flex items-center justify-between gap-2">
                                  <span className="font-medium">🔀 {m.fullName}</span>
                                  <span className="text-muted-foreground">transfer z {m.fromDepartment} • {formatYmdPl(m.date)}</span>
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
