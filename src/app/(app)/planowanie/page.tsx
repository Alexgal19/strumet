
'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Loader2, CalendarClock } from 'lucide-react';
import { Employee } from '@/lib/types';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate, parseMaybeDate } from '@/lib/date';

export default function PlanningPage() {
  const { employees, isLoading } = useAppContext();
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const plannedTerminations = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.plannedTerminationDate) return false;
        const terminationDate = parseMaybeDate(e.plannedTerminationDate);
        return terminationDate ? startOfDay(terminationDate) >= today : false;
      })
      .sort((a, b) => new Date(a.plannedTerminationDate!).getTime() - new Date(b.plannedTerminationDate!).getTime());
  }, [activeEmployees]);

  const onVacation = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.vacationStartDate || !e.vacationEndDate) return false;
        const start = parseMaybeDate(e.vacationStartDate);
        const end = parseMaybeDate(e.vacationEndDate);
        if (!start || !end) return false;
        return isWithinInterval(today, { start: startOfDay(start), end: endOfDay(end) });
      })
      .sort((a, b) => new Date(a.vacationEndDate!).getTime() - new Date(b.vacationEndDate!).getTime());
  }, [activeEmployees]);

  const upcomingVacations = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.vacationStartDate) return false;
        const startDate = parseMaybeDate(e.vacationStartDate);
        if (!startDate) return false;
        // Ensure the employee is not already counted in the 'onVacation' list
        return startOfDay(startDate) >= today && !onVacation.some(onVac => onVac.id === e.id);
      })
      .sort((a, b) => new Date(a.vacationStartDate!).getTime() - new Date(b.vacationStartDate!).getTime());
  }, [activeEmployees, onVacation]);


  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const EmployeeCard = ({ employee, type }: { employee: Employee, type: 'termination' | 'vacation' | 'vacation-planned' }) => {
    let dateLabel: string | undefined;

    if (type === 'termination') {
        const dateString = formatDate(employee.plannedTerminationDate, "PPP");
        dateLabel = `Data zwolnienia: ${dateString}`;
    } else if (type === 'vacation') {
        const dateString = formatDate(employee.vacationEndDate, "PPP");
        dateLabel = `Koniec urlopu: ${dateString}`;
    } else if (type === 'vacation-planned') {
        const startDate = formatDate(employee.vacationStartDate, "dd.MM");
        const endDate = formatDate(employee.vacationEndDate, "dd.MM.yyyy");
        dateLabel = `Urlop: ${startDate} - ${endDate}`;
    }
    
    return (
        <Card className={cn(
            "w-full animate-fade-in-up",
            type === 'termination' && 'border-destructive/50 bg-destructive/10',
            (type === 'vacation' || type === 'vacation-planned') && 'border-yellow-500/50 bg-yellow-500/10',
        )}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base">{employee.fullName}</CardTitle>
                    <CardDescription className="text-xs">{employee.jobTitle} - {employee.department}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                 <div className="flex items-center text-muted-foreground">
                    <CalendarClock className="mr-2 h-4 w-4" />
                    <strong className="text-foreground text-xs">{dateLabel}</strong>
                </div>
            </CardContent>
        </Card>
    )
  };
  
  const renderEmployeeList = (list: Employee[], type: 'termination' | 'vacation' | 'vacation-planned', emptyMessage: string) => {
    if (list.length === 0) {
      return <p className="text-center text-sm text-muted-foreground py-6">{emptyMessage}</p>;
    }
    return (
      <ScrollArea className="h-full">
        <div className="space-y-3 pr-4">
          {list.map(employee => (
            <EmployeeCard key={employee.id} employee={employee} type={type} />
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Planowanie"
        description="Zarządzaj nadchodzącymi zwolnieniami i urlopami pracowników."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 flex-grow">
        
        <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Planowane zwolnienia ({plannedTerminations.length})</h2>
            <div className="flex-grow rounded-lg border bg-card/50 p-4 min-h-[200px]">
                {renderEmployeeList(plannedTerminations, 'termination', 'Brak zaplanowanych zwolnień.')}
            </div>
        </div>

        <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Pracownicy na urlopie ({onVacation.length})</h2>
             <div className="flex-grow rounded-lg border bg-card/50 p-4 min-h-[200px]">
                {renderEmployeeList(onVacation, 'vacation', 'Obecnie nikt nie przebywa na urlopie.')}
            </div>
        </div>
        
        <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Nadchodzące urlopy ({upcomingVacations.length})</h2>
            <div className="flex-grow rounded-lg border bg-card/50 p-4 min-h-[200px]">
                {renderEmployeeList(upcomingVacations, 'vacation-planned', 'Brak zaplanowanych urlopów.')}
            </div>
        </div>

      </div>
    </div>
  );
}
