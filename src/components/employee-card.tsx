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
    <div className="group relative flex items-center gap-4 glass-card p-4 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
      {/* Subtle shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer pointer-events-none z-0" />

      
      {/* Avatar */}
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm relative z-10',
        avatarColor
      )}>
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{employee.fullName}</p>
        <p className="truncate text-xs text-gray-500">
          {employee.department}{employee.jobTitle ? ` · ${employee.jobTitle}` : ''}
        </p>
      </div>

      {/* Status badge */}
      <LegalizationBadge status={employee.legalizationStatus} />

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
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
