'use client';

import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import { type HarmonogramData } from '@/lib/harmonogram';
import { useToast } from '@/hooks/use-toast';
import { usePublicZapotrzebowaniaStats } from './use-public-zapotrzebowania-stats';
import { useZapotrzebowaniaModel } from './zapotrzebowania-model';
import { useZapotrzebowaniaActions } from './use-zapotrzebowania-actions';
import { BulkArrivalsDialog } from './bulk-arrivals-dialog';
import { DemandSummary } from './demand-summary';
import { DemandToolbar } from './demand-toolbar';
import { DeptDemandCard } from './dept-demand-card';
import type { DemandRenderContext } from './demand-context';

export function PublicZapotrzebowaniaView({ data, setData, onUpdatePotrzeby }: { data: HarmonogramData, setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>>, onUpdatePotrzeby?: (dept: string, mgr: string, job: string, newAmount: number) => void | boolean | Promise<boolean | void> }) {
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

  const todayYmd = format(new Date(), 'yyyy-MM-dd');

  const model = useZapotrzebowaniaModel({
    jobTitlesByDept,
    planowanePrzyjecia: data.planowanePrzyjecia,
    todayYmd,
    query,
    onlyProblems,
    sortMode,
  });

  const {
    saveComment,
    addArrival,
    addArrivalFromInputs,
    commitPotrzeby,
    updateArrival,
    removeArrival,
  } = useZapotrzebowaniaActions({
    data,
    setData,
    onUpdatePotrzeby,
    isAdmin,
    currentUserEmail: currentUser?.email,
    logAudit,
    toast,
    newArrivalDate,
    newArrivalCount,
    commentDrafts,
    setEditingComment,
    setNewArrivalDate,
    setNewArrivalCount,
  });

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
        planned: jobs.map(j => model.getPlannedTotalForJob(dept, j.jobTitle)),
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

  const ctx: DemandRenderContext = {
    isAdmin,
    todayYmd,
    plus7: model.plus7,
    plus30: model.plus30,
    comments: data.komentarzeZapotrzebowania,
    collapsedDepts,
    expandedJobs,
    expandedTerminations,
    newArrivalDate,
    newArrivalCount,
    commentDrafts,
    editingComment,
    toggleDept: dept => setCollapsedDepts(prev => ({ ...prev, [dept]: !prev[dept] })),
    toggleJob: key => setExpandedJobs(prev => ({ ...prev, [key]: !prev[key] })),
    toggleTermination: key => setExpandedTerminations(prev => ({ ...prev, [key]: !prev[key] })),
    setNewArrivalDate,
    setNewArrivalCount,
    startComment: (cKey, savedText) => {
      setCommentDrafts(prev => ({ ...prev, [cKey]: savedText ?? '' }));
      setEditingComment(prev => ({ ...prev, [cKey]: true }));
    },
    setCommentDraft: (cKey, value) => setCommentDrafts(prev => ({ ...prev, [cKey]: value })),
    cancelComment: cKey => setEditingComment(prev => ({ ...prev, [cKey]: false })),
    saveComment,
    commitPotrzeby,
    addArrival: addArrivalFromInputs,
    updateArrival,
    removeArrival,
  };

  return (
    <>
      <DemandSummary
        totalMissingToday={model.totalMissingToday}
        totalTerminations={model.totalTerminations}
        totalPlanned={model.totalPlanned}
      />

      <DemandToolbar
        query={query}
        onQueryChange={setQuery}
        onlyProblems={onlyProblems}
        onToggleOnlyProblems={() => setOnlyProblems(v => !v)}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        onOpenBulk={() => setBulkOpen(true)}
      />

      {model.deptModels.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-foreground">
            {onlyProblems || query.trim() ? 'Brak wyników dla wybranych filtrów.' : 'Brak stanowisk.'}
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col gap-5">
        {model.deptModels.map(m => (
          <DeptDemandCard key={m.dept} model={m} flash={!!flashDepts[m.dept]} ctx={ctx} />
        ))}
      </div>
      <p className="text-sm text-foreground">
        Teraz = Potrzeby − Jest. Za 7 / 30 dni = prognoza po zwolnieniach (brak liczony od dnia po ostatnim dniu pracy) i zaplanowanych przyjęciach.
        Brakuje netto = stan docelowy po wszystkich zwolnieniach i przyjęciach. Kliknij stanowisko, aby dodać przyjęcie lub komentarz.
      </p>

      <BulkArrivalsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        options={model.bulkOptions}
        todayYmd={todayYmd}
        onAdd={(dept, job, date, count) => addArrival(dept, job, date, count, true)}
      />
    </>
  );
}
