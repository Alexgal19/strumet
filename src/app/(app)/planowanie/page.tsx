
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
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PlanningPageProps {
  employees: Employee[];
  isLoading: boolean;
}

export default function PlanningPage({ employees, isLoading }: PlanningPageProps) {
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const plannedTerminations = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.plannedTerminationDate) return false;
        try {
          const terminationDate = startOfDay(parseISO(e.plannedTerminationDate));
          return terminationDate >= today;
        } catch (error) {
          return false;
        }
      })
      .sort((a, b) => new Date(a.plannedTerminationDate!).getTime() - new Date(b.plannedTerminationDate!).getTime());
  }, [activeEmployees]);

  const onVacation = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.vacationStartDate || !e.vacationEndDate) return false;
        try {
            const start = startOfDay(parseISO(e.vacationStartDate));
            const end = endOfDay(parseISO(e.vacationEndDate));
            return isWithinInterval(today, { start, end });
        } catch (error) {
            return false;
        }
      })
      .sort((a, b) => new Date(a.vacationEndDate!).getTime() - new Date(b.vacationEndDate!).getTime());
  }, [activeEmployees]);

  const allPlannedVacations = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.vacationStartDate || !e.vacationEndDate) return false;
        try {
            const startDate = startOfDay(parseISO(e.vacationStartDate));
            return startDate >= today && !onVacation.some(onVac => onVac.id === e.id);
        } catch (error) {
            return false;
        }
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
    let dateLabel, dateString;

    if (type === 'termination' && employee.plannedTerminationDate) {
        dateString = format(parseISO(employee.plannedTerminationDate), "PPP", { locale: pl });
        dateLabel = `Data zwolnienia: ${dateString}`;
    } else if (type === 'vacation' && employee.vacationEndDate) {
        dateString = format(parseISO(employee.vacationEndDate), "PPP", { locale: pl });
        dateLabel = `Koniec urlopu: ${dateString}`;
    } else if (type === 'vacation-planned' && employee.vacationStartDate) {
        const startDate = format(parseISO(employee.vacationStartDate), "dd.MM");
        const endDate = employee.vacationEndDate ? format(parseISO(employee.vacationEndDate), "dd.MM.yyyy") : '';
        dateLabel = `Urlop: ${startDate} - ${endDate}`;
    }
    
    return (
        <Card className={cn(
            "w-full",
            type === 'termination' && 'border-destructive/50 bg-destructive/10',
            (type === 'vacation' || type === 'vacation-planned') && 'border-yellow-500/50 bg-yellow-500/10',
        )}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg">{employee.fullName}</CardTitle>
                    <CardDescription>{employee.jobTitle} - {employee.department}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                 <div className="flex items-center text-muted-foreground">
                    <CalendarClock className="mr-2 h-4 w-4" />
                    <strong className="text-foreground">{dateLabel}</strong>
                </div>
            </CardContent>
        </Card>
    )
  };
  
  const renderEmployeeList = (list: Employee[], type: 'termination' | 'vacation' | 'vacation-planned', emptyMessage: string) => {
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
            
            <h2 className="text-2xl font-bold tracking-tight pt-4">Wszystkie zaplanowane urlopy</h2>
            {renderEmployeeList(allPlannedVacations, 'vacation-planned', 'Brak zaplanowanych urlopów.')}
        </div>

      </div>
    </div>
  );
}
