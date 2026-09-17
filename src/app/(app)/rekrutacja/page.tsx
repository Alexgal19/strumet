'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref as dbRef, remove, set, update } from 'firebase/database';
import { addDays, format, startOfDay } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import { objectToArray } from '@/lib/utils';
import { formatDate, parseMaybeDate } from '@/lib/date';
import type { Recruitment, RecruitmentArrival, RecruitmentPosition } from '@/lib/types';
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
  ChevronDown,
  ChevronRight,
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
  departmentHeadcount,
  headcountByDeptJob,
  terminationsByDeptJob,
  jobTitleStats,
  onUpdateDepartment,
  onDelete,
}: {
  recruitment: Recruitment;
  departments: { id: string; name: string }[];
  jobTitles: { id: string; name: string }[];
  departmentHeadcount: number;
  headcountByDeptJob: Map<string, number>;
  terminationsByDeptJob: Map<string, number>;
  jobTitleStats: { jobTitle: string; count: number; toRecruit: number; terminations: number }[];
  onUpdateDepartment: (recruitment: Recruitment, department: string) => Promise<boolean>;
  onDelete: (recruitment: Recruitment) => void;
}) => {
  const { toast } = useToast();
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [deptDraft, setDeptDraft] = useState(recruitment.department);
  const [isSavingDept, setIsSavingDept] = useState(false);
  const [isAddingArrival, setIsAddingArrival] = useState(false);

  const positions = recruitment.positions;

  const startEditingDept = () => {
    setDeptDraft(recruitment.department);
    setIsEditingDept(true);
  };

  const handleSaveDept = async () => {
    if (isSavingDept) return;
    if (!deptDraft) {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Wybierz dział.' });
      return;
    }
    setIsSavingDept(true);
    const ok = await onUpdateDepartment(recruitment, deptDraft);
    setIsSavingDept(false);
    if (ok) setIsEditingDept(false);
  };

  const sortedArrivals = useMemo(
    () =>
      [...recruitment.arrivals].sort((a, b) => {
        const da = parseMaybeDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const dbTime = parseMaybeDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return da - dbTime;
      }),
    [recruitment.arrivals]
  );

  const sumToRecruit = positions.reduce((s, p) => s + (Number(p.toRecruit) || 0), 0);
  const plannedTotal = recruitment.arrivals.reduce((sum, a) => sum + (Number(a.count) || 0), 0);
  const missing = Math.max(0, sumToRecruit - plannedTotal);
  const surplus = Math.max(0, plannedTotal - sumToRecruit);

  const sumZwalnia = positions.reduce(
    (s, p) => s + (terminationsByDeptJob.get(`${recruitment.department}|${p.jobTitle}`) ?? 0),
    0
  );
  const sumPotrzeby = positions.reduce((s, p) => {
    const obecnie = headcountByDeptJob.get(`${recruitment.department}|${p.jobTitle}`) ?? 0;
    const zwalnia = terminationsByDeptJob.get(`${recruitment.department}|${p.jobTitle}`) ?? 0;
    return s + Math.max(0, obecnie + (Number(p.toRecruit) || 0) - zwalnia);
  }, 0);

  const getPositionOptions = (posId: string) => {
    const usedHere = new Set(
      positions.filter(p => p.id !== posId).map(p => p.jobTitle)
    );
    return jobTitles.filter(jt => !usedHere.has(jt.name));
  };

  const getPositionStat = (pos: RecruitmentPosition) => {
    const key = `${recruitment.department}|${pos.jobTitle}`;
    const obecnie = headcountByDeptJob.get(key) ?? 0;
    const zwalnia = terminationsByDeptJob.get(key) ?? 0;
    const potrzeby = Math.max(0, obecnie + (Number(pos.toRecruit) || 0) - zwalnia);
    return { obecnie, zwalnia, potrzeby };
  };

  const handlePositionJobTitleChange = async (posId: string, jobTitle: string) => {
    const db = getDB();
    if (!db) return;
    try {
      await update(dbRef(db, `recruitment/${recruitment.id}/positions/${posId}`), { jobTitle });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać stanowiska.' });
    }
  };

  const handleAddPosition = async () => {
    const db = getDB();
    if (!db) return;
    const taken = new Set(positions.map(p => p.jobTitle));
    const free = jobTitles.find(jt => !taken.has(jt.name));
    if (!free) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Wszystkie stanowiska zostały już dodane.',
      });
      return;
    }
    try {
      const posRef = push(dbRef(db, `recruitment/${recruitment.id}/positions`));
      await set(posRef, { jobTitle: free.name, toRecruit: 1 });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać stanowiska.' });
    }
  };

  const handleRemovePosition = async (posId: string) => {
    const db = getDB();
    if (!db) return;
    try {
      await remove(dbRef(db, `recruitment/${recruitment.id}/positions/${posId}`));
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć stanowiska.' });
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
          {isEditingDept ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              <Select value={deptDraft} onValueChange={setDeptDraft}>
                <SelectTrigger className="h-9 w-full sm:w-64" aria-label="Edytuj dział">
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
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                  disabled={isSavingDept || !deptDraft}
                  onClick={handleSaveDept}
                  aria-label="Zapisz zmiany"
                >
                  {isSavingDept ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={isSavingDept}
                  onClick={() => setIsEditingDept(false)}
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
                {positions.length} {positions.length === 1 ? 'stanowisko' : 'stanowiska'}
              </Badge>
            </div>
          )}
          {!isEditingDept && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="tabular-nums">
                Na dziale: {departmentHeadcount} os.
              </Badge>
              {sumZwalnia > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/60 text-amber-700 tabular-nums dark:text-amber-400"
                >
                  Zwalnia się: −{sumZwalnia}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400"
              >
                Potrzeby: {sumPotrzeby} os.
              </Badge>
              {missing > 0 && (
                <Badge variant="destructive" className="tabular-nums">
                  Brakuje: {missing}
                </Badge>
              )}
              <Badge variant="outline" className="tabular-nums">
                Rekrutacja: {sumToRecruit} os.
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
                  Komplet: {plannedTotal}/{sumToRecruit}
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={startEditingDept}
                aria-label={`Edytuj dział ${recruitment.department}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(recruitment)}
                aria-label={`Usuń zapotrzebowanie ${recruitment.department}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Stanowiska i liczba osób:
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-primary/30 px-3 text-primary hover:bg-primary/5"
              onClick={handleAddPosition}
            >
              <Plus className="h-3.5 w-3.5" />
              Dodaj stanowisko
            </Button>
          </div>
          {positions.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
              Brak stanowisk — kliknij „Dodaj stanowisko”.
            </p>
          ) : (
            positions.map(pos => {
              const rowOptions = getPositionOptions(pos.id);
              return (
                <div
                  key={pos.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border bg-background/50 px-3 py-2"
                >
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Select
                    value={pos.jobTitle}
                    onValueChange={value => handlePositionJobTitleChange(pos.id, value)}
                  >
                    <SelectTrigger
                      className="h-9 w-full sm:w-56"
                      aria-label="Stanowisko"
                    >
                      <SelectValue placeholder="Wybierz stanowisko…" />
                    </SelectTrigger>
                    <SelectContent>
                      {rowOptions.map(jt => (
                        <SelectItem key={jt.id} value={jt.name}>
                          {jt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5">
                    <PositionCountInput recruitmentId={recruitment.id} position={pos} />
                    <span className="text-xs text-muted-foreground">os.</span>
                  </div>
                  {pos.jobTitle && (
                    <span className="text-xs text-muted-foreground">
                      Potrzeby:{' '}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {getPositionStat(pos).potrzeby} os.
                      </span>{' '}
                      (jest {getPositionStat(pos).obecnie}, zwalnia {getPositionStat(pos).zwalnia})
                    </span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemovePosition(pos.id)}
                    aria-label="Usuń stanowisko"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
        )}

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

const PositionCountInput = ({
  recruitmentId,
  position,
}: {
  recruitmentId: string;
  position: RecruitmentPosition;
}) => {
  const { toast } = useToast();
  const [draft, setDraft] = useState(String(position.toRecruit ?? 0));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setDraft(String(position.toRecruit ?? 0));
  }, [position.toRecruit, isFocused]);

  const handleBlur = async () => {
    const db = getDB();
    if (!db) return;
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setDraft(String(position.toRecruit ?? 0));
      return;
    }
    if (parsed === position.toRecruit) return;
    try {
      await update(dbRef(db, `recruitment/${recruitmentId}/positions/${position.id}`), {
        toRecruit: parsed,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać liczby osób.' });
    }
  };

  return (
    <Input
      type="number"
      min={1}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        handleBlur();
      }}
      onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="h-9 w-24 tabular-nums"
      aria-label="Liczba osób do rekrutacji"
    />
  );
};

export default function RekrutacjaPage() {
  const { isLoading: isContextLoading, config } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  const { toast } = useToast();

  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [newDepartment, setNewDepartment] = useState('');
  const [formRows, setFormRows] = useState<{ jobTitle: string; count: string }[]>([
    { jobTitle: '', count: '' },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [toDelete, setToDelete] = useState<Recruitment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [view, setView] = useState<'karty' | 'harmonogram'>('karty');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  useEffect(() => {
    const db = getDB();
    if (!db) return;
    const recruitmentRef = dbRef(db, 'recruitment');
    const unsubscribe = onValue(recruitmentRef, snapshot => {
      const rows = objectToArray(snapshot.val()).map(row => {
        // Nowy model: positions[] — stare wpisy (jobTitle/toRecruit) mapujemy do jednej pozycji
        const positions = row.positions
          ? objectToArray(row.positions).map((p: Record<string, unknown>) => ({
              ...p,
              toRecruit: Number(p.toRecruit) || 0,
            }))
          : row.jobTitle
            ? [{ id: 'legacy', jobTitle: row.jobTitle, toRecruit: Number(row.toRecruit) || 0 }]
            : [];
        return { ...row, positions, arrivals: objectToArray(row.arrivals) };
      }) as Recruitment[];
      setRecruitments(rows);
      setIsDataLoading(false);
    }, () => {
      setIsDataLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const sortedRecruitments = useMemo(
    () =>
      [...recruitments].sort((a, b) =>
        a.department.localeCompare(b.department, 'pl')
      ),
    [recruitments]
  );

  const totalToRecruit = recruitments.reduce(
    (sum, r) => sum + r.positions.reduce((s, p) => s + (Number(p.toRecruit) || 0), 0),
    0
  );
  const totalPositions = recruitments.reduce((s, r) => s + r.positions.length, 0);
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

  // Harmonogram obsady — 30 dni od dziś
  const harmonogramDays = useMemo(
    () => Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i)),
    []
  );

  const terminationsByDept = useMemo(() => {
    const map = new Map<string, string[]>();
    const today = startOfDay(new Date());
    activeEmployees.forEach(e => {
      const planned = parseMaybeDate(e.plannedTerminationDate);
      if (!planned || startOfDay(planned).getTime() < today.getTime()) return;
      const arr = map.get(e.department) ?? [];
      arr.push(format(planned, 'yyyy-MM-dd'));
      map.set(e.department, arr);
    });
    return map;
  }, [activeEmployees]);

  const arrivalsByDept = useMemo(() => {
    const map = new Map<string, { date: string; count: number }[]>();
    recruitments.forEach(r =>
      r.arrivals.forEach(a => {
        if (!a.date) return;
        const arr = map.get(r.department) ?? [];
        arr.push({ date: a.date, count: Number(a.count) || 0 });
        map.set(r.department, arr);
      })
    );
    return map;
  }, [recruitments]);

  const harmonogramRows = useMemo(() => {
    const depts = new Set<string>();
    recruitments.forEach(r => r.department && depts.add(r.department));
    activeEmployees.forEach(e => e.department && depts.add(e.department));
    return [...depts]
      .sort((a, b) => a.localeCompare(b, 'pl'))
      .map(dept => {
        const obecnie = headcountByDepartment.get(dept) ?? 0;
        const sumRekrut = recruitments
          .filter(r => r.department === dept)
          .reduce(
            (s, r) => s + r.positions.reduce((x, p) => x + (Number(p.toRecruit) || 0), 0),
            0
          );
        const potrzeby = obecnie + sumRekrut;
        const termDates = terminationsByDept.get(dept) ?? [];
        const arrivals = arrivalsByDept.get(dept) ?? [];
        const cells = harmonogramDays.map(d => {
          const key = format(d, 'yyyy-MM-dd');
          const mam =
            obecnie -
            termDates.filter(t => t <= key).length +
            arrivals.filter(a => a.date <= key).reduce((s, a) => s + a.count, 0);
          const newTerms = termDates.filter(t => t === key).length;
          const newArrivals = arrivals
            .filter(a => a.date === key)
            .reduce((s, a) => s + a.count, 0);
          const changes: string[] = [];
          if (newArrivals > 0) changes.push(`+${newArrivals} przyjęć`);
          if (newTerms > 0) changes.push(`−${newTerms} zwolnień`);
          return {
            key,
            mam,
            deficit: mam < potrzeby,
            title: changes.length > 0 ? changes.join(', ') : undefined,
          };
        });
        return { dept, potrzeby, obecnie, sumRekrut, cells };
      });
  }, [recruitments, activeEmployees, headcountByDepartment, terminationsByDept, arrivalsByDept, harmonogramDays]);

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
    map.forEach(entries => {
      entries.sort((a, b) => b.count - a.count || a.jobTitle.localeCompare(b.jobTitle, 'pl'));
    });
    return map;
  }, [activeEmployees, recruitments]);

  const usedDepartments = useMemo(
    () => new Set(recruitments.map(r => r.department)),
    [recruitments]
  );

  const availableDepartments = useMemo(
    () => config.departments.filter(d => !usedDepartments.has(d.name)),
    [config.departments, usedDepartments]
  );

  const getRowJobTitleOptions = (rowIndex: number) =>
    config.jobTitles.filter(
      jt =>
        !formRows.some((row, i) => i !== rowIndex && row.jobTitle === jt.name)
    );

  const canSubmitForm =
    !!newDepartment &&
    formRows.length > 0 &&
    formRows.every(r => r.jobTitle && parseInt(r.count, 10) >= 1) &&
    new Set(formRows.map(r => r.jobTitle)).size === formRows.length;

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
    if (!db || !newDepartment || !canSubmitForm) return;
    setIsAdding(true);
    try {
      const newRef = push(dbRef(db, 'recruitment'));
      await set(newRef, { department: newDepartment, createdAt: new Date().toISOString() });
      for (const row of formRows) {
        const posRef = push(dbRef(db, `recruitment/${newRef.key}/positions`));
        await set(posRef, {
          jobTitle: row.jobTitle,
          toRecruit: parseInt(row.count, 10),
        });
      }
      const totalOs = formRows.reduce((s, r) => s + parseInt(r.count, 10), 0);
      toast({
        title: formRows.length > 1 ? `Dodano ${formRows.length} stanowiska` : 'Dodano zapotrzebowanie',
        description: `${newDepartment} — ${totalOs} os. do rekrutacji`,
      });
      setNewDepartment('');
      setFormRows([{ jobTitle: '', count: '' }]);
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać zapotrzebowania.' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateDepartment = async (
    recruitment: Recruitment,
    department: string
  ): Promise<boolean> => {
    const db = getDB();
    if (!db) return false;
    const taken = recruitments.some(r => r.id !== recruitment.id && r.department === department);
    if (taken) {
      toast({
        variant: 'destructive',
        title: 'Duplikat',
        description: `Zapotrzebowanie dla działu ${department} już istnieje.`,
      });
      return false;
    }
    try {
      await update(dbRef(db, `recruitment/${recruitment.id}`), { department });
      toast({ title: 'Zapisano', description: department });
      return true;
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać zmian.' });
      return false;
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
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapotrzebowania.' });
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

      const orderRows = sortedRecruitments.map(r => {
        const planned = r.arrivals.reduce((s, a) => s + (Number(a.count) || 0), 0);
        const doRekrutacji = r.positions.reduce((s, p) => s + (Number(p.toRecruit) || 0), 0);
        const zwalnia = r.positions.reduce(
          (s, p) => s + (terminationsByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0),
          0
        );
        const potrzeby = r.positions.reduce((s, p) => {
          const obecnie = headcountByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0;
          const z = terminationsByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0;
          return s + Math.max(0, obecnie + (Number(p.toRecruit) || 0) - z);
        }, 0);
        const pozycje = r.positions.map(p => `${p.jobTitle}: ${p.toRecruit}`).join(', ');
        return [
          r.department,
          pozycje,
          headcountByDepartment.get(r.department) ?? 0,
          zwalnia,
          doRekrutacji,
          potrzeby,
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
          'Stanowiska (ile osób)',
          'Obecnie na dziale',
          'Zwalnia się',
          'Do zrekrutowania',
          'Potrzeby',
          'Zaplanowane przyjęcia',
          'Brakuje',
        ].map(n => ({ name: n, filterButton: true })),
        rows: orderRows,
      });
      ws1.getColumn(1).width = 28;
      ws1.getColumn(2).width = 46;
      [3, 4, 5, 6, 7, 8].forEach(col => (ws1.getColumn(col).width = 20));
      const uniqueDeptHeadcount = new Map<string, number>();
      sortedRecruitments.forEach(r => {
        if (!uniqueDeptHeadcount.has(r.department)) {
          uniqueDeptHeadcount.set(r.department, headcountByDepartment.get(r.department) ?? 0);
        }
      });
      const sumDeptHeadcount = [...uniqueDeptHeadcount.values()].reduce((a, b) => a + b, 0);
      const sumZwalniaAll = orderRows.reduce((s, row) => s + (Number(row[3]) || 0), 0);
      const sumPotrzebyAll = orderRows.reduce((s, row) => s + (Number(row[5]) || 0), 0);
      const totalRow = ws1.addRow([
        'RAZEM',
        '',
        sumDeptHeadcount,
        sumZwalniaAll,
        totalToRecruit,
        sumPotrzebyAll,
        totalPlanned,
        Math.max(0, totalToRecruit - totalPlanned),
      ]);
      totalRow.font = { bold: true };

      const positionRows = sortedRecruitments.flatMap(r =>
        r.positions.map(p => {
          const jobKey = `${r.department}|${p.jobTitle}`;
          const obecnie = headcountByDeptJob.get(jobKey) ?? 0;
          const zwalnia = terminationsByDeptJob.get(jobKey) ?? 0;
          const doRekrutacji = Number(p.toRecruit) || 0;
          return [
            r.department,
            p.jobTitle,
            obecnie,
            zwalnia,
            doRekrutacji,
            Math.max(0, obecnie + doRekrutacji - zwalnia),
          ];
        })
      );

      const ws2 = wb.addWorksheet('Stanowiska');
      ws2.addTable({
        name: 'Stanowiska',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: [
          'Dział',
          'Stanowisko',
          'Obecnie na stanowisku',
          'Zwalnia się',
          'Do zrekrutowania',
          'Potrzeby',
        ].map(n => ({ name: n, filterButton: true })),
        rows: positionRows,
      });
      ws2.getColumn(1).width = 28;
      ws2.getColumn(2).width = 26;
      [3, 4, 5, 6].forEach(col => (ws2.getColumn(col).width = 20));

      const arrivalRows = sortedRecruitments.flatMap(r =>
        r.arrivals.length === 0
          ? [[r.department, '—', 0]]
          : [...r.arrivals]
              .sort((a, b) => {
                const da = parseMaybeDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                const dbTime = parseMaybeDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                return da - dbTime;
              })
              .map(a => [r.department, formatDate(a.date) || '—', Number(a.count) || 0])
      );

      const ws3 = wb.addWorksheet('Daty przyjęć');
      ws3.addTable({
        name: 'DatyPrzyjec',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: ['Dział', 'Data przyjęcia', 'Liczba osób'].map(n => ({
          name: n,
          filterButton: true,
        })),
        rows: arrivalRows,
      });
      ws3.getColumn(1).width = 28;
      ws3.getColumn(2).width = 18;
      ws3.getColumn(3).width = 16;

      // Arkusz 4: Harmonogram obsady — 30 dni, deficyt na czerwono
      // Pod każdym działem rozwijane wiersze stanowisk (grupa Excel — plus/minus po lewej)
      const ws4 = wb.addWorksheet('Harmonogram obsady');
      const harmonogramTableRows: (string | number)[][] = [];
      const harmonogramSubRows: boolean[] = [];
      harmonogramRows.forEach(row => {
        harmonogramTableRows.push([
          row.dept,
          row.potrzeby,
          row.obecnie,
          ...row.cells.map(c => c.mam),
        ]);
        harmonogramSubRows.push(false);
        (jobTitlesByDepartment.get(row.dept) ?? []).forEach(s => {
          harmonogramTableRows.push([
            `   • ${s.jobTitle}`,
            Math.max(0, s.count + s.toRecruit - s.terminations),
            s.count,
            ...harmonogramDays.map(() => ''),
          ]);
          harmonogramSubRows.push(true);
        });
      });
      ws4.addTable({
        name: 'HarmonogramObsady',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: ['Dział', 'Potrzeby', 'Mam teraz', ...harmonogramDays.map(d => `Mam ${format(d, 'dd.MM')}`)].map(
          n => ({ name: n, filterButton: false })
        ),
        rows: harmonogramTableRows,
      });
      harmonogramSubRows.forEach((isSub, i) => {
        const sheetRow = ws4.getRow(i + 2);
        if (isSub) {
          sheetRow.outlineLevel = 1;
          sheetRow.font = { italic: true, color: { argb: 'FF6B7280' } };
        }
      });
      ws4.getColumn(1).width = 24;
      ws4.getColumn(2).width = 12;
      ws4.getColumn(3).width = 12;
      harmonogramRows.forEach((row, i) => {
        const subCount = (jobTitlesByDepartment.get(row.dept) ?? []).length;
        if (subCount === 0) return;
        const offset = harmonogramRows
          .slice(0, i)
          .reduce((s, r) => s + (jobTitlesByDepartment.get(r.dept)?.length ?? 0) + 1, 0);
        row.cells.forEach((cell, j) => {
          if (cell.deficit) {
            const tableCell = ws4.getRow(offset + 2).getCell(4 + j);
            tableCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
            tableCell.font = { color: { argb: 'FF9C0006' }, bold: true };
          }
        });
      });

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
              <div className="flex overflow-hidden rounded-lg border border-border">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'karty' ? 'default' : 'ghost'}
                  className="rounded-none border-0"
                  onClick={() => setView('karty')}
                >
                  Zapotrzebowania
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'harmonogram' ? 'default' : 'ghost'}
                  className="rounded-none border-0"
                  onClick={() => setView('harmonogram')}
                >
                  Harmonogram obsady (30 dni)
                </Button>
              </div>
            </div>

            {view === 'harmonogram' ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Harmonogram obsady — 30 dni ({format(harmonogramDays[0], 'dd.MM')} –{' '}
                    {format(harmonogramDays[harmonogramDays.length - 1], 'dd.MM')})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded bg-emerald-500/60" />
                      obsada wystarczająca
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded bg-destructive/70" />
                      deficyt (poniżej Potrzeby)
                    </span>
                    <span>
                      Mamy [dzień] = obecnie − zwolnienia (od tego dnia) + przyjęcia (od tego dnia)
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-max border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 min-w-[160px] border-b bg-background px-3 py-2 text-left font-semibold">
                            Dział
                          </th>
                          <th className="sticky left-[160px] z-10 border-b bg-background px-3 py-2 text-right font-semibold">
                            Potrzeby
                          </th>
                          <th className="sticky left-[220px] z-10 border-b bg-background px-3 py-2 text-right font-semibold">
                            Za raz
                          </th>
                          {harmonogramDays.map((d, i) => (
                            <th
                              key={d.toISOString()}
                              className={
                                'border-b px-2.5 py-2 text-center font-semibold tabular-nums' +
                                (i === 0 ? ' bg-primary/5' : '')
                              }
                            >
                              {format(d, 'dd.MM')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {harmonogramRows.map(row => {
                          const isExpanded = expandedDept === row.dept;
                          const stats = jobTitlesByDepartment.get(row.dept) ?? [];
                          return (
                            <React.Fragment key={row.dept}>
                              <tr
                                className="cursor-pointer border-b border-border/40 hover:bg-muted/40"
                                onClick={() => setExpandedDept(isExpanded ? null : row.dept)}
                              >
                                <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium">
                                  <span className="flex items-center gap-1.5">
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                    {row.dept}
                                  </span>
                                </td>
                                <td className="sticky left-[160px] z-10 bg-background px-3 py-2 text-right font-semibold tabular-nums">
                                  {row.potrzeby}
                                </td>
                                <td className="sticky left-[220px] z-10 bg-background px-3 py-2 text-right tabular-nums">
                                  {row.obecnie}
                                </td>
                                {row.cells.map(cell => (
                                  <td
                                    key={cell.key}
                                    title={cell.title}
                                    className={
                                      'px-2.5 py-2 text-center tabular-nums' +
                                      (cell.deficit
                                        ? ' bg-destructive/15 font-semibold text-destructive'
                                        : cell.title
                                          ? ' bg-emerald-500/15'
                                          : '')
                                    }
                                  >
                                    {cell.mam}
                                  </td>
                                ))}
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={3 + harmonogramDays.length} className="bg-muted/40 px-6 py-3">
                                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                      Stanowiska w dziale ({formatHeadcount(row.obecnie)}):
                                    </p>
                                    {stats.length === 0 ? (
                                      <p className="text-xs text-muted-foreground">
                                        Brak aktywnych pracowników w tym dziale.
                                      </p>
                                    ) : (
                                      <div className="space-y-1">
                                        {stats.map(s => (
                                          <div
                                            key={s.jobTitle}
                                            className="flex flex-wrap items-center justify-between gap-x-3 text-xs"
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
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {harmonogramRows.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Brak danych — dodaj zapotrzebowanie lub pracowników.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <Users className="h-4 w-4" />
                Zapotrzebowania: {recruitments.length}
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

            <Card>
              <CardContent className="space-y-3 pt-6">
                <Select
                  value={newDepartment}
                  onValueChange={value => {
                    setNewDepartment(value);
                    setFormRows([{ jobTitle: '', count: '' }]);
                  }}
                >
                  <SelectTrigger className="w-full lg:w-80" aria-label="Wybierz dział">
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

                {newDepartment && (
                  <div className="space-y-2">
                    {formRows.map((row, index) => {
                      const rowOptions = getRowJobTitleOptions(index);
                      return (
                        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Select
                            value={row.jobTitle}
                            onValueChange={value =>
                              setFormRows(prev =>
                                prev.map((r, i) => (i === index ? { ...r, jobTitle: value } : r))
                              )
                            }
                          >
                            <SelectTrigger
                              className="w-full sm:w-64"
                              aria-label={`Stanowisko — wiersz ${index + 1}`}
                            >
                              <SelectValue placeholder="Wybierz stanowisko…" />
                            </SelectTrigger>
                            <SelectContent>
                              {rowOptions.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                  Brak dostępnych stanowisk.
                                </p>
                              ) : (
                                rowOptions.map(jt => (
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
                            value={row.count}
                            onChange={e =>
                              setFormRows(prev =>
                                prev.map((r, i) => (i === index ? { ...r, count: e.target.value } : r))
                              )
                            }
                            className="w-full sm:w-32"
                            aria-label={`Liczba osób — stanowisko ${index + 1}`}
                          />
                          {formRows.length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setFormRows(prev => prev.filter((_, i) => i !== index))}
                              aria-label={`Usuń wiersz ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => setFormRows(prev => [...prev, { jobTitle: '', count: '' }])}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Dodaj stanowisko
                    </Button>
                  </div>
                )}

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

                <div className="flex justify-end">
                  <Button className="gap-2" disabled={!canSubmitForm || isAdding} onClick={handleAdd}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {formRows.length > 1 ? `Dodaj zapotrzebowanie (${formRows.length} stanowiska)` : 'Dodaj'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {recruitments.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  <UserPlus className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  Brak danych — wybierz dział i stanowiska powyżej, aby zaplanować rekrutację.
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
                    departmentHeadcount={headcountByDepartment.get(recruitment.department) ?? 0}
                    headcountByDeptJob={headcountByDeptJob}
                    terminationsByDeptJob={terminationsByDeptJob}
                    jobTitleStats={jobTitlesByDepartment.get(recruitment.department) ?? []}
                    onUpdateDepartment={handleUpdateDepartment}
                    onDelete={setToDelete}
                  />
                ))}
              </div>
            )}
              </>
            )}
          </div>

          <AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Usunąć zapotrzebowanie?</AlertDialogTitle>
                <AlertDialogDescription>
                  Zapotrzebowanie dla działu „{toDelete?.department}” ({toDelete?.positions.length ?? 0}{' '}
                  pozycji) zostanie usunięte razem z liczbami osób i wszystkimi datami przyjęć. Tej
                  operacji nie można cofnąć.
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
