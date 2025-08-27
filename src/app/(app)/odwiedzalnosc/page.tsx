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
import { Loader2, ArrowLeft, ArrowRight, User, TrendingDown, CalendarDays, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
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
  setYear,
  setMonth,
  parse,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { getPolishHolidays } from '@/lib/holidays';
import { cn } from '@/lib/utils';
import { Absence } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, remove, push } from "firebase/database";
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AttendancePage() {
  const { employees, absences, config, isLoading } = useFirebaseData();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === 'all') {
      return activeEmployees;
    }
    return activeEmployees.filter(e => e.department === selectedDepartment);
  }, [activeEmployees, selectedDepartment]);


  const holidays = useMemo(() => getPolishHolidays(currentDate.getFullYear()), [currentDate]);

  const isHoliday = (date: Date) => {
    return holidays.some(holiday => isSameDay(holiday, date));
  };
  
  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
  }, [currentDate]);

  const workingDaysInMonth = useMemo(() => {
    return daysInMonth.filter(day => !isWeekend(day) && !isHoliday(day)).length;
  }, [daysInMonth, holidays]);
  
  const absencesByEmployeeForMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const absencesMap = new Map<string, Set<string>>();

    absences.forEach(absence => {
        try {
            const absenceDate = parse(absence.date, 'yyyy-MM-dd', new Date());
            if (absenceDate >= start && absenceDate <= end) {
                if (!absencesMap.has(absence.employeeId)) {
                    absencesMap.set(absence.employeeId, new Set());
                }
                absencesMap.get(absence.employeeId)?.add(absence.date);
            }
        } catch (e) {
             console.error("Could not parse absence date:", absence.date);
        }
    });

    const result = new Map<string, { count: number, dates: Set<string> }>();
    activeEmployees.forEach(emp => {
      const empAbsences = absencesMap.get(emp.id) || new Set();
      result.set(emp.id, { count: empAbsences.size, dates: empAbsences });
    });

    return result;
  }, [absences, currentDate, activeEmployees]);
  

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
  
  const overallAbsenceDays = useMemo(() => {
    let total = 0;
    absencesByEmployeeForMonth.forEach(value => {
        total += value.count;
    });
    return total;
  }, [absencesByEmployeeForMonth]);
  
  const overallAbsencePercentage = workingDaysInMonth > 0 && activeEmployees.length > 0
    ? (overallAbsenceDays / (workingDaysInMonth * activeEmployees.length)) * 100
    : 0;

  const departmentAbsenceData = useMemo(() => {
    if (workingDaysInMonth === 0) return [];
    
    return config.departments.map((dept, index) => {
      const deptEmployees = activeEmployees.filter(e => e.department === dept.name);
      if (deptEmployees.length === 0) return null;

      let deptAbsences = 0;
      deptEmployees.forEach(emp => {
        deptAbsences += absencesByEmployeeForMonth.get(emp.id)?.count || 0;
      });

      const totalPossibleDays = deptEmployees.length * workingDaysInMonth;
      const percentage = totalPossibleDays > 0 ? (deptAbsences / totalPossibleDays) * 100 : 0;
      
      return {
        name: dept.name,
        absences: deptAbsences,
        percentage: percentage,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      };
    }).filter(Boolean).sort((a, b) => (b?.absences || 0) - (a?.absences || 0));
  }, [activeEmployees, absencesByEmployeeForMonth, config.departments, workingDaysInMonth]);


  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({length: 12}, (_, i) => ({
      value: i.toString(),
      label: format(new Date(2000, i), 'LLLL', {locale: pl}),
  }));

  const gridTemplateColumns = `200px repeat(${daysInMonth.length}, minmax(0, 1fr))`;

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

        {departmentAbsenceData.length > 0 && (
          <Card className="mb-6">
             <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="px-6">
                    <div className="flex items-center">
                      <Building className="mr-2 h-5 w-5" />
                      <span className="font-semibold">Nieobecności wg działów</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground mb-4">Statystyka nieobecności dla poszczególnych działów w wybranym miesiącu.</p>
                    <div className="space-y-4">
                      {departmentAbsenceData.map((dept) => dept && (
                          <div key={dept.name} className="space-y-1">
                              <div className="flex justify-between items-center text-sm font-medium">
                                  <span style={{ color: dept.fill }}>{dept.name}</span>
                                  <span>{dept.absences} dni ({dept.percentage.toFixed(1)}%)</span>
                              </div>
                              <Progress value={dept.percentage} className="h-2" indicatorClassName="bg-[var(--progress-indicator-fill)]" style={{'--progress-indicator-fill': dept.fill} as React.CSSProperties} />
                          </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )}

      <Card className="flex-grow flex flex-col">
        <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="text-2xl capitalize">
                    {format(currentDate, 'LLLL yyyy', { locale: pl })}
                </CardTitle>
                <div className="flex items-center flex-wrap gap-2">
                    <Select value={currentDate.getMonth().toString()} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="Miesiąc" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={currentDate.getFullYear().toString()} onValueChange={handleYearChange}>
                        <SelectTrigger className="w-full sm:w-[100px]">
                            <SelectValue placeholder="Rok" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Wybierz dział" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszystkie działy</SelectItem>
                            {config.departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                          <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleNextMonth}>
                          <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
            <div className="grid gap-px bg-border -ml-6 -mr-6" style={{ gridTemplateColumns }}>
                {/* Header Row */}
                <div className="sticky top-0 z-10 bg-muted/50 p-2 text-sm font-semibold flex items-center justify-start">Pracownik</div>
                {daysInMonth.map(day => (
                    <div 
                        key={day.toString()}
                        className={cn(
                            "sticky top-0 z-10 bg-muted/50 p-2 text-center text-sm font-semibold flex flex-col items-center justify-center min-w-[40px]",
                            isHoliday(day) && 'bg-yellow-500/20 text-yellow-700',
                            isWeekend(day) && !isHoliday(day) && 'bg-red-500/10 text-red-600',
                            isToday(day) && 'bg-primary/20 text-primary-foreground'
                        )}
                    >
                       <span className="capitalize">{format(day, 'E', { locale: pl }).slice(0, 2)}</span>
                       <span className="font-bold">{format(day, 'd')}</span>
                    </div>
                ))}
                
                {/* Employee Rows */}
                {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(employee => {
                        const employeeAbsenceInfo = absencesByEmployeeForMonth.get(employee.id);
                        const absencesCount = employeeAbsenceInfo?.count || 0;
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
                                    const isAbsent = employeeAbsenceInfo?.dates.has(dateString);
                                    
                                    return (
                                        <div
                                            key={`${employee.id}-${dateString}`}
                                            onClick={() => toggleAbsence(employee.id, day)}
                                            className={cn(
                                                "min-h-[60px] border-b bg-card flex items-center justify-center transition-colors",
                                                isHoliday(day) && 'bg-yellow-500/20 cursor-not-allowed',
                                                isWeekend(day) && !isHoliday(day) && 'bg-red-500/10 cursor-not-allowed',
                                                !(isWeekend(day) || isHoliday(day)) && 'cursor-pointer hover:bg-muted',
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
                    <div className={`col-span-${daysInMonth.length + 1} text-center p-8 text-muted-foreground`}>
                        Brak aktywnych pracowników do wyświetlenia.
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
