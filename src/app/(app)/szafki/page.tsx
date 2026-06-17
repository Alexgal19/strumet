'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import type { Employee } from '@/lib/types';
import { getDB } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Save, RotateCcw, Lock, Unlock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---

interface LockerPosition {
  id: string;
  defaultLabel: string;
  row: number;
  col: number;
  width?: number; // grid column span
  height?: number; // grid row span
}

interface LockerSection {
  id: string;
  name: string;
  layout: 'grid' | 'column' | 'row';
  gridCols?: number;
  lockers: LockerPosition[];
}

interface LockerZone {
  id: string;
  name: string;
  sections: LockerSection[];
}

// --- Zone 1 Data (based on image) ---

const ZONE_1: LockerZone = {
  id: 'zone1',
  name: 'Strefa 1',
  sections: [
    {
      id: 'top-left',
      name: 'Góra lewa',
      layout: 'grid',
      gridCols: 1,
      lockers: [
        { id: 'z1-tl-1', defaultLabel: '136', row: 1, col: 1 },
        { id: 'z1-tl-2', defaultLabel: '135', row: 2, col: 1 },
        { id: 'z1-tl-3', defaultLabel: '134', row: 3, col: 1 },
        { id: 'z1-tl-4', defaultLabel: '133', row: 4, col: 1 },
      ],
    },
    {
      id: 'top-right',
      name: 'Góra prawa',
      layout: 'grid',
      gridCols: 1,
      lockers: [
        { id: 'z1-tr-1', defaultLabel: '140', row: 1, col: 1 },
        { id: 'z1-tr-2', defaultLabel: '139', row: 2, col: 1 },
        { id: 'z1-tr-3', defaultLabel: '138', row: 3, col: 1 },
        { id: 'z1-tr-4', defaultLabel: '137', row: 4, col: 1 },
      ],
    },
    {
      id: 'wall-label',
      name: 'Ściana',
      layout: 'grid',
      gridCols: 1,
      lockers: [
        { id: 'z1-wall', defaultLabel: 'СТІНА (напрямок ↓)', row: 1, col: 1, width: 1 },
      ],
    },
    {
      id: 'left-column',
      name: 'Rząd 91-110',
      layout: 'grid',
      gridCols: 1,
      lockers: [
        { id: 'z1-lc-1', defaultLabel: '110', row: 1, col: 1 },
        { id: 'z1-lc-2', defaultLabel: '109', row: 2, col: 1 },
        { id: 'z1-lc-3', defaultLabel: '108', row: 3, col: 1 },
        { id: 'z1-lc-4', defaultLabel: '107', row: 4, col: 1 },
        { id: 'z1-lc-5', defaultLabel: '106', row: 5, col: 1 },
        { id: 'z1-lc-6', defaultLabel: '105', row: 6, col: 1 },
        { id: 'z1-lc-7', defaultLabel: '104', row: 7, col: 1 },
        { id: 'z1-lc-8', defaultLabel: '103', row: 8, col: 1 },
        { id: 'z1-lc-9', defaultLabel: '102', row: 9, col: 1 },
        { id: 'z1-lc-10', defaultLabel: '101', row: 10, col: 1 },
        { id: 'z1-lc-11', defaultLabel: '100', row: 11, col: 1 },
        { id: 'z1-lc-12', defaultLabel: '99', row: 12, col: 1 },
        { id: 'z1-lc-13', defaultLabel: '98', row: 13, col: 1 },
        { id: 'z1-lc-14', defaultLabel: '97', row: 14, col: 1 },
        { id: 'z1-lc-15', defaultLabel: '96', row: 15, col: 1 },
        { id: 'z1-lc-16', defaultLabel: '95', row: 16, col: 1 },
        { id: 'z1-lc-17', defaultLabel: '94', row: 17, col: 1 },
        { id: 'z1-lc-18', defaultLabel: '93', row: 18, col: 1 },
        { id: 'z1-lc-19', defaultLabel: '92', row: 19, col: 1 },
        { id: 'z1-lc-20', defaultLabel: '91', row: 20, col: 1 },
      ],
    },
    {
      id: 'right-top-row',
      name: 'Rząd 87-90',
      layout: 'grid',
      gridCols: 4,
      lockers: [
        { id: 'z1-rtr-1', defaultLabel: '87', row: 1, col: 1 },
        { id: 'z1-rtr-2', defaultLabel: '88', row: 1, col: 2 },
        { id: 'z1-rtr-3', defaultLabel: '89', row: 1, col: 3 },
        { id: 'z1-rtr-4', defaultLabel: '90', row: 1, col: 4 },
      ],
    },
    {
      id: 'right-mid1',
      name: 'Rząd 81-86',
      layout: 'grid',
      gridCols: 6,
      lockers: [
        { id: 'z1-rm1-1', defaultLabel: '81', row: 1, col: 1 },
        { id: 'z1-rm1-2', defaultLabel: '82', row: 1, col: 2 },
        { id: 'z1-rm1-3', defaultLabel: '83', row: 1, col: 3 },
        { id: 'z1-rm1-4', defaultLabel: '84', row: 1, col: 4 },
        { id: 'z1-rm1-5', defaultLabel: '85', row: 1, col: 5 },
        { id: 'z1-rm1-6', defaultLabel: '86', row: 1, col: 6 },
        { id: 'z1-rm1-7', defaultLabel: '75', row: 2, col: 1 },
        { id: 'z1-rm1-8', defaultLabel: '76', row: 2, col: 2 },
        { id: 'z1-rm1-9', defaultLabel: '77', row: 2, col: 3 },
        { id: 'z1-rm1-10', defaultLabel: '78', row: 2, col: 4 },
        { id: 'z1-rm1-11', defaultLabel: '79', row: 2, col: 5 },
        { id: 'z1-rm1-12', defaultLabel: '80', row: 2, col: 6 },
      ],
    },
    {
      id: 'right-mid2',
      name: 'Rząd 69-74 / 63-68',
      layout: 'grid',
      gridCols: 6,
      lockers: [
        { id: 'z1-rm2-1', defaultLabel: '69', row: 1, col: 1 },
        { id: 'z1-rm2-2', defaultLabel: '70', row: 1, col: 2 },
        { id: 'z1-rm2-3', defaultLabel: '71', row: 1, col: 3 },
        { id: 'z1-rm2-4', defaultLabel: '72', row: 1, col: 4 },
        { id: 'z1-rm2-5', defaultLabel: '73', row: 1, col: 5 },
        { id: 'z1-rm2-6', defaultLabel: '74', row: 1, col: 6 },
        { id: 'z1-rm2-7', defaultLabel: '63', row: 2, col: 1 },
        { id: 'z1-rm2-8', defaultLabel: '64', row: 2, col: 2 },
        { id: 'z1-rm2-9', defaultLabel: '65', row: 2, col: 3 },
        { id: 'z1-rm2-10', defaultLabel: '66', row: 2, col: 4 },
        { id: 'z1-rm2-11', defaultLabel: '67', row: 2, col: 5 },
        { id: 'z1-rm2-12', defaultLabel: '68', row: 2, col: 6 },
      ],
    },
    {
      id: 'right-okreme',
      name: 'OKREME',
      layout: 'grid',
      gridCols: 3,
      lockers: [
        { id: 'z1-okr-label', defaultLabel: 'OKREME:', row: 1, col: 1, width: 1 },
        { id: 'z1-okr-1', defaultLabel: '62', row: 1, col: 2 },
        { id: 'z1-okr-2', defaultLabel: '61', row: 1, col: 3 },
      ],
    },
    {
      id: 'right-column',
      name: 'Rząd 49-60',
      layout: 'grid',
      gridCols: 1,
      lockers: [
        { id: 'z1-rc-1', defaultLabel: '49', row: 1, col: 1 },
        { id: 'z1-rc-2', defaultLabel: '50', row: 2, col: 1 },
        { id: 'z1-rc-3', defaultLabel: '51', row: 3, col: 1 },
        { id: 'z1-rc-4', defaultLabel: '52', row: 4, col: 1 },
        { id: 'z1-rc-5', defaultLabel: '53', row: 5, col: 1 },
        { id: 'z1-rc-6', defaultLabel: '54', row: 6, col: 1 },
        { id: 'z1-rc-7', defaultLabel: '55', row: 7, col: 1 },
        { id: 'z1-rc-8', defaultLabel: '56', row: 8, col: 1 },
        { id: 'z1-rc-9', defaultLabel: '57', row: 9, col: 1 },
        { id: 'z1-rc-10', defaultLabel: '58', row: 10, col: 1 },
        { id: 'z1-rc-11', defaultLabel: '59', row: 11, col: 1 },
        { id: 'z1-rc-12', defaultLabel: '60', row: 12, col: 1 },
      ],
    },
    {
      id: 'bottom-mid',
      name: 'Rząd 25-48',
      layout: 'grid',
      gridCols: 12,
      lockers: [
        { id: 'z1-bm-1', defaultLabel: '48', row: 1, col: 1 },
        { id: 'z1-bm-2', defaultLabel: '47', row: 1, col: 2 },
        { id: 'z1-bm-3', defaultLabel: '46', row: 1, col: 3 },
        { id: 'z1-bm-4', defaultLabel: '45', row: 1, col: 4 },
        { id: 'z1-bm-5', defaultLabel: '44', row: 1, col: 5 },
        { id: 'z1-bm-6', defaultLabel: '43', row: 1, col: 6 },
        { id: 'z1-bm-7', defaultLabel: '42', row: 1, col: 7 },
        { id: 'z1-bm-8', defaultLabel: '41', row: 1, col: 8 },
        { id: 'z1-bm-9', defaultLabel: '40', row: 1, col: 9 },
        { id: 'z1-bm-10', defaultLabel: '39', row: 1, col: 10 },
        { id: 'z1-bm-11', defaultLabel: '38', row: 1, col: 11 },
        { id: 'z1-bm-12', defaultLabel: '37', row: 1, col: 12 },
        { id: 'z1-bm-13', defaultLabel: '25', row: 2, col: 1 },
        { id: 'z1-bm-14', defaultLabel: '26', row: 2, col: 2 },
        { id: 'z1-bm-15', defaultLabel: '27', row: 2, col: 3 },
        { id: 'z1-bm-16', defaultLabel: '28', row: 2, col: 4 },
        { id: 'z1-bm-17', defaultLabel: '29', row: 2, col: 5 },
        { id: 'z1-bm-18', defaultLabel: '30', row: 2, col: 6 },
        { id: 'z1-bm-19', defaultLabel: '31', row: 2, col: 7 },
        { id: 'z1-bm-20', defaultLabel: '32', row: 2, col: 8 },
        { id: 'z1-bm-21', defaultLabel: '33', row: 2, col: 9 },
        { id: 'z1-bm-22', defaultLabel: '34', row: 2, col: 10 },
        { id: 'z1-bm-23', defaultLabel: '35', row: 2, col: 11 },
        { id: 'z1-bm-24', defaultLabel: '36', row: 2, col: 12 },
      ],
    },
    {
      id: 'bottom',
      name: 'Rząd 1-24',
      layout: 'grid',
      gridCols: 12,
      lockers: [
        { id: 'z1-b-1', defaultLabel: '13', row: 1, col: 1 },
        { id: 'z1-b-2', defaultLabel: '14', row: 1, col: 2 },
        { id: 'z1-b-3', defaultLabel: '15', row: 1, col: 3 },
        { id: 'z1-b-4', defaultLabel: '16', row: 1, col: 4 },
        { id: 'z1-b-5', defaultLabel: '17', row: 1, col: 5 },
        { id: 'z1-b-6', defaultLabel: '18', row: 1, col: 6 },
        { id: 'z1-b-7', defaultLabel: '19', row: 1, col: 7 },
        { id: 'z1-b-8', defaultLabel: '20', row: 1, col: 8 },
        { id: 'z1-b-9', defaultLabel: '21', row: 1, col: 9 },
        { id: 'z1-b-10', defaultLabel: '22', row: 1, col: 10 },
        { id: 'z1-b-11', defaultLabel: '23', row: 1, col: 11 },
        { id: 'z1-b-12', defaultLabel: '24', row: 1, col: 12 },
        { id: 'z1-b-13', defaultLabel: '1', row: 2, col: 1 },
        { id: 'z1-b-14', defaultLabel: '2', row: 2, col: 2 },
        { id: 'z1-b-15', defaultLabel: '3', row: 2, col: 3 },
        { id: 'z1-b-16', defaultLabel: '4', row: 2, col: 4 },
        { id: 'z1-b-17', defaultLabel: '5', row: 2, col: 5 },
        { id: 'z1-b-18', defaultLabel: '6', row: 2, col: 6 },
        { id: 'z1-b-19', defaultLabel: '7', row: 2, col: 7 },
        { id: 'z1-b-20', defaultLabel: '8', row: 2, col: 8 },
        { id: 'z1-b-21', defaultLabel: '9', row: 2, col: 9 },
        { id: 'z1-b-22', defaultLabel: '10', row: 2, col: 10 },
        { id: 'z1-b-23', defaultLabel: '11', row: 2, col: 11 },
        { id: 'z1-b-24', defaultLabel: '12', row: 2, col: 12 },
      ],
    },
  ],
};

