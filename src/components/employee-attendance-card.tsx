
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Employee, Absence } from '@/lib/types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWeekend, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { UserX } from 'lucide-react';

interface EmployeeAttendanceCardProps {
    employee: Employee;
    absences: Absence[];
    currentDate: Date;
    holidays: Date[];
    onToggleAbsence: (employeeId: string, date: string, isAbsent: boolean) => void;
}

export const EmployeeAttendanceCard: React.FC<EmployeeAttendanceCardProps> = ({
    employee,
    absences,
    currentDate,
    holidays,
    onToggleAbsence,
}) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const employeeAbsences = useMemo(() => {
        return absences.filter(a => a.employeeId === employee.id);
    }, [absences, employee.id]);

    const totalAbsencesInMonth = useMemo(() => {
         return employeeAbsences.filter(a => {
            const absenceDate = new Date(a.date);
            return absenceDate >= monthStart && absenceDate <= monthEnd;
        }).length;
    }, [employeeAbsences, monthStart, monthEnd]);

    const workingDaysInMonth = useMemo(() => {
        return days.filter(day => !isWeekend(day) && !holidays.some(h => isSameDay(h, day))).length;
    }, [days, holidays]);

    const absencePercentage = workingDaysInMonth > 0 ? (totalAbsencesInMonth / workingDaysInMonth) * 100 : 0;
    
    const handleDayClick = (day: Date) => {
        const dateString = format(day, 'yyyy-MM-dd');
        const isCurrentlyAbsent = employeeAbsences.some(a => a.date === dateString);
        onToggleAbsence(employee.id, dateString, isCurrentlyAbsent);
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-base truncate">{employee.fullName}</CardTitle>
                <CardDescription className="text-xs truncate">{employee.jobTitle} - {employee.department}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="grid grid-cols-7 gap-1">
                    {days.map(day => {
                        const dateString = format(day, 'yyyy-MM-dd');
                        const isAbsent = employeeAbsences.some(a => a.date === dateString);
                        const isHoliday = holidays.some(h => isSameDay(h, day));
                        const isWknd = isWeekend(day);
                        
                        return (
                            <Button
                                key={dateString}
                                variant={isAbsent ? 'destructive' : isWknd || isHoliday ? 'ghost' : 'outline'}
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full",
                                    (isWknd || isHoliday) && !isAbsent && "text-muted-foreground",
                                    isAbsent && "text-destructive-foreground"
                                )}
                                onClick={() => handleDayClick(day)}
                            >
                                {format(day, 'd')}
                            </Button>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground justify-between">
                <div className="flex items-center gap-1">
                    <UserX className="h-3 w-3"/>
                    <span>Nieobecności: <strong>{totalAbsencesInMonth}</strong></span>
                </div>
                 <span>Absencja: <strong>{absencePercentage.toFixed(2)}%</strong></span>
            </CardFooter>
        </Card>
    );
};
