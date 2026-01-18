import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWeekend, isSameDay } from 'date-fns';
import { Employee } from './types';

export interface CalendarDay {
    dateString: string;
    isHoliday: boolean;
    isWeekend: boolean;
    isToday: boolean;
    dayOfMonth: number;
}

export interface Absence {
    id: string;
    employeeId: string;
    date: string;
}

export interface EmployeeStats {
    absencesCount: number;
    absencePercentage: number;
    absenceDates: string[];
}

export interface DepartmentAbsenceStat {
    name: string;
    absences: number;
    percentage: number;
    fill: string;
}

export interface AttendanceStats {
    totalActiveEmployees: number;
    workingDaysInMonth: number;
    totalAbsences: number;
    overallAbsencePercentage: number;
    departmentAbsenceData: DepartmentAbsenceStat[];
}

export interface AttendanceData {
    employees: Employee[];
    absences: Absence[];
    employeeStats: Record<string, EmployeeStats>;
    calendarDays: CalendarDay[];
    stats: AttendanceStats;
}

export async function getAttendanceDataForMonth(start: Date, end: Date): Promise<AttendanceData> {
    // Mock implementation to satisfy build
    const days = eachDayOfInterval({ start, end });
    const calendarDays: CalendarDay[] = days.map(day => ({
        dateString: format(day, 'yyyy-MM-dd'),
        isHoliday: false,
        isWeekend: isWeekend(day),
        isToday: isSameDay(day, new Date()),
        dayOfMonth: day.getDate()
    }));

    return {
        employees: [],
        absences: [],
        employeeStats: {},
        calendarDays,
        stats: {
            totalActiveEmployees: 0,
            workingDaysInMonth: 0,
            totalAbsences: 0,
            overallAbsencePercentage: 0,
            departmentAbsenceData: []
        }
    };
}