// --- Zone 2 Data (K lockers) ---

function generateKZone(floor: number, startK: number): LockerSection[] {
  const sections: LockerSection[] = [];
  const rows = [
    { count: 16, name: `Rząd ${startK}-${startK + 15}` },
    { count: 14, name: `Rząd ${startK + 16}-${startK + 29}` },
    { count: 12, name: `Rząd ${startK + 30}-${startK + 41}` },
    { count: 16, name: `Rząd ${startK + 42}-${startK + 57}` },
    { count: 16, name: `Rząd ${startK + 58}-${startK + 73}` },
    { count: 12, name: `Rząd ${startK + 74}-${startK + 85}` },
    { count: 12, name: `Rząd ${startK + 86}-${startK + 97}` },
    { count: 12, name: `Rząd ${startK + 98}-${startK + 109}` },
    { count: 10, name: `Rząd ${startK + 110}-${startK + 119}` },
  ];

  let currentK = startK;
  rows.forEach((row, idx) => {
    const lockers: LockerPosition[] = [];
    for (let i = 0; i < row.count; i++) {
      lockers.push({
        id: `z2-f${floor}-r${idx}-${i}`,
        defaultLabel: `K${currentK + i}`,
        row: 1,
        col: i + 1,
      });
    }
    sections.push({
      id: `floor${floor}-row${idx}`,
      name: row.name,
      layout: 'grid',
      gridCols: row.count,
      lockers,
    });
    currentK += row.count;
  });

  // Extra small lockers at bottom right
  sections.push({
    id: `floor${floor}-extra`,
    name: 'Dodatkowe',
    layout: 'grid',
    gridCols: 2,
    lockers: [
      { id: `z2-f${floor}-ex-1`, defaultLabel: `K${currentK}`, row: 1, col: 1 },
      { id: `z2-f${floor}-ex-2`, defaultLabel: `K${currentK + 1}`, row: 1, col: 2 },
    ],
  });

  return sections;
}

