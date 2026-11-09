'use client';

import { excelLikeMatch } from '@/lib/search';
import { normalizeLockerLabel } from '@/lib/lockers';
import type { LockerPosition, LockerZone } from './locker-types';
import { LockerBox } from './locker-box';

export interface LockerRow {
  key: string;
  lockers: LockerPosition[];
}

const lockerNumber = (label: string) => Number(label.replace(/\D/g, '')) || 0;
// Napisy typu "OKREME:" czy "СТІНА" to podpisy na planie, nie szafki
const isRealLocker = (l: LockerPosition) => /^K?\d+$/i.test(l.defaultLabel.trim());

/** Rozkłada strefę na rzędy posortowane rosnąco po numerach szafek. */
export function getZoneRows(zone: LockerZone): LockerRow[] {
  const rows: LockerRow[] = [];
  for (const section of zone.sections) {
    const lockers = section.lockers.filter(isRealLocker);
    if (lockers.length === 0) continue;
    // Sekcje jednokolumnowe (pionowe na planie) to jeden rząd; siatki dzielimy po polu `row`
    const groups = new Map<number, LockerPosition[]>();
    for (const locker of lockers) {
      const rowNo = section.gridCols === 1 ? 1 : locker.row;
      groups.set(rowNo, [...(groups.get(rowNo) ?? []), locker]);
    }
    for (const [rowNo, group] of groups) {
      rows.push({
        key: `${section.id}-${rowNo}`,
        lockers: [...group].sort((a, b) => lockerNumber(a.defaultLabel) - lockerNumber(b.defaultLabel)),
      });
    }
  }
  return rows.sort((a, b) => lockerNumber(a.lockers[0].defaultLabel) - lockerNumber(b.lockers[0].defaultLabel));
}

export function ZoneView({
  rows,
  labels,
  editingId,
  highlightQuery,
  occupancy,
  onEdit,
  onChange,
}: {
  rows: LockerRow[];
  labels: Record<string, string>;
  editingId: string | null;
  highlightQuery: string;
  occupancy: Record<string, string[]>;
  onEdit: (id: string | null) => void;
  onChange: (id: string, val: string) => void;
}) {
  const query = highlightQuery.trim();
  const labelOf = (l: LockerPosition) => labels[l.id] ?? l.defaultLabel;
  const occupantsOf = (l: LockerPosition) => occupancy[normalizeLockerLabel(labelOf(l))] ?? [];

  return (
    <div className="divide-y divide-border/60">
      {rows.map((row, idx) => {
        const first = labelOf(row.lockers[0]);
        const last = labelOf(row.lockers[row.lockers.length - 1]);
        const taken = row.lockers.filter((l) => occupantsOf(l).length > 0).length;
        return (
          <div key={row.key} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-baseline gap-2 sm:w-32 sm:shrink-0 sm:flex-col sm:gap-0.5">
              <span className="text-sm font-semibold">Rząd {idx + 1}</span>
              <span className="text-xs text-muted-foreground">
                {row.lockers.length > 1 ? `${first} – ${last}` : first} · {taken}/{row.lockers.length} zajęte
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {row.lockers.map((locker) => {
                const label = labelOf(locker);
                const occupants = occupantsOf(locker);
                const matches = query.length > 0 && excelLikeMatch(query, [label, ...occupants]);
                return (
                  <LockerBox
                    key={locker.id}
                    label={label}
                    occupants={occupants}
                    isEditing={editingId === locker.id}
                    isHighlighted={matches}
                    isDimmed={query.length > 0 && !matches}
                    onChange={(val) => onChange(locker.id, val)}
                    onClick={() => onEdit(editingId === locker.id ? null : locker.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
