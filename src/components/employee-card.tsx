"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, UserX, RotateCcw, Trash2, Briefcase } from "lucide-react";
import type { Employee } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmployeeSummary } from "./employee-summary";
import { getStatusColor } from "@/lib/legalization-statuses";

// Deterministic avatar color based on first character of name
const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
];

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
}

export const EmployeeCard = React.memo(function EmployeeCard({
  employee,
  onEdit,
  onTerminate,
  onRestore,
  onDeletePermanently,
}: EmployeeCardProps) {
  const initial = employee.fullName?.charAt(0)?.toUpperCase() ?? '?';
  const avatarColor = getAvatarColor(employee.fullName ?? '');

  return (
    <div className="group relative flex items-center gap-3 bg-white dark:bg-black/40 rounded-xl border border-border/60 p-3 shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-[0.98]">
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

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <EmployeeSummary employee={employee}>
            <DropdownMenuItem onSelect={e => e.preventDefault()}>
              <Briefcase className="mr-2 h-4 w-4" />Generuj podsumowanie
            </DropdownMenuItem>
          </EmployeeSummary>
          <DropdownMenuSeparator />
          {onRestore && (
            <DropdownMenuItem onSelect={onRestore}>
              <RotateCcw className="mr-2 h-4 w-4" />Przywróć
            </DropdownMenuItem>
          )}
          {onTerminate && (
            <DropdownMenuItem onSelect={onTerminate} className="text-destructive">
              <UserX className="mr-2 h-4 w-4" />Zwolnij
            </DropdownMenuItem>
          )}
          {onDeletePermanently && (
            <DropdownMenuItem onSelect={onDeletePermanently} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Usuń trwale
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

EmployeeCard.displayName = "EmployeeCard";
