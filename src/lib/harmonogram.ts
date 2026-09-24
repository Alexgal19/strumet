import { addDays, addMonths, format, getDaysInMonth, startOfDay, startOfMonth } from 'date-fns';
import { pl as plLocale } from 'date-fns/locale';
import { parseMaybeDate } from '@/lib/date';

export interface HarmonogramEmployee {
  department: string;
  jobTitle: string;
  fullName: string;
  manager?: string;
  hireDate?: string;
  vacationStartDate?: string;
  vacationEndDate?: string;
  plannedTerminationDate?: string;
  terminationDate?: string;
  status?: string;
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
  terminating?: HarmonogramEmployee[];
  title?: string;
  statusType?: 'present' | 'absent' | 'vacation' | 'terminated' | 'terminating' | 'not_hired';
}

export interface HarmonogramEmployeeRow {
  fullName: string;
  jobTitle: string;
  manager: string;
  department: string;
  hireDate?: string;
  terminationDate?: string;
  plannedTerminationDate?: string;
  obecnie: number;
  cells: HarmonogramCell[];
}

export interface HarmonogramPositionRow {
  jobTitle: string;
  manager: string;
  department: string;
  potrzeby: number;
  obecnie: number;
  cells: HarmonogramCell[];
  employees: HarmonogramEmployeeRow[];
}

export interface HarmonogramManagerRow {
  manager: string;
  department: string;
  potrzeby: number;
  obecnie: number;
  cells: HarmonogramCell[];
  positions: HarmonogramPositionRow[];
}

export interface HarmonogramRow {
  dept: string;
  potrzeby: number;
  obecnie: number;
  cells: HarmonogramCell[];
  managers: HarmonogramManagerRow[];
  positions: HarmonogramPositionRow[]; // dla kompatybilności wstecznej
}

export interface HarmonogramResult {
  monthDate: Date;
  monthLabel: string;
  days: Date[];
  rows: HarmonogramRow[];
}

const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

function parseSafeDate(d?: string): Date | null {
  const parsed = parseMaybeDate(d);
  return parsed ? startOfDay(parsed) : null;
}

