'use client';

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
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
import { Button } from '@/components/ui/button';
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

export function HarmonogramView({
  data,
  showExport = true,
}: {
  data: HarmonogramData;
  showExport?: boolean;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  const [cellTooltip, setCellTooltip] = useState<{
    x: number;
    top: number;
    bottom: number;
    absentees: HarmonogramCell['absentees'];
    vacationers: HarmonogramCell['vacationers'];
    singleTitle?: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const result = useMemo(() => buildHarmonogram(data, monthOffset), [data, monthOffset]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportHarmonogramToExcel(result);
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

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base capitalize">
            Harmonogram obsady — {result.monthLabel}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setMonthOffset(m => m - 1)}
                aria-label="Poprzedni miesiąc"
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
                Ten miesiąc
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setMonthOffset(m => m + 1)}
                aria-label="Następny miesiąc"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 border-l pl-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={expandAll}
                title="Rozwiń wszystkie poziomy"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Rozwiń wszystko
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={collapseAll}
                title="Zwiń wszystkie poziomy"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Zwiń wszystko
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
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="animate-absence-blink inline-block h-3 w-3 rounded" />
            nieobecni (najedź, aby zobaczyć kto)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-pink-500/60" />
            na urlopie
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-emerald-500/60" />
            zmiany / przyjęcia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-mono">—</span>
            zwolniony / przed zatrudnieniem
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto pb-2">
          <table className="w-max border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[220px] border-b bg-background px-3 py-2 text-left font-semibold">
                  Dział / Kierownik / Stanowisko / Pracownik
                </th>
                <th className="sticky left-[220px] top-0 z-30 min-w-[70px] border-b bg-background px-3 py-2 text-right font-semibold">
                  Potrzeby
                </th>
                <th className="sticky left-[290px] top-0 z-30 min-w-[70px] border-b bg-background px-3 py-2 text-right font-semibold">
                  Mam teraz
                </th>
                {result.days.map((d, i) => (
                  <th
                    key={d.toISOString()}
                    className={
                      'sticky top-0 z-20 border-b bg-background px-2.5 py-2 text-center font-semibold tabular-nums' +
                      (i === 0 ? ' text-primary' : '')
                    }
                  >
                    {format(d, 'dd.MM')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map(deptRow => {
                const isDeptExpanded = expandedDepts.has(deptRow.dept);
                return (
                  <React.Fragment key={deptRow.dept}>
                    {/* Poziom 0: Dział */}
                    <tr
                      className="cursor-pointer border-b border-border/40 hover:bg-muted/40 transition-colors"
                      onClick={() => toggleDept(deptRow.dept)}
                    >
                      <td className="sticky left-0 z-10 bg-background px-3 py-2 font-semibold">
                        <span className="flex items-center gap-1.5">
                          {isDeptExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span>{deptRow.dept}</span>
                        </span>
                      </td>
                      <td className="sticky left-[220px] z-10 bg-background px-3 py-2 text-right font-semibold tabular-nums">
                        {deptRow.potrzeby}
                      </td>
                      <td className="sticky left-[290px] z-10 bg-background px-3 py-2 text-right tabular-nums">
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
                              className="cursor-pointer border-b border-border/30 bg-muted/50 hover:bg-muted/70 transition-colors"
                              onClick={() => toggleManager(mgrKey)}
                            >
                              <td className="sticky left-0 z-10 bg-muted/50 py-1.5 pl-6 pr-3 text-xs font-medium">
                                <span className="flex items-center gap-1.5">
                                  {isMgrExpanded ? (
                                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  )}
                                  <Users className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                  <span>
                                    {mgrRow.manager === 'Brak kierownika'
                                      ? 'Brak kierownika'
                                      : `Kierownik: ${mgrRow.manager}`}
                                  </span>
                                </span>
                              </td>
                              <td className="sticky left-[220px] z-10 bg-muted/50 px-3 py-1.5 text-right text-xs font-semibold tabular-nums">
                                {mgrRow.potrzeby}
                              </td>
                              <td className="sticky left-[290px] z-10 bg-muted/50 px-3 py-1.5 text-right text-xs tabular-nums">
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
                                      className="cursor-pointer border-b border-border/20 bg-muted/25 hover:bg-muted/40 transition-colors"
                                      onClick={() => togglePosition(posKey)}
                                    >
                                      <td className="sticky left-0 z-10 bg-muted/25 py-1.5 pl-11 pr-3 text-xs italic text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                          {isPosExpanded ? (
                                            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                          )}
                                          <span>• {posRow.jobTitle}</span>
                                        </span>
                                      </td>
                                      <td className="sticky left-[220px] z-10 bg-muted/25 px-3 py-1.5 text-right text-xs font-semibold tabular-nums">
                                        {posRow.potrzeby}
                                      </td>
                                      <td className="sticky left-[290px] z-10 bg-muted/25 px-3 py-1.5 text-right text-xs tabular-nums">
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
                                          className="border-b border-border/10 bg-background/60 hover:bg-muted/20 transition-colors"
                                        >
                                          <td className="sticky left-0 z-10 bg-background/90 py-1 pl-16 pr-3 text-xs text-foreground/85">
                                            <span className="flex items-center gap-1.5">
                                              <User className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                              <span>{empRow.fullName}</span>
                                            </span>
                                          </td>
                                          <td className="sticky left-[220px] z-10 bg-background/90 px-3 py-1 text-right text-xs text-muted-foreground/60">
                                            —
                                          </td>
                                          <td className="sticky left-[290px] z-10 bg-background/90 px-3 py-1 text-right text-xs tabular-nums">
                                            {empRow.obecnie}
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
          </table>
          {result.rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Brak danych.</p>
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
          singleTitle={cellTooltip.singleTitle}
        />
      )}
    </Card>
  );
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
    singleTitle?: string;
  }) => void;
  onLeave: () => void;
}) {
  const handleMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (cell.absentees.length === 0 && cell.vacationers.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onHover({
      x: rect.left + rect.width / 2,
      top: rect.top,
      bottom: rect.bottom,
      absentees: cell.absentees,
      vacationers: cell.vacationers,
    });
  };

  return (
    <td
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      className={
        'px-2.5 py-1.5 text-center tabular-nums text-xs' +
        (cell.absentees.length > 0
          ? ' animate-absence-blink font-semibold'
          : cell.vacationers.length > 0
            ? ' bg-pink-500/25'
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
      singleTitle: cell.title,
    });
  };

  let displayContent: React.ReactNode = cell.mam;
  let cellClass = 'px-2.5 py-1 text-center tabular-nums text-xs ';

  if (cell.statusType === 'absent') {
    displayContent = '0';
    cellClass += ' animate-absence-blink font-bold text-destructive';
  } else if (cell.statusType === 'vacation') {
    displayContent = '0';
    cellClass += ' bg-pink-500/25 font-medium text-pink-600 dark:text-pink-400';
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
  singleTitle,
}: {
  x: number;
  top: number;
  bottom: number;
  absentees: HarmonogramCell['absentees'];
  vacationers: HarmonogramCell['vacationers'];
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

  if (singleTitle && absentees.length === 0 && vacationers.length === 0) {
    return createPortal(
      <div
        ref={ref}
        className="pointer-events-none fixed z-50 max-w-[340px] rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-lg"
        style={style}
      >
        {singleTitle}
      </div>,
      document.body
    );
  }

  if (absentees.length === 0 && vacationers.length === 0) return null;

  return createPortal(
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 w-[340px] overflow-hidden rounded-lg border bg-background shadow-xl"
      style={style}
    >
      {singleTitle && (
        <div className="border-b bg-muted/40 px-3 py-1 text-xs font-semibold">
          {singleTitle}
        </div>
      )}
      {absentees.length > 0 && (
        <div>
          <p className="animate-absence-blink px-3 py-1.5 text-xs font-semibold text-destructive">
            Nieobecni ({absentees.length})
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
          <p className="bg-pink-500/15 px-3 py-1.5 text-xs font-semibold text-pink-600 dark:text-pink-400">
            Na urlopie ({vacationers.length})
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
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="px-3 py-1 font-medium">Pracownik</th>
          <th className="px-2 py-1 font-medium">Stanowisko</th>
          <th className="px-3 py-1 font-medium">Kierownik</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.key} className="border-b border-border/40">
            <td className="px-3 py-1 font-medium">{row.fullName}</td>
            <td className="px-2 py-1">{row.jobTitle}</td>
            <td className="px-3 py-1 text-muted-foreground">{row.manager || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
