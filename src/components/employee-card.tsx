"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Edit,
  UserX,
  RotateCcw,
  CalendarClock,
  Briefcase,
  Building,
  Trash2,
} from "lucide-react";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { Employee } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmployeeSummary } from "./employee-summary";
import { formatDate, parseMaybeDate } from "@/lib/date";

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: () => void;
  onTerminate?: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = React.memo(
  ({ employee, onEdit, onTerminate, onRestore, onDeletePermanently }) => {
    const today = startOfDay(new Date());

    const vacationStartDate = parseMaybeDate(employee.vacationStartDate);
    const vacationEndDate = parseMaybeDate(employee.vacationEndDate);
    const plannedTerminationDateDate = parseMaybeDate(
      employee.plannedTerminationDate,
    );

    const isOnVacation =
      vacationStartDate &&
      vacationEndDate &&
      isWithinInterval(today, {
        start: startOfDay(vacationStartDate),
        end: endOfDay(vacationEndDate),
      });

    const hasUpcomingTermination =
      plannedTerminationDateDate &&
      startOfDay(plannedTerminationDateDate) >= today;

    let statusBadge: React.ReactNode = null;
    if (employee.status === "zwolniony") {
      statusBadge = (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
          Zwolniony
        </Badge>
      );
    } else if (isOnVacation) {
      statusBadge = (
        <Badge
          variant="secondary"
          className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50 text-[10px] px-1.5 py-0"
        >
          Na urlopie
        </Badge>
      );
    } else if (hasUpcomingTermination) {
      statusBadge = (
        <Badge
          variant="destructive"
          className="bg-orange-500/20 text-orange-700 border-orange-500/50 text-[10px] px-1.5 py-0"
        >
          Plan. zwolnienie
        </Badge>
      );
    } else {
      statusBadge = (
        <Badge
          variant="secondary"
          className="bg-green-500/20 text-green-700 border-green-500/50 text-[10px] px-1.5 py-0"
        >
          Aktywny
        </Badge>
      );
    }

    const hireDateStr =
      formatDate(employee.hireDate, "dd.MM.yyyy") || "Brak danych";
    const terminationDateStr =
      formatDate(employee.terminationDate, "dd.MM.yyyy") || "Brak danych";
    const plannedTerminationDateStr = formatDate(
      employee.plannedTerminationDate,
      "dd.MM.yyyy",
    );

    return (
      <AlertDialog>
        <Card className="flex flex-col h-full animate-fade-in-up">
          <CardHeader className="flex flex-row items-start gap-2 p-3 pb-1">
            <div className="flex-grow min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight truncate">{employee.fullName}</CardTitle>
              <CardDescription className="text-xs truncate">
                {employee.jobTitle}
              </CardDescription>
              <div className="mt-1">{statusBadge}</div>
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-7 w-7 p-0"
                  >
                    <span className="sr-only">Otwórz menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                  {onEdit && (
                    <DropdownMenuItem onSelect={onEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edytuj
                    </DropdownMenuItem>
                  )}
                  <EmployeeSummary employee={employee}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Generuj podsumowanie
                    </DropdownMenuItem>
                  </EmployeeSummary>
                  <DropdownMenuSeparator />
                  {onRestore && (
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Przywróć
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  )}
                  {onTerminate && (
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Zwolnij
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  )}
                  {onDeletePermanently && (
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usuń trwale
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-1 text-xs text-muted-foreground p-3 pt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building className="h-3 w-3 shrink-0" />
              <span className="truncate">{employee.department} / {employee.manager}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-3 w-3 shrink-0" />
              <span>Zatr. {hireDateStr}</span>
            </div>
            {employee.status === "zwolniony" && (
              <div className="flex items-center gap-1.5 text-destructive">
                <CalendarClock className="h-3 w-3 shrink-0" />
                <span>Zwol. {terminationDateStr}</span>
              </div>
            )}
            {hasUpcomingTermination && (
              <div className="flex items-center gap-1.5 text-orange-600">
                <CalendarClock className="h-3 w-3 shrink-0" />
                <span>Plan. zwol. {plannedTerminationDateStr}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {onTerminate && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Czy na pewno chcesz zwolnić pracownika?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Pracownik <strong>{employee.fullName}</strong> zostanie
                przeniesiony do archiwum zwolnionych.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={onTerminate}>
                Zwolnij
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}

        {onRestore && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Czy na pewno chcesz przywrócić pracownika?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Pracownik <strong>{employee.fullName}</strong> zostanie
                przywrócony do listy aktywnych.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={onRestore}>
                Przywróć
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}

        {onDeletePermanently && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Czy na pewno chcesz trwale usunąć pracownika?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-destructive">
                Tej akcji <strong>nie można cofnąć</strong>. Spowoduje to trwałe
                usunięcie pracownika <strong>{employee.fullName}</strong> i
                wszystkich jego danych z bazy.
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
        )}
      </AlertDialog>
    );
  },
);

EmployeeCard.displayName = "EmployeeCard";
