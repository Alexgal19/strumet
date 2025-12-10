
'use client';

import React, { useState, useMemo, useEffect, useCallback, startTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Loader2, ArrowLeft, ArrowRight, User, TrendingDown, CalendarDays, Building, Search, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  format,
  addMonths,
  subMonths,
  setYear,
  setMonth,
  startOfMonth,
  endOfMonth,
  parseISO
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { getPolishHolidays } from '@/lib/holidays';
import { cn } from '@/lib/utils';
import { Employee, Absence, AllConfig } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';


const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

interface CalendarDay {
  dateString: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
}

interface AttendanceData {
  employees: Employee[];
  absences: Absence[];
  calendarDays: CalendarDay[];
  employeeStats: Record<string, { absenceDates: string[]; absencesCount: number; absencePercentage: number; }>;
  stats: {
    totalActiveEmployees: number;
    workingDaysInMonth: number;
    totalAbsences: number;
    overallAbsencePercentage: number;
    departmentAbsenceData: any[];
  };
}

const getAttendanceDataForMonth = (
  employees: Employee[],
  absences: Absence[],
  startDate: Date,
  endDate: Date
): AttendanceData => {
  const activeEmployees = employees.filter(e => e.status === 'aktywny');
  const holidays = getPolishHolidays(startDate.getFullYear());
  const today = format(new Date(), 'yyyy-MM-dd');

  const calendarDays: CalendarDay[] = [];
  let day = startDate;
  while (day <= endDate) {
    const dayOfWeek = day.getDay();
    const dateString = format(day, 'yyyy-MM-dd');
    calendarDays.push({
      dateString,
      dayOfMonth: day.getDate(),
      isCurrentMonth: true,
      isToday: dateString === today,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: holidays.some(h => format(h, 'yyyy-MM-dd') === dateString)
    });
    day = addDays(day, 1);
  }

  const workingDaysInMonth = calendarDays.filter(d => !d.isWeekend && !d.isHoliday).length;

  const employeeStats: Record<string, any> = {};
  activeEmployees.forEach(emp => {
    const empAbsences = absences.filter(a => a.employeeId === emp.id && a.date >= format(startDate, 'yyyy-MM-dd') && a.date <= format(endDate, 'yyyy-MM-dd'));
    const absenceDates = empAbsences.map(a => a.date);
    employeeStats[emp.id] = {
      absenceDates,
      absencesCount: absenceDates.length,
      absencePercentage: workingDaysInMonth > 0 ? (absenceDates.length / workingDaysInMonth) * 100 : 0
    };
  });
  
  const totalAbsences = absences.filter(a => a.date >= format(startDate, 'yyyy-MM-dd') && a.date <= format(endDate, 'yyyy-MM-dd')).length;
  const totalPossibleWorkingDays = activeEmployees.length * workingDaysInMonth;

  const departmentAbsences: Record<string, number> = {};
  activeEmployees.forEach(emp => {
      if(!departmentAbsences[emp.department]) departmentAbsences[emp.department] = 0;
      departmentAbsences[emp.department] += employeeStats[emp.id].absencesCount;
  });

  const departmentAbsenceData = Object.entries(departmentAbsences).map(([name, value], index) => ({
      name,
      absences: value,
      percentage: totalAbsences > 0 ? (value / totalAbsences) * 100 : 0,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`
  })).sort((a,b) => b.absences - a.absences);


  return {
    employees: activeEmployees,
    absences,
    calendarDays,
    employeeStats,
    stats: {
      totalActiveEmployees: activeEmployees.length,
      workingDaysInMonth,
      totalAbsences,
      overallAbsencePercentage: totalPossibleWorkingDays > 0 ? (totalAbsences / totalPossibleWorkingDays) * 100 : 0,
      departmentAbsenceData
    }
  };
};

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


const EmployeeAttendanceCard = ({ employee, attendanceData, onToggleAbsence }: { employee: Employee; attendanceData: AttendanceData; onToggleAbsence: (employeeId: string, date: Date) => void }) => {
    const empStats = attendanceData.employeeStats[employee.id];
    if (!empStats) return null;

    return (
        <Card>
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle className="text-lg">{employee.fullName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{employee.jobTitle}</p>
                    </div>
                    <div className='text-right'>
                       <div className="font-bold text-lg">{empStats.absencesCount}d</div>
                       <div className="text-muted-foreground text-xs">{empStats.absencePercentage.toFixed(0)}% nieob.</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground mb-2">
                   {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                    {attendanceData.calendarDays.map(day => {
                        const isAbsent = empStats.absenceDates.includes(day.dateString);
                        const dayDate = parseISO(day.dateString);
                        
                        return (
                            <Button
                                key={day.dateString}
                                variant={isAbsent ? 'destructive' : 'ghost'}
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full text-sm font-medium transition-colors",
                                    !day.isWeekend && !day.isHoliday && isAbsent && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                                    !day.isWeekend && !day.isHoliday && !isAbsent && 'hover:bg-primary/10',
                                    day.isHoliday && 'bg-accent/20 text-accent-foreground hover:bg-accent/30',
                                    day.isWeekend && !day.isHoliday && 'bg-destructive/10 text-destructive hover:bg-destructive/20',
                                    day.isToday && 'ring-2 ring-primary',
                                    (day.isWeekend || day.isHoliday) && 'cursor-not-allowed opacity-80',
                                )}
                                onClick={() => !(day.isWeekend || day.isHoliday) && onToggleAbsence(employee.id, dayDate)}
                                disabled={day.isWeekend || day.isHoliday}
                            >
                               {day.dayOfMonth}
                            </Button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
};


export default function AttendancePage() {
  const { employees, config, addAbsence, deleteAbsence, isLoading: isAppLoading } = useAppContext();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoadingAbsences, setIsLoadingAbsences] = useState(true);

  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const departmentOptions: OptionType[] = useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);

  useEffect(() => {
    const absencesRef = ref(db, 'absences');
    const unsubscribe = onValue(absencesRef, (snapshot) => {
      setAbsences(objectToArray(snapshot.val()));
      setIsLoadingAbsences(false);
    });
    return () => unsubscribe();
  }, []);

  const attendanceData = useMemo(() => {
    return getAttendanceDataForMonth(employees, absences, startOfMonth(currentDate), endOfMonth(currentDate));
  }, [employees, absences, currentDate]);

  const filteredEmployees = useMemo(() => {
    if (!attendanceData) return [];
    const searchLower = searchTerm.toLowerCase();
    return attendanceData.employees.filter(e => {
        const departmentMatch = selectedDepartments.length === 0 || selectedDepartments.includes(e.department);
        const searchMatch = !searchLower || e.fullName.toLowerCase().includes(searchLower);
        return departmentMatch && searchMatch;
    });
  }, [attendanceData, selectedDepartments, searchTerm]);

  const handleDateChange = (newDate: Date) => {
    startTransition(() => {
      setCurrentDate(newDate);
    });
  };

  const handlePrevMonth = () => handleDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => handleDateChange(addMonths(currentDate, 1));
  const handleYearChange = (year: string) => handleDateChange(setYear(currentDate, parseInt(year, 10)));
  const handleMonthChange = (monthIndex: string) => handleDateChange(setMonth(currentDate, parseInt(monthIndex, 10)));

  const toggleAbsence = async (employeeId: string, date: Date) => {
    if (!attendanceData) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    const existingAbsence = absences.find(a => a.employeeId === employeeId && a.date === dateString);

    try {
        if (existingAbsence) {
            await deleteAbsence(existingAbsence.id);
        } else {
            await addAbsence(employeeId, dateString);
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

  const isLoading = isAppLoading || isLoadingAbsences;

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-sm uppercase text-muted-foreground">
                {data.name}
              </span>
              <span className="font-bold text-base text-muted-foreground">
                {data.absences} ({data.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderDesktopView = () => (
     <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[250px]">Pracownik</TableHead>
                    <TableHead className="text-center w-[120px]">Nieobecności</TableHead>
                    <TableHead className="text-center">Kalendarz</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredEmployees.length > 0 ? filteredEmployees.map(employee => {
                    const empStats = attendanceData.employeeStats[employee.id];
                    if (!empStats) return null;
                    return (
                        <TableRow key={employee.id}>
                            <TableCell>
                                <div className="font-medium">{employee.fullName}</div>
                                <div className="text-xs text-muted-foreground">{employee.department}</div>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="font-bold text-lg">{empStats.absencesCount} dni</div>
                                <div className="text-xs text-muted-foreground">{empStats.absencePercentage.toFixed(1)}%</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1.5 flex-wrap">
                                    {attendanceData.calendarDays.map(day => {
                                        const isAbsent = empStats.absenceDates.includes(day.dateString);
                                        const dayDate = parseISO(day.dateString);
                                        return (
                                            <Button
                                                key={day.dateString}
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 rounded-full text-xs font-medium transition-colors",
                                                    !day.isWeekend && !day.isHoliday && isAbsent && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                                                     !day.isWeekend && !day.isHoliday && !isAbsent && 'hover:bg-primary/10',
                                                    day.isHoliday && 'bg-accent/20 text-accent-foreground',
                                                    day.isWeekend && !day.isHoliday && 'bg-destructive/10 text-destructive',
                                                    day.isToday && 'ring-2 ring-primary',
                                                    (day.isWeekend || day.isHoliday) && 'cursor-not-allowed opacity-70',
                                                )}
                                                onClick={() => !(day.isWeekend || day.isHoliday) && toggleAbsence(employee.id, dayDate)}
                                                disabled={day.isWeekend || day.isHoliday}
                                            >
                                               {day.dayOfMonth}
                                            </Button>
                                        )
                                    })}
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                }) : (
                     <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            Brak pracowników do wyświetlenia.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  )

  const renderMobileView = () => (
     <div className="space-y-4">
        {filteredEmployees.length > 0 ? (
            filteredEmployees.map(employee => (
                <EmployeeAttendanceCard 
                    key={employee.id}
                    employee={employee}
                    attendanceData={attendanceData}
                    onToggleAbsence={toggleAbsence}
                />
            ))
        ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
                <UserX className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold">Brak pracowników</h3>
                <p className="text-sm">Nie znaleziono pracowników pasujących do wybranych kryteriów filtrowania.</p>
            </div>
        )}
    </div>
  )


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
                  <div className="text-2xl font-bold">{attendanceData.stats.totalActiveEmployees}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dni robocze w miesiącu</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{attendanceData.stats.workingDaysInMonth}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suma nieobecności</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{attendanceData.stats.totalAbsences}</div>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Procent nieobecności</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground font-bold text-lg">%</div>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">
                    {`${attendanceData.stats.overallAbsencePercentage.toFixed(1)}%`}
                  </div>
              </CardContent>
          </Card>
      </div>

       {attendanceData && attendanceData.stats.departmentAbsenceData.length > 0 && (
          <Card className="mb-6">
              <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                      <AccordionTrigger className="px-6 py-4">
                          <div className="flex items-center">
                              <Building className="mr-3 h-5 w-5" />
                              <span className="font-semibold text-base">Nieobecności wg działów</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                               <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Pie
                                            data={attendanceData.stats.departmentAbsenceData}
                                            dataKey="absences"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            stroke="hsl(var(--card))"
                                            strokeWidth={2}
                                        >
                                            {attendanceData.stats.departmentAbsenceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            iconType="circle"
                                            layout="vertical"
                                            verticalAlign="middle"
                                            align="right"
                                            formatter={(value, entry: any) => (
                                                <span className="text-sm text-muted-foreground">
                                                    {value} ({entry.payload.absences}d)
                                                </span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                              <div className="space-y-4">
                                  {attendanceData.stats.departmentAbsenceData.map((dept) => dept && (
                                      <div key={dept.name} className="space-y-1">
                                          <div className="flex justify-between items-center text-sm font-medium">
                                              <span style={{ color: dept.fill }}>{dept.name}</span>
                                              <span>{dept.absences} dni ({dept.percentage.toFixed(1)}%)</span>
                                          </div>
                                          <Progress value={dept.percentage} className="h-2" indicatorClassName="bg-[var(--progress-indicator-fill)]" style={{ '--progress-indicator-fill': dept.fill } as React.CSSProperties} />
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-2xl capitalize">
                    {format(currentDate, 'LLLL yyyy', { locale: pl })}
                </CardTitle>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isLoading}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
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
                    <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isLoading}>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
             <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Szukaj po nazwisku..." 
                  className="pl-9" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="md:w-[220px]">
                  <MultiSelect
                    options={departmentOptions}
                    selected={selectedDepartments}
                    onChange={setSelectedDepartments}
                    title="Wybierz dział"
                  />
              </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto relative">
             {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
            {isMobile ? renderMobileView() : renderDesktopView()}
        </CardContent>
      </Card>
    </div>
  );
}

function addDays(date: Date, days: number) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
