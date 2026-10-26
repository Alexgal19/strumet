'use client';

import { useMemo, useState } from 'react';
import { push, ref as dbRef, remove, set, update } from 'firebase/database';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import { parseMaybeDate } from '@/lib/date';
import type { Recruitment, RecruitmentPosition } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { RecruitmentCardHeader } from './recruitment-card-header';
import { RecruitmentPositionsEditor } from './recruitment-positions-editor';
import { RecruitmentDepartmentStats } from './recruitment-department-stats';
import { RecruitmentArrivalsEditor } from './recruitment-arrivals-editor';

export const RecruitmentCard = ({
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
  const [draftPositions, setDraftPositions] = useState<{ jobTitle: string; count: string }[]>([]);
  const [isSavingPositions, setIsSavingPositions] = useState(false);

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

  const handleAddPositionDraft = () => {
    setDraftPositions(prev => [...prev, { jobTitle: '', count: '' }]);
  };

  const handleRemoveDraftPosition = (index: number) => {
    setDraftPositions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraftPositions = async () => {
    const db = getDB();
    if (!db) return;

    const validDrafts = draftPositions.filter(d => d.jobTitle && parseInt(d.count, 10) > 0);
    if (validDrafts.length === 0) {
      setDraftPositions([]);
      return;
    }

    setIsSavingPositions(true);
    try {
      for (const row of validDrafts) {
        const posRef = push(dbRef(db, `recruitment/${recruitment.id}/positions`));
        await set(posRef, { jobTitle: row.jobTitle, toRecruit: parseInt(row.count, 10) });
      }
      setDraftPositions([]);
      toast({ title: 'Zapisano', description: 'Dodano nowe stanowiska.' });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać stanowisk.' });
    } finally {
      setIsSavingPositions(false);
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
      <RecruitmentCardHeader
        recruitment={recruitment}
        departments={departments}
        isEditingDept={isEditingDept}
        deptDraft={deptDraft}
        setDeptDraft={setDeptDraft}
        isSavingDept={isSavingDept}
        startEditingDept={startEditingDept}
        handleSaveDept={handleSaveDept}
        setIsEditingDept={setIsEditingDept}
        onDelete={onDelete}
        positionCount={positions.length}
        departmentHeadcount={departmentHeadcount}
        sumZwalnia={sumZwalnia}
        sumPotrzeby={sumPotrzeby}
        missing={missing}
        sumToRecruit={sumToRecruit}
        surplus={surplus}
        plannedTotal={plannedTotal}
      />
      <CardContent className="space-y-3">
        <RecruitmentPositionsEditor
          recruitment={recruitment}
          positions={positions}
          jobTitles={jobTitles}
          draftPositions={draftPositions}
          setDraftPositions={setDraftPositions}
          isSavingPositions={isSavingPositions}
          handleAddPositionDraft={handleAddPositionDraft}
          handleRemoveDraftPosition={handleRemoveDraftPosition}
          handleSaveDraftPositions={handleSaveDraftPositions}
          handlePositionJobTitleChange={handlePositionJobTitleChange}
          handleRemovePosition={handleRemovePosition}
          getPositionOptions={getPositionOptions}
          getPositionStat={getPositionStat}
        />

        <RecruitmentDepartmentStats
          jobTitleStats={jobTitleStats}
          departmentHeadcount={departmentHeadcount}
          positions={positions}
        />

        <RecruitmentArrivalsEditor
          recruitmentId={recruitment.id}
          sortedArrivals={sortedArrivals}
          plannedTotal={plannedTotal}
          isAddingArrival={isAddingArrival}
          handleAddArrival={handleAddArrival}
          handleRemoveArrival={handleRemoveArrival}
        />
      </CardContent>
    </Card>
  );
};
