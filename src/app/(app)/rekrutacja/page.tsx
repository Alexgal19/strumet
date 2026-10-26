'use client';

import { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref as dbRef, remove, set, update } from 'firebase/database';
import { startOfDay } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import { objectToArray } from '@/lib/utils';
import { parseMaybeDate } from '@/lib/date';
import type { Recruitment } from '@/lib/types';
import { HarmonogramView } from '@/components/harmonogram-view';
import { Loader2 } from 'lucide-react';
import { RecruitmentPageHeader } from '@/components/rekrutacja/recruitment-page-header';
import { RecruitmentViewToggle } from '@/components/rekrutacja/recruitment-view-toggle';
import { RecruitmentStatsBar } from '@/components/rekrutacja/recruitment-stats-bar';
import { AddRecruitmentForm } from '@/components/rekrutacja/add-recruitment-form';
import { RecruitmentList } from '@/components/rekrutacja/recruitment-list';
import { RecruitmentDeleteDialog } from '@/components/rekrutacja/recruitment-delete-dialog';
import {
  buildHarmonogramData,
  buildJobTitlesByDepartment,
  buildSelectedDepartmentStats,
} from '@/components/rekrutacja/recruitment-derived';
import { exportRecruitmentToExcel } from '@/components/rekrutacja/export-rekrutacja';

export default function RekrutacjaPage() {
  const { isLoading: isContextLoading, config, employees: allEmployees, absences } = useAppContext();
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


  const jobTitlesByDepartment = useMemo(
    () => buildJobTitlesByDepartment(activeEmployees, recruitments),
    [activeEmployees, recruitments]
  );

  const harmonogramData = useMemo(
    () => buildHarmonogramData(allEmployees, absences, recruitments),
    [allEmployees, absences, recruitments]
  );

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

  const selectedDepartmentStats = useMemo(
    () => buildSelectedDepartmentStats(activeEmployees, newDepartment),
    [activeEmployees, newDepartment]
  );

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

  const handleExport = () =>
    exportRecruitmentToExcel({
      recruitments,
      sortedRecruitments,
      headcountByDepartment,
      headcountByDeptJob,
      terminationsByDeptJob,
      totalToRecruit,
      totalPlanned,
      toast,
    });

  const isLoading = isContextLoading || isDataLoading || isEmployeesLoading;

  return (
    <div className="h-full flex flex-col">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <RecruitmentPageHeader
            canExport={recruitments.length > 0}
            onExport={handleExport}
          />

          <div className="flex flex-col gap-4 overflow-y-auto pb-6">
            <RecruitmentViewToggle view={view} onViewChange={setView} />

            {view === 'harmonogram' ? (
              <HarmonogramView data={harmonogramData} />
            ) : (
              <>
                <RecruitmentStatsBar
                  recruitmentsCount={recruitments.length}
                  totalPositions={totalPositions}
                  totalToRecruit={totalToRecruit}
                  totalPlanned={totalPlanned}
                />

                <AddRecruitmentForm
                  newDepartment={newDepartment}
                  onDepartmentChange={value => {
                    setNewDepartment(value);
                    setFormRows([{ jobTitle: '', count: '' }]);
                  }}
                  availableDepartments={availableDepartments}
                  headcountByDepartment={headcountByDepartment}
                  formRows={formRows}
                  setFormRows={setFormRows}
                  getRowJobTitleOptions={getRowJobTitleOptions}
                  selectedDepartmentStats={selectedDepartmentStats}
                  canSubmitForm={canSubmitForm}
                  isAdding={isAdding}
                  onSubmit={handleAdd}
                />

                <RecruitmentList
                  sortedRecruitments={sortedRecruitments}
                  departments={config.departments}
                  jobTitles={config.jobTitles}
                  headcountByDepartment={headcountByDepartment}
                  headcountByDeptJob={headcountByDeptJob}
                  terminationsByDeptJob={terminationsByDeptJob}
                  jobTitlesByDepartment={jobTitlesByDepartment}
                  onUpdateDepartment={handleUpdateDepartment}
                  onDelete={setToDelete}
                />
              </>
            )}
          </div>

          <RecruitmentDeleteDialog
            toDelete={toDelete}
            isDeleting={isDeleting}
            onConfirm={confirmDelete}
            onOpenChange={open => !open && setToDelete(null)}
          />
        </>
      )}
    </div>
  );
}
