'use client';

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildHarmonogram,
  exportHarmonogramToExcel,
  HarmonogramCell,
  HarmonogramData,
  HarmonogramRow,
} from '@/lib/harmonogram';

export function HarmonogramView({
  data,
  showExport = true,
}: {
  data: HarmonogramData;
  showExport?: boolean;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [cellTooltip, setCellTooltip] = useState<{
    x: number;
    top: number;
    bottom: number;
    absentees: HarmonogramCell['absentees'];
    vacationers: HarmonogramCell['vacationers'];
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

  return (
    <Card>
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
            zmiany (przyjęcia / zwolnienia)
          </span>
          <span>
            Mam [dzień] = obecnie − zatrudnienia po tym dniu − zwolnienia (od dnia po zwolnieniu) +
            przyjęcia (od tego dnia) − nieobecni (tego dnia) − urlopy (tego dnia)
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <table className="w-max border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[160px] border-b bg-background px-3 py-2 text-left font-semibold">
                  Dział / Stanowisko
                </th>
                <th className="sticky left-[160px] z-10 min-w-[70px] border-b bg-background px-3 py-2 text-right font-semibold">
                  Potrzeby
                </th>
                <th className="sticky left-[230px] z-10 min-w-[70px] border-b bg-background px-3 py-2 text-right font-semibold">
                  Mam teraz
                </th>
                {result.days.map((d, i) => (
                  <th
                    key={d.toISOString()}
                    className={
                      'border-b px-2.5 py-2 text-center font-semibold tabular-nums' +
                      (i === 0 ? ' bg-primary/5' : '')
                    }
                  >
                    {format(d, 'dd.MM')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map(row => (
                <HarmonogramDeptRows
                  key={row.dept}
                  row={row}
                  dayCount={result.days.length}
                  expanded={expandedDept === row.dept}
                  onToggle={() =>
                    setExpandedDept(prev => (prev === row.dept ? null : row.dept))
                  }
                  onCellHover={setCellTooltip}
                  onCellLeave={() => setCellTooltip(null)}
                />
              ))}
            </tbody>
          </table>
          {result.rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Brak danych.</p>
          )}
        </div>
      </CardContent>

      {cellTooltip && (cellTooltip.absentees.length > 0 || cellTooltip.vacationers.length > 0) && (
        <TooltipPanel
          x={cellTooltip.x}
          top={cellTooltip.top}
          bottom={cellTooltip.bottom}
          absentees={cellTooltip.absentees}
          vacationers={cellTooltip.vacationers}
        />
      )}
    </Card>
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
}: {
  x: number;
  top: number;
  bottom: number;
  absentees: HarmonogramCell['absentees'];
  vacationers: HarmonogramCell['vacationers'];
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
    setStyle({ left, top: nextTop });
  }, [x, top, bottom]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 w-[340px] overflow-hidden rounded-lg border bg-background shadow-xl"
      style={style}
    >
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
    </div>
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

function HarmonogramDeptRows({
  row,
  dayCount,
  expanded,
  onToggle,
  onCellHover,
  onCellLeave,
}: {
  row: HarmonogramRow;
  dayCount: number;
  expanded: boolean;
  onToggle: () => void;
  onCellHover: (t: {
    x: number;
    top: number;
    bottom: number;
    absentees: HarmonogramCell['absentees'];
    vacationers: HarmonogramCell['vacationers'];
  }) => void;
  onCellLeave: () => void;
}) {
  const handleHover = (e: React.MouseEvent<HTMLTableCellElement>, cell: HarmonogramCell) => {
    if (cell.absentees.length === 0 && cell.vacationers.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onCellHover({
      x: rect.left + rect.width / 2,
      top: rect.top,
      bottom: rect.bottom,
      absentees: cell.absentees,
      vacationers: cell.vacationers,
    });
  };

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/40 hover:bg-muted/40"
        onClick={onToggle}
      >
        <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium">
          <span className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {row.dept}
          </span>
        </td>
        <td className="sticky left-[160px] z-10 bg-background px-3 py-2 text-right font-semibold tabular-nums">
          {row.potrzeby}
        </td>
        <td className="sticky left-[230px] z-10 bg-background px-3 py-2 text-right tabular-nums">
          {row.obecnie}
        </td>
        {row.cells.map((cell, i) => (
          <td
            key={`${row.dept}-${i}`}
            onMouseEnter={e => handleHover(e, cell)}
            onMouseLeave={onCellLeave}
            className={
              'px-2.5 py-2 text-center tabular-nums' +
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
        ))}
      </tr>
      {expanded &&
        row.positions.map(pos => (
          <tr key={`${row.dept}-${pos.jobTitle}`} className="bg-muted/40">
            <td className="sticky left-0 z-10 bg-muted/40 py-1.5 pl-10 pr-3 text-xs italic text-muted-foreground">
              • {pos.jobTitle}
            </td>
            <td className="sticky left-[160px] z-10 bg-muted/40 px-3 py-1.5 text-right text-xs font-semibold tabular-nums">
              {pos.potrzeby}
            </td>
            <td className="sticky left-[230px] z-10 bg-muted/40 px-3 py-1.5 text-right text-xs tabular-nums">
              {pos.obecnie}
            </td>
            {pos.cells.map((cell, i) => (
              <td
                key={`${row.dept}-${pos.jobTitle}-${i}`}
                onMouseEnter={e => handleHover(e, cell)}
                onMouseLeave={onCellLeave}
                className={
                  'px-2.5 py-1.5 text-center text-xs tabular-nums' +
                  (cell.absentees.length > 0
                    ? ' animate-absence-blink font-semibold'
                    : cell.vacationers.length > 0
                      ? ' bg-pink-500/25'
                      : '')
                }
              >
                {cell.mam}
              </td>
            ))}
            {dayCount > pos.cells.length &&
              Array.from({ length: dayCount - pos.cells.length }, (_, i) => (
                <td key={`pad-${i}`} />
              ))}
          </tr>
        ))}
    </>
  );
}
