'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref as dbRef, remove, set, update } from 'firebase/database';
import { format, startOfDay } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import { cn, objectToArray } from '@/lib/utils';
import { formatDate, parseMaybeDate } from '@/lib/date';
import type { Recruitment, RecruitmentArrival } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Briefcase,
  CalendarPlus,
  Check,
  Download,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

const formatHeadcount = (count: number) => `${count} os.`;

const ArrivalRow = ({
  recruitmentId,
  arrival,
  onRemove,
}: {
  recruitmentId: string;
  arrival: RecruitmentArrival;
  onRemove: (arrivalId: string) => void;
}) => {
  const { toast } = useToast();
  const [countDraft, setCountDraft] = useState(String(arrival.count ?? 1));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setCountDraft(String(arrival.count ?? 1));
  }, [arrival.count, isFocused]);

  const handleDateChange = async (value: string) => {
    const db = getDB();
    if (!db) return;
    try {
      await update(dbRef(db, `recruitment/${recruitmentId}/arrivals/${arrival.id}`), {
        date: value,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać daty.' });
    }
  };

  const handleCountBlur = async () => {
    const db = getDB();
    if (!db) return;
    const parsed = parseInt(countDraft, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setCountDraft(String(arrival.count ?? 1));
      return;
    }
    if (parsed === arrival.count) return;
    try {
      await update(dbRef(db, `recruitment/${recruitmentId}/arrivals/${arrival.id}`), {
        count: parsed,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać liczby osób.' });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background/50 px-3 py-2">
      <CalendarPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        type="date"
        value={arrival.date ?? ''}
        onChange={e => handleDateChange(e.target.value)}
        className="h-9 w-full sm:w-auto sm:flex-1"
        aria-label="Data przyjęcia"
      />
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={1}
          value={countDraft}
          onChange={e => setCountDraft(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleCountBlur();
          }}
          className="h-9 w-20 tabular-nums"
          aria-label="Liczba osób"
        />
        <span className="text-xs text-muted-foreground">os.</span>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="ml-auto h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(arrival.id)}
        aria-label="Usuń datę"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const RecruitmentCard = ({
  recruitment,
  departments,
  jobTitles,
  headcount,
  jobTitleStats,
  onUpdateMeta,
  onDelete,
}: {
  recruitment: Recruitment;
  departments: { id: string; name: string }[];
  jobTitles: { id: string; name: string }[];
  headcount: { department: number; jobTitle: number; terminations: number };
  jobTitleStats: { jobTitle: string; count: number; toRecruit: number; terminations: number }[];
  onUpdateMeta: (recruitment: Recruitment, department: string, jobTitle: string) => Promise<boolean>;
  onDelete: (recruitment: Recruitment) => void;
}) => {
  const { toast } = useToast();
  const jobTitleLabel = recruitment.jobTitle?.trim() || '—';
  const [countDraft, setCountDraft] = useState(String(recruitment.toRecruit ?? 0));
  const [isFocused, setIsFocused] = useState(false);
  const [isAddingArrival, setIsAddingArrival] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [deptDraft, setDeptDraft] = useState(recruitment.department);
  const [jobTitleDraft, setJobTitleDraft] = useState(recruitment.jobTitle ?? '');
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const startEditingMeta = () => {
    setDeptDraft(recruitment.department);
    setJobTitleDraft(recruitment.jobTitle ?? '');
    setIsEditingMeta(true);
  };

  const handleSaveMeta = async () => {
    if (isSavingMeta) return;
    if (!deptDraft || !jobTitleDraft) {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Wybierz dział i stanowisko.' });
      return;
    }
    setIsSavingMeta(true);
    const ok = await onUpdateMeta(recruitment, deptDraft, jobTitleDraft);
    setIsSavingMeta(false);
    if (ok) setIsEditingMeta(false);
  };

  useEffect(() => {
    if (!isFocused) setCountDraft(String(recruitment.toRecruit ?? 0));
  }, [recruitment.toRecruit, isFocused]);

  const sortedArrivals = useMemo(
    () =>
      [...recruitment.arrivals].sort((a, b) => {
        const da = parseMaybeDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const dbTime = parseMaybeDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return da - dbTime;
      }),
    [recruitment.arrivals]
  );

  const plannedTotal = recruitment.arrivals.reduce((sum, a) => sum + (Number(a.count) || 0), 0);
  const missing = Math.max(0, (recruitment.toRecruit || 0) - plannedTotal);
  const surplus = Math.max(0, plannedTotal - (recruitment.toRecruit || 0));
  // Obecnie w całym dziale + do zrekrutowania = ile osób będzie łącznie na dziale
  const totalAfterRecruitment = headcount.department + (recruitment.toRecruit || 0);
  // Potrzeby = na stanowisku + do zrekrutowania − planowane zwolnienia
  const positionNeeds = Math.max(
    0,
    headcount.jobTitle + (recruitment.toRecruit || 0) - headcount.terminations
  );

  const handleCountBlur = async () => {
    const db = getDB();
    if (!db) return;
    const parsed = parseInt(countDraft, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      setCountDraft(String(recruitment.toRecruit ?? 0));
      return;
    }
    if (parsed === recruitment.toRecruit) return;
    try {
      await update(dbRef(db, `recruitment/${recruitment.id}`), { toRecruit: parsed });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać liczby osób.' });
    }
  };

  const handleAddArrival = async () => {
    const db = getDB();
    if (!db) return;
    setIsAddingArrival(true);
    try {
      const arrRef = push(dbRef(db, `recruitment/${recruitment.id}/arrivals`));
      await set(arrRef, { date: format(new Date(), 'yyyy-MM-dd'), count: 1 });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać daty przyjęcia.' });
    } finally {
      setIsAddingArrival(false);
    }
  };

  const handleRemoveArrival = async (arrivalId: string) => {
    const db = getDB();
    if (!db) return;
    try {
      await remove(dbRef(db, `recruitment/${recruitment.id}/arrivals/${arrivalId}`));
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć daty przyjęcia.' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isEditingMeta ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              <Select value={deptDraft} onValueChange={setDeptDraft}>
                <SelectTrigger className="h-9 w-full sm:w-56" aria-label="Edytuj dział">
                  <SelectValue placeholder="Dział…" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={jobTitleDraft} onValueChange={setJobTitleDraft}>
                <SelectTrigger className="h-9 w-full sm:w-52" aria-label="Edytuj stanowisko">
                  <SelectValue placeholder="Stanowisko…" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitles.map(jt => (
                    <SelectItem key={jt.id} value={jt.name}>
                      {jt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                  disabled={isSavingMeta || !deptDraft || !jobTitleDraft}
                  onClick={handleSaveMeta}
                  aria-label="Zapisz zmiany"
                >
                  {isSavingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={isSavingMeta}
                  onClick={() => setIsEditingMeta(false)}
                  aria-label="Anuluj edycję"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CardTitle className="text-base">{recruitment.department}</CardTitle>
              <Badge variant="secondary" className="max-w-full truncate">
                {jobTitleLabel}
              </Badge>
            </div>
          )}
          {!isEditingMeta && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="tabular-nums">
                Na dziale: {headcount.department} os.
              </Badge>
              <Badge variant="outline" className="tabular-nums">
                Na stanowisku: {headcount.jobTitle} os.
              </Badge>
              {headcount.terminations > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/60 text-amber-700 tabular-nums dark:text-amber-400"
                >
                  Zwalnia się: −{headcount.terminations}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400"
              >
                Potrzeby: {positionNeeds} os.
              </Badge>
              {missing > 0 && (
                <Badge variant="destructive" className="tabular-nums">
                  Brakuje: {missing}
                </Badge>
              )}
              <Badge variant="outline" className="tabular-nums">
                Rekrutacja: {recruitment.toRecruit || 0} os.
              </Badge>
              {surplus > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/60 text-amber-700 tabular-nums dark:text-amber-400"
                >
                  Nadwyżka: +{surplus}
                </Badge>
              )}
              {plannedTotal > 0 && missing === 0 && surplus === 0 && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400"
                >
                  Komplet: {plannedTotal}/{recruitment.toRecruit}
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={startEditingMeta}
                aria-label={`Edytuj ${recruitment.department} — ${jobTitleLabel}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(recruitment)}
                aria-label={`Usuń ${recruitment.department} — ${jobTitleLabel}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="w-full text-xs font-medium text-muted-foreground sm:w-auto">
            Ile osób zrekrutować:
          </label>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              value={countDraft}
              onChange={e => setCountDraft(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                handleCountBlur();
              }}
              onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="h-9 w-24 tabular-nums"
              aria-label={`Liczba osób do rekrutacji — ${recruitment.department}`}
            />
            <span className="text-xs text-muted-foreground">os.</span>
            <span className="text-xs text-muted-foreground">
              (na dziale jest {headcount.department} → będzie {totalAfterRecruitment})
            </span>
          </div>
        </div>

        <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            Stanowiska w dziale ({headcount.department} os.):
          </p>
          <div className="space-y-1">
            {jobTitleStats.map(s => (
              <div
                key={s.jobTitle}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs',
                  s.jobTitle === jobTitleLabel && 'font-semibold text-foreground'
                )}
              >
                <span>
                  {s.jobTitle} — {formatHeadcount(s.count)}
                  {s.terminations > 0 && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                      (zwalnia się: {s.terminations})
                    </span>
                  )}
                  {s.jobTitle === jobTitleLabel && (
                    <span className="ml-1 font-normal text-primary">(ta pozycja)</span>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Planowane przyjęcia ({plannedTotal} os.):
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-primary/30 px-3 text-primary hover:bg-primary/5"
              disabled={isAddingArrival}
              onClick={handleAddArrival}
            >
              {isAddingArrival ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Dodaj datę
            </Button>
          </div>
          {sortedArrivals.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
              Brak zaplanowanych dat przyjęć — kliknij „Dodaj datę”.
            </p>
          ) : (
            sortedArrivals.map(arrival => (
              <ArrivalRow
                key={arrival.id}
                recruitmentId={recruitment.id}
                arrival={arrival}
                onRemove={handleRemoveArrival}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function RekrutacjaPage() {
  const { isLoading: isContextLoading, config } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  const { toast } = useToast();

  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [newDepartment, setNewDepartment] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newCount, setNewCount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [toDelete, setToDelete] = useState<Recruitment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const db = getDB();
    if (!db) return;
    const recruitmentRef = dbRef(db, 'recruitment');
    const unsubscribe = onValue(recruitmentRef, snapshot => {
      const rows = objectToArray(snapshot.val()).map(row => ({
        ...row,
        arrivals: objectToArray(row.arrivals),
      })) as Recruitment[];
      setRecruitments(rows);
      setIsDataLoading(false);
    }, () => {
      setIsDataLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const sortedRecruitments = useMemo(
    () =>
      [...recruitments].sort(
        (a, b) =>
          a.department.localeCompare(b.department, 'pl') ||
          (a.jobTitle ?? '').localeCompare(b.jobTitle ?? '', 'pl')
      ),
    [recruitments]
  );

  const usedCombos = useMemo(
    () => new Set(recruitments.map(r => `${r.department}|${r.jobTitle?.trim() || '—'}`)),
    [recruitments]
  );

  const availableDepartments = useMemo(
    () => config.departments.filter(d => !usedCombos.has(`${d.name}|${newJobTitle?.trim() || '—'}`)),
    [config.departments, usedCombos, newJobTitle]
  );

  const availableJobTitles = useMemo(() => {
    if (!newDepartment) return [];
    return config.jobTitles.filter(jt => !usedCombos.has(`${newDepartment}|${jt.name?.trim() || '—'}`));
  }, [config.jobTitles, usedCombos, newDepartment]);

  const totalToRecruit = recruitments.reduce((sum, r) => sum + (Number(r.toRecruit) || 0), 0);
  const totalPlanned = recruitments.reduce(
    (sum, r) => sum + r.arrivals.reduce((s, a) => s + (Number(a.count) || 0), 0),
    0
  );

  const headcountByDepartment = useMemo(() => {
    const map = new Map<string, number>();
    activeEmployees.forEach(e => {
      map.set(e.department, (map.get(e.department) ?? 0) + 1);
    });
    return map;
  }, [activeEmployees]);

  const headcountByDeptJob = useMemo(() => {
    const map = new Map<string, number>();
    activeEmployees.forEach(e => {
      const key = `${e.department}|${e.jobTitle}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [activeEmployees]);

  // Planowane zwolnienia per dział·stanowisko (data >= dziś)
  const terminationsByDeptJob = useMemo(() => {
    const map = new Map<string, number>();
    const today = startOfDay(new Date());
    activeEmployees.forEach(e => {
      const planned = parseMaybeDate(e.plannedTerminationDate);
      if (!planned || startOfDay(planned).getTime() < today.getTime()) return;
      const key = `${e.department}|${e.jobTitle}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [activeEmployees]);

  // Stanowiska w każdym dziale: obecna obsada + planowane zwolnienia + potrzeby rekrutacyjne
  const jobTitlesByDepartment = useMemo(() => {
    const map = new Map<
      string,
      { jobTitle: string; count: number; toRecruit: number; terminations: number }[]
    >();
    const today = startOfDay(new Date());
    const isPlannedTerm = (plannedTerminationDate?: string) => {
      const planned = parseMaybeDate(plannedTerminationDate);
      return !!planned && startOfDay(planned).getTime() >= today.getTime();
    };
    const ensure = (department: string) => {
      let entries = map.get(department);
      if (!entries) {
        entries = [];
        map.set(department, entries);
      }
      return entries;
    };
    activeEmployees.forEach(e => {
      if (!e.department || !e.jobTitle) return;
      const entries = ensure(e.department);
      const existing = entries.find(x => x.jobTitle === e.jobTitle);
      const terminating = isPlannedTerm(e.plannedTerminationDate);
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
    recruitments.forEach(r => {
      if (!r.department) return;
      const entries = ensure(r.department);
      const jobTitle = r.jobTitle?.trim() || '—';
      const existing = entries.find(x => x.jobTitle === jobTitle);
      if (existing) existing.toRecruit += Number(r.toRecruit) || 0;
      else
        entries.push({ jobTitle, count: 0, toRecruit: Number(r.toRecruit) || 0, terminations: 0 });
    });
    map.forEach(entries => {
      entries.sort((a, b) => b.count - a.count || a.jobTitle.localeCompare(b.jobTitle, 'pl'));
    });
    return map;
  }, [activeEmployees, recruitments]);

  const handleUpdateMeta = async (
    recruitment: Recruitment,
    department: string,
    jobTitle: string
  ): Promise<boolean> => {
    const db = getDB();
    if (!db) return false;
    const combo = `${department}|${jobTitle}`;
    const taken = recruitments.some(
      r => r.id !== recruitment.id && `${r.department}|${r.jobTitle?.trim() || '—'}` === combo
    );
    if (taken) {
      toast({
        variant: 'destructive',
        title: 'Duplikat',
        description: `${department} · ${jobTitle} — taka pozycja już istnieje.`,
      });
      return false;
    }
    try {
      await update(dbRef(db, `recruitment/${recruitment.id}`), { department, jobTitle });
      toast({ title: 'Zapisano', description: `${department} · ${jobTitle}` });
      return true;
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać zmian.' });
      return false;
    }
  };

  const selectedDepartmentStats = useMemo(() => {
    if (!newDepartment) return null;
    const deptEmployees = activeEmployees.filter(e => e.department === newDepartment);
    const byJobTitle = new Map<string, { count: number; managers: Set<string> }>();
    deptEmployees.forEach(e => {
      const entry = byJobTitle.get(e.jobTitle) ?? { count: 0, managers: new Set<string>() };
      entry.count += 1;
      if (e.manager) entry.managers.add(e.manager);
      byJobTitle.set(e.jobTitle, entry);
    });
    return {
      total: deptEmployees.length,
      rows: [...byJobTitle.entries()]
        .map(([jobTitle, { count, managers }]) => ({
          jobTitle,
          count,
          managers: [...managers].sort((a, b) => a.localeCompare(b, 'pl')),
        }))
        .sort((a, b) => b.count - a.count || a.jobTitle.localeCompare(b.jobTitle, 'pl')),
    };
  }, [activeEmployees, newDepartment]);

  const handleAdd = async () => {
    const db = getDB();
    const parsedCount = parseInt(newCount, 10);
    if (!db || !newDepartment || !newJobTitle || Number.isNaN(parsedCount) || parsedCount < 1) return;
    setIsAdding(true);
    try {
      const newRef = push(dbRef(db, 'recruitment'));
      await set(newRef, {
        department: newDepartment,
        jobTitle: newJobTitle,
        toRecruit: parsedCount,
        createdAt: new Date().toISOString(),
      });
      setNewDepartment('');
      setNewJobTitle('');
      setNewCount('');
      toast({
        title: 'Dodano pozycję',
        description: `${newDepartment} · ${newJobTitle} — ${parsedCount} os. do rekrutacji`,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać pozycji.' });
    } finally {
      setIsAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const db = getDB();
    if (!db) return;
    setIsDeleting(true);
    try {
      await remove(dbRef(db, `recruitment/${toDelete.id}`));
      setToDelete(null);
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć działu.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    if (recruitments.length === 0) return;
    try {
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');
      const wb = new ExcelJS.Workbook();

      const summaryRows = sortedRecruitments.map(r => {
        const planned = r.arrivals.reduce((s, a) => s + (Number(a.count) || 0), 0);
        const jobKey = `${r.department}|${r.jobTitle?.trim() || '—'}`;
        const doRekrutacji = r.toRecruit || 0;
        const obecnieDzial = headcountByDepartment.get(r.department) ?? 0;
        const obecnieStanowisko = headcountByDeptJob.get(jobKey) ?? 0;
        const zwalnia = terminationsByDeptJob.get(jobKey) ?? 0;
        return [
          r.department,
          r.jobTitle?.trim() || '—',
          obecnieDzial,
          obecnieStanowisko,
          zwalnia,
          doRekrutacji,
          Math.max(0, obecnieStanowisko + doRekrutacji - zwalnia),
          obecnieDzial + doRekrutacji,
          planned,
          Math.max(0, doRekrutacji - planned),
        ];
      });

      const ws1 = wb.addWorksheet('Podsumowanie');
      ws1.addTable({
        name: 'Podsumowanie',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: [
          'Dział',
          'Stanowisko',
          'Obecnie na dziale',
          'Obecnie na stanowisku',
          'Zwalnia się',
          'Do zrekrutowania',
          'Potrzeby (stanowisko)',
          'Razem będzie (dział)',
          'Zaplanowane przyjęcia',
          'Brakuje',
        ].map(n => ({ name: n, filterButton: true })),
        rows: summaryRows,
      });
      ws1.getColumn(1).width = 28;
      ws1.getColumn(2).width = 26;
      [3, 4, 5, 6, 7, 8, 9, 10].forEach(col => (ws1.getColumn(col).width = 20));
      // Suma po unikalnych działach (wiersze dział·stanowisko powtarzają obsadę działu)
      const uniqueDeptHeadcount = new Map<string, number>();
      sortedRecruitments.forEach(r => {
        if (!uniqueDeptHeadcount.has(r.department)) {
          uniqueDeptHeadcount.set(r.department, headcountByDepartment.get(r.department) ?? 0);
        }
      });
      const sumDeptHeadcount = [...uniqueDeptHeadcount.values()].reduce((a, b) => a + b, 0);
      const sumObecnieStanowisko = sortedRecruitments.reduce(
        (s, r) => s + (headcountByDeptJob.get(`${r.department}|${r.jobTitle?.trim() || '—'}`) ?? 0),
        0
      );
      const sumZwalnia = sortedRecruitments.reduce(
        (s, r) => s + (terminationsByDeptJob.get(`${r.department}|${r.jobTitle?.trim() || '—'}`) ?? 0),
        0
      );
      const totalRow = ws1.addRow([
        'RAZEM',
        '',
        sumDeptHeadcount,
        sumObecnieStanowisko,
        sumZwalnia,
        totalToRecruit,
        Math.max(0, sumObecnieStanowisko + totalToRecruit - sumZwalnia),
        sumDeptHeadcount + totalToRecruit,
        totalPlanned,
        Math.max(0, totalToRecruit - totalPlanned),
      ]);
      totalRow.font = { bold: true };

      const arrivalRows = sortedRecruitments.flatMap(r =>
        r.arrivals.length === 0
          ? [[r.department, r.jobTitle?.trim() || '—', '—', 0]]
          : [...r.arrivals]
              .sort((a, b) => {
                const da = parseMaybeDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                const dbTime = parseMaybeDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                return da - dbTime;
              })
              .map(a => [
                r.department,
                r.jobTitle?.trim() || '—',
                formatDate(a.date) || '—',
                Number(a.count) || 0,
              ])
      );

      const ws2 = wb.addWorksheet('Daty przyjęć');
      ws2.addTable({
        name: 'DatyPrzyjec',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: ['Dział', 'Stanowisko', 'Data przyjęcia', 'Liczba osób'].map(n => ({
          name: n,
          filterButton: true,
        })),
        rows: arrivalRows,
      });
      ws2.getColumn(1).width = 28;
      ws2.getColumn(2).width = 26;
      ws2.getColumn(3).width = 16;
      ws2.getColumn(4).width = 14;

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `Rekrutacja_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Błąd podczas eksportu:', error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się wyeksportować danych do pliku Excel.',
      });
    }
  };

  const isLoading = isContextLoading || isDataLoading || isEmployeesLoading;

  return (
    <div className="h-full flex flex-col">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Rekrutacja"
            description="Zaplanuj, ile osób trzeba zrekrutować do każdego działu i kiedy mają przyjść."
          >
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={recruitments.length === 0}
              className="gap-2 border-primary/20 bg-white/50 text-primary hover:bg-primary/5 dark:bg-black/50"
            >
              <Download className="h-4 w-4" />
              Eksportuj do Excel
            </Button>
          </PageHeader>

          <div className="flex flex-col gap-4 overflow-y-auto pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <Users className="h-4 w-4" />
                Pozycje (dział · stanowisko): {recruitments.length}
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

            <Card>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
                  <Select
                    value={newDepartment}
                    onValueChange={value => {
                      setNewDepartment(value);
                      setNewJobTitle('');
                    }}
                  >
                    <SelectTrigger className="w-full lg:w-72" aria-label="Wybierz dział">
                      <SelectValue placeholder="Wybierz dział…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartments.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          Brak dostępnych działów.
                        </p>
                      ) : (
                        availableDepartments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name} ({formatHeadcount(headcountByDepartment.get(dept.name) ?? 0)})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newJobTitle}
                    onValueChange={setNewJobTitle}
                    disabled={!newDepartment}
                  >
                    <SelectTrigger className="w-full lg:w-64" aria-label="Wybierz stanowisko">
                      <SelectValue
                        placeholder={newDepartment ? 'Wybierz stanowisko…' : 'Najpierw dział…'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableJobTitles.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          Wszystkie stanowiska dla tego działu zostały dodane.
                        </p>
                      ) : (
                        availableJobTitles.map(jt => (
                          <SelectItem key={jt.id} value={jt.name}>
                            {jt.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ile osób?"
                    value={newCount}
                    onChange={e => setNewCount(e.target.value)}
                    className="w-full lg:w-32"
                    aria-label="Liczba osób do rekrutacji"
                  />
                  <Button
                    className="gap-2 lg:ml-auto"
                    disabled={
                      !newDepartment ||
                      !newJobTitle ||
                      !newCount ||
                      parseInt(newCount, 10) < 1 ||
                      isAdding
                    }
                    onClick={handleAdd}
                  >
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Dodaj
                  </Button>
                </div>

                {selectedDepartmentStats && (
                  <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Obecnie w dziale: {formatHeadcount(selectedDepartmentStats.total)}
                    </p>
                    {selectedDepartmentStats.rows.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Brak aktywnych pracowników w tym dziale.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedDepartmentStats.rows.map(row => (
                          <div
                            key={row.jobTitle}
                            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              {row.jobTitle} — {formatHeadcount(row.count)}
                            </span>
                            <span className="text-muted-foreground">
                              {row.managers.length > 0
                                ? `Kierownik: ${row.managers.join(', ')}`
                                : 'Brak kierownika'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {recruitments.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  <UserPlus className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  Brak danych — wybierz dział i stanowisko powyżej, aby zaplanować rekrutację.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {sortedRecruitments.map(recruitment => (
                  <RecruitmentCard
                    key={recruitment.id}
                    recruitment={recruitment}
                    departments={config.departments}
                    jobTitles={config.jobTitles}
                    headcount={{
                      department: headcountByDepartment.get(recruitment.department) ?? 0,
                      jobTitle:
                        headcountByDeptJob.get(
                          `${recruitment.department}|${recruitment.jobTitle?.trim() || '—'}`
                        ) ?? 0,
                      terminations:
                        terminationsByDeptJob.get(
                          `${recruitment.department}|${recruitment.jobTitle?.trim() || '—'}`
                        ) ?? 0,
                    }}
                    jobTitleStats={jobTitlesByDepartment.get(recruitment.department) ?? []}
                    onUpdateMeta={handleUpdateMeta}
                    onDelete={setToDelete}
                  />
                ))}
              </div>
            )}
          </div>

          <AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Usunąć plan rekrutacji?</AlertDialogTitle>
                <AlertDialogDescription>
                  Pozycja „{toDelete?.department} · {toDelete?.jobTitle?.trim() || '—'}” zostanie
                  usunięta razem z liczbą osób i wszystkimi datami przyjęć. Tej operacji nie można
                  cofnąć.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="gap-2">
                  {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Usuń
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
