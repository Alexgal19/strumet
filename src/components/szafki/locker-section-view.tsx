'use client';

import { cn } from '@/lib/utils';
import { excelLikeMatch } from '@/lib/search';
import type { LockerSection } from './locker-types';
import { LockerBox } from './locker-box';

export function LockerSectionView({
  section,
  labels,
  editingId,
  highlightQuery,
  occupiedLockers,
  occupiedByMap,
  onEdit,
  onChange,
}: {
  section: LockerSection;
  labels: Record<string, string>;
  editingId: string | null;
  highlightQuery: string;
  occupiedLockers: Set<string>;
  occupiedByMap: Record<string, string>;
  onEdit: (id: string | null) => void;
  onChange: (id: string, val: string) => void;
}) {
  const isHighlighted = (label: string) =>
    highlightQuery.length > 0 && excelLikeMatch(highlightQuery, [label]);

  if (section.layout === 'grid' && section.gridCols) {
    return (
      <div className={cn("space-y-1", section.gridCols === 1 && "w-24")}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          {section.name}
        </p>
        {/* Siatki >4 kolumn nie mieszczą się na mobile — poziomy scroll zamiast ucinania przez overflow-x-hidden shella */}
        <div className="overflow-x-auto pb-1">
          <div
            className={cn(
              'inline-grid gap-3 w-full min-w-max',
              section.gridCols === 1 && 'grid-cols-1',
              section.gridCols === 2 && 'grid-cols-2',
              section.gridCols === 4 && 'grid-cols-4',
              section.gridCols === 6 && 'grid-cols-[repeat(6,minmax(56px,1fr))]',
              section.gridCols === 12 && 'grid-cols-[repeat(12,minmax(48px,1fr))]',
              section.gridCols === 14 && 'grid-cols-[repeat(14,minmax(64px,1fr))]',
              section.gridCols === 16 && 'grid-cols-[repeat(16,minmax(64px,1fr))]',
            )}
          >
          {section.lockers.map((locker) => {
            const currentLabel = labels[locker.id] ?? locker.defaultLabel;
            return (
              <LockerBox
                key={locker.id}
                id={locker.id}
                label={currentLabel}
                isEditing={editingId === locker.id}
                isHighlighted={isHighlighted(currentLabel)}
                isOccupied={occupiedLockers.has(currentLabel)}
                occupiedBy={occupiedByMap[currentLabel]}
                onChange={(val) => onChange(locker.id, val)}
                onClick={() => onEdit(editingId === locker.id ? null : locker.id)}
              />
            );
           })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {section.name}
      </p>
      <div className="flex flex-col gap-1">
        {section.lockers.map((locker) => {
          const currentLabel = labels[locker.id] ?? locker.defaultLabel;
          return (
            <LockerBox
              key={locker.id}
              id={locker.id}
              label={currentLabel}
              isEditing={editingId === locker.id}
              isHighlighted={isHighlighted(currentLabel)}
              isOccupied={occupiedLockers.has(currentLabel)}
              occupiedBy={occupiedByMap[currentLabel]}
              onChange={(val) => onChange(locker.id, val)}
              onClick={() => onEdit(editingId === locker.id ? null : locker.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