const ZONE_2_FLOOR_1: LockerZone = {
  id: 'zone2-f1',
  name: 'Strefa 2 — Piętro 1',
  sections: generateKZone(1, 1),
};

const ZONE_2_FLOOR_2: LockerZone = {
  id: 'zone2-f2',
  name: 'Strefa 2 — Piętro 2',
  sections: generateKZone(2, 121),
};

const ALL_ZONES = [ZONE_1, ZONE_2_FLOOR_1, ZONE_2_FLOOR_2];

// --- Components ---

function LockerBox({
  id,
  label,
  isEditing,
  isHighlighted,
  isOccupied,
  occupiedBy,
  onChange,
  onClick,
}: {
  id: string;
  label: string;
  isEditing: boolean;
  isHighlighted: boolean;
  isOccupied: boolean;
  occupiedBy?: string;
  onChange: (val: string) => void;
  onClick: () => void;
}) {
  if (isEditing) {
    return (
      <input
        autoFocus
        title="Edytuj numer szafki"
        value={label}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onClick()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onClick();
        }}
        className={cn(
          'w-full h-full min-h-[48px] text-center text-sm font-semibold rounded-md border-2 border-primary bg-primary/10 text-primary outline-none px-1'
        )}
      />
    );
  }

  const isLabel = label.includes('OKREME') || label.includes('СТІНА') || label.includes('напрямок');

  return (
    <button
      title={occupiedBy || label}
      onClick={onClick}
      className={cn(
        'w-full min-h-[48px] rounded-md border text-sm font-medium transition-all duration-200 flex items-center justify-center px-2 py-2',
        isLabel
          ? 'border-transparent bg-transparent text-muted-foreground cursor-default hover:bg-transparent'
          : isOccupied
          ? 'border-green-500 bg-green-500/20 text-green-700 hover:bg-green-500/30 hover:border-green-600 shadow-[0_0_8px_hsl(var(--green-500)_/_0.2)]'
          : isHighlighted
          ? 'border-primary bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--primary)_/_0.3)] scale-105 z-10'
          : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted hover:border-primary/40 hover:shadow-sm'
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

function LockerSectionView({
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
    highlightQuery.length > 0 && label.toLowerCase().includes(highlightQuery.toLowerCase());

  if (section.layout === 'grid' && section.gridCols) {
    return (
      <div className={cn("space-y-1", section.gridCols === 1 && "w-20")}>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          {section.name}
        </p>
        <div
          className={cn(
            'inline-grid gap-2 w-full',
            section.gridCols === 1 && 'grid-cols-1',
            section.gridCols === 2 && 'grid-cols-2',
            section.gridCols === 4 && 'grid-cols-4',
            section.gridCols === 6 && 'grid-cols-6',
            section.gridCols === 12 && 'grid-cols-12',
            section.gridCols === 14 && 'grid-cols-[repeat(14,minmax(52px,1fr))]',
            section.gridCols === 16 && 'grid-cols-[repeat(16,minmax(52px,1fr))]',
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
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
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

function ZoneView({
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
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
          {/* Left column */}
          <div className="shrink-0 w-20">
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

// --- Main Page ---

export default function LockersPage() {
  const { isAdmin } = useAppContext();
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightQuery, setHighlightQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Build occupied lockers set and map from employees
  const occupied = new Set<string>();
  const byMap: Record<string, string> = {};
  employees.forEach((emp: Employee) => {
    const locker = emp.lockerNumber?.trim();
    const deptLocker = emp.departmentLockerNumber?.trim();
    if (locker) {
      occupied.add(locker);
      byMap[locker] = emp.fullName;
    }
    if (deptLocker) {
      occupied.add(deptLocker);
      byMap[deptLocker] = emp.fullName;
    }
  });
  const occupiedLockers = occupied;
  const occupiedByMap = byMap;

  // Load from Firebase
  useEffect(() => {
    const db = getDB();
    if (!db) return;
    const labelsRef = ref(db, 'config/lockerLabels');
    const unsub = onValue(labelsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setLabels(data);
    });
    return () => unsub();
  }, []);

  const handleChange = useCallback((id: string, val: string) => {
    setLabels((prev) => {
      if (prev[id] === val) return prev;
      return { ...prev, [id]: val };
    });
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    const db = getDB();
    if (!db) return;
    setIsSaving(true);
    try {
      await set(ref(db, 'config/lockerLabels'), labels);
      toast({ title: 'Zapisano', description: 'Numeracja szafek została zaktualizowana.' });
      setHasChanges(false);
    } catch (err) {
      toast({ title: 'Błąd', description: 'Nie udało się zapisać zmian.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Czy na pewno chcesz przywrócić domyślną numerację?')) {
      setLabels({});
      setHasChanges(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Szafki pracowników"
        description="Mapa szafek z możliwością edycji numeracji"
      >
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {isSaving ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj szafki (np. 77, K15)..."
          value={highlightQuery}
          onChange={(e) => setHighlightQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Lock className="h-4 w-4" />
          Tylko administrator może edytować numerację szafek.
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-green-500 bg-green-500/20" />
          <span>Zajęta (przypisana do pracownika)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-border/60 bg-muted/40" />
          <span>Wolna</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-primary bg-primary/20" />
          <span>Wyszukana</span>
        </div>
      </div>

      <Tabs defaultValue="zone1" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="zone1">Strefa 1 (1-140)</TabsTrigger>
          <TabsTrigger value="zone2-f1">Strefa 2 — Piętro 1 (K1-K120)</TabsTrigger>
          <TabsTrigger value="zone2-f2">Strefa 2 — Piętro 2 (K121-K240)</TabsTrigger>
        </TabsList>

        {ALL_ZONES.map((zone) => (
          <TabsContent key={zone.id} value={zone.id}>
            <Card>
              <CardHeader>
                <CardTitle>{zone.name}</CardTitle>
                <CardDescription>
                  Kliknij na szafkę, aby {isAdmin ? 'edytować jej numer' : 'zaznaczyć'}.
                  {highlightQuery && (
                    <span className="ml-1 text-primary font-medium">
                      Wyniki wyszukiwania dla &quot;{highlightQuery}&quot;
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ZoneView
                  zone={zone}
                  labels={labels}
                  editingId={editingId}
                  highlightQuery={highlightQuery}
                  occupiedLockers={occupiedLockers}
                  occupiedByMap={occupiedByMap}
                  onEdit={(id) => {
                    if (!isAdmin) return;
                    setEditingId(id);
                  }}
                  onChange={handleChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
