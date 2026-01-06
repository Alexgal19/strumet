
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
import { Loader2, CalendarIcon, ChevronLeft, ChevronRight, UserX, Copy, Info, Users } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import type { Employee, Absence } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { add, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getYear, getMonth, setYear, setMonth, isWeekend, getDaysInMonth } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { EmployeeAttendanceCard } from '@/components/employee-attendance-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const DepartmentStats = ({
  departmentData,
  onCopy,
}: {
  departmentData: { name: string; percentage: number, employees: Employee[] }[];
  onCopy: (text: string) => void;
}) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const formatListForCopy = () => {
    return departmentData.map(d => `${d.name}: ${d.percentage.toFixed(2)}%`).join('\n');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Absencja wg działów</CardTitle>
          <CardDescription>Średni % nieobecności w miesiącu.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onCopy(formatListForCopy())}>
          <Copy className="mr-2 h-4 w-4" />
          Kopiuj listę
        </Button>
      </CardHeader>
      <CardContent>
        {departmentData.length > 0 ? (
          <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
            {departmentData.map((dept) => (
              <AccordionItem value={dept.name} key={dept.name}>
                <AccordionTrigger>
                  <div className="flex w-full justify-between items-center">
                    <span className="font-medium">{dept.name}</span>
                    <span className={cn("font-semibold", dept.percentage > 5 && "text-destructive")}>{dept.percentage.toFixed(2)}%</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="text-sm text-muted-foreground pl-4">
                    {dept.employees.map(emp => (
                        <li key={emp.id} className="py-1">{emp.fullName}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">Brak danych do wyświetlenia.</p>
        )}
      </CardContent>
    </Card>
  );
};


export default function OdwiedzalnoscPage() {
  const { employees, absences, isLoading: isAppLoading, addAbsence, deleteAbsence } = useAppContext();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const departmentOptions = useMemo(() => [
    { value: "all", label: "Wszystkie działy" },
    ...[...new Set(activeEmployees.map(e => e.department).filter(Boolean))].sort().map(d => ({ value: d, label: d }))
  ], [activeEmployees]);

  const years = useMemo(() => {
    const currentYear = getYear(new Date());
    return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: format(new Date(2000, i, 1), 'LLLL', { locale: pl }),
    }));
  }, []);

  const { workingDaysInMonth, holidays } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInPeriod = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const holidaysForYear = getPolishHolidays(getYear(currentDate));
    
    let workingDays = 0;
    daysInPeriod.forEach(day => {
      const isWknd = isWeekend(day);
      const isHoliday = holidaysForYear.some(h => isSameDay(h, day));
      if (!isWknd && !isHoliday) {
        workingDays++;
      }
    });

    return { workingDaysInMonth: workingDays, holidays: holidaysForYear };
  }, [currentDate]);

  const filteredEmployees = useMemo(() => {
    let filtered = activeEmployees;
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(e => e.department === selectedDepartment);
    }
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(e => e.fullName.toLowerCase().includes(lowerCaseSearch));
    }
    return filtered;
  }, [activeEmployees, selectedDepartment, searchTerm]);

  const { totalAbsencesInMonth, departmentStats } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const relevantAbsences = absences.filter(a => {
        const absenceDate = new Date(a.date);
        return absenceDate >= monthStart && absenceDate <= monthEnd;
    });

    const totalAbsences = relevantAbsences.length;

    const deptStatsMap: Record<string, { absenceCount: number, employeeCount: number, employees: Employee[] }> = {};
    activeEmployees.forEach(emp => {
        if (!deptStatsMap[emp.department]) {
            deptStatsMap[emp.department] = { absenceCount: 0, employeeCount: 0, employees: [] };
        }
        deptStatsMap[emp.department].employeeCount++;
        deptStatsMap[emp.department].employees.push(emp);
    });
    
    relevantAbsences.forEach(abs => {
        const employee = activeEmployees.find(e => e.id === abs.employeeId);
        if (employee && deptStatsMap[employee.department]) {
            deptStatsMap[employee.department].absenceCount++;
        }
    });

    const departmentStats = Object.entries(deptStatsMap)
        .map(([name, data]) => ({
            name,
            percentage: data.employeeCount > 0 && workingDaysInMonth > 0
                ? (data.absenceCount / (data.employeeCount * workingDaysInMonth)) * 100
                : 0,
            employees: data.employees.sort((a,b) => a.fullName.localeCompare(b.fullName))
        }))
        .sort((a, b) => b.percentage - a.percentage);

    return { totalAbsencesInMonth: totalAbsences, departmentStats };
  }, [absences, currentDate, activeEmployees, workingDaysInMonth]);
  
  const totalAbsencePercentage = useMemo(() => {
      if (activeEmployees.length === 0 || workingDaysInMonth === 0) return 0;
      const totalPossibleWorkDays = activeEmployees.length * workingDaysInMonth;
      return (totalAbsencesInMonth / totalPossibleWorkDays) * 100;
  }, [activeEmployees.length, workingDaysInMonth, totalAbsencesInMonth]);

  const handleToggleAbsence = async (employeeId: string, date: string, isCurrentlyAbsent: boolean) => {
      const existingAbsence = absences.find(a => a.employeeId === employeeId && a.date === date);
      
      if (isCurrentlyAbsent && existingAbsence) {
          await deleteAbsence(existingAbsence.id);
      } else if (!isCurrentlyAbsent) {
          await addAbsence(employeeId, date);
      }
  };

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Skopiowano!",
      description: "Statystyki działów zostały skopiowane do schowka.",
    });
  }, [toast]);
  

  const isLoading = isAppLoading;

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Obecność"
        description="Zarządzaj nieobecnościami pracowników i analizuj statystyki."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dni robocze w miesiącu</CardTitle>
                  <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{workingDaysInMonth}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suma nieobecności (miesiąc)</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totalAbsencesInMonth}</div>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Absencja (miesiąc)</CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totalAbsencePercentage.toFixed(2)}%</div>
              </CardContent>
          </Card>
      </div>

       <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight capitalize">
              {format(currentDate, 'LLLL yyyy', { locale: pl })}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
                 <Input 
                    placeholder="Szukaj po nazwisku, imieniu..."
                    className="max-w-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                 <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-full sm:w-[200px]">
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
                 <div className="flex items-center gap-1 p-1 rounded-md border bg-card">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(prev => add(prev, { months: -1 }))}><ChevronLeft /></Button>
                      <Select value={String(getMonth(currentDate))} onValueChange={v => setCurrentDate(setMonth(currentDate, Number(v)))}>
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={String(getYear(currentDate))} onValueChange={v => setCurrentDate(setYear(currentDate, Number(v)))}>
                        <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(prev => add(prev, { months: 1 }))}><ChevronRight /></Button>
                 </div>
            </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
          <div className="lg:col-span-2">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredEmployees.map(emp => (
                    <EmployeeAttendanceCard
                        key={emp.id}
                        employee={emp}
                        absences={absences}
                        currentDate={currentDate}
                        holidays={holidays}
                        onToggleAbsence={handleToggleAbsence}
                    />
                ))}
             </div>
             {filteredEmployees.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-center p-12 text-muted-foreground h-full">
                    <UserX className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">Brak pracowników</h3>
                    <p className="text-sm">Nie znaleziono pracowników pasujących do wybranych kryteriów.</p>
                </div>
             )}
          </div>
          <div className="lg:col-span-1">
             <DepartmentStats 
                departmentData={departmentStats}
                onCopy={handleCopy}
            />
          </div>
      </div>
    </div>
  );
}
