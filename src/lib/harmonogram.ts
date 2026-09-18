import { addDays, addMonths, format, getDaysInMonth, startOfDay, startOfMonth } from 'date-fns';
import { pl as plLocale } from 'date-fns/locale';

export interface HarmonogramEmployee {
  department: string;
  jobTitle: string;
  fullName: string;
  manager?: string;
  hireDate?: string;
  vacationStartDate?: string;
  vacationEndDate?: string;
  plannedTerminationDate?: string;
}

export interface HarmonogramAbsence {
  date: string; // YYYY-MM-DD
  department: string;
  jobTitle: string;
  fullName: string;
  manager?: string;
}

export interface HarmonogramRecruitment {
  department: string;
  positions: { jobTitle: string; toRecruit: number }[];
  arrivals: { date: string; count: number }[];
}

export interface HarmonogramData {
  employees: HarmonogramEmployee[];
  absences: HarmonogramAbsence[];
  recruitments: HarmonogramRecruitment[];
}

export interface HarmonogramCell {
  mam: number;
  absentees: HarmonogramAbsence[];
  vacationers: HarmonogramEmployee[];
  title?: string;
}

export interface HarmonogramPositionRow {
  jobTitle: string;
  potrzeby: number;
  obecnie: number;
  cells: HarmonogramCell[];
}

export interface HarmonogramRow {
  dept: string;
  potrzeby: number;
  obecnie: number;
  cells: HarmonogramCell[];
  positions: HarmonogramPositionRow[];
}

export interface HarmonogramResult {
  monthDate: Date;
  monthLabel: string;
  days: Date[];
  rows: HarmonogramRow[];
}

const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

