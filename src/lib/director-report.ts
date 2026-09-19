import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Employee, Recruitment } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';

export interface DirectorReportEmployeeItem {
  id: string;
  fullName: string;
  jobTitle: string;
  department: string;
  manager?: string;
  date: string; // ISO or YYYY-MM-DD
  formattedDate: string; // dd.MM.yyyy
  status?: string;
}

export interface DirectorReportGroupCount {
  name: string;
  count: number;
}

export interface DirectorReportRecruitmentByDept {
  department: string;
  total: number;
  positions: { jobTitle: string; toRecruit: number }[];
}

export interface DirectorReportData {
  coordinatorName: string;
  companyName: string;
  periodLabel: string;
  startDate: Date;
  endDate: Date;
  formattedRange: string;

  // Stan aktualny
  totalActive: number;
  currentJobTitleBreakdown: DirectorReportGroupCount[];
  currentDeptBreakdown: DirectorReportGroupCount[];

  // Zwolnieni
  terminatedTotal: number;
  terminatedByJobTitle: DirectorReportGroupCount[];
  terminatedEmployees: DirectorReportEmployeeItem[];

  // Zatrudnieni
  hiredTotal: number;
  hiredByJobTitle: DirectorReportGroupCount[];
  hiredEmployees: DirectorReportEmployeeItem[];

  // Zapotrzebowanie (z modułu Rekrutacja)
  recruitmentTotal: number;
  recruitmentByDept: DirectorReportRecruitmentByDept[];
  recruitmentByJobTitle: DirectorReportGroupCount[];
}

/**
 * Odmiana słowa "osoba" w języku polskim (np. 1 osoba, 2-4 osoby, 5-21 osób)
 */
