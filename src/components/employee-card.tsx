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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* Avatar */}
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white',
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
      <div onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Akcje</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={e => e.preventDefault()}>
                    <RotateCcw className="mr-2 h-4 w-4" />Przywróć
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Przywrócić pracownika?</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{employee.fullName}</strong> zostanie przeniesiony do listy aktywnych.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={onRestore}>Przywróć</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {onTerminate && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                    <UserX className="mr-2 h-4 w-4" />Zwolnij
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Zwolnić pracownika?</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{employee.fullName}</strong> zostanie przeniesiony do archiwum.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={onTerminate}>Zwolnij</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {onDeletePermanently && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />Usuń trwale
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Trwale usunąć pracownika?</AlertDialogTitle>
                    <AlertDialogDescription className="text-destructive">
                      Tej akcji <strong>nie można cofnąć</strong>. <strong>{employee.fullName}</strong> zostanie usunięty z bazy.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={onDeletePermanently}
                    >
                      Usuń trwale
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

EmployeeCard.displayName = "EmployeeCard";
