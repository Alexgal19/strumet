'use client';

import { useMemo } from 'react';
import { startOfDay, format } from 'date-fns';
import { type HarmonogramData, buildHarmonogram } from '@/lib/harmonogram';
import { isPendingTermination } from '@/lib/przyjecia-historia';
import { toYmd } from '@/lib/date';

type JobTitleStat = { jobTitle: string; count: number; toRecruit: number; terminations: number };

export function usePublicZapotrzebowaniaStats(data: HarmonogramData) {
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