export function formatPolishPersons(count: number): string {
  if (count === 1) return '1 osoba';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} osoby`;
  }
  return `${count} osób`;
}

/**
 * Przelicza dane do raportu dyrektorskiego
 */
export function calculateDirectorReport(params: {
  employees: Employee[];
  recruitments: Recruitment[];
  from: Date;
  to: Date;
  periodLabel?: string;
  coordinatorName?: string;
  companyName?: string;
}): DirectorReportData {
  const {
    employees,
    recruitments,
    from,
    to,
    periodLabel = 'w wybranym okresie',
    coordinatorName = 'Oleksandr Holiadynets',
    companyName = 'STRUMET',
  } = params;

  const interval = {
    start: startOfDay(from),
    end: endOfDay(to),
  };

  // 1. Stan aktualny pracowników (aktywni)
  const activeEmployees = employees.filter(e => e.status === 'aktywny');
  const totalActive = activeEmployees.length;

  const jobCounts: Record<string, number> = {};
  const deptCounts: Record<string, number> = {};

  activeEmployees.forEach(e => {
    const job = e.jobTitle?.trim() || 'Inne';
    const dept = e.department?.trim() || 'Inny dział';
    jobCounts[job] = (jobCounts[job] || 0) + 1;
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const currentJobTitleBreakdown: DirectorReportGroupCount[] = Object.entries(jobCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const currentDeptBreakdown: DirectorReportGroupCount[] = Object.entries(deptCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 2. Osoby, które skończyły pracę (Zwolnieni w okresie)
  const terminatedEmployees: DirectorReportEmployeeItem[] = [];
  const termJobCounts: Record<string, number> = {};

  employees.forEach(e => {
    // Sprawdzamy datę zwolnienia: terminationDate lub plannedTerminationDate (jeśli zwolniony)
    const termDate =
      parseMaybeDate(e.terminationDate) ||
      (e.status === 'zwolniony' ? parseMaybeDate(e.plannedTerminationDate) : null);

    if (termDate && isWithinInterval(termDate, interval)) {
      const job = e.jobTitle?.trim() || 'Brak stanowiska';
      termJobCounts[job] = (termJobCounts[job] || 0) + 1;
      terminatedEmployees.push({
        id: e.id,
        fullName: e.fullName,
        jobTitle: job,
        department: e.department?.trim() || 'Brak działu',
        manager: e.manager,
        date: format(termDate, 'yyyy-MM-dd'),
        formattedDate: format(termDate, 'dd.MM.yyyy'),
        status: e.status,
      });
    }
  });

  // Sortowanie zwolnionych po dacie malejąco, potem po nazwisku
  terminatedEmployees.sort((a, b) => b.date.localeCompare(a.date) || a.fullName.localeCompare(b.fullName));

  const terminatedByJobTitle: DirectorReportGroupCount[] = Object.entries(termJobCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 3. Osoby, które zaczęły pracę (Zatrudnieni w okresie)
  const hiredEmployees: DirectorReportEmployeeItem[] = [];
  const hiredJobCounts: Record<string, number> = {};

  employees.forEach(e => {
    const hireDate = parseMaybeDate(e.hireDate);
    if (hireDate && isWithinInterval(hireDate, interval)) {
      const job = e.jobTitle?.trim() || 'Brak stanowiska';
      hiredJobCounts[job] = (hiredJobCounts[job] || 0) + 1;
      hiredEmployees.push({
        id: e.id,
        fullName: e.fullName,
        jobTitle: job,
        department: e.department?.trim() || 'Brak działu',
        manager: e.manager,
        date: format(hireDate, 'yyyy-MM-dd'),
        formattedDate: format(hireDate, 'dd.MM.yyyy'),
        status: e.status,
      });
    }
  });

  hiredEmployees.sort((a, b) => b.date.localeCompare(a.date) || a.fullName.localeCompare(b.fullName));

  const hiredByJobTitle: DirectorReportGroupCount[] = Object.entries(hiredJobCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 4. Zapotrzebowanie (z modułu Rekrutacja)
  const recJobCounts: Record<string, number> = {};
  const recruitmentByDept: DirectorReportRecruitmentByDept[] = [];
  let recruitmentTotal = 0;

  recruitments.forEach(rec => {
    const deptName = rec.department?.trim() || 'Ogólne';
    const deptPositions: { jobTitle: string; toRecruit: number }[] = [];
    let deptTotal = 0;

    if (Array.isArray(rec.positions)) {
      rec.positions.forEach(pos => {
        const count = Number(pos.toRecruit) || 0;
        if (count > 0) {
          const title = pos.jobTitle?.trim() || 'Pracownik';
          deptPositions.push({ jobTitle: title, toRecruit: count });
          deptTotal += count;
          recJobCounts[title] = (recJobCounts[title] || 0) + count;
        }
      });
    }

    if (deptTotal > 0) {
      recruitmentTotal += deptTotal;
      recruitmentByDept.push({
        department: deptName,
        total: deptTotal,
        positions: deptPositions,
      });
    }
  });

  recruitmentByDept.sort((a, b) => b.total - a.total);

  const recruitmentByJobTitle: DirectorReportGroupCount[] = Object.entries(recJobCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const formattedRange = `${format(from, 'dd.MM.yyyy')} - ${format(to, 'dd.MM.yyyy')}`;

  return {
    coordinatorName,
    companyName,
    periodLabel,
    startDate: from,
    endDate: to,
    formattedRange,
    totalActive,
    currentJobTitleBreakdown,
    currentDeptBreakdown,
    terminatedTotal: terminatedEmployees.length,
    terminatedByJobTitle,
    terminatedEmployees,
    hiredTotal: hiredEmployees.length,
    hiredByJobTitle,
    hiredEmployees,
    recruitmentTotal,
    recruitmentByDept,
    recruitmentByJobTitle,
  };
}

/**
 * Generuje gotowy tekst raportu do wklejenia na WhatsApp / Email
 */
export function generateDirectorReportText(
  data: DirectorReportData,
  options?: { includeEmployeeList?: boolean }
): string {
  const includeList = options?.includeEmployeeList ?? true;
  const lines: string[] = [];

  // Nagłówek
  lines.push(`${data.coordinatorName} (${formatPolishPersons(data.totalActive)})`);
  lines.push(`🔴 ${data.companyName} – ${formatPolishPersons(data.totalActive)}`);
  lines.push('W tym');

  data.currentJobTitleBreakdown.forEach(item => {
    lines.push(`- ${item.name} – ${item.count}`);
  });

  lines.push('');

  // Zwolnienia (Czerwony wyróżnik)
  const termHeader = `${formatPolishPersons(data.terminatedTotal)} skończyło pracę ${data.periodLabel}`;
  lines.push(`🟥 ${termHeader.toUpperCase()}`);
  if (data.terminatedTotal === 0) {
    lines.push('Brak odejść w tym okresie.');
  } else {
    data.terminatedByJobTitle.forEach(item => {
      lines.push(`- ${item.name} – ${formatPolishPersons(item.count)}`);
    });

    if (includeList && data.terminatedEmployees.length > 0) {
      lines.push('');
      lines.push('Szczegóły (kto i kiedy):');
      data.terminatedEmployees.forEach(e => {
        lines.push(`• ${e.fullName} (${e.jobTitle}, ${e.department}) – data: ${e.formattedDate}`);
      });
    }
  }

  lines.push('');

  // Przyjęcia (Zielony wyróżnik)
  const hireHeader = `${formatPolishPersons(data.hiredTotal)} zaczęło pracę ${data.periodLabel}`;
  lines.push(`🟩 ${hireHeader.toUpperCase()}`);
  if (data.hiredTotal === 0) {
    lines.push('Brak nowych przyjęć w tym okresie.');
  } else {
    data.hiredByJobTitle.forEach(item => {
      lines.push(`- ${item.name} – ${formatPolishPersons(item.count)}`);
    });

    if (includeList && data.hiredEmployees.length > 0) {
      lines.push('');
      lines.push('Szczegóły (kto i kiedy):');
      data.hiredEmployees.forEach(e => {
        lines.push(`• ${e.fullName} (${e.jobTitle}, ${e.department}) – data: ${e.formattedDate}`);
      });
    }
  }

  lines.push('');

  // Zapotrzebowanie (Żółty wyróżnik)
  lines.push(`🟨 DO ZREKRUTOWANIA (${formatPolishPersons(data.recruitmentTotal)}):`);
  if (data.recruitmentTotal === 0) {
    lines.push('Brak otwartych zapotrzebowań.');
  } else {
    data.recruitmentByDept.forEach(dept => {
      lines.push(`📌 ${dept.department} (${dept.total} os.):`);
      dept.positions.forEach(pos => {
        lines.push(`   - ${pos.jobTitle} – ${pos.toRecruit} os.`);
      });
    });
  }

  return lines.join('\n');
}
