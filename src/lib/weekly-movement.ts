import { endOfWeek, format, startOfWeek, subWeeks } from 'date-fns';
import { toYmd } from '@/lib/date';

/**
 * Ruch kadrowy w poprzednim tygodniu kalendarzowym (pon–niedz): ile osób zatrudniono i ile odeszło,
 * w podziale na działy i stanowiska. Działa na danych publicznego harmonogramu (bez danych wrażliwych).
 */

export interface MovementPerson {
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  terminationDate?: string;
  plannedTerminationDate?: string;
  status?: string;
}

export interface MovementGroup {
  department: string;
  total: number;
  jobs: { jobTitle: string; count: number }[];
}

export interface MovementSummary {
  total: number;
  groups: MovementGroup[];
}

export interface WeeklyMovement {
  fromYmd: string;
  toYmd: string;
  hired: MovementSummary;
  left: MovementSummary;
}

/** Poprzedni tydzień kalendarzowy względem `now` (poniedziałek–niedziela), jako yyyy-MM-dd. */
export function lastWeekRange(now: Date = new Date()): { fromYmd: string; toYmd: string } {
  const ref = subWeeks(now, 1);
  return {
    fromYmd: format(startOfWeek(ref, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    toYmd: format(endOfWeek(ref, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

/**
 * Dzień odejścia: faktyczna data zwolnienia, a gdy jej brak — planowana, ale tylko jeśli osoba
 * już odeszła (status "zwolniony" albo planowana data minęła). Tak samo jak w raporcie dla dyrektora.
 */
export function leaveDateYmd(p: MovementPerson, todayYmd: string): string | null {
  const actual = p.terminationDate ? toYmd(p.terminationDate) : null;
  if (actual) return actual;
  const planned = p.plannedTerminationDate ? toYmd(p.plannedTerminationDate) : null;
  if (!planned) return null;
  return p.status === 'zwolniony' || planned < todayYmd ? planned : null;
}

function summarize(people: MovementPerson[]): MovementSummary {
  const byDept = new Map<string, Map<string, number>>();
  people.forEach(p => {
    const dept = p.department?.trim() || 'Brak działu';
    const job = p.jobTitle?.trim() || 'Brak stanowiska';
    const jobs = byDept.get(dept) ?? new Map<string, number>();
    jobs.set(job, (jobs.get(job) ?? 0) + 1);
    byDept.set(dept, jobs);
  });
  const groups: MovementGroup[] = [...byDept.entries()]
    .map(([department, jobs]) => {
      const list = [...jobs.entries()]
        .map(([jobTitle, count]) => ({ jobTitle, count }))
        .sort((a, b) => b.count - a.count || a.jobTitle.localeCompare(b.jobTitle, 'pl'));
      return { department, total: list.reduce((s, j) => s + j.count, 0), jobs: list };
    })
    .sort((a, b) => b.total - a.total || a.department.localeCompare(b.department, 'pl'));
  return { total: people.length, groups };
}

export function summarizeLastWeek(
  employees: MovementPerson[],
  hires: MovementPerson[] | undefined,
  now: Date = new Date()
): WeeklyMovement {
  const { fromYmd, toYmd: toYmdStr } = lastWeekRange(now);
  const todayYmd = format(now, 'yyyy-MM-dd');
  const inRange = (ymd: string | null) => !!ymd && ymd >= fromYmd && ymd <= toYmdStr;

  // `hires` obejmuje także osoby już zwolnione bez daty (nie ma ich w `employees`).
  const hiredPeople = (hires ?? employees).filter(p => inRange(p.hireDate ? toYmd(p.hireDate) : null));
  const leftPeople = employees.filter(p => inRange(leaveDateYmd(p, todayYmd)));

  return { fromYmd, toYmd: toYmdStr, hired: summarize(hiredPeople), left: summarize(leftPeople) };
}
