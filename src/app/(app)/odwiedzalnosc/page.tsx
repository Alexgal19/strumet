'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { useFirebaseData } from '@/context/config-context';
import { Loader2, ArrowLeft, ArrowRight, User, TrendingDown, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isWeekend,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  getDay,
  setYear,
  setMonth,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { getPolishHolidays } from '@/lib/holidays';
import { cn } from '@/lib/utils';
import { Employee, Absence } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, remove, push } from "firebase/database";
import { useToast } from '@/hooks/use-toast';

export default function AttendancePage() {
  const { employees, absences, isLoading } = useFirebaseData();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const holidays = useMemo(() => getPolishHolidays(currentDate.getFullYear()), [currentDate]);

  const isHoliday = (date: Date) => {
    return holidays.some(holiday => isSameDay(holiday, date));
  };
  
  const workingDaysInMonth = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
    return days.filter(day => !isWeekend(day) && !isHoliday(day)).length;
  }, [currentDate, holidays]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const handleYearChange = (year: string) => {
    setCurrentDate(newDate => setYear(newDate, parseInt(year, 10)));
  };

  const handleMonthChange = (monthIndex: string) => {
    setCurrentDate(newDate => setMonth(newDate, parseInt(monthIndex, 10)));
  };


  const toggleAbsence = async (employeeId: string, date: Date) => {
    if (isWeekend(date) || isHoliday(date)) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie można oznaczyć nieobecności w dzień wolny od pracy.',
      });
      return;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    const existingAbsence = absences.find(a => a.employeeId === employeeId && a.date === dateString);

    try {
        if (existingAbsence) {
            await remove(ref(db, `absences/${existingAbsence.id}`));
        } else {
            const newAbsenceRef = push(ref(db, 'absences'));
            await set(newAbsenceRef, {
                employeeId,
                date: dateString,
            });
        }
    } catch (error) {
        console.error("Error toggling absence:", error);
        toast({
            variant: 'destructive',
            title: 'Błąd',
            description: 'Wystąpił problem podczas zapisu danych.',
        });
    }
  };

  const getEmployeeAbsencesForMonth = (employeeId: string) => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return absences.filter(a =>
      a.employeeId === employeeId &&
      new Date(a.date) >= start &&
      new Date(a.date) <= end
    ).length;
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const overallAbsenceDays = absences.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  }).length;
  
  const overallAbsencePercentage = workingDaysInMonth > 0 && activeEmployees.length > 0
    ? (overallAbsenceDays / (workingDaysInMonth * activeEmployees.length)) * 100
    : 0;

  const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({length: 12}, (_, i) => ({
      value: i.toString(),
      label: format(new Date(2000, i), 'LLLL', {locale: pl}),
  }));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Odliczanie obecności"
        description="Zarządzaj kalendarzem obecności pracowników."
      />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aktywni pracownicy</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeEmployees.length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dni robocze w miesiącu</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{workingDaysInMonth}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Suma nieobecności</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{overallAbsenceDays}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Procent nieobecności</CardTitle>
                    <div className="h-4 w-4 text-muted-foreground font-bold text-lg">%</div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{overallAbsencePercentage.toFixed(1)}%</div>
                </CardContent>
            </Card>
        </div>


      <Card className="flex-grow flex flex-col">
        <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="text-2xl capitalize">
                    {format(currentDate, 'LLLL yyyy', { locale: pl })}
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Select value={currentDate.getMonth().toString()} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Miesiąc" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={currentDate.getFullYear().toString()} onValueChange={handleYearChange}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Rok" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
            <div className="grid grid-cols-[200px_repeat(31,minmax(0,1fr))] gap-px bg-border -ml-6 -mr-6">
                {/* Header Row */}
                <div className="sticky top-0 z-10 bg-muted/50 p-2 text-sm font-semibold flex items-center justify-start">Pracownik</div>
                {daysInMonth.map(day => (
                    <div 
                        key={day.toString()}
                        className={cn(
                            "sticky top-0 z-10 bg-muted/50 p-2 text-center text-sm font-semibold flex flex-col items-center justify-center",
                            (isWeekend(day) || isHoliday(day)) && 'bg-muted/30 text-muted-foreground',
                            isToday(day) && 'bg-primary/20 text-primary-foreground'
                        )}
                    >
                       <span className="capitalize">{format(day, 'E', { locale: pl }).slice(0, 2)}</span>
                       <span className="font-bold">{format(day, 'd')}</span>
                    </div>
                ))}
                
                {/* Employee Rows */}
                {activeEmployees.length > 0 ? (
                    activeEmployees.map(employee => {
                        const absencesCount = getEmployeeAbsencesForMonth(employee.id);
                        const absencePercentage = workingDaysInMonth > 0 ? (absencesCount / workingDaysInMonth) * 100 : 0;

                        return (
                            <React.Fragment key={employee.id}>
                                <div className="grid grid-cols-[1fr_auto] items-center bg-card p-2 border-b border-t">
                                  <div className="flex-grow overflow-hidden pr-2">
                                      <p className="font-medium truncate text-sm">{employee.fullName}</p>
                                      <p className="text-xs text-muted-foreground truncate">{employee.jobTitle}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-xs">{absencesCount}d</div>
                                    <div className="text-muted-foreground text-xs">{absencePercentage.toFixed(0)}%</div>
                                  </div>
                                </div>
                                {daysInMonth.map(day => {
                                    const dateString = format(day, 'yyyy-MM-dd');
                                    const isAbsent = absences.some(a => a.employeeId === employee.id && a.date === dateString);
                                    
                                    return (
                                        <div
                                            key={`${employee.id}-${dateString}`}
                                            onClick={() => toggleAbsence(employee.id, day)}
                                            className={cn(
                                                "min-h-[60px] border-b bg-card flex items-center justify-center transition-colors",
                                                (isWeekend(day) || isHoliday(day)) 
                                                    ? 'bg-muted/30 cursor-not-allowed'
                                                    : 'cursor-pointer hover:bg-muted',
                                                isAbsent && 'bg-destructive/20'
                                            )}
                                        >
                                            {isAbsent && <User className="h-4 w-4 text-destructive" />}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        );
                    })
                ) : (
                    <div className="col-span-32 text-center p-8 text-muted-foreground">
                        Brak aktywnych pracowników.
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
