
'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, CalendarIcon, ChevronLeft, ChevronRight, UserCheck, UserX, Percent } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import type { Employee, Absence, AllConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { add, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getYear, getMonth, setYear, setMonth, isWeekend } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPolishHolidays } from '@/lib/holidays';
import { useAppContext } from '@/context/app-context';
import { Progress } from '@/components/ui/progress';


const DepartmentStats = ({ department, employees, absences }: { department: string, employees: Employee[], absences: Absence[] }) => {
    const totalEmployees = employees.length;
    if (totalEmployees === 0) return null;

    const departmentAbsences = absences.filter(a => employees.some(e => e.id === a.employeeId));
    const totalAbsenceDays = departmentAbsences.length;
    const workingDaysInMonth = 21; // Uproszczenie, do poprawy
    const totalPossibleDays = totalEmployees * workingDaysInMonth;
    const absencePercentage = totalPossibleDays > 0 ? (totalAbsenceDays / totalPossibleDays) * 100 : 0;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Statystyki dla: {department}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Procent nieobecności</span>
                        <span className="text-sm font-bold">{absencePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={absencePercentage} indicatorClassName="bg-destructive" />
                </div>
                <div className="text-sm text-muted-foreground">
                    <p>Całkowita liczba pracowników: <span className="font-bold text-foreground">{totalEmployees}</span></p>
                    <p>Całkowita liczba dni absencji: <span className="font-bold text-foreground">{totalAbsenceDays}</span></p>
                </div>
            </CardContent>
        </Card>
    );
};


const AttendanceCalendar = ({ employees, absences, currentDate, onDateChange, onToggleAbsence }: { employees: Employee[], absences: Absence[], currentDate: Date, onDateChange: (date: Date) => void, onToggleAbsence: (employeeId: string, date: string, isAbsent: boolean) => void }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const holidays = useMemo(() => getPolishHolidays(getYear(currentDate)), [currentDate]);

  const handleDayClick = (employeeId: string, day: Date) => {
    const dateString = format(day, 'yyyy-MM-dd');
    const isCurrentlyAbsent = absences.some(a => a.employeeId === employeeId && a.date === dateString);
    onToggleAbsence(employeeId, dateString, isCurrentlyAbsent);
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => onDateChange(add(currentDate, { months: -1 }))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold text-center capitalize">
              {format(currentDate, 'LLLL yyyy', { locale: pl })}
            </h2>
            <Button variant="outline" size="icon" onClick={() => onDateChange(add(currentDate, { months: 1 }))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto p-0">
        <div className="relative">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-card z-10 shadow-sm">
              <tr>
                <th className="sticky left-0 bg-card p-2 border-b border-r w-52 min-w-52 text-left text-sm font-medium text-muted-foreground">Pracownik</th>
                {days.map(day => {
                    const isHoliday = holidays.some(h => isSameDay(h, day));
                    const isWknd = isWeekend(day);
                    return (
                        <th key={day.toString()} className={cn("p-2 border-b border-l text-center text-xs font-medium min-w-[40px]", (isWknd || isHoliday) && "text-destructive")}>
                           <div className="flex flex-col items-center">
                             <span>{format(day, 'E', { locale: pl }).charAt(0)}</span>
                             <span>{format(day, 'd')}</span>
                           </div>
                        </th>
                    )
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => {
                const employeeAbsences = absences.filter(a => a.employeeId === employee.id);
                const totalAbsences = employeeAbsences.length;

                return (
                  <tr key={employee.id} className="group hover:bg-muted/50">
                    <td className="sticky left-0 bg-card group-hover:bg-muted/50 p-2 border-b border-r w-52 min-w-52">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm truncate">{employee.fullName}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <UserX className="h-3 w-3 text-destructive" />
                                <span>{totalAbsences}</span>
                            </div>
                        </div>
                      </div>
                    </td>
                    {days.map(day => {
                      const dateString = format(day, 'yyyy-MM-dd');
                      const isAbsent = employeeAbsences.some(a => a.date === dateString);
                      const isHoliday = holidays.some(h => isSameDay(h, day));
                      const isWknd = isWeekend(day);
                      return (
                        <td key={day.toString()} className="p-0 border-b border-l text-center align-middle">
                          <button
                            onClick={() => handleDayClick(employee.id, day)}
                            className={cn(
                              "w-full h-14 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:z-20",
                              isAbsent ? "bg-destructive/80 hover:bg-destructive text-destructive-foreground" : "hover:bg-muted",
                              (isWknd || isHoliday) && !isAbsent && "bg-muted/30"
                            )}
                          >
                            {isAbsent && <UserX className="h-5 w-5" />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};


export default function OdwiedzalnoscPage() {
  const { employees, absences, isLoading: isAppLoading, addAbsence, deleteAbsence, config } = useAppContext();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);
  
  const departmentOptions = useMemo(() => {
    const depts = new Set(activeEmployees.map(e => e.department));
    return [{ value: "all", label: "Wszystkie działy" }, ...Array.from(depts).sort().map(d => ({ value: d, label: d }))];
  }, [activeEmployees]);
  
  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === "all") return activeEmployees;
    return activeEmployees.filter(e => e.department === selectedDepartment);
  }, [activeEmployees, selectedDepartment]);

  const handleToggleAbsence = async (employeeId: string, date: string, isCurrentlyAbsent: boolean) => {
      const existingAbsence = absences.find(a => a.employeeId === employeeId && a.date === date);
      
      if (isCurrentlyAbsent && existingAbsence) {
          await deleteAbsence(existingAbsence.id);
      } else if (!isCurrentlyAbsent) {
          await addAbsence(employeeId, date);
      }
  };

  const isLoading = isAppLoading;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Obecność"
        description="Zarządzaj obecnością i analizuj statystyki dla działów."
      >
        <div className="w-64">
           <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz dział" />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow">
          <div className="lg:col-span-3 h-full min-h-[600px]">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <AttendanceCalendar 
                    employees={filteredEmployees}
                    absences={absences}
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    onToggleAbsence={handleToggleAbsence}
                />
            </Suspense>
          </div>
          <div className="lg:col-span-1 space-y-6">
             <DepartmentStats 
                department={selectedDepartment === 'all' ? 'Wszystkie działy' : selectedDepartment}
                employees={filteredEmployees}
                absences={absences.filter(a => {
                    const emp = employees.find(e => e.id === a.employeeId);
                    return emp && (selectedDepartment === 'all' || emp.department === selectedDepartment);
                })}
            />
          </div>
      </div>
    </div>
  );
}
