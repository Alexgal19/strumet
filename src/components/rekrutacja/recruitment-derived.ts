import { startOfDay } from 'date-fns';
import { parseMaybeDate } from '@/lib/date';
import type { Absence, Employee, Recruitment } from '@/lib/types';
import type { HarmonogramData } from '@/lib/harmonogram';

// Stanowiska w każdym dziale: obecna obsada + planowane zwolnienia + potrzeby rekrutacyjne
export const buildJobTitlesByDepartment = (
  activeEmployees: Employee[],
  recruitments: Recruitment[]
) => {
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
};

export const buildHarmonogramData = (
  allEmployees: Employee[],
  absences: Absence[],
  recruitments: Recruitment[]
): HarmonogramData => ({
  employees: allEmployees
    .filter(
      e =>
        e.status === 'aktywny' ||
        (e.status === 'zwolniony' && (e.terminationDate || e.plannedTerminationDate))
    )
    .map(e => ({
      department: e.department,
      jobTitle: e.jobTitle,
      fullName: e.fullName,
      manager: e.manager,
      hireDate: e.hireDate,
      vacationStartDate: e.vacationStartDate,
      vacationEndDate: e.vacationEndDate,
      plannedTerminationDate: e.plannedTerminationDate,
      terminationDate: e.terminationDate,
      status: e.status,
    })),
  absences: absences.map(a => {
    const emp = allEmployees.find(x => x.id === a.employeeId);
    return {
      date: a.date,
      department: emp?.department ?? '',
      jobTitle: emp?.jobTitle ?? '',
      fullName: emp?.fullName ?? '',
      manager: emp?.manager,
    };
  }),
  recruitments: recruitments.map(r => ({
    id: r.id,
    department: r.department,
    positions: r.positions.map(p => ({
      id: p.id,
      jobTitle: p.jobTitle,
      toRecruit: Number(p.toRecruit) || 0,
    })),
    arrivals: r.arrivals.map(a => ({
      id: a.id,
      date: a.date,
      count: Number(a.count) || 0,
    })),
  })),
});

export const buildSelectedDepartmentStats = (
  activeEmployees: Employee[],
  department: string
) => {
  if (!department) return null;
  const deptEmployees = activeEmployees.filter(e => e.department === department);
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
};
