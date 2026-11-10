import { endOfWeek, format, startOfWeek, subDays, subWeeks } from 'date-fns';
import { toYmd } from '@/lib/date';

import { t } from '@/lib/i18n';
/**
 * Ruch kadrowy w wybranym okresie (dzień albo tydzień kalendarzowy pon–niedz): ile osób zatrudniono
 * i ile odeszło, w podziale na działy i stanowiska. Działa na danych publicznego harmonogramu.
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

/** Tydzień kalendarzowy (pon–niedz) cofnięty o `weeksBack` od `now` (0 = ten tydzień, 1 = zeszły). */
export function weekRange(now: Date = new Date(), weeksBack = 1): { fromYmd: string; toYmd: string } {
  const ref = subWeeks(now, weeksBack);
  return {
    fromYmd: format(startOfWeek(ref, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    toYmd: format(endOfWeek(ref, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

/** Pojedynczy dzień cofnięty o `daysBack` od `now` (0 = dziś, 1 = wczoraj). */
export function dayRange(now: Date = new Date(), daysBack = 1): { fromYmd: string; toYmd: string } {
  const ymd = format(subDays(now, daysBack), 'yyyy-MM-dd');
  return { fromYmd: ymd, toYmd: ymd };
}

/** Poprzedni tydzień kalendarzowy względem `now` (poniedziałek–niedziela), jako yyyy-MM-dd. */
export function lastWeekRange(now: Date = new Date()): { fromYmd: string; toYmd: string } {
  return weekRange(now, 1);
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
    const dept = p.department?.trim() || t('schedule.noDepartment');
    const job = p.jobTitle?.trim() || t('schedule.noJobTitle');
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

/** Zatrudnieni i odchodzący w okresie [fromYmd, toYmd] (włącznie). */
export function summarizeRange(
  employees: MovementPerson[],
  hires: MovementPerson[] | undefined,
  range: { fromYmd: string; toYmd: string },
  now: Date = new Date()
): WeeklyMovement {
  const { fromYmd, toYmd: toYmdStr } = range;
  const todayYmd = format(now, 'yyyy-MM-dd');
  const inRange = (ymd: string | null) => !!ymd && ymd >= fromYmd && ymd <= toYmdStr;

  // `hires` obejmuje także osoby już zwolnione bez daty (nie ma ich w `employees`).
  const hiredPeople = (hires ?? employees).filter(p => inRange(p.hireDate ? toYmd(p.hireDate) : null));
  const leftPeople = employees.filter(p => inRange(leaveDateYmd(p, todayYmd)));

  return { fromYmd, toYmd: toYmdStr, hired: summarize(hiredPeople), left: summarize(leftPeople) };
}

export function summarizeLastWeek(
  employees: MovementPerson[],
  hires: MovementPerson[] | undefined,
  now: Date = new Date()
): WeeklyMovement {
  return summarizeRange(employees, hires, lastWeekRange(now), now);
}
