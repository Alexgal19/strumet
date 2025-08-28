
'use client';

import React, { useState, useMemo, useEffect, useCallback, startTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Loader2, ArrowLeft, ArrowRight, User, TrendingDown, CalendarDays, Building, Search } from 'lucide-react';
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
  endOfMonth
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { ref, set, remove, push, onValue } from "firebase/database";
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { getAttendanceDataForMonth, AttendanceData } from '@/lib/attendance-actions';
import { cn } from '@/lib/utils';
import { Employee, AllConfig, ConfigItem } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAttendanceView } from '@/components/mobile-attendance-view';


const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function AttendancePage() {
  const isMobile = useIsMobile();
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

    const dayInfo = attendanceData.calendarDays.find(d => d.dateString === format(date, 'yyyy-MM-dd'));
    if (dayInfo?.isWeekend || dayInfo?.isHoliday) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie można oznaczyć nieobecności w dzień wolny od pracy.',
      });
      return;
    }
    
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

  const gridTemplateColumns = `minmax(200px, 1.5fr) repeat(${attendanceData?.calendarDays.length || 0}, minmax(40px, 1fr))`;

  const renderDesktopView = () => (
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
                    <div className="w-full sm:w-[220px]">
                      <MultiSelect
                        options={departmentOptions}
                        selected={selectedDepartments}
                        onChange={setSelectedDepartments}
                        placeholder="Wybierz dział"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isDataLoading}>
                          <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isDataLoading}>
                          <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto relative">
            {isDataLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Szukaj po nazwisku..." 
                className="pl-9" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            {attendanceData ? (
                <div className="grid gap-px bg-border -ml-6 -mr-6" style={{ gridTemplateColumns }}>
                    {/* Header Row */}
                    <div className="sticky top-0 z-10 bg-muted/50 p-2 text-sm font-semibold flex items-center justify-start">Pracownik</div>
                    {attendanceData.calendarDays.map(day => (
                        <div 
                            key={day.dateString}
                            className={cn(
                                "sticky top-0 z-10 bg-muted/50 p-2 text-center text-sm font-semibold flex flex-col items-center justify-center",
                                day.isHoliday && 'bg-yellow-500/20 text-yellow-700',
                                day.isWeekend && !day.isHoliday && 'bg-red-500/10 text-red-600',
                                day.isToday && 'bg-primary/20 text-primary-foreground'
                            )}
                        >
                          <span className="capitalize">{day.dayOfWeek}</span>
                          <span className="font-bold">{day.dayOfMonth}</span>
                        </div>
                    ))}
                    
                    {/* Employee Rows */}
                    {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(employee => {
                            const empStats = attendanceData.employeeStats[employee.id];
                            if (!empStats) return null;

                            return (
                                <React.Fragment key={employee.id}>
                                    <div className="grid grid-cols-[1fr_auto] items-center bg-card p-2 border-b border-t">
                                      <div className="flex-grow overflow-hidden pr-2">
                                          <p className="font-medium truncate text-sm">{employee.fullName}</p>
                                          <p className="text-xs text-muted-foreground truncate">{employee.jobTitle}</p>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-xs">{empStats.absencesCount}d</div>
                                        <div className="text-muted-foreground text-xs">{empStats.absencePercentage.toFixed(0)}%</div>
                                      </div>
                                    </div>
                                    {attendanceData.calendarDays.map(day => {
                                        const isAbsent = empStats.absenceDates.includes(day.dateString);
                                        
                                        return (
                                            <div
                                                key={`${employee.id}-${day.dateString}`}
                                                onClick={() => toggleAbsence(employee.id, new Date(day.dateString))}
                                                className={cn(
                                                    "min-h-[60px] border-b bg-card flex items-center justify-center transition-colors",
                                                    day.isHoliday && 'bg-yellow-500/20 cursor-not-allowed',
                                                    day.isWeekend && !day.isHoliday && 'bg-red-500/10 cursor-not-allowed',
                                                    !(day.isWeekend || day.isHoliday) && 'cursor-pointer hover:bg-muted',
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
                        <div className={`col-span-${attendanceData.calendarDays.length + 1} text-center p-8 text-muted-foreground`}>
                            Brak pracowników pasujących do kryteriów.
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">Brak danych o obecności.</div>
            )}
        </CardContent>
      </Card>
  );

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

      {isMobile ? (
         <MobileAttendanceView
            attendanceData={attendanceData}
            filteredEmployees={filteredEmployees}
            isDataLoading={isDataLoading}
            currentDate={currentDate}
            departmentOptions={departmentOptions}
            selectedDepartments={selectedDepartments}
            setSelectedDepartments={setSelectedDepartments}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            toggleAbsence={toggleAbsence}
         />
      ) : renderDesktopView()}

    </div>
  );
}
