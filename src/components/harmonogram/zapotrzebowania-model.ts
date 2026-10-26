'use client';

import { useMemo } from 'react';
import { addDaysToYmd, forecastShortage, shortageAt } from '@/lib/braki-prognoza';
import { toYmd } from '@/lib/date';
import type { HarmonogramData } from '@/lib/harmonogram';
import type { BulkOptions, DeptDemandModel, JobTitlesByDept, PlannedArrival } from './demand-types';

type PlannedIndex = {
  list: Map<string, PlannedArrival[]>;
  total: Map<string, number>;
};

export function useZapotrzebowaniaModel({
  jobTitlesByDept,
  planowanePrzyjecia,
  todayYmd,
  query,
  onlyProblems,
  sortMode,
}: {
  jobTitlesByDept: JobTitlesByDept;
  planowanePrzyjecia: HarmonogramData['planowanePrzyjecia'];
  todayYmd: string;
  query: string;
  onlyProblems: boolean;
  sortMode: 'deficit' | 'name';
}) {
  // Indeks przyjęć (dział|stanowisko → lista i suma), liczony raz na zmianę danych/daty.
  // W Zapotrzebowania tylko nadchodzące (data >= dziś); minione trafiają do Historii.
  const plannedIndex = useMemo<PlannedIndex>(() => {
    const list = new Map<string, PlannedArrival[]>();
    const total = new Map<string, number>();
    Object.values(planowanePrzyjecia || {}).forEach(p => {
      if (!isUpcomingArrival(p.date, todayYmd)) return;
      const k = `${p.department}|${p.jobTitle}`;
      const arr = list.get(k) ?? [];
      arr.push(p);
      list.set(k, arr);
      if (isCountableArrival(p.date, todayYmd)) total.set(k, (total.get(k) ?? 0) + p.count);
    });
    return { list, total };
  }, [planowanePrzyjecia, todayYmd]);

  return useMemo(() => {
    const getPlannedForJob = (dept: string, jobTitle: string) =>
      plannedIndex.list.get(`${dept}|${jobTitle}`) ?? [];
    const getPlannedTotalForJob = (dept: string, jobTitle: string) =>
      plannedIndex.total.get(`${dept}|${jobTitle}`) ?? 0;

    const getMissing = (dept: string, jobTitle: string) => {
      const jobs = jobTitlesByDept.get(dept);
      const job = jobs?.find(j => j.jobTitle === jobTitle);
      if (!job) return 0;
      return Math.max(0, job.potrzeby - (job.obecnie - job.zwalnia));
    };

    // Braki netto liczymy per stanowisko (nadmiar przyjęć na jednym stanowisku nie pokrywa braków
    // na innym), a sumy działu i ogółu są sumą tych wartości — dzięki temu zgadzają się z kartami.
    const getNetMissing = (dept: string, jobTitle: string) =>
      Math.max(0, getMissing(dept, jobTitle) - getPlannedTotalForJob(dept, jobTitle));

    // "Łącznie brakuje" = braki NA DZIŚ (Potrzeby − Jest per stanowisko, jak kolumna "Teraz"),
    // bez zwolnień i przyjęć z przyszłości — te widać w kolumnach prognozy i w "Brakuje netto".
    let totalMissingToday = 0;
    let totalTerminations = 0;
    let totalPlanned = 0;
    jobTitlesByDept.forEach((jobs, dept) => {
      jobs.forEach(job => {
        totalMissingToday += Math.max(0, job.potrzeby - job.obecnie);
        totalTerminations += job.zwalnia;
        totalPlanned += getPlannedTotalForJob(dept, job.jobTitle);
      });
    });

    // ---- Model tabeli: dział → stanowiska, z prognozą "teraz / za 7 / za 30 dni" ----
    const plus7 = addDaysToYmd(todayYmd, 7);
    const plus30 = addDaysToYmd(todayYmd, 30);
    const q = query.trim().toLowerCase();

    const deptModels: DeptDemandModel[] = Array.from(jobTitlesByDept.entries()).map(([dept, jobs]) => {
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

    const bulkOptions: BulkOptions = new Map();
    jobTitlesByDept.forEach((jobs, dept) => {
      bulkOptions.set(dept, jobs.map(j => ({ jobTitle: j.jobTitle, net: getNetMissing(dept, j.jobTitle) })));
    });

    return {
      deptModels,
      bulkOptions,
      plannedIndex,
      getPlannedTotalForJob,
      totalMissingToday,
      totalTerminations,
      totalPlanned,
      plus7,
      plus30,
    };
  }, [jobTitlesByDept, plannedIndex, todayYmd, query, onlyProblems, sortMode]);
}

const isUpcomingArrival = (date: string | undefined, todayYmd: string) => {
  if (!date) return true;
  const ymd = toYmd(date);
  // Пошкоджену дату не губимо — як у splitArrivals.
  if (!ymd) return true;
  return ymd >= todayYmd;
};

// Tylko wpisy z poprawną datą liczą się do pokrycia — tak samo jak forecastShortage
// (pomija nieprawidłowe daty). Wpis bez daty nadal jest widoczny na liście do poprawy.
const isCountableArrival = (date: string | undefined, todayYmd: string) => {
  if (!date) return false;
  const ymd = toYmd(date);
  if (!ymd) return false;
  return ymd >= todayYmd;
};
