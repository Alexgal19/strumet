
'use client';

import React, { useState, useMemo, useEffect, useCallback, startTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { db } from '@/lib/firebase';
import { ref, set, remove, push, onValue } from "firebase/database";
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { getAttendanceDataForMonth, AttendanceData } from '@/lib/attendance-actions';
import { cn } from '@/lib/utils';
import { Employee, AllConfig } from '@/lib/types';


const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};


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
                    {attendanceData.calendarDays.map((day, index) => {
                        if (day.isPlaceholder) {
                            return <div key={`placeholder-${index}`} />;
                        }
                        
                        const isAbsent = empStats.absenceDates.includes(day.dateString!);
                        const dayDate = parseISO(day.dateString!);
                        
                        return (
                            <Button
                                key={day.dateString}
                                variant={isAbsent ? 'destructive' : 'ghost'}
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full text-sm font-medium transition-colors",
                                    day.isHoliday && 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30',
                                    day.isWeekend && !day.isHoliday && 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
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
  const [config, setConfig] = useState<AllConfig>({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [] });
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);

  useEffect(() => {
    const configRef = ref(db, 'config');
    const unsubscribeConfig = onValue(configRef, (snapshot) => {
        const data = snapshot.val();
        setConfig({
            departments: objectToArray(data?.departments),
            jobTitles: objectToArray(data?.jobTitles),
            managers: objectToArray(data?.managers),
            nationalities: objectToArray(data?.nationalities),
            clothingItems: objectToArray(data?.clothingItems),
        });
        setIsConfigLoading(false);
    });

    return () => {
        unsubscribeConfig();
    }
  }, []);
  
  const departmentOptions: OptionType[] = useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);

  const fetchAttendanceData = useCallback(async (date: Date) => {
    setIsDataLoading(true);
    try {
      const data = await getAttendanceDataForMonth(startOfMonth(date), endOfMonth(date));
      setAttendanceData(data);
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się załadować danych o obecności.',
      });
      setAttendanceData(null);
    } finally {
      setIsDataLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (!isConfigLoading) {
        startTransition(() => {
            fetchAttendanceData(currentDate);
        });
    }
  }, [currentDate, isConfigLoading, fetchAttendanceData]);


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
    const existingAbsence = attendanceData.absences.find(a => a.employeeId === employeeId && a.date === dateString);

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
        // Refetch data to show updated state
        fetchAttendanceData(currentDate);
    } catch (error) {
        console.error("Error toggling absence:", error);
        toast({
            variant: 'destructive',
            title: 'Błąd',
            description: 'Wystąpił problem podczas zapisu danych.',
        });
    }
  };
  
  if (isConfigLoading) {
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
                  <div className="text-2xl font-bold">{attendanceData?.stats.totalActiveEmployees ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dni robocze w miesiącu</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{attendanceData?.stats.workingDaysInMonth ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suma nieobecności</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{attendanceData?.stats.totalAbsences ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Procent nieobecności</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground font-bold text-lg">%</div>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">
                    {attendanceData ? `${attendanceData.stats.overallAbsencePercentage.toFixed(1)}%` : <Loader2 className="h-6 w-6 animate-spin" />}
                  </div>
              </CardContent>
          </Card>
      </div>

      {attendanceData && attendanceData.stats.departmentAbsenceData.length > 0 && (
        <Card className="mb-6">
           <Accordion type="single" collapsible>
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
                    {attendanceData.stats.departmentAbsenceData.map((dept) => dept && (
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-2xl capitalize">
                    {format(currentDate, 'LLLL yyyy', { locale: pl })}
                </CardTitle>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isDataLoading}>
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
                    <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isDataLoading}>
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
                    placeholder="Wybierz dział"
                  />
              </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto relative">
             {isDataLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
            {!isDataLoading && attendanceData ? (
                filteredEmployees.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredEmployees.map(employee => (
                           <EmployeeAttendanceCard 
                                key={employee.id}
                                employee={employee}
                                attendanceData={attendanceData}
                                onToggleAbsence={toggleAbsence}
                           />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
                        <UserX className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">Brak pracowników</h3>
                        <p className="text-sm">Nie znaleziono pracowników pasujących do wybranych kryteriów filtrowania.</p>
                    </div>
                )
            ) : !isDataLoading && (
                <div className="text-center text-muted-foreground py-10">Brak danych o obecności.</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