export function buildHarmonogram(
  data: HarmonogramData,
  monthOffset = 0,
  now: Date = new Date()
): HarmonogramResult {
  const monthDate = startOfMonth(addMonths(now, monthOffset));
  const days = Array.from({ length: getDaysInMonth(monthDate) }, (_, i) =>
    addDays(monthDate, i)
  );
  const today = startOfDay(now);

  // Zwolnienia planowane per dziaĹ‚ (data >= dziĹ›)
  const terminationsByDept = new Map<string, string[]>();
  data.employees.forEach(e => {
    const planned = e.plannedTerminationDate
      ? startOfDay(new Date(e.plannedTerminationDate))
      : null;
    if (!planned || Number.isNaN(planned.getTime())) return;
    const arr = terminationsByDept.get(e.department) ?? [];
    arr.push(dayKey(planned));
    terminationsByDept.set(e.department, arr);
  });

  const hiresByDept = new Map<string, string[]>();
  data.employees.forEach(e => {
    const hire = e.hireDate ? startOfDay(new Date(e.hireDate)) : null;
    if (!hire || Number.isNaN(hire.getTime())) return;
    const arr = hiresByDept.get(e.department) ?? [];
    arr.push(dayKey(hire));
    hiresByDept.set(e.department, arr);
  });

  // Urlopy per dziaĹ‚ i dziaĹ‚Â·stanowisko
  const vacationsByDept = new Map<
    string,
    { start: string; end: string; employee: HarmonogramEmployee }[]
  >();
  const vacationsByDeptJob = new Map<
    string,
    { start: string; end: string; employee: HarmonogramEmployee }[]
  >();
  data.employees.forEach(e => {
    if (!e.vacationStartDate) return;
    const start = startOfDay(new Date(e.vacationStartDate));
    if (Number.isNaN(start.getTime())) return;
    const endRaw = e.vacationEndDate ? new Date(e.vacationEndDate) : null;
    const entry = {
      start: dayKey(start),
      end: endRaw && !Number.isNaN(endRaw.getTime()) ? dayKey(startOfDay(endRaw)) : '9999-12-31',
      employee: e,
    };
    const arrDept = vacationsByDept.get(e.department) ?? [];
    arrDept.push(entry);
    vacationsByDept.set(e.department, arrDept);
    const keyJob = `${e.department}|${e.jobTitle}`;
    const arrJob = vacationsByDeptJob.get(keyJob) ?? [];
    arrJob.push(entry);
    vacationsByDeptJob.set(keyJob, arrJob);
  });

  // NieobecnoĹ›ci per dziaĹ‚ i dziaĹ‚Â·stanowisko
  const absencesByDept = new Map<string, Map<string, HarmonogramAbsence[]>>();
  const absencesByDeptJob = new Map<string, Map<string, HarmonogramAbsence[]>>();
  data.absences.forEach(a => {
    if (!a.date) return;
    const byDept = absencesByDept.get(a.department) ?? new Map<string, HarmonogramAbsence[]>();
    const listDept = byDept.get(a.date) ?? [];
    listDept.push(a);
    byDept.set(a.date, listDept);
    absencesByDept.set(a.department, byDept);
    const keyJob = `${a.department}|${a.jobTitle}`;
    const byDateJob = absencesByDeptJob.get(keyJob) ?? new Map<string, HarmonogramAbsence[]>();
    const listJob = byDateJob.get(a.date) ?? [];
    listJob.push(a);
    byDateJob.set(a.date, listJob);
    absencesByDeptJob.set(keyJob, byDateJob);
  });

  // Obsada: dziaĹ‚y, stan na dziĹ›
  const headcountByDept = new Map<string, number>();
  const headcountByDeptJob = new Map<string, number>();
  const jobTitlesByDept = new Map<
    string,
    { jobTitle: string; count: number; toRecruit: number; terminations: number }[]
  >();
  data.employees.forEach(e => {
    headcountByDept.set(e.department, (headcountByDept.get(e.department) ?? 0) + 1);
    const keyJob = `${e.department}|${e.jobTitle}`;
    headcountByDeptJob.set(keyJob, (headcountByDeptJob.get(keyJob) ?? 0) + 1);
    let entries = jobTitlesByDept.get(e.department);
    if (!entries) {
      entries = [];
      jobTitlesByDept.set(e.department, entries);
    }
    const terminating =
      !!e.plannedTerminationDate &&
      startOfDay(new Date(e.plannedTerminationDate)).getTime() >= today.getTime();
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

  // PrzydziaĹ‚ przyjÄ™Ä‡ do pozycji zamĂłwienia (po kolei)
  const positionTimelines = new Map<
    string,
    { hireDates: string[]; termDates: string[]; arrivals: { date: string; count: number }[] }
  >();
  const ensureTimeline = (key: string) => {
    let entry = positionTimelines.get(key);
    if (!entry) {
      entry = { hireDates: [], termDates: [], arrivals: [] };
      positionTimelines.set(key, entry);
    }
    return entry;
  };
  data.employees.forEach(e => {
    const tl = ensureTimeline(`${e.department}|${e.jobTitle}`);
    const hire = e.hireDate ? startOfDay(new Date(e.hireDate)) : null;
    if (hire && !Number.isNaN(hire.getTime())) tl.hireDates.push(dayKey(hire));
    const planned = e.plannedTerminationDate
      ? startOfDay(new Date(e.plannedTerminationDate))
      : null;
    if (planned && !Number.isNaN(planned.getTime())) tl.termDates.push(dayKey(planned));
  });
  data.recruitments.forEach(r => {
    const slots = r.positions.map(p => ({ jobTitle: p.jobTitle, left: Number(p.toRecruit) || 0 }));
    [...r.arrivals]
      .filter(a => a.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(a => {
        let left = Number(a.count) || 0;
        for (const slot of slots) {
          if (left <= 0) break;
          if (slot.left <= 0) continue;
          const take = Math.min(slot.left, left);
          ensureTimeline(`${r.department}|${slot.jobTitle}`).arrivals.push({
            date: a.date,
            count: take,
          });
          slot.left -= take;
          left -= take;
        }
      });
  });

  const depts = new Set<string>();
  data.recruitments.forEach(r => r.department && depts.add(r.department));
  data.employees.forEach(e => e.department && depts.add(e.department));

  const rows: HarmonogramRow[] = [...depts]
    .sort((a, b) => a.localeCompare(b, 'pl'))
    .map(dept => {
      const obecnie = headcountByDept.get(dept) ?? 0;
      const sumRekrut = data.recruitments
        .filter(r => r.department === dept)
        .reduce(
          (s, r) => s + r.positions.reduce((x, p) => x + (Number(p.toRecruit) || 0), 0),
          0
        );
      const potrzeby = obecnie + sumRekrut;
      const termDates = terminationsByDept.get(dept) ?? [];
      const vacations = vacationsByDept.get(dept) ?? [];
      const deptAbsences = absencesByDept.get(dept);

      const cells: HarmonogramCell[] = days.map(d => {
        const key = dayKey(d);
        const absentees = deptAbsences?.get(key) ?? [];
        const vacationers = vacations
          .filter(v => v.start <= key && key <= v.end)
          .map(v => v.employee);
        const mam =
          obecnie -
          (hiresByDept.get(dept)?.filter(h => h > key).length ?? 0) -
          termDates.filter(t => t < key).length +
          arrivalsOf(dept, data)
            .filter(a => a.date <= key)
            .reduce((s, a) => s + a.count, 0) -
          absentees.length -
          vacationers.length;
        const title = buildTitle({ absentees, vacationers, mam });
        return { mam, absentees, vacationers, title };
      });

      const positions: HarmonogramPositionRow[] = (jobTitlesByDept.get(dept) ?? []).map(s => {
        const tl = positionTimelines.get(`${dept}|${s.jobTitle}`);
        const jobAbsences = absencesByDeptJob.get(`${dept}|${s.jobTitle}`);
        const jobVacations = vacationsByDeptJob.get(`${dept}|${s.jobTitle}`) ?? [];
        const potrzebyPos = Math.max(0, s.count + s.toRecruit - s.terminations);
        const posCells: HarmonogramCell[] = days.map(d => {
          const key = dayKey(d);
          const absentees = jobAbsences?.get(key) ?? [];
          const vacationers = jobVacations
            .filter(v => v.start <= key && key <= v.end)
            .map(v => v.employee);
          const mam =
            s.count -
            (tl?.hireDates.filter(h => h > key).length ?? 0) -
            (tl?.termDates.filter(t => t < key).length ?? 0) +
            (tl?.arrivals.filter(a => a.date <= key).reduce((x, a) => x + a.count, 0) ?? 0) -
            absentees.length -
            vacationers.length;
          const title = buildTitle({ absentees, vacationers, mam });
          return { mam, absentees, vacationers, title };
        });
        return { jobTitle: s.jobTitle, potrzeby: potrzebyPos, obecnie: s.count, cells: posCells };
      });

      return { dept, potrzeby, obecnie, cells, positions };
    });

  return {
    monthDate,
    monthLabel: format(monthDate, 'LLLL yyyy', { locale: plLocale }),
    days,
    rows,
  };
}

function arrivalsOf(dept: string, data: HarmonogramData) {
  return data.recruitments
    .filter(r => r.department === dept)
    .flatMap(r => r.arrivals.filter(a => a.date));
}

function buildTitle({
  absentees,
  vacationers,
  mam,
}: {
  absentees: HarmonogramAbsence[];
  vacationers: HarmonogramEmployee[];
  mam: number;
}): string | undefined {
  const changes: string[] = [];
  if (absentees.length > 0) changes.push(`â’${absentees.length} nieobecnych`);
  if (vacationers.length > 0) changes.push(`â’${vacationers.length} na urlopie`);
  const details: string[] = [];
  if (absentees.length > 0)
    details.push(
      `Nieobecni: ${absentees
        .map(a => `${a.fullName} (${a.jobTitle}${a.manager ? `, kier. ${a.manager}` : ''})`)
        .join('; ')}`
    );
  if (vacationers.length > 0)
    details.push(
      `Na urlopie: ${vacationers
        .map(e => `${e.fullName} (${e.jobTitle}${e.manager ? `, kier. ${e.manager}` : ''})`)
        .join('; ')}`
    );
  const title = [changes.join(', '), ...details].filter(Boolean).join(' | ');
  return title || `Mam: ${mam}`;
}


/** Eksport harmonogramu do Excel (jeden arkusz, grupy stanowisk, kolory) */
export async function exportHarmonogramToExcel(result: HarmonogramResult): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const { saveAs } = await import('file-saver');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Harmonogram obsady');

  const columns: { name: string; filterButton: boolean }[] = [
    { name: 'DziaĹ‚', filterButton: false },
    { name: 'Potrzeby', filterButton: false },
    { name: 'Mam teraz', filterButton: false },
    ...result.days.map(d => ({ name: format(d, 'dd.MM'), filterButton: false })),
    { name: 'Nieobecni / Na urlopie', filterButton: false },
  ];

  const wsRows: {
    values: (string | number)[];
    isSub: boolean;
    cells?: HarmonogramCell[];
  }[] = [];
  result.rows.forEach(row => {
    wsRows.push({
      values: [row.dept, row.potrzeby, row.obecnie, ...row.cells.map(c => c.mam)],
      isSub: false,
      cells: row.cells,
    });
    row.positions.forEach(pos => {
      wsRows.push({
        values: [`   â€˘ ${pos.jobTitle}`, pos.potrzeby, pos.obecnie, ...pos.cells.map(c => c.mam)],
        isSub: true,
        cells: pos.cells,
      });
    });
  });

  ws.addTable({
    name: 'HarmonogramObsady',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns,
    rows: wsRows.map(r => [...r.values, '']),
  });

  wsRows.forEach((row, i) => {
    const sheetRow = ws.getRow(i + 2);
    if (row.isSub) {
      // row.font (styl wiersza) generuje niepoprawny XML w ExcelJS â€” stylujemy komĂłrki
      sheetRow.outlineLevel = 1;
      sheetRow.hidden = true;
      for (let c = 1; c <= row.values.length; c++) {
        sheetRow.getCell(c).font = { italic: true, color: { argb: 'FF6B7280' } };
      }
    }
    row.cells?.forEach((cell, j) => {
      if (cell.absentees.length > 0) {
        const tableCell = sheetRow.getCell(4 + j);
        tableCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        tableCell.font = { color: { argb: 'FF9C0006' }, bold: true };
      } else if (cell.vacationers.length > 0) {
        const tableCell = sheetRow.getCell(4 + j);
        tableCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8BBD9' } };
        tableCell.font = { color: { argb: 'FF880E4F' }, italic: true };
      }
    });
    const uwagiCell = sheetRow.getCell(4 + result.days.length);
    uwagiCell.alignment = { wrapText: true, vertical: 'top' };
  });

  ws.getColumn(1).width = 24;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 12;
  ws.getColumn(4 + result.days.length).width = 60;

  // Kolumna â€žNieobecni / Na urlopie" â€” tekstowe podsumowanie per dzieĹ„
  result.rows.forEach((row, i) => {
    const uwagi = row.cells
      .map((cell, j) => {
        const parts: string[] = [];
        if (cell.absentees.length > 0)
          parts.push(`Nieobecni: ${cell.absentees.map(a => a.fullName).join(', ')}`);
        if (cell.vacationers.length > 0)
          parts.push(`Na urlopie: ${cell.vacationers.map(e => e.fullName).join(', ')}`);
        return parts.length > 0 ? `${format(result.days[j], 'dd.MM')} â€” ${parts.join('; ')}` : null;
      })
      .filter(Boolean)
      .join(' | ');
    if (uwagi) ws.getRow(i + 2).getCell(4 + result.days.length).value = uwagi;
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `Harmonogram_obsady_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

