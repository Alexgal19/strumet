'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { addMonths, format, getDaysInMonth } from 'date-fns';
import { getDateLocale } from '@/lib/i18n';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  User,
  Users,
  Maximize2,
  Minimize2,
} from 'lucide-react';

import { toYmd } from '@/lib/date';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildHarmonogram,
  exportHarmonogramToExcel,
  HarmonogramCell,
  HarmonogramData,
  HarmonogramRow,
  HarmonogramManagerRow,
  HarmonogramPositionRow,
  HarmonogramEmployeeRow,
} from '@/lib/harmonogram';

import { t } from '@/lib/i18n';
const mobileQuery = '(max-width: 767px)';

function subscribeToMobile(onChange: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function isMobileScreen() {
  return window.matchMedia(mobileQuery).matches;
}

export function HarmonogramView({
  data,
  showExport = true,
  isAdmin,
  onUpdatePotrzeby,
  onlyShortages = false,
}: {
  data: HarmonogramData;
  showExport?: boolean;
  isAdmin?: boolean;
  onUpdatePotrzeby?: (dept: string, mgr: string, job: string, newAmount: number) => void;
  onlyShortages?: boolean;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const [cellTooltip, setCellTooltip] = useState<{
    x: number;
    top: number;
    bottom: number;
    absentees: HarmonogramCell['absentees'];
    vacationers: HarmonogramCell['vacationers'];
    terminating?: HarmonogramCell['terminating'];
    singleTitle?: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const isMobile = useSyncExternalStore(subscribeToMobile, isMobileScreen, () => false);

  const result = useMemo(() => buildHarmonogram(data, monthOffset), [data, monthOffset]);

  const displayRows = useMemo(() => {
    const hasShortage = (row: HarmonogramRow) =>
      row.potrzeby - row.obecnie > 0 ||
      row.positions.some((position) => position.potrzeby - position.obecnie > 0);

    return [...result.rows].sort((a, b) => {
      const aShort = hasShortage(a) ? 1 : 0;
      const bShort = hasShortage(b) ? 1 : 0;
      if (aShort !== bShort) return bShort - aShort;
      return a.dept.localeCompare(b.dept, 'pl');
    });
  }, [result.rows]);

  const todayIndex = useMemo(
    () => result.days.findIndex(d => format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')),
    [result.days]
  );
  const activeDayIndex = selectedDayIndex !== null ? selectedDayIndex : (todayIndex >= 0 ? todayIndex : 0);

  const totals = useMemo(() => {
    const potrzeby = result.rows.reduce((s, r) => s + r.potrzeby, 0);
    const stanZatrudnienia = result.rows.reduce((s, r) => s + r.obecnie, 0);
    const perDayMam = result.days.map((_, i) =>
      result.rows.reduce((s, r) => s + (r.cells[i]?.mam ?? 0), 0)
    );
    const perDayAbsent = result.days.map((_, i) =>
      result.rows.reduce(
        (s, r) => s + (r.cells[i]?.absentees.length ?? 0) + (r.cells[i]?.vacationers.length ?? 0),
        0
      )
    );
    const absentNa = perDayAbsent[activeDayIndex] ?? 0;
    const presentNa = perDayMam[activeDayIndex] ?? 0;
    const diff = perDayMam.map(v => v - potrzeby);
    const employedGap = result.days.map(() => stanZatrudnienia - potrzeby);
    
    // Tylko NADCHODZĄCE przyjęcia (data >= dziś): minione trafiają do zakładki Historia
    // (tak samo jak w Zapotrzebowania), więc nie są "oczekiwane". Porównanie na yyyy-MM-dd.
    const todayYmd = format(new Date(), 'yyyy-MM-dd');
    const monthPrefix = format(result.monthDate, 'yyyy-MM');
    const upcomingPlanned = (data.planowanePrzyjecia ? Object.values(data.planowanePrzyjecia) : [])
      .map(p => ({ p, ymd: toYmd(p.date) }))
      .filter((x): x is { p: typeof x.p; ymd: string } => !!x.ymd && x.ymd >= todayYmd)
      .sort((a, b) => a.ymd.localeCompare(b.ymd));
    const currentMonthArrivals = upcomingPlanned.filter(x => x.ymd.startsWith(monthPrefix)).map(x => x.p);
    const upcomingArrivals = upcomingPlanned.filter(x => x.ymd.slice(0, 7) > monthPrefix).map(x => x.p);
    return { potrzeby, stanZatrudnienia, presentNa, absentNa, diff, employedGap, currentMonthArrivals, upcomingArrivals };
  }, [result, activeDayIndex]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportHarmonogramToExcel(result, activeDayIndex);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleDept = (dept: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  const toggleManager = (key: string) => {
    setExpandedManagers(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePosition = (key: string) => {
    setExpandedPositions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const allDepts = new Set<string>();
    const allManagers = new Set<string>();
    const allPositions = new Set<string>();

    result.rows.forEach(dept => {
      allDepts.add(dept.dept);
      dept.managers.forEach(mgr => {
        const mgrKey = `${dept.dept}|${mgr.manager}`;
        allManagers.add(mgrKey);
        mgr.positions.forEach(pos => {
          allPositions.add(`${mgrKey}|${pos.jobTitle}`);
        });
      });
    });

    setExpandedDepts(allDepts);
    setExpandedManagers(allManagers);
    setExpandedPositions(allPositions);
  };

  const collapseAll = () => {
    setExpandedDepts(new Set());
    setExpandedManagers(new Set());
    setExpandedPositions(new Set());
  };

  const moveDay = (direction: -1 | 1) => {
    const next = activeDayIndex + direction;
    if (next >= 0 && next < result.days.length) {
      setSelectedDayIndex(next);
      return;
    }
    setMonthOffset(value => value + direction);
    setSelectedDayIndex(
      direction === 1 ? 0 : getDaysInMonth(addMonths(result.monthDate, -1)) - 1
    );
  };

  return (
    <Card className="min-w-0 md:flex md:min-h-0 md:flex-1 md:flex-col">
      {isMobile ? (
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold capitalize">{result.monthLabel}</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-12 shrink-0 px-3"
              onClick={() => {
                setMonthOffset(0);
                setSelectedDayIndex(null);
              }}
            >
              {t('schedule.today')}
            </Button>
          </div>

          <div className="sticky top-0 z-20 -mx-4 flex items-center gap-2 border-b bg-card px-4 py-2" aria-label={t('schedule.pickAScheduleDay')}>
            <Button type="button" variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => moveDay(-1)} aria-label={t('schedule.previousDay')}>
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t('schedule.scheduleDay')}</span>
              <select
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-center text-sm font-semibold capitalize text-foreground"
                value={activeDayIndex}
                onChange={event => setSelectedDayIndex(Number(event.target.value))}
              >
                {result.days.map((day, index) => (
                  <option key={day.toISOString()} value={index}>
                    {format(day, 'EEEE, d MMMM', { locale: getDateLocale() })}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => moveDay(1)} aria-label={t('schedule.nextDay')}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2" aria-label={t('schedule.staffingSummary')}>
            <MobileMetric label={t('schedule.present')} value={totals.presentNa} />
            <MobileMetric label={t('schedule.needed')} value={totals.potrzeby} />
            <MobileMetric label={t('schedule.understaffed')} value={Math.max(0, totals.potrzeby - totals.presentNa)} alert={totals.presentNa < totals.potrzeby} />
            <MobileMetric label={t('schedule.absentAndOnLeave')} value={totals.absentNa} />
          </div>
          <p className="text-[13px] text-muted-foreground">{t('schedule.headcountEmployedDifferenceVsNeeds', { employed: totals.stanZatrudnienia, diff: `${totals.employedGap[activeDayIndex] > 0 ? '+' : ''}${totals.employedGap[activeDayIndex]}` })}</p>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t('schedule.departments')}</h3>
            {displayRows.map(dept => {
              const open = expandedDepts.has(dept.dept);
              const cell = dept.cells[activeDayIndex];
              return (
                <section key={dept.dept} className="min-w-0 overflow-hidden rounded-xl border">
                  <button type="button" className="flex min-h-14 w-full items-center gap-2 px-3 py-2 text-left" aria-expanded={open} onClick={() => toggleDept(dept.dept)}>
                    <span className="min-w-0 flex-1 break-words">
                      <span className="block font-semibold">{mobileDepartmentLabel(dept.dept)}</span>
                      <span className="block text-[13px] text-muted-foreground">Stan {dept.obecnie} · Obecni {cell?.mam ?? 0} · Potrzeby {dept.potrzeby}</span>
                    </span>
                    <span className="shrink-0 text-right text-sm tabular-nums">
                      <span className={(cell?.mam ?? 0) < dept.potrzeby ? 'text-[13px] font-semibold text-destructive' : 'text-[13px] text-muted-foreground'}>
                        {(cell?.mam ?? 0) < dept.potrzeby ? t('schedule.shortByCount', { count: dept.potrzeby - (cell?.mam ?? 0) }) : t('schedule.fullyStaffed')}
                      </span>
                    </span>
                    {open ? <ChevronDown className="h-5 w-5 shrink-0" /> : <ChevronRight className="h-5 w-5 shrink-0" />}
                  </button>
                  {open && (
                    <div className="space-y-3 border-t p-3">
                      <MobileStatusLists cell={cell} />
                      {dept.managers.map(manager => {
                        const managerKey = `${dept.dept}|${manager.manager}`;
                        const managerOpen = expandedManagers.has(managerKey);
                        return (
                          <div key={managerKey} className="min-w-0 rounded-lg border bg-muted/20">
                            <MobileHierarchyButton label={manager.manager === 'Brak kierownika' ? t('schedule.noManager') : t('schedule.managerName', { name: manager.manager })} row={manager} dayIndex={activeDayIndex} open={managerOpen} onClick={() => toggleManager(managerKey)} />
                            {managerOpen && (
                              <div className="space-y-2 border-t p-2">
                                {manager.positions.map(position => {
                                  const positionKey = `${managerKey}|${position.jobTitle}`;
                                  const positionOpen = expandedPositions.has(positionKey);
                                  return (
                                    <div key={positionKey} className="min-w-0 rounded-lg border bg-background">
                                      <MobileHierarchyButton label={position.jobTitle} row={position} dayIndex={activeDayIndex} open={positionOpen} onClick={() => togglePosition(positionKey)} />
                                      {positionOpen && (
                                        <div className="space-y-1 border-t p-2">
                                          <MobileStatusLists cell={position.cells[activeDayIndex]} />
                                          {position.employees.map((employee, employeeIndex) => {
                                            const employeeCell = employee.cells[activeDayIndex];
                                            return (
                                              <div key={`${employee.fullName}-${employeeIndex}`} className="flex min-h-12 items-center justify-between gap-2 border-t py-2 text-sm first:border-t-0">
                                                <span className="min-w-0 break-words">{employee.fullName}</span>
                                                <span className="shrink-0 text-right text-[13px] font-medium">{mobileEmployeeStatus(employeeCell)}</span>
                                              </div>
                                            );
                                          })}
                                          {position.employees.length === 0 && <p className="py-2 text-[13px] text-muted-foreground">{t('schedule.noEmployeesAssigned')}</p>}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
            {displayRows.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('schedule.noData')}
              </p>
            )}
          </div>
        </CardContent>
      ) : (
      <>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base capitalize">
            {t('schedule.staffingScheduleMonth', { month: result.monthLabel })}
          </CardTitle>
          <div className="flex-1 px-4 hidden sm:flex items-center">
            {totals.currentMonthArrivals && totals.currentMonthArrivals.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className=" gap-2 border-blue-500/30 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
                    <CalendarPlus className="h-4 w-4" />
                    {t('schedule.plannedArrivalsCountPpl', { count: totals.currentMonthArrivals.reduce((sum, a) => sum + a.count, 0) })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="border-b bg-muted/50 px-4 py-2.5">
                    <h4 className="font-medium flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4" /> {t('schedule.expectedThisMonth')}</h4>
                  </div>
                  <div className="p-2 max-h-[300px] overflow-auto">
                    {totals.currentMonthArrivals.map(arr => (
                      <div key={arr.id} className="flex flex-col gap-0.5 rounded-md p-2 hover:bg-muted/50 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">{format(new Date(arr.date), 'dd.MM')}</span>
                          <span className="font-bold bg-foreground text-background px-2 py-0.5 rounded text-xs">{t('schedule.countPpl', { count: arr.count })}</span>
                        </div>
                        <span className="text-foreground text-xs">{arr.jobTitle} <span className="opacity-70">({arr.department})</span></span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {totals.upcomingArrivals && totals.upcomingArrivals.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className=" gap-2 border-violet-500/30 bg-violet-50/50 hover:bg-violet-100/50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 dark:hover:bg-violet-900/30">
                    <CalendarDays className="h-4 w-4" />
                    {t('schedule.laterMonthsCountPpl', { count: totals.upcomingArrivals.reduce((sum, a) => sum + a.count, 0) })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="border-b bg-muted/50 px-4 py-2.5">
                    <h4 className="font-medium flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4" /> {t('schedule.expectedInLaterMonths')}</h4>
                  </div>
                  <div className="p-2 max-h-[300px] overflow-auto">
                    {totals.upcomingArrivals.map(arr => (
                      <div key={arr.id} className="flex flex-col gap-0.5 rounded-md p-2 hover:bg-muted/50 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">{format(new Date(arr.date), 'dd.MM.yyyy')}</span>
                          <span className="font-bold bg-foreground text-background px-2 py-0.5 rounded text-xs">{t('schedule.countPpl', { count: arr.count })}</span>
                        </div>
                        <span className="text-foreground text-xs">{arr.jobTitle} <span className="opacity-70">({arr.department})</span></span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
    
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setMonthOffset(m => m - 1)}
                aria-label={t('schedule.previousMonth')}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setMonthOffset(0)}
              >
                {t('schedule.thisMonth')}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setMonthOffset(m => m + 1)}
                aria-label={t('schedule.nextMonth')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 border-l pl-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[13px]"
                onClick={() => {
                  setMonthOffset(0);
                  setSelectedDayIndex(null);
                }}
              >
                {t('schedule.today')}
              </Button>
            </div>

            <div className="flex items-center gap-1 border-l pl-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-[13px]"
                onClick={expandAll}
                title={t('schedule.expandAllLevels')}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {t('schedule.expandAll')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-[13px]"
                onClick={collapseAll}
                title={t('schedule.collapseAllLevels')}
              >
                <Minimize2 className="h-3.5 w-3.5" />
                {t('schedule.collapseAll')}
              </Button>
            </div>

            {showExport && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                disabled={result.rows.length === 0 || isExporting}
                onClick={handleExport}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Excel
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="animate-absence-blink inline-block h-3 w-3 rounded" />
            {t('schedule.absentHoverToSeeWho')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-pink-500/60" />
            {t('schedule.onLeave')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-amber-400/80" />
            {t('schedule.leavingTerminationPlannedTerminationDate')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-emerald-500/60" />
            {t('schedule.changesArrivals')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-mono">—</span>
            {t('schedule.terminatedBeforeHire')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto pb-2">
          <table className="w-full min-w-max border-collapse text-[13px] harmonogram-table">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[150px] max-w-[170px] md:min-w-[180px] md:max-w-none truncate border-b bg-background px-2 py-2 text-left font-semibold">
                  {t('schedule.departmentManagerJobTitleEmployee')}
                </th>
                <th className="md:sticky md:left-[180px] top-0 z-20 md:z-30 min-w-[60px] border-b bg-background px-2 py-2 text-right font-semibold text-[13px]">
                  {t('schedule.needed')}
                </th>
                <th className="md:sticky md:left-[240px] top-0 z-20 md:z-30 min-w-[70px] border-b bg-background px-2 py-2 text-right font-semibold">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs uppercase text-muted-foreground">{t('schedule.asOf')}</span>
                    <span className="text-primary font-bold leading-none text-[13px]">
                      {selectedDayIndex === null && todayIndex >= 0
                        ? t('schedule.todayDate', { date: format(result.days[activeDayIndex], 'd.MM') })
                        : format(result.days[activeDayIndex], 'd.MM')}
                    </span>
                    <span className="text-xs leading-none text-muted-foreground/70">
                      {t('schedule.active')}
                    </span>
                  </div>
                </th>
                {result.days.map((d, i) => {
                  const isSelected = i === activeDayIndex;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th
                      key={d.toISOString()}
                      onClick={() => setSelectedDayIndex(i)}
                      className={
                        'sticky top-0 z-20 border-b bg-background px-1 py-2 text-center font-semibold tabular-nums cursor-pointer hover:bg-muted transition-colors text-[13px]' +
                        (isSelected ? ' bg-primary/10 text-primary border-b-2 border-b-primary' : '') +
                        (!isSelected && i === todayIndex ? ' text-primary' : '') +
                        (!isSelected && isWeekend ? ' text-muted-foreground/70' : '')
                      }
                      title={format(d, 'dd.MM.yyyy, EEEE', { locale: getDateLocale() })}
                    >
                      {format(d, 'd')}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map(deptRow => {
                const isDeptExpanded = expandedDepts.has(deptRow.dept);
                return (
                  <React.Fragment key={deptRow.dept}>
                    {/* Poziom 0: Dział */}
                    <tr
                      className="group cursor-pointer border-b border-border/40 hover:bg-muted/40 transition-colors"
                      onClick={() => toggleDept(deptRow.dept)}
                    >
                      <td className="sticky left-0 z-10 bg-background max-w-[170px] md:max-w-none truncate px-3 py-2 font-semibold">
                        <span className="flex items-center gap-1.5">
                          {isDeptExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate">{deptRow.dept}</span>
                        </span>
                      </td>
                      <td className="md:sticky md:left-[180px] z-10 bg-background px-2 py-2 text-right font-semibold tabular-nums text-[13px]">
                        {deptRow.potrzeby}
                      </td>
                      <td className={`md:sticky md:left-[240px] z-10 bg-background px-2 py-2 text-right tabular-nums text-[13px] ${deptRow.obecnie < deptRow.potrzeby ? 'text-red-600 font-bold' : ''}`} title={t('schedule.employedActiveStatusIncludingAbsent')}>
                        {deptRow.obecnie}
                      </td>
                      {deptRow.cells.map((cell, i) => (
                        <CellWithTooltip
                          key={`${deptRow.dept}-${i}`}
                          cell={cell}
                          onHover={setCellTooltip}
                          onLeave={() => setCellTooltip(null)}
                        />
                      ))}
                    </tr>

                    {/* Poziom 1: Kierownik */}
                    {isDeptExpanded &&
                      deptRow.managers.map(mgrRow => {
                        const mgrKey = `${deptRow.dept}|${mgrRow.manager}`;
                        const isMgrExpanded = expandedManagers.has(mgrKey);

                        return (
                          <React.Fragment key={mgrKey}>
                            <tr
                              className="group cursor-pointer border-b border-border/30 bg-muted/50 hover:bg-muted/70 transition-colors"
                              onClick={() => toggleManager(mgrKey)}
                            >
                              <td className="sticky left-0 z-10 bg-muted/50 max-w-[170px] md:max-w-none truncate py-1.5 pl-6 pr-3 text-[13px] font-medium">
                                <span className="flex items-center gap-1.5">
                                  {isMgrExpanded ? (
                                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  )}
                                  <Users className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                  <span className="truncate">
                                    {mgrRow.manager === 'Brak kierownika'
                                      ? t('schedule.noManager')
                                      : t('schedule.managerName', { name: mgrRow.manager })}
                                  </span>
                                </span>
                              </td>
                              <td className="md:sticky md:left-[180px] z-10 bg-muted/50 px-2 py-1.5 text-right text-[13px] font-semibold tabular-nums">
                                {mgrRow.potrzeby}
                              </td>
                              <td className={`md:sticky md:left-[240px] z-10 bg-muted/50 px-2 py-1.5 text-right text-[13px] tabular-nums ${mgrRow.obecnie < mgrRow.potrzeby ? 'text-red-600 font-bold' : ''}`} title={t('schedule.employedActiveStatusIncludingAbsent')}>
                                {mgrRow.obecnie}
                              </td>
                              {mgrRow.cells.map((cell, i) => (
                                <CellWithTooltip
                                  key={`${mgrKey}-${i}`}
                                  cell={cell}
                                  onHover={setCellTooltip}
                                  onLeave={() => setCellTooltip(null)}
                                />
                              ))}
                            </tr>

                            {/* Poziom 2: Stanowisko */}
                            {isMgrExpanded &&
                              mgrRow.positions.map(posRow => {
                                const posKey = `${mgrKey}|${posRow.jobTitle}`;
                                const isPosExpanded = expandedPositions.has(posKey);

                                return (
                                  <React.Fragment key={posKey}>
                                    <tr
                                      className="group cursor-pointer border-b border-border/20 bg-muted/25 hover:bg-muted/40 transition-colors"
                                      onClick={() => togglePosition(posKey)}
                                    >
                                      <td className="sticky left-0 z-10 bg-muted/25 max-w-[170px] md:max-w-none truncate py-1.5 pl-11 pr-3 text-[13px] italic text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                          {isPosExpanded ? (
                                            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                          )}
                                          <span className="truncate">• {posRow.jobTitle}</span>
                                        </span>
                                      </td>
                                      <td className="md:sticky md:left-[180px] z-10 bg-muted/25 px-2 py-1.5 text-right text-[13px] font-semibold tabular-nums">
                                        {isAdmin ? (<div onClick={(e) => e.stopPropagation()}><Input type="number" min={0} value={posRow.potrzeby} onChange={(e) => onUpdatePotrzeby?.(posRow.department, posRow.manager, posRow.jobTitle, parseInt(e.target.value) || 0)} className="h-6 w-14 px-1 py-0 text-right text-[13px] inline-block font-semibold bg-transparent" /></div>) : (posRow.potrzeby)}
                                      </td>
                                      <td className={`md:sticky md:left-[240px] z-10 bg-muted/25 px-2 py-1.5 text-right text-[13px] tabular-nums ${posRow.obecnie < posRow.potrzeby ? 'text-red-600 font-bold' : ''}`} title={t('schedule.employedActiveStatusIncludingAbsent')}>
                                        {posRow.obecnie}
                                      </td>
                                      {posRow.cells.map((cell, i) => (
                                        <CellWithTooltip
                                          key={`${posKey}-${i}`}
                                          cell={cell}
                                          onHover={setCellTooltip}
                                          onLeave={() => setCellTooltip(null)}
                                        />
                                      ))}
                                    </tr>

                                    {/* Poziom 3: Pracownik */}
                                    {isPosExpanded &&
                                      posRow.employees.map(empRow => (
                                        <tr
                                          key={`${posKey}-${empRow.fullName}`}
                                          className="group border-b border-border/10 bg-background/60 hover:bg-muted/20 transition-colors"
                                        >
                                          <td className="sticky left-0 z-10 bg-background/90 max-w-[170px] md:max-w-none truncate py-1 pl-16 pr-3 text-[13px] text-foreground/85">
                                            <span className="flex items-center gap-1.5">
                                              <User className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                              <span className="truncate">{empRow.fullName}</span>
                                            </span>
                                          </td>
                                          <td className="md:sticky md:left-[180px] z-10 bg-background/90 px-2 py-1 text-right text-[13px] text-muted-foreground/60">
                                            —
                                          </td>
                                          <td className="md:sticky md:left-[240px] z-10 bg-background/90 px-2 py-1 text-right text-[13px] tabular-nums" title={t('schedule.employedActiveStatus')}>
                                            {empRow.obecnie ? (
                                              <span className="font-bold">1</span>
                                            ) : (
                                              <span className="text-muted-foreground/40">—</span>
                                            )}
                                          </td>
                                          {empRow.cells.map((cell, i) => (
                                            <EmployeeCellWithTooltip
                                              key={`${empRow.fullName}-${i}`}
                                              cell={cell}
                                              onHover={setCellTooltip}
                                              onLeave={() => setCellTooltip(null)}
                                            />
                                          ))}
                                        </tr>
                                      ))}
                                  </React.Fragment>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              {(() => {
                const sign = (v: number) => (v > 0 ? `+${v}` : `${v}`);
                const gapColor = (v: number) =>
                  v < 0
                    ? 'text-destructive'
                    : v > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground';
                const perDayAbsent = result.days.map((_, i) =>
                  result.rows.reduce(
                    (s, r) =>
                      s +
                      (r.cells[i]?.absentees.length ?? 0) +
                      (r.cells[i]?.vacationers.length ?? 0),
                    0
                  )
                );
                const label =
                  'sticky left-0 z-30 h-7 min-w-[150px] md:min-w-[180px] border-t bg-background px-2 py-1.5 text-left text-xs font-semibold uppercase leading-none';
                const fixed =
                  'sticky md:left-[180px] z-30 h-7 min-w-[60px] border-t bg-background px-2 py-1.5 text-right text-[13px] tabular-nums leading-none';
                const stan =
                  'sticky md:left-[240px] z-30 h-7 min-w-[70px] border-t bg-background px-2 py-1.5 text-right text-[13px] tabular-nums leading-none';
                const day =
                  'sticky z-20 h-7 border-t bg-background px-1 py-1.5 text-center text-[13px] font-semibold tabular-nums leading-none';

                const rows: {
                  key: string;
                  label: string;
                  labelClass?: string;
                  stanValue?: React.ReactNode;
                  stanTitle?: string;
                  fixedValue?: React.ReactNode;
                  perDay: number[];
                  valueClass: (v: number) => string;
                  dayTitle: (i: number) => string;
                }[] = [
                  {
                    key: 'nb-urlop',
                    label: t('schedule.absentLeave'),
                    labelClass: 'text-amber-600 dark:text-amber-400',
                    stanValue: totals.absentNa,
                    stanTitle: t('schedule.absentOnLeaveTodayCount', { count: totals.absentNa }),
                    perDay: perDayAbsent,
                    valueClass: v => (v > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/40'),
                    dayTitle: i => t('schedule.absentOnLeaveDateCount', { date: format(result.days[i], 'dd.MM'), count: perDayAbsent[i] ?? 0 }),
                  },
                  {
                    key: 'potrzeby-stan-zatrudnienia',
                    label: t('schedule.headcountActiveStatusNeeded'),
                    stanValue: sign(totals.employedGap[activeDayIndex] ?? 0),
                    stanTitle: t('schedule.employedActiveStatusEmployedNeeded', { employed: totals.stanZatrudnienia, needed: totals.potrzeby }),
                    perDay: totals.employedGap,
                    valueClass: gapColor,
                    dayTitle: i => {
                      const v = totals.employedGap[i] ?? 0;
                      return t('schedule.employedActiveStatusEmployedNeeded2', { employed: totals.stanZatrudnienia, needed: totals.potrzeby, diff: sign(v) });
                    },
                  },
                ];

                return (
                  <>
                    <tr className="group border-t-2">
                      <td className={label + ' border-t-2'} style={{ bottom: '84px' }}>
                        {t('schedule.total')}
                      </td>
                      <td className={fixed + ' border-t-2 font-bold'} style={{ bottom: '84px' }}>
                        {totals.potrzeby}
                      </td>
                      <td className={stan + ' border-t-2 font-bold' + (totals.stanZatrudnienia < totals.potrzeby ? ' text-red-600' : '')} style={{ bottom: '84px' }} title={t('schedule.employedActiveStatusIncludingAbsent')}>
                        {totals.stanZatrudnienia}
                      </td>
                      {result.days.map((d, i) => (
                        <td
                          key={d.toISOString()}
                          className={
                            day + ' border-t-2' +
                            (i === activeDayIndex ? ' bg-primary/10' : '')
                          }
                          style={{ bottom: '84px' }}
                        />
                      ))}
                    </tr>
                    {rows.map((row, rowIdx) => (
                      <tr key={row.key} className="group">
                        <td
                          className={
                            label + (row.labelClass ? ` ${row.labelClass}` : '')
                          }
                          style={{ bottom: `${(rows.length - rowIdx - 1) * 28}px` }}
                        >
                          {row.label}
                        </td>
                        <td className={fixed} style={{ bottom: `${(rows.length - rowIdx - 1) * 28}px` }}>
                          —
                        </td>
                        <td
                          className={stan}
                          style={{ bottom: `${(rows.length - rowIdx - 1) * 28}px` }}
                          title={row.stanTitle}
                        >
                          {row.stanValue}
                        </td>
                        {result.days.map((d, i) => {
                          const v = row.perDay[i] ?? 0;
                          return (
                            <td
                              key={d.toISOString()}
                              title={row.dayTitle(i)}
                              className={
                                day + ' ' + row.valueClass(v) +
                                (i === activeDayIndex ? ' bg-primary/10' : '')
                              }
                              style={{ bottom: `${(rows.length - rowIdx - 1) * 28}px` }}
                            >
                              {row.key === 'nb-urlop' ? (v > 0 ? v : '—') : sign(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                );
              })()}
            </tfoot>
          </table>
          {displayRows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('schedule.noData')}
            </p>
          )}
        </div>
      </CardContent>

      {cellTooltip && (
        <TooltipPanel
          x={cellTooltip.x}
          top={cellTooltip.top}
          bottom={cellTooltip.bottom}
          absentees={cellTooltip.absentees}
          vacationers={cellTooltip.vacationers}
          terminating={cellTooltip.terminating}
          singleTitle={cellTooltip.singleTitle}
        />
      )}
      </>
      )}
    </Card>
  );
}

function MobileMetric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/20 p-3">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${alert ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

function MobileHierarchyButton({
  label,
  row,
  dayIndex,
  open,
  onClick,
}: {
  label: string;
  row: HarmonogramManagerRow | HarmonogramPositionRow;
  dayIndex: number;
  open: boolean;
  onClick: () => void;
}) {
  const present = row.cells[dayIndex]?.mam ?? 0;
  return (
    <button type="button" className="flex min-h-12 w-full items-center gap-2 px-3 py-2 text-left" aria-expanded={open} onClick={onClick}>
      <span className="min-w-0 flex-1 break-words text-sm font-medium">{label}</span>
      <span className="shrink-0 text-right text-[13px] tabular-nums">
        <span className="block">{present} / {row.potrzeby}</span>
        <span className={present < row.potrzeby ? 'text-destructive' : 'text-muted-foreground'}>
          {present < row.potrzeby ? t('schedule.shortByCount', { count: row.potrzeby - present }) : t('schedule.fullyStaffed')}
        </span>
      </span>
      {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
    </button>
  );
}

function MobileStatusLists({ cell }: { cell?: HarmonogramCell }) {
  if (!cell) return null;
  const groups = [
    { label: t('schedule.absent'), entries: cell.absentees, color: 'text-destructive' },
    { label: t('schedule.onLeave2'), entries: cell.vacationers, color: 'text-pink-600 dark:text-pink-400' },
    { label: t('schedule.leaving'), entries: cell.terminating ?? [], color: 'text-amber-600 dark:text-amber-400' },
  ];
  return (
    <div className="space-y-2">
      {groups.filter(group => group.entries.length > 0).map(group => (
        <div key={group.label} className="rounded-md bg-muted/40 px-3 py-2 text-[13px]">
          <p className={`font-semibold ${group.color}`}>{group.label} ({group.entries.length})</p>
          <ul className="mt-1 space-y-1">
            {group.entries.map((person, index) => (
              <li key={`${person.fullName}-${index}`} className="break-words">
                {person.fullName} <span className="text-muted-foreground">· {person.jobTitle}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function mobileEmployeeStatus(cell?: HarmonogramCell) {
  switch (cell?.statusType) {
    case 'present': return t('schedule.present2');
    case 'absent': return t('schedule.absent2');
    case 'vacation': return t('schedule.leave');
    case 'terminating': return t('schedule.lastDay');
    case 'terminated': return t('schedule.terminated');
    case 'not_hired': return t('schedule.beforeHire');
    default: return '—';
  }
}

function mobileDepartmentLabel(name: string) {
  return name.replace(/^DZIAŁ[_ ]?/i, '').replaceAll('_', ' ').split(' ').map(part =>
    part.length <= 3 ? part.toLocaleUpperCase('pl') : part.charAt(0).toLocaleUpperCase('pl') + part.slice(1).toLocaleLowerCase('pl')
  ).join(' ');
}

function CellWithTooltip({
  cell,
  onHover,
  onLeave,
}: {
  cell: HarmonogramCell;
  onHover: (t: {
    x: number;
    top: number;
    bottom: number;
    absentees: HarmonogramCell['absentees'];
    vacationers: HarmonogramCell['vacationers'];
    terminating?: HarmonogramCell['terminating'];
    singleTitle?: string;
  }) => void;
  onLeave: () => void;
}) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (
      cell.absentees.length === 0 &&
      cell.vacationers.length === 0 &&
      !(cell.terminating && cell.terminating.length > 0)
    )
      return;
    const rect = e.currentTarget.getBoundingClientRect();
    onHover({
      x: rect.left + rect.width / 2,
      top: rect.top,
      bottom: rect.bottom,
      absentees: cell.absentees,
      vacationers: cell.vacationers,
      terminating: cell.terminating,
    });
  };

  return (
    <td
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      className={
        'px-1 py-1.5 text-center tabular-nums text-[13px]' +
        (cell.absentees.length > 0
          ? ' animate-absence-blink font-semibold'
          : cell.vacationers.length > 0
            ? ' bg-pink-500/25'
            : cell.terminating && cell.terminating.length > 0
              ? ' bg-amber-500/25 font-medium'
              : cell.title && cell.title.includes('przyjęć')
                ? ' bg-emerald-500/15'
                : '')
      }
    >
      {cell.mam}
    </td>
  );
}

function EmployeeCellWithTooltip({
  cell,
  onHover,
  onLeave,
}: {
  cell: HarmonogramCell;
  onHover: (t: {
    x: number;
    top: number;
    bottom: number;
    absentees: HarmonogramCell['absentees'];
    vacationers: HarmonogramCell['vacationers'];
    terminating?: HarmonogramCell['terminating'];
    singleTitle?: string;
  }) => void;
  onLeave: () => void;
}) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (!cell.title) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onHover({
      x: rect.left + rect.width / 2,
      top: rect.top,
      bottom: rect.bottom,
      absentees: cell.absentees,
      vacationers: cell.vacationers,
      terminating: cell.terminating,
      singleTitle: cell.title,
    });
  };

  let displayContent: React.ReactNode = cell.mam;
  let cellClass = 'px-1 py-1 text-center tabular-nums text-[13px] ';

  if (cell.statusType === 'absent') {
    displayContent = '0';
    cellClass += ' animate-absence-blink font-bold text-destructive';
  } else if (cell.statusType === 'vacation') {
    displayContent = '0';
    cellClass += ' bg-pink-500/25 font-medium text-pink-600 dark:text-pink-400';
  } else if (cell.statusType === 'terminating') {
    cellClass += ' bg-amber-500/25 font-medium text-amber-600 dark:text-amber-400';
  } else if (cell.statusType === 'terminated' || cell.statusType === 'not_hired') {
    displayContent = '—';
    cellClass += ' text-muted-foreground/40';
  } else {
    cellClass += ' text-foreground/80';
  }

  return (
    <td onMouseEnter={handleMouseEnter} onMouseLeave={onLeave} className={cellClass}>
      {displayContent}
    </td>
  );
}

const TOOLTIP_WIDTH = 340;
const TOOLTIP_MARGIN = 8;

function TooltipPanel({
  x,
  top,
  bottom,
  absentees,
  vacationers,
  terminating = [],
  singleTitle,
}: {
  x: number;
  top: number;
  bottom: number;
  absentees: HarmonogramCell['absentees'];
  vacationers: HarmonogramCell['vacationers'];
  terminating?: HarmonogramCell['terminating'];
  singleTitle?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({
    left: x,
    top: bottom + 4,
  });

  React.useLayoutEffect(() => {
    const h = ref.current?.offsetHeight ?? 0;
    const left = Math.max(
      TOOLTIP_MARGIN,
      Math.min(x - TOOLTIP_WIDTH / 2, window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN)
    );
    const fitsBelow = bottom + 4 + h <= window.innerHeight - TOOLTIP_MARGIN;
    const nextTop = fitsBelow ? bottom + 4 : Math.max(TOOLTIP_MARGIN, top - h - 4);
    const clampedTop = Math.min(
      nextTop,
      Math.max(TOOLTIP_MARGIN, window.innerHeight - h - TOOLTIP_MARGIN)
    );
    setStyle({ left, top: clampedTop });
  }, [x, top, bottom]);

  if (
    singleTitle &&
    absentees.length === 0 &&
    vacationers.length === 0 &&
    terminating.length === 0
  ) {
    return createPortal(
      <div
        ref={ref}
        className="pointer-events-none fixed z-50 max-w-[340px] rounded-md border bg-popover px-3 py-1.5 text-[13px] text-popover-foreground shadow-lg"
        style={style}
      >
        {singleTitle}
      </div>,
      document.body
    );
  }

  if (absentees.length === 0 && vacationers.length === 0 && terminating.length === 0)
    return null;

  return createPortal(
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 w-[340px] overflow-hidden rounded-lg border bg-background shadow-xl"
      style={style}
    >
      {singleTitle && (
        <div className="border-b bg-muted/40 px-3 py-1 text-[13px] font-semibold">
          {singleTitle}
        </div>
      )}
      {absentees.length > 0 && (
        <div>
          <p className="animate-absence-blink px-3 py-1.5 text-[13px] font-semibold text-destructive">
            {t('schedule.absentCount', { count: absentees.length })}
          </p>
          <AbsenceTooltipTable
            rows={absentees.map(a => ({
              key: `${a.date}-${a.fullName}`,
              fullName: a.fullName,
              jobTitle: a.jobTitle,
              manager: a.manager,
            }))}
          />
        </div>
      )}
      {vacationers.length > 0 && (
        <div>
          <p className="bg-pink-500/15 px-3 py-1.5 text-[13px] font-semibold text-pink-600 dark:text-pink-400">
            {t('schedule.onLeaveCount', { count: vacationers.length })}
          </p>
          <AbsenceTooltipTable
            rows={vacationers.map(e => ({
              key: `u-${e.fullName}-${e.jobTitle}`,
              fullName: e.fullName,
              jobTitle: e.jobTitle,
              manager: e.manager,
            }))}
          />
        </div>
      )}
      {terminating.length > 0 && (
        <div>
          <p className="bg-amber-500/15 px-3 py-1.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
            {t('schedule.leavingCount', { count: terminating.length })}
          </p>
          <AbsenceTooltipTable
            rows={terminating.map(e => ({
              key: `t-${e.fullName}-${e.jobTitle}`,
              fullName: e.fullName,
              jobTitle: e.jobTitle,
              manager: e.manager,
            }))}
          />
        </div>
      )}
    </div>,
    document.body
  );
}

function AbsenceTooltipTable({
  rows,
}: {
  rows: { key: string; fullName: string; jobTitle: string; manager?: string }[];
}) {
  return (
    <table className="block w-full overflow-x-auto text-[13px]">
      <thead>
        <tr className="group border-b text-left text-muted-foreground">
          <th className="px-3 py-1 font-medium">{t('schedule.employee')}</th>
          <th className="px-2 py-1 font-medium">{t('schedule.jobTitle')}</th>
          <th className="px-3 py-1 font-medium">{t('schedule.manager')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.key} className="group border-b border-border/40">
            <td className="px-3 py-1 font-medium">{row.fullName}</td>
            <td className="px-2 py-1">{row.jobTitle}</td>
            <td className="px-3 py-1 text-muted-foreground">{row.manager || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