export function buildHarmonogram(
  data: HarmonogramData,
  monthOffset = 0,
  now: Date = new Date()
): HarmonogramResult {
  const monthDate = startOfMonth(addMonths(now, monthOffset));
  const days = Array.from({ length: getDaysInMonth(monthDate) }, (_, i) =>
    addDays(monthDate, i)
  );
  const startDay = days[0];
  const endDay = days[days.length - 1];
  const today = startOfDay(now);

  // Mapa nieobecności: data|fullNameLowerCase -> HarmonogramAbsence[]
  const absencesByDateName = new Map<string, HarmonogramAbsence[]>();
  data.absences.forEach(a => {
    if (!a.date || !a.fullName) return;
    const key = `${a.date}|${a.fullName.trim().toLowerCase()}`;
    const list = absencesByDateName.get(key) ?? [];
    list.push(a);
    absencesByDateName.set(key, list);
  });

  // Przydział planowanych przyjęć (arrivals) per dział i stanowisko
  const arrivalsByDeptJob = new Map<string, { date: string; count: number }[]>();
  const toRecruitByDeptJob = new Map<string, number>();

  data.recruitments.forEach(r => {
    const slots = r.positions.map(p => {
      const job = p.jobTitle?.trim() || 'Inne';
      const needed = Number(p.toRecruit) || 0;
      const key = `${r.department}|${job}`;
      toRecruitByDeptJob.set(key, (toRecruitByDeptJob.get(key) ?? 0) + needed);
      return { jobTitle: job, left: needed };
    });

    [...r.arrivals]
      .filter(a => a.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(a => {
        let left = Number(a.count) || 0;
        for (const slot of slots) {
          if (left <= 0) break;
          if (slot.left <= 0) continue;
          const take = Math.min(slot.left, left);
          const key = `${r.department}|${slot.jobTitle}`;
          const arr = arrivalsByDeptJob.get(key) ?? [];
          arr.push({ date: a.date, count: take });
          arrivalsByDeptJob.set(key, arr);
          slot.left -= take;
          left -= take;
        }
      });
  });

  // Wszyscy unikalni pracownicy przefiltrowani pod kątem widoczności w danym miesiącu
  // Pracownik jest widoczny, jeśli nie został zwolniony przed początkiem tego miesiąca
  // i nie został zatrudniony po końcu tego miesiąca.
  // Planowana data rozwiązania NIE zwalnia pracownika — liczy się status 'aktywny'
  // albo faktyczna data zwolnienia (planowana tylko dla statusu 'zwolniony').
  const effectiveTermDate = (e: HarmonogramEmployee): Date | null => {
    const actual = parseSafeDate(e.terminationDate);
    if (actual) return actual;
    if (e.status === 'zwolniony') return parseSafeDate(e.plannedTerminationDate);
    return null;
  };

  const relevantEmployees = data.employees.filter(e => {
    const hire = parseSafeDate(e.hireDate);
    const term = effectiveTermDate(e);

    if (hire && hire > endDay) return false;
    if (term && term < startDay) return false;
    return true;
  });

  // Lista wszystkich działów (z pracowników oraz z zapotrzebowań)
  const deptsSet = new Set<string>();
  data.recruitments.forEach(r => r.department && deptsSet.add(r.department));
  data.employees.forEach(e => e.department && deptsSet.add(e.department));
  const sortedDepts = [...deptsSet].sort((a, b) => a.localeCompare(b, 'pl'));

  const rows: HarmonogramRow[] = sortedDepts.map(dept => {
    const deptEmployees = relevantEmployees.filter(e => e.department === dept);

    // Grupowanie pracowników według kierownika (manager)
    const employeesByManager = new Map<string, HarmonogramEmployee[]>();
    deptEmployees.forEach(e => {
      const mgr = e.manager?.trim() || 'Brak kierownika';
      const list = employeesByManager.get(mgr) ?? [];
      list.push(e);
      employeesByManager.set(mgr, list);
    });

    // Jeśli brak pracowników w dziale, upewnijmy się, że istnieje grupa dla zapotrzebowań
    if (employeesByManager.size === 0) {
      employeesByManager.set('Brak kierownika', []);
    }

    // Stanowiska z zapotrzebowań w tym dziale
    const deptRecruitPositions = data.recruitments
      .filter(r => r.department === dept)
      .flatMap(r => r.positions.map(p => p.jobTitle?.trim() || 'Inne'));

    const managers: HarmonogramManagerRow[] = [...employeesByManager.entries()]
      .sort(([a], [b]) => {
        if (a === 'Brak kierownika') return 1;
        if (b === 'Brak kierownika') return -1;
        return a.localeCompare(b, 'pl');
      })
      .map(([mgrName, mgrEmployees]) => {
        // Grupowanie pracowników według stanowiska (jobTitle)
        const employeesByJob = new Map<string, HarmonogramEmployee[]>();
        mgrEmployees.forEach(e => {
          const job = e.jobTitle?.trim() || 'Inne';
          const list = employeesByJob.get(job) ?? [];
          list.push(e);
          employeesByJob.set(job, list);
        });

        // Jeśli to 'Brak kierownika' (lub jedyny kierownik), dodaj stanowiska z rekrutacji, które nie mają pracowników
        if (mgrName === 'Brak kierownika' || employeesByManager.size === 1) {
          deptRecruitPositions.forEach(job => {
            if (!employeesByJob.has(job)) {
              employeesByJob.set(job, []);
            }
          });
        }

        const positions: HarmonogramPositionRow[] = [...employeesByJob.entries()]
          .sort(([a], [b]) => a.localeCompare(b, 'pl'))
          .map(([jobTitle, jobEmployees]) => {
            // Generowanie wierszy pojedynczych pracowników
            const employeeRows: HarmonogramEmployeeRow[] = jobEmployees
              .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pl'))
              .map(e => {
                const hire = parseSafeDate(e.hireDate);
                const term = effectiveTermDate(e);
                // Planowane zwolnienie: pracownik wciąż aktywny (liczy się jak pulpit),
                // ale komórki od wskazanej daty są podświetlone.
                const plannedTerm =
                  e.status === 'aktywny' ? parseSafeDate(e.plannedTerminationDate) : null;

                // Obecnie: synchronizacja z zakładką "Pracownicy aktywni" (tylko status 'aktywny')
                const isEmployedToday = e.status === 'aktywny';
                const empObecnie = isEmployedToday ? 1 : 0;

                const empCells: HarmonogramCell[] = days.map(d => {
                  const key = dayKey(d);

                  if (hire && hire > d) {
                    return {
                      mam: 0,
                      absentees: [],
                      vacationers: [],
                      terminating: [],
                      statusType: 'not_hired',
                      title: `${e.fullName}: Przed zatrudnieniem (od ${format(hire, 'dd.MM.yyyy')})`,
                    };
                  }

                  if (term && term < d) {
                    return {
                      mam: 0,
                      absentees: [],
                      vacationers: [],
                      terminating: [],
                      statusType: 'terminated',
                      title: `${e.fullName}: Zwolniony (od ${format(term, 'dd.MM.yyyy')})`,
                    };
                  }

                  // Dzień zwolnienia (faktycznego) lub planowane zwolnienie (aktywny) —
                  // podświetlenie od wskazanej daty; pracownik wciąż liczony (mam: 1)
                  const isTermDay = !!term && term.getTime() === d.getTime();
                  if (isTermDay || (plannedTerm && plannedTerm <= d)) {
                    return {
                      mam: 1,
                      absentees: [],
                      vacationers: [],
                      terminating: [e],
                      statusType: 'terminating',
                      title: isTermDay
                        ? `${e.fullName}: Zwolnienie — ostatni dzień (${format(term!, 'dd.MM.yyyy')})`
                        : `${e.fullName}: Planowane zwolnienie (od ${format(plannedTerm!, 'dd.MM.yyyy')})`,
                    };
                  }

                  // Sprawdzenie nieobecności
                  const absList =
                    absencesByDateName.get(`${key}|${e.fullName.trim().toLowerCase()}`) ?? [];
                  if (absList.length > 0) {
                    return {
                      mam: 0,
                      absentees: absList,
                      vacationers: [],
                      terminating: [],
                      statusType: 'absent',
                      title: `${e.fullName}: Nieobecny (${absList.map(a => a.jobTitle || 'nieobecność').join(', ')})`,
                    };
                  }

                  // Sprawdzenie urlopu
                  const vStart = parseSafeDate(e.vacationStartDate);
                  const vEnd = parseSafeDate(e.vacationEndDate);
                  if (vStart && vStart <= d && (!vEnd || d <= vEnd)) {
                    return {
                      mam: 0,
                      absentees: [],
                      vacationers: [e],
                      terminating: [],
                      statusType: 'vacation',
                      title: `${e.fullName}: Na urlopie (${format(vStart, 'dd.MM')} - ${vEnd ? format(vEnd, 'dd.MM') : '...'})`,
                    };
                  }

                  return {
                    mam: 1,
                    absentees: [],
                    vacationers: [],
                    terminating: [],
                    statusType: 'present',
                    title: `${e.fullName}: Obecny (1)`,
                  };
                });

                return {
                  fullName: e.fullName,
                  jobTitle,
                  manager: mgrName,
                  department: dept,
                  hireDate: e.hireDate,
                  terminationDate: e.terminationDate,
                  plannedTerminationDate: e.plannedTerminationDate,
                  obecnie: empObecnie,
                  cells: empCells,
                };
              });

            const posObecnie = employeeRows.reduce((sum, emp) => sum + emp.obecnie, 0);

            // Potrzeby stanowiska
            const toRecruit = toRecruitByDeptJob.get(`${dept}|${jobTitle}`) ?? 0;
            const termCount = employeeRows.filter(
              emp =>
                (emp.terminationDate && parseSafeDate(emp.terminationDate)! >= today) ||
                (emp.plannedTerminationDate && parseSafeDate(emp.plannedTerminationDate)! >= today)
            ).length;
            const posPotrzeby = Math.max(posObecnie, posObecnie + toRecruit - termCount);

            // Przyjęcia dla tego stanowiska
            const arrivals = arrivalsByDeptJob.get(`${dept}|${jobTitle}`) ?? [];

            const posCells: HarmonogramCell[] = days.map((d, dayIndex) => {
              const key = dayKey(d);
              const empMamSum = employeeRows.reduce(
                (sum, emp) => sum + (emp.cells[dayIndex]?.mam ?? 0),
                0
              );
              const arrivalsCount = arrivals
                .filter(a => a.date <= key)
                .reduce((sum, a) => sum + a.count, 0);
              const mam = empMamSum + arrivalsCount;

              const absentees = employeeRows.flatMap(
                emp => emp.cells[dayIndex]?.absentees ?? []
              );
              const vacationers = employeeRows.flatMap(
                emp => emp.cells[dayIndex]?.vacationers ?? []
              );
              const terminating = dedupeEmployees(
                employeeRows.flatMap(emp => emp.cells[dayIndex]?.terminating ?? [])
              );
              const title = buildTitle({ absentees, vacationers, terminating, mam });

              return { mam, absentees, vacationers, terminating, title };
            });

            return {
              jobTitle,
              manager: mgrName,
              department: dept,
              potrzeby: posPotrzeby,
              obecnie: posObecnie,
              cells: posCells,
              employees: employeeRows,
            };
          });

        const mgrObecnie = positions.reduce((sum, pos) => sum + pos.obecnie, 0);
        const mgrPotrzeby = positions.reduce((sum, pos) => sum + pos.potrzeby, 0);

        const mgrCells: HarmonogramCell[] = days.map((_, dayIndex) => {
          const mam = positions.reduce(
            (sum, pos) => sum + (pos.cells[dayIndex]?.mam ?? 0),
            0
          );
          const absentees = dedupeAbsences(
            positions.flatMap(pos => pos.cells[dayIndex]?.absentees ?? [])
          );
          const vacationers = dedupeEmployees(
            positions.flatMap(pos => pos.cells[dayIndex]?.vacationers ?? [])
          );
          const terminating = dedupeEmployees(
            positions.flatMap(pos => pos.cells[dayIndex]?.terminating ?? [])
          );
          const title = buildTitle({ absentees, vacationers, terminating, mam });

          return { mam, absentees, vacationers, terminating, title };
        });

        return {
          manager: mgrName,
          department: dept,
          potrzeby: mgrPotrzeby,
          obecnie: mgrObecnie,
          cells: mgrCells,
          positions,
        };
      });

    const deptObecnie = managers.reduce((sum, mgr) => sum + mgr.obecnie, 0);

    // Sumaryczne potrzeby działu (stan obecny + wszystkie toRecruit dla działu)
    const totalDeptToRecruit = data.recruitments
      .filter(r => r.department === dept)
      .reduce(
        (sum, r) => sum + r.positions.reduce((s, p) => s + (Number(p.toRecruit) || 0), 0),
        0
      );
    const deptPotrzeby = Math.max(
      managers.reduce((sum, mgr) => sum + mgr.potrzeby, 0),
      deptObecnie + totalDeptToRecruit
    );

    const deptCells: HarmonogramCell[] = days.map((_, dayIndex) => {
      const mam = managers.reduce(
        (sum, mgr) => sum + (mgr.cells[dayIndex]?.mam ?? 0),
        0
      );
      const absentees = dedupeAbsences(
        managers.flatMap(mgr => mgr.cells[dayIndex]?.absentees ?? [])
      );
      const vacationers = dedupeEmployees(
        managers.flatMap(mgr => mgr.cells[dayIndex]?.vacationers ?? [])
      );
      const terminating = dedupeEmployees(
        managers.flatMap(mgr => mgr.cells[dayIndex]?.terminating ?? [])
      );
      const title = buildTitle({ absentees, vacationers, terminating, mam });

      return { mam, absentees, vacationers, terminating, title };
    });

    const allPositions = managers.flatMap(mgr => mgr.positions);

    return {
      dept,
      potrzeby: deptPotrzeby,
      obecnie: deptObecnie,
      cells: deptCells,
      managers,
      positions: allPositions,
    };
  });

  return {
    monthDate,
    monthLabel: format(monthDate, 'LLLL yyyy', { locale: plLocale }),
    days,
    rows,
  };
}

function dedupeAbsences(absences: HarmonogramAbsence[]): HarmonogramAbsence[] {
  const seen = new Set<string>();
  return absences.filter(a => {
    const key = `${a.date}|${a.fullName.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeEmployees(employees: HarmonogramEmployee[]): HarmonogramEmployee[] {
  const seen = new Set<string>();
  return employees.filter(e => {
    const key = e.fullName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildTitle({
  absentees,
  vacationers,
  terminating = [],
  mam,
}: {
  absentees: HarmonogramAbsence[];
  vacationers: HarmonogramEmployee[];
  terminating?: HarmonogramEmployee[];
  mam: number;
}): string | undefined {
  const changes: string[] = [];
  if (absentees.length > 0) changes.push(`−${absentees.length} nieobecnych`);
  if (vacationers.length > 0) changes.push(`−${vacationers.length} na urlopie`);
  if (terminating.length > 0) changes.push(`${terminating.length} zwalnia się`);
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
  if (terminating.length > 0)
    details.push(
      `Zwalnia się: ${terminating
        .map(e => `${e.fullName} (${e.jobTitle}${e.manager ? `, kier. ${e.manager}` : ''})`)
        .join('; ')}`
    );
  const title = [changes.join(', '), ...details].filter(Boolean).join(' | ');
  return title || `Mam: ${mam}`;
}

/** Eksport harmonogramu do Excel (pełna 4-poziomowa hierarchia: Dział -> Kierownik -> Stanowisko -> Pracownik) */
export async function exportHarmonogramToExcel(
  result: HarmonogramResult,
  activeDayIndex: number = 0
) {
  const ExcelJS = (await import('exceljs')).default;
  const { saveAs } = await import('file-saver');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Harmonogram Obsady');

  const columns: any[] = [
    { name: 'Dział / Kierownik / Stanowisko / Pracownik', filterButton: true },
    { name: 'Potrzeby', filterButton: true },
    { name: `Stan na ${format(result.days[activeDayIndex], 'dd.MM')}`, filterButton: true },
    ...result.days.map(d => ({ name: format(d, 'dd.MM'), filterButton: false })),
    { name: 'Uwagi' },
  ];

  interface ExcelRowDef {
    values: (string | number)[];
    level: number; // 0=Dział, 1=Kierownik, 2=Stanowisko, 3=Pracownik
    cells?: HarmonogramCell[];
  }

  const wsRows: ExcelRowDef[] = [];

  result.rows.forEach(dept => {
    wsRows.push({
      values: [dept.dept, dept.potrzeby, dept.cells[activeDayIndex]?.mam ?? 0, ...dept.cells.map(c => c.mam)],
      level: 0,
      cells: dept.cells,
    });

    dept.managers.forEach(mgr => {
      wsRows.push({
        values: [`   Kierownik: ${mgr.manager}`, mgr.potrzeby, mgr.cells[activeDayIndex]?.mam ?? 0, ...mgr.cells.map(c => c.mam)],
        level: 1,
        cells: mgr.cells,
      });

      mgr.positions.forEach(pos => {
        wsRows.push({
          values: [`      • ${pos.jobTitle}`, pos.potrzeby, pos.cells[activeDayIndex]?.mam ?? 0, ...pos.cells.map(c => c.mam)],
          level: 2,
          cells: pos.cells,
        });

        pos.employees.forEach(emp => {
          wsRows.push({
            values: [`         - ${emp.fullName}`, '', emp.cells[activeDayIndex]?.mam > 0 ? 1 : 0, ...emp.cells.map(c => c.mam)],
            level: 3,
            cells: emp.cells,
          });
        });
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
    sheetRow.outlineLevel = row.level;

    if (row.level > 0) {
      sheetRow.hidden = true;
      for (let c = 1; c <= row.values.length; c++) {
        const cell = sheetRow.getCell(c);
        if (row.level === 1) {
          cell.font = { bold: true, color: { argb: 'FF1F2937' } };
        } else if (row.level === 2) {
          cell.font = { italic: true, color: { argb: 'FF4B5563' } };
        } else {
          cell.font = { color: { argb: 'FF6B7280' } };
        }
      }
    } else {
      sheetRow.getCell(1).font = { bold: true };
    }

    // Kolorowanie komórek z absencją, urlopem lub planowanym zwolnieniem
    row.cells?.forEach((cell, j) => {
      const tableCell = sheetRow.getCell(4 + j);
      if (cell.absentees.length > 0) {
        tableCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        tableCell.font = { color: { argb: 'FF9C0006' }, bold: true };
      } else if (cell.vacationers.length > 0) {
        tableCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8BBD9' } };
        tableCell.font = { color: { argb: 'FF880E4F' }, italic: true };
      } else if (cell.terminating && cell.terminating.length > 0) {
        tableCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
        tableCell.font = { color: { argb: 'FF92400E' }, bold: true };
      } else if (row.level === 3 && cell.statusType === 'terminated') {
        tableCell.font = { color: { argb: 'FF9CA3AF' } };
      }
    });

    const uwagiCell = sheetRow.getCell(4 + result.days.length);
    uwagiCell.alignment = { wrapText: true, vertical: 'top' };
  });

  ws.getColumn(1).width = 38;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 12;
  ws.getColumn(4 + result.days.length).width = 50;

  // Kolumna z podsumowaniem uwag
  wsRows.forEach((row, i) => {
    if (!row.cells) return;
    const uwagi = row.cells
      .map((cell, j) => {
        const parts: string[] = [];
        if (cell.absentees.length > 0)
          parts.push(`Nieobecni: ${cell.absentees.map(a => a.fullName).join(', ')}`);
        if (cell.vacationers.length > 0)
          parts.push(`Na urlopie: ${cell.vacationers.map(e => e.fullName).join(', ')}`);
        if (cell.terminating && cell.terminating.length > 0)
          parts.push(`Zwalnia się: ${cell.terminating.map(e => e.fullName).join(', ')}`);
        return parts.length > 0
          ? `${format(result.days[j], 'dd.MM')} — ${parts.join('; ')}`
          : null;
      })
      .filter(Boolean)
      .join(' | ');

    if (uwagi) {
      ws.getRow(i + 2).getCell(4 + result.days.length).value = uwagi;
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `Harmonogram_obsady_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
