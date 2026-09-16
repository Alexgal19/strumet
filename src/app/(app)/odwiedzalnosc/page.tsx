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
import { Loader2, CalendarIcon, CalendarDays, ChevronLeft, ChevronRight, UserX, Copy, Info, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import type { Employee, Absence } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { add, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getYear, getMonth, setYear, setMonth, isWeekend, getDaysInMonth, parseISO } from 'date-fns';
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
import { useEmployees } from '@/hooks/use-employees';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { EmployeeAttendanceCard } from '@/components/employee-attendance-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AttendanceExcelExportButton } from '@/components/attendance-excel-export-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { excelLikeMatch } from '@/lib/search';

const DepartmentStats = ({
  departmentData,
  onCopy,
}: {
  departmentData: { name: string; percentage: number, employees: { employee: Employee, absencePercentage: number }[] }[];
  onCopy: (text: string) => void;
}) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const formatListForCopy = () => {
    return departmentData.map(d => 
        `${d.name}: ${d.percentage.toFixed(2)}%\n` +
        d.employees.map(e => `  - ${e.employee.fullName}: ${e.absencePercentage.toFixed(2)}%`).join('\n')
    ).join('\n\n');
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Absencja wg działów</CardTitle>
          <CardDescription>Średni % nieobecności w miesiącu.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => onCopy(formatListForCopy())}>
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
                    {dept.employees.map(empData => (
                        <li key={empData.employee.id} className="flex justify-between items-center py-1">
                            <span>{empData.employee.fullName}</span>
                            <span className={cn("font-semibold", empData.absencePercentage > 5 && "text-destructive")}>
                                {empData.absencePercentage.toFixed(2)}%
                            </span>
                        </li>
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
  const { absences, isLoading: isAppLoading, addAbsence, deleteAbsence } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  // Filtr dat nieobecności — pokazuje kto był nieobecny w wybranych dniach
  const [absenceDateFilter, setAbsenceDateFilter] = useState<Date[]>([]);

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
        filtered = filtered.filter(e => excelLikeMatch(searchTerm, [e.fullName]));
    }
    return filtered;
  }, [activeEmployees, selectedDepartment, searchTerm]);

  const isDateFilterActive = absenceDateFilter.length > 0;
  const absenceDateFilterKeys = useMemo(
    () => new Set(absenceDateFilter.map(d => format(d, 'yyyy-MM-dd'))),
    [absenceDateFilter]
  );

  // Przy aktywnym filtrze dat — tylko pracownicy nieobecni w wybranych dniach
  const dateFilteredEmployees = useMemo(() => {
    if (!isDateFilterActive) return filteredEmployees;
    return filteredEmployees.filter(emp =>
      absences.some(a => a.employeeId === emp.id && absenceDateFilterKeys.has(a.date))
    );
  }, [filteredEmployees, absences, isDateFilterActive, absenceDateFilterKeys]);

  // Podsumowanie: kto i w których dniach był nieobecny (grupowane po działach)
  const absenceSummary = useMemo(() => {
    if (!isDateFilterActive) return [];
    return dateFilteredEmployees
      .map(emp => ({
        employee: emp,
        dates: absences
          .filter(a => a.employeeId === emp.id && absenceDateFilterKeys.has(a.date))
          .map(a => a.date)
          .sort(),
      }))
      .sort((a, b) => {
        const depCompare = (a.employee.department || '').localeCompare(b.employee.department || '', 'pl');
        if (depCompare !== 0) return depCompare;
        return a.employee.fullName.localeCompare(b.employee.fullName, 'pl');
      });
  }, [dateFilteredEmployees, absences, isDateFilterActive, absenceDateFilterKeys]);

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
    
    const employeeAbsenceMap = relevantAbsences.reduce((acc, abs) => {
        acc[abs.employeeId] = (acc[abs.employeeId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const departmentStats = Object.entries(deptStatsMap)
        .map(([name, data]) => ({
            name,
            percentage: data.employeeCount > 0 && workingDaysInMonth > 0
                ? (data.absenceCount / (data.employeeCount * workingDaysInMonth)) * 100
                : 0,
            employees: data.employees
                .map(emp => {
                    const empAbsences = employeeAbsenceMap[emp.id] || 0;
                    return {
                        employee: emp,
                        absencePercentage: workingDaysInMonth > 0 ? (empAbsences / workingDaysInMonth) * 100 : 0
                    };
                })
                .sort((a,b) => a.employee.fullName.localeCompare(b.employee.fullName))
        }))
        .sort((a, b) => b.percentage - a.percentage);

    return { totalAbsencesInMonth: totalAbsences, departmentStats };
  }, [absences, currentDate, activeEmployees, workingDaysInMonth]);
  
  const totalAbsencePercentage = useMemo(() => {
      if (activeEmployees.length === 0 || workingDaysInMonth === 0) return 0;
      const totalPossibleWorkDays = activeEmployees.length * workingDaysInMonth;
      return (totalAbsencesInMonth / totalPossibleWorkDays) * 100;
  }, [activeEmployees.length, workingDaysInMonth, totalAbsencesInMonth]);

  const isLoading = isAppLoading || isEmployeesLoading;
  const isMobile = useIsMobile();

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

  const employeesContent = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dateFilteredEmployees.map(emp => (
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
      {dateFilteredEmployees.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-center p-12 text-muted-foreground h-full">
              <UserX className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">Brak pracowników</h3>
              <p className="text-sm">Nie znaleziono pracowników pasujących do wybranych kryteriów.</p>
          </div>
      )}
    </>
  );

  const statsContent = (
    <DepartmentStats
        departmentData={departmentStats}
        onCopy={handleCopy}
    />
  );

  return (
    <div className="min-h-full w-full">
        {isLoading ? (
            <div className="flex min-h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <>
                <PageHeader
                    title="Obecność"
                    description="Zarządzaj nieobecnościami pracowników i analizuj statystyki."
                />

                <div className="mb-6 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
                    <Card className="min-w-[70%] sm:min-w-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dni robocze w miesiącu</CardTitle>
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{workingDaysInMonth}</div>
                        </CardContent>
                    </Card>
                    <Card className="min-w-[70%] sm:min-w-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Suma nieobecności (miesiąc)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalAbsencesInMonth}</div>
                        </CardContent>
                    </Card>
                    <Card className="min-w-[70%] sm:min-w-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Absencja (miesiąc)</CardTitle>
                            <UserX className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalAbsencePercentage.toFixed(2)}%</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight capitalize">
                            {format(currentDate, 'LLLL yyyy', { locale: pl })}
                        </h2>
                        <AttendanceExcelExportButton
                            currentDate={currentDate}
                            employees={dateFilteredEmployees}
                            absences={absences}
                            workingDays={workingDaysInMonth}
                            selectedDates={isDateFilterActive ? absenceDateFilter : undefined}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            placeholder="Szukaj po nazwisku..."
                            className="flex-1 min-w-[140px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="flex-1 min-w-[140px] sm:w-[200px] sm:flex-none">
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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={isDateFilterActive ? 'secondary' : 'outline'}
                                    className={cn(
                                        'flex-1 min-w-[140px] sm:flex-none justify-start h-9',
                                        isDateFilterActive && 'text-primary border-primary/40'
                                    )}
                                >
                                    <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
                                    {isDateFilterActive ? `Wybrane dni: ${absenceDateFilter.length}` : 'Filtruj po datach'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="multiple"
                                    selected={absenceDateFilter}
                                    onSelect={(dates) => setAbsenceDateFilter(dates ?? [])}
                                    defaultMonth={currentDate}
                                    locale={pl}
                                />
                                <div className="p-2 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full"
                                        disabled={!isDateFilterActive}
                                        onClick={() => setAbsenceDateFilter([])}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Wyczyść filtr dat
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-md border bg-card w-full sm:w-auto">
                        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => setCurrentDate(prev => add(prev, { months: -1 }))}><ChevronLeft /></Button>
                        <Select value={String(getMonth(currentDate))} onValueChange={v => setCurrentDate(setMonth(currentDate, Number(v)))}>
                            <SelectTrigger className="flex-1 sm:w-32 h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={String(getYear(currentDate))} onValueChange={v => setCurrentDate(setYear(currentDate, Number(v)))}>
                            <SelectTrigger className="w-20 sm:w-24 h-10 shrink-0"><SelectValue /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => setCurrentDate(prev => add(prev, { months: 1 }))}><ChevronRight /></Button>
                    </div>
                </div>

                {/* Wynik filtra dat: kto był nieobecny w wybranych dniach (grupowane po działach) */}
                {isDateFilterActive && (
                    <Card className="mb-6">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <CardTitle className="text-base">
                                    Nieobecni w wybranych dniach ({absenceSummary.length})
                                </CardTitle>
                                <CardDescription className="break-words">
                                    {absenceDateFilter
                                        .slice()
                                        .sort((a, b) => a.getTime() - b.getTime())
                                        .map(d => format(d, 'dd.MM.yyyy', { locale: pl }))
                                        .join(', ')}
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full sm:w-auto shrink-0" onClick={() => setAbsenceDateFilter([])}>
                                <X className="mr-2 h-4 w-4" />
                                Wyczyść filtr
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {absenceSummary.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    Brak nieobecności w wybranych dniach.
                                </p>
                            ) : (
                                <div className="divide-y divide-border/60">
                                    {absenceSummary.map(({ employee, dates }) => (
                                        <div key={employee.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{employee.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{employee.department || 'Bez działu'}</p>
                                            </div>
                                            <p className="text-sm font-semibold">{dates.map(d => format(parseISO(d), 'dd.MM')).join(', ')}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {isMobile ? (
                    <Tabs defaultValue="employees" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="employees" className="min-h-[44px]">Pracownicy</TabsTrigger>
                            <TabsTrigger value="departments" className="min-h-[44px]">Działy</TabsTrigger>
                        </TabsList>
                        <TabsContent value="employees">{employeesContent}</TabsContent>
                        <TabsContent value="departments">{statsContent}</TabsContent>
                    </Tabs>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">{employeesContent}</div>
                        <div className="lg:col-span-1">{statsContent}</div>
                    </div>
                )}
            </>
        )}
    </div>
  );
}
