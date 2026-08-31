"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal, Edit, UserX, RotateCcw, Trash2, Briefcase, Mail, CalendarX,
} from "lucide-react";
import type { Employee } from "@/lib/types";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { EmployeeSummary } from "./employee-summary";
import { getStatusColor } from "@/lib/legalization-statuses";

// Deterministic avatar color based on first character of name
const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
];

const ACTION_W = 76;

function getAvatarColor(name: string): string {
  const code = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[code];
}

function LegalizationBadge({ status }: { status: string | undefined }) {
  if (!status || status === 'Brak') return null;
  const color = getStatusColor(status);
  return (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', color)}>
      {status}
    </span>
  );
}

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: () => void;
  onTerminate?: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
  onLegalizationEmail?: () => void;
  onAbsenceEmail?: () => void;
  isAbsentToday?: boolean;
  onToggleAbsenceToday?: () => void;
}

export const EmployeeCard = React.memo(function EmployeeCard({
  employee,
  onEdit,
  onTerminate,
  onRestore,
  onDeletePermanently,
  onLegalizationEmail,
  onAbsenceEmail,
  isAbsentToday,
  onToggleAbsenceToday,
}: EmployeeCardProps) {
  const initial = employee.fullName?.charAt(0)?.toUpperCase() ?? '?';
  const avatarColor = getAvatarColor(employee.fullName ?? '');

  // --- Swipe (strefa kciuka): w lewo -> akcje, w prawo -> nieobecność ---
  const [revealed, setRevealed] = useState<'start' | 'end' | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startPos = React.useRef({ x: 0, y: 0 });
  const axis = React.useRef<'x' | 'y' | null>(null);

  const endActionsCount = (onTerminate ? 1 : 0) + (onRestore ? 1 : 0);
  const maxRight = endActionsCount * ACTION_W;
  const maxLeft = onToggleAbsenceToday ? ACTION_W : 0;

  const baseX = revealed === 'end' ? -maxRight : revealed === 'start' ? maxLeft : 0;
  const x = dragging ? dragX : baseX;

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY };
    axis.current = null;
    setDragging(true);
    setDragX(baseX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const dx = t.clientX - startPos.current.x;
    const dy = t.clientY - startPos.current.y;
    if (!axis.current) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) axis.current = 'x';
      else if (Math.abs(dy) > 8) axis.current = 'y';
    }
    if (axis.current !== 'x') return;
    setDragX(Math.min(maxLeft, Math.max(-maxRight, baseX + dx)));
  };

  const handleTouchEnd = () => {
    setDragging(false);
    if (axis.current === 'x') {
      if (dragX <= -ACTION_W * 0.45 && maxRight > 0) {
        setRevealed('end');
        haptic(5);
      } else if (dragX >= ACTION_W * 0.45 && maxLeft > 0) {
        setRevealed('start');
        haptic(5);
      } else {
        setRevealed(null);
      }
    }
    setDragX(0);
  };

  const handleCardClick = () => {
    if (revealed) {
      setRevealed(null);
      return;
    }
    onEdit?.();
  };

  const runAction = (action: () => void) => {
    haptic(15);
    setRevealed(null);
    action();
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border/60 shadow-sm select-none touch-pan-y"
    >
      {/* Akcja: nieobecność (odsłaniana przesunięciem w prawo) */}
      {onToggleAbsenceToday && (
        <div className="absolute inset-y-0 left-0 z-0 flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              haptic(10);
              onToggleAbsenceToday();
            }}
            className={cn(
              'flex w-[76px] flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white transition-colors',
              isAbsentToday ? 'bg-muted-foreground' : 'bg-primary'
            )}
          >
            <CalendarX className="h-4 w-4" />
            {isAbsentToday ? 'Obecny' : 'Nieobecny'}
          </button>
        </div>
      )}

      {/* Akcje: zwolnij / przywróć (odsłaniane przesunięciem w lewo) */}
      {maxRight > 0 && (
        <div className="absolute inset-y-0 right-0 z-0 flex">
          {onRestore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                runAction(onRestore);
              }}
              className="flex w-[76px] flex-col items-center justify-center gap-1 bg-emerald-600 text-[11px] font-semibold text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Przywróć
            </button>
          )}
          {onTerminate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                runAction(onTerminate);
              }}
              className="flex w-[76px] flex-col items-center justify-center gap-1 bg-amber-600 text-[11px] font-semibold text-white"
            >
              <UserX className="h-4 w-4" />
              Zwolnij
            </button>
          )}
        </div>
      )}

      {/* Zawartość karty */}
      <div
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="relative z-10 flex items-center gap-3 bg-white p-3 transition-shadow cursor-pointer hover:shadow-md dark:bg-black/40"
        style={{
          transform: `translateX(${x}px)`,
          transition: dragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Avatar */}
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm',
          avatarColor
        )}>
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{employee.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {employee.department}{employee.jobTitle ? ` · ${employee.jobTitle}` : ''}
          </p>
        </div>

        {/* Status badge */}
        <LegalizationBadge status={employee.legalizationStatus} />

        {/* Quick "Nieobecny dziś" toggle */}
        {onToggleAbsenceToday && (
          <button
            className={cn(
              'flex shrink-0 min-h-[40px] items-center gap-1 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-colors',
              isAbsentToday
                ? 'border-destructive/40 bg-destructive text-destructive-foreground'
                : 'border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
            )}
            title={isAbsentToday ? 'Nieobecny dziś — kliknij, aby cofnąć' : 'Oznacz jako nieobecny dziś'}
            onClick={(e) => {
              e.stopPropagation();
              haptic(10);
              onToggleAbsenceToday();
            }}
          >
            <UserX className="h-4 w-4" />
            {isAbsentToday ? 'Nieobecny' : 'Nieob.'}
          </button>
        )}

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-md p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Akcje</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akcje</DropdownMenuLabel>
            {onEdit && (
              <DropdownMenuItem onSelect={onEdit}>
                <Edit className="mr-2 h-4 w-4" />Edytuj
              </DropdownMenuItem>
            )}
            {onLegalizationEmail && (
              <DropdownMenuItem onSelect={onLegalizationEmail}>
                <Mail className="mr-2 h-4 w-4" />Wniosek do Legalizacji
              </DropdownMenuItem>
            )}
            {onAbsenceEmail && (
              <DropdownMenuItem onSelect={onAbsenceEmail}>
                <Mail className="mr-2 h-4 w-4" />Zgłoś nieobecność
              </DropdownMenuItem>
            )}
            <EmployeeSummary employee={employee}>
              <DropdownMenuItem onSelect={e => e.preventDefault()}>
                <Briefcase className="mr-2 h-4 w-4" />Generuj podsumowanie
              </DropdownMenuItem>
            </EmployeeSummary>
            <DropdownMenuSeparator />
            {onRestore && (
              <DropdownMenuItem onSelect={onRestore}>
                <RotateCcw className="h-4 w-4" />Przywróć
              </DropdownMenuItem>
            )}
            {onTerminate && (
              <DropdownMenuItem onSelect={onTerminate} className="text-destructive">
                <UserX className="h-4 w-4" />Zwolnij
              </DropdownMenuItem>
            )}
            {onDeletePermanently && (
              <DropdownMenuItem onSelect={onDeletePermanently} className="text-destructive">
                <Trash2 className="h-4 w-4" />Usuń trwale
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

EmployeeCard.displayName = "EmployeeCard";
