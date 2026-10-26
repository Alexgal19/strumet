'use client';

import type { LockerZone } from './locker-types';
import { LockerSectionView } from './locker-section-view';

export function ZoneView({
  zone,
  labels,
  editingId,
  highlightQuery,
  occupiedLockers,
  occupiedByMap,
  onEdit,
  onChange,
}: {
  zone: LockerZone;
  labels: Record<string, string>;
  editingId: string | null;
  highlightQuery: string;
  occupiedLockers: Set<string>;
  occupiedByMap: Record<string, string>;
  onEdit: (id: string | null) => void;
  onChange: (id: string, val: string) => void;
}) {
  // For Zone 1, we need a special layout to match the image
  if (zone.id === 'zone1') {
    return (
      <div className="space-y-6">
        {/* Top row: left and right columns */}
        <div className="flex justify-between items-start">
          <LockerSectionView
            section={zone.sections[0]}
            labels={labels}
            editingId={editingId}
            highlightQuery={highlightQuery}
            occupiedLockers={occupiedLockers}
            occupiedByMap={occupiedByMap}
            onEdit={onEdit}
            onChange={onChange}
          />
          <LockerSectionView
            section={zone.sections[1]}
            labels={labels}
            editingId={editingId}
            highlightQuery={highlightQuery}
            occupiedLockers={occupiedLockers}
            occupiedByMap={occupiedByMap}
            onEdit={onEdit}
            onChange={onChange}
          />
        </div>

        {/* Wall label */}
        <div className="flex justify-center">
          <LockerSectionView
            section={zone.sections[2]}
            labels={labels}
            editingId={editingId}
            highlightQuery={highlightQuery}
            occupiedLockers={occupiedLockers}
            occupiedByMap={occupiedByMap}
            onEdit={onEdit}
            onChange={onChange}
          />
        </div>

        {/* Middle: left column + right sections */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
          {/* Left column */}
          <div className="shrink-0 w-24">
            <LockerSectionView
              section={zone.sections[3]}
              labels={labels}
              editingId={editingId}
              highlightQuery={highlightQuery}
              occupiedLockers={occupiedLockers}
              occupiedByMap={occupiedByMap}
              onEdit={onEdit}
              onChange={onChange}
            />
          </div>

          {/* Right sections */}
          <div className="flex flex-col gap-4">
            <LockerSectionView
              section={zone.sections[4]}
              labels={labels}
              editingId={editingId}
              highlightQuery={highlightQuery}
              occupiedLockers={occupiedLockers}
              occupiedByMap={occupiedByMap}
              onEdit={onEdit}
              onChange={onChange}
            />
            <LockerSectionView
              section={zone.sections[5]}
              labels={labels}
              editingId={editingId}
              highlightQuery={highlightQuery}
              occupiedLockers={occupiedLockers}
              occupiedByMap={occupiedByMap}
              onEdit={onEdit}
              onChange={onChange}
            />
            <LockerSectionView
              section={zone.sections[6]}
              labels={labels}
              editingId={editingId}
              highlightQuery={highlightQuery}
              occupiedLockers={occupiedLockers}
              occupiedByMap={occupiedByMap}
              onEdit={onEdit}
              onChange={onChange}
            />
            <div className="border border-dashed border-red-300/50 rounded-lg p-2 bg-red-50/30 dark:bg-red-950/10">
              <LockerSectionView
                section={zone.sections[7]}
                labels={labels}
                editingId={editingId}
                highlightQuery={highlightQuery}
                occupiedLockers={occupiedLockers}
                occupiedByMap={occupiedByMap}
                onEdit={onEdit}
                onChange={onChange}
              />
            </div>
            <LockerSectionView
              section={zone.sections[8]}
              labels={labels}
              editingId={editingId}
              highlightQuery={highlightQuery}
              occupiedLockers={occupiedLockers}
              occupiedByMap={occupiedByMap}
              onEdit={onEdit}
              onChange={onChange}
            />
          </div>
        </div>

        {/* Bottom sections */}
        <div className="flex flex-col gap-4">
          <LockerSectionView
            section={zone.sections[9]}
            labels={labels}
            editingId={editingId}
            highlightQuery={highlightQuery}
            occupiedLockers={occupiedLockers}
            occupiedByMap={occupiedByMap}
            onEdit={onEdit}
            onChange={onChange}
          />
          <LockerSectionView
            section={zone.sections[10]}
            labels={labels}
            editingId={editingId}
            highlightQuery={highlightQuery}
            occupiedLockers={occupiedLockers}
            occupiedByMap={occupiedByMap}
            onEdit={onEdit}
            onChange={onChange}
          />
        </div>
      </div>
    );
  }

  // For Zone 2 floors, just stack sections
  return (
    <div className="space-y-6">
      {zone.sections.map((section) => (
        <div key={section.id} className="flex justify-center">
          <LockerSectionView
            section={section}
            labels={labels}
            editingId={editingId}
            highlightQuery={highlightQuery}
            occupiedLockers={occupiedLockers}
            occupiedByMap={occupiedByMap}
            onEdit={onEdit}
            onChange={onChange}
          />
        </div>
      ))}
    </div>
  );
}
