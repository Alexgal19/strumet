
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, User, Search, ChevronRight } from 'lucide-react';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { Employee } from '@/lib/types';
import { AttendanceData } from '@/lib/attendance-actions';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

interface MobileAttendanceViewProps {
    attendanceData: AttendanceData | null;
    filteredEmployees: Employee[];
    isDataLoading: boolean;
    currentDate: Date;
    departmentOptions: OptionType[];
    selectedDepartments: string[];
    setSelectedDepartments: (value: string[]) => void;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    toggleAbsence: (employeeId: string, date: Date) => void;
}

export function MobileAttendanceView({
    attendanceData,
    filteredEmployees,
    isDataLoading,
    currentDate,
    departmentOptions,
    selectedDepartments,
    setSelectedDepartments,
    searchTerm,
    setSearchTerm,
    handlePrevMonth,
    handleNextMonth,
    toggleAbsence,
}: MobileAttendanceViewProps) {
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    if (selectedEmployee && attendanceData) {
        const empStats = attendanceData.employeeStats[selectedEmployee.id];
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(null)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h3 className="font-bold text-lg">{selectedEmployee.fullName}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                            {format(currentDate, 'LLLL yyyy', { locale: pl })}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground mb-2">
                   {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(day => <div key={day}>{day}</div>)}
                </div>
                 <div className="grid grid-cols-7 gap-2 flex-grow">
                    {attendanceData.calendarDays.map(day => {
                        const isAbsent = empStats.absenceDates.includes(day.dateString);
                        return (
                            <div
                                key={day.dateString}
                                onClick={() => toggleAbsence(selectedEmployee.id, parseISO(day.dateString))}
                                className={cn(
                                    "flex items-center justify-center aspect-square rounded-full text-sm font-medium transition-colors",
                                    day.isHoliday && 'bg-yellow-500/20 text-yellow-700 cursor-not-allowed',
                                    day.isWeekend && !day.isHoliday && 'bg-red-500/10 text-red-600 cursor-not-allowed',
                                    day.isToday && 'ring-2 ring-primary',
                                    !(day.isWeekend || day.isHoliday) && 'cursor-pointer hover:bg-muted',
                                    isAbsent && 'bg-destructive/80 text-destructive-foreground'
                                )}
                            >
                               {day.dayOfMonth}
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} disabled={isDataLoading}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold text-lg text-center capitalize">
                {format(currentDate, 'LLLL yyyy', { locale: pl })}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={isDataLoading}>
                <ArrowLeft className="h-4 w-4 transform rotate-180" />
            </Button>
        </div>
        
        <div className="space-y-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Szukaj pracownika..." 
              className="pl-9" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <MultiSelect
            options={departmentOptions}
            selected={selectedDepartments}
            onChange={setSelectedDepartments}
            placeholder="Wybierz dział"
          />
        </div>
        
        {isDataLoading && (
             <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )}

        {!isDataLoading && attendanceData && (
             <div className="flex-grow overflow-y-auto -mr-4 pr-4 space-y-3">
                 {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(employee => {
                        const empStats = attendanceData.employeeStats[employee.id];
                        if (!empStats) return null;
                        return (
                             <Card key={employee.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEmployee(employee)}>
                                <CardHeader className="flex flex-row items-center justify-between p-4">
                                   <div className="flex-grow">
                                     <CardTitle className="text-base">{employee.fullName}</CardTitle>
                                     <CardDescription>{employee.jobTitle}</CardDescription>
                                   </div>
                                   <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                     <div className="text-sm">
                                        <span className="font-semibold">{empStats.absencesCount}</span> dni nieobecności {' '}
                                        (<span className="text-muted-foreground">{empStats.absencePercentage.toFixed(1)}%</span>)
                                    </div>
                                    <Progress value={empStats.absencePercentage} className="h-2 mt-2" />
                                </CardContent>
                             </Card>
                        )
                    })
                 ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        Brak pracowników pasujących do kryteriów.
                    </div>
                 )}
            </div>
        )}
      </div>
    );
}

