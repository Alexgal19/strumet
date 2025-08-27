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
import { useFirebaseData } from '@/context/config-context';
import { Loader2, User, CalendarClock, AlertTriangle } from 'lucide-react';
import { Employee } from '@/lib/types';
import { format, differenceInDays, parseISO, isWithinInterval, startOfDay, endOfDay, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function PlanningPage() {
  const { employees, isLoading } = useFirebaseData();

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const plannedTerminations = useMemo(() => {
    return activeEmployees
      .filter(e => e.plannedTerminationDate)
      .sort((a, b) => new Date(a.plannedTerminationDate!).getTime() - new Date(b.plannedTerminationDate!).getTime());
  }, [activeEmployees]);

  const onVacation = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.vacationStartDate || !e.vacationEndDate) return false;
        const start = startOfDay(parseISO(e.vacationStartDate));
        const end = endOfDay(parseISO(e.vacationEndDate));
        return isWithinInterval(today, { start, end });
      })
      .sort((a, b) => new Date(a.vacationEndDate!).getTime() - new Date(b.vacationEndDate!).getTime());
  }, [activeEmployees]);

  const approachingVacations = useMemo(() => {
    const today = new Date();
    return activeEmployees
      .filter(e => {
        if (!e.vacationStartDate) return false;
        const diff = differenceInDays(parseISO(e.vacationStartDate), today);
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => new Date(a.vacationStartDate!).getTime() - new Date(b.vacationStartDate!).getTime());
  }, [activeEmployees]);


  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const EmployeeCard = ({ employee, type }: { employee: Employee, type: 'termination' | 'vacation' | 'vacation-approaching' }) => {
    const today = new Date();
    let date, diff, isUrgent, isWarning, isInfo, dateLabel, dateString;

    if (type === 'termination' && employee.plannedTerminationDate) {
        date = parseISO(employee.plannedTerminationDate);
        diff = differenceInDays(date, today);
        dateLabel = "Data zwolnienia";
    } else if (type === 'vacation' && employee.vacationEndDate) {
        date = parseISO(employee.vacationEndDate);
        diff = differenceInDays(date, today);
        dateLabel = "Koniec urlopu";
    } else if (type === 'vacation-approaching' && employee.vacationStartDate) {
        date = parseISO(employee.vacationStartDate);
        diff = differenceInDays(date, today);
        dateLabel = "Początek urlopu";
    }
    
    if (date) {
        isUrgent = diff !== undefined && diff <= 3;
        isWarning = diff !== undefined && diff > 3 && diff <= 7;
        isInfo = !isUrgent && !isWarning;
        dateString = format(date, "PPP", { locale: pl });
    }

    const getDaysLabel = (days: number) => {
        if (days === 0) return 'dzisiaj';
        if (days === 1) return `za 1 dzień`;
        if (days > 1 && days < 5) return `za ${days} dni`;
        return `za ${days} dni`;
    };
    
    return (
        <Card className={cn(
            "w-full",
            isUrgent && 'border-destructive/50 bg-destructive/10',
            isWarning && 'border-yellow-500/50 bg-yellow-500/10',
        )}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg">{employee.fullName}</CardTitle>
                    <CardDescription>{employee.jobTitle} - {employee.department}</CardDescription>
                </div>
                 {(isUrgent || isWarning) && <AlertTriangle className={cn("h-5 w-5", isUrgent ? "text-destructive" : "text-yellow-600")} />}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                    <CalendarClock className="mr-2 h-4 w-4" />
                    <span>{dateLabel}: <strong className="text-foreground">{dateString}</strong></span>
                </div>
                {diff !== undefined && diff >= 0 && (
                    <div className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full inline-block",
                        isUrgent && 'bg-destructive/20 text-destructive-foreground',
                        isWarning && 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
                        isInfo && 'bg-muted text-muted-foreground'
                    )}>
                        {getDaysLabel(diff)}
                    </div>
                )}
            </CardContent>
        </Card>
    )
  };
  
  const renderEmployeeList = (list: Employee[], type: 'termination' | 'vacation' | 'vacation-approaching', emptyMessage: string) => {
    if (list.length === 0) {
      return <p className="text-center text-muted-foreground py-6">{emptyMessage}</p>;
    }
    return (
      <div className="space-y-4">
        {list.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} type={type} />
        ))}
      </div>
    );
  };


  return (
    <div>
      <PageHeader
        title="Planowanie"
        description="Zarządzaj nadchodzącymi zwolnieniami i urlopami pracowników."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Planowane zwolnienia</h2>
            {renderEmployeeList(plannedTerminations, 'termination', 'Brak zaplanowanych zwolnień.')}
        </div>

        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Pracownicy na urlopie</h2>
            {renderEmployeeList(onVacation, 'vacation', 'Obecnie nikt nie przebywa na urlopie.')}
            
            <h2 className="text-2xl font-bold tracking-tight pt-4">Nadchodzące urlopy (7 dni)</h2>
            {renderEmployeeList(approachingVacations, 'vacation-approaching', 'Brak nadchodzących urlopów w najbliższym tygodniu.')}
        </div>

      </div>
    </div>
  );
}
