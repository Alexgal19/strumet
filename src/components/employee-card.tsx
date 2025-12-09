
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Copy, UserX, RotateCcw, CalendarClock, Briefcase, Building } from 'lucide-react';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { Employee } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmployeeSummary } from './employee-summary';
import { formatDate, parseMaybeDate } from '@/lib/date';


interface EmployeeCardProps {
  employee: Employee;
  onEdit?: () => void;
  onTerminate?: () => void;
  onRestore?: () => void;
  onCopy?: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEdit,
  onTerminate,
  onRestore,
  onCopy,
}) => {
    
  const today = startOfDay(new Date());
  
  const vacationStartDate = parseMaybeDate(employee.vacationStartDate);
  const vacationEndDate = parseMaybeDate(employee.vacationEndDate);
  const plannedTerminationDateDate = parseMaybeDate(employee.plannedTerminationDate);

  const isOnVacation = vacationStartDate && vacationEndDate && isWithinInterval(today, {
    start: startOfDay(vacationStartDate),
    end: endOfDay(vacationEndDate)
  });

  const hasUpcomingTermination = plannedTerminationDateDate && startOfDay(plannedTerminationDateDate) >= today;
  
  let statusBadge: React.ReactNode = null;
  if (employee.status === 'zwolniony') {
    statusBadge = <Badge variant="destructive" className="text-xs">Zwolniony</Badge>;
  } else if (isOnVacation) {
    statusBadge = <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50 text-xs">Na urlopie</Badge>;
  } else if (hasUpcomingTermination) {
      statusBadge = <Badge variant="destructive" className="bg-orange-500/20 text-orange-700 border-orange-500/50 text-xs">Planowane zwolnienie</Badge>;
  } else {
    statusBadge = <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/50 text-xs">Aktywny</Badge>;
  }

  const hireDateStr = formatDate(employee.hireDate, "dd.MM.yyyy") || 'Brak danych';
  const terminationDateStr = formatDate(employee.terminationDate, "dd.MM.yyyy") || 'Brak danych';
  const plannedTerminationDateStr = formatDate(employee.plannedTerminationDate, "dd.MM.yyyy");

  return (
    <Card className="flex flex-col h-full animate-fade-in-up">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={employee.avatarDataUri || `https://avatar.vercel.sh/${employee.fullName}.png`} alt={employee.fullName} />
          <AvatarFallback>{employee.fullName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <CardTitle className="text-lg">{employee.fullName}</CardTitle>
          <CardDescription className="text-sm">{employee.jobTitle}</CardDescription>
          <div className="mt-2">{statusBadge}</div>
        </div>
        <div className="-mr-2 -mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                  <span className="sr-only">Otwórz menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                {onEdit && <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" />Edytuj</DropdownMenuItem>}
                {onCopy && <DropdownMenuItem onSelect={onCopy}><Copy className="mr-2 h-4 w-4" />Kopiuj imię</DropdownMenuItem>}
                <EmployeeSummary employee={employee}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}><Briefcase className="mr-2 h-4 w-4" />Generuj podsumowanie</DropdownMenuItem>
                </EmployeeSummary>
                <DropdownMenuSeparator />
                {onRestore && <DropdownMenuItem onSelect={onRestore}><RotateCcw className="mr-2 h-4 w-4" />Przywróć</DropdownMenuItem>}
                {onTerminate && <DropdownMenuItem onSelect={onTerminate} className="text-destructive"><UserX className="mr-2 h-4 w-4" />Zwolnij</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
         <div className="flex items-center">
            <Building className="mr-3 h-4 w-4 shrink-0" />
            <span>{employee.department} / {employee.manager}</span>
        </div>
         <div className="flex items-center">
            <CalendarClock className="mr-3 h-4 w-4 shrink-0" />
            <span>Zatr. {hireDateStr}</span>
        </div>
        {employee.status === 'zwolniony' && (
             <div className="flex items-center text-destructive">
                <CalendarClock className="mr-3 h-4 w-4 shrink-0" />
                <span>Zwol. {terminationDateStr}</span>
            </div>
        )}
        {hasUpcomingTermination && (
             <div className="flex items-center text-orange-600">
                <CalendarClock className="mr-3 h-4 w-4 shrink-0" />
                <span>Plan. zwol. {plannedTerminationDateStr}</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
};
