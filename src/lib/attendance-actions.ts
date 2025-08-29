
'use server';

import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { 
    eachDayOfInterval, 
    format, 
    isWeekend, 
    isSameDay,
    isToday,
    startOfDay,
    parse,
    getDay
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { getPolishHolidays } from '@/lib/holidays';
import type { Employee, Absence, ConfigItem } from '@/lib/types';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

type CalendarDay = {
    isPlaceholder?: boolean;
    dateString?: string;
    dayOfMonth?: string;
    dayOfWeek?: string;
    isWeekend?: boolean;
    isHoliday?: boolean;
    isToday?: boolean;
};


export interface AttendanceData {
    employees: Employee[];
    absences: Absence[];
    calendarDays: CalendarDay[];
    stats: {
        totalActiveEmployees: number;
        workingDaysInMonth: number;
        totalAbsences: number;
        overallAbsencePercentage: number;
        departmentAbsenceData: {
            name: string;
            absences: number;
            percentage: number;
            fill: string;
        }[];
    };
    employeeStats: Record<string, {
        absencesCount: number;
        absencePercentage: number;
        absenceDates: string[];
    }>;
}

export async function getAttendanceDataForMonth(
  startDate: Date,
  endDate: Date
): Promise<AttendanceData> {
  // 1. Fetch all necessary data in parallel
  const [employeesSnapshot, absencesSnapshot, configSnapshot] = await Promise.all([
    get(ref(db, 'employees')),
    get(ref(db, 'absences')),
    get(ref(db, 'config')),
  ]);

  const allEmployees = objectToArray<Employee>(employeesSnapshot.val());
  const allAbsences = objectToArray<Absence>(absencesSnapshot.val());
  const config = {
    departments: objectToArray<ConfigItem>(configSnapshot.val()?.departments),
  };

  const activeEmployees = allEmployees.filter(e => e.status === 'aktywny');
  const year = startDate.getFullYear();
  const holidays = getPolishHolidays(year);
  const isHoliday = (date: Date) => holidays.some(h => isSameDay(h, date));

  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  // 2. Pre-calculate calendar days info
  const calendarDaysWithData: CalendarDay[] = daysInMonth.map(day => ({
    dateString: format(day, 'yyyy-MM-dd'),
    dayOfMonth: format(day, 'd'),
    dayOfWeek: format(day, 'E', { locale: pl }).slice(0, 2),
    isWeekend: isWeekend(day),
    isHoliday: isHoliday(day),
    isToday: isToday(day),
  }));

  const workingDaysInMonth = calendarDaysWithData.filter(d => !d.isWeekend && !d.isHoliday).length;
  
  // Add placeholders for the start of the month
  const firstDayOfWeek = getDay(startDate); // Sunday is 0, Monday is 1
  const dayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Adjust to Monday-first week
  
  const placeholders: CalendarDay[] = Array.from({ length: dayOffset }, () => ({ isPlaceholder: true }));
  const calendarDays = [...placeholders, ...calendarDaysWithData];


  // 3. Filter absences for the current month and create a lookup map
  const monthAbsences = allAbsences.filter(absence => {
    try {
      const absenceDate = parse(absence.date, 'yyyy-MM-dd', new Date());
      return absenceDate >= startDate && absenceDate <= endDate;
    } catch {
      return false;
    }
  });

  const absencesByEmployeeMap = new Map<string, string[]>();
  monthAbsences.forEach(absence => {
    if (!absencesByEmployeeMap.has(absence.employeeId)) {
      absencesByEmployeeMap.set(absence.employeeId, []);
    }
    absencesByEmployeeMap.get(absence.employeeId)!.push(absence.date);
  });

  // 4. Calculate stats for each employee
  const employeeStats: AttendanceData['employeeStats'] = {};
  activeEmployees.forEach(emp => {
    const empAbsenceDates = absencesByEmployeeMap.get(emp.id) || [];
    const absencesCount = empAbsenceDates.length;
    employeeStats[emp.id] = {
      absencesCount,
      absencePercentage: workingDaysInMonth > 0 ? (absencesCount / workingDaysInMonth) * 100 : 0,
      absenceDates: empAbsenceDates,
    };
  });
  
  // 5. Calculate overall and department stats
  const totalAbsences = monthAbsences.length;
  const overallAbsencePercentage = workingDaysInMonth > 0 && activeEmployees.length > 0 
    ? (totalAbsences / (workingDaysInMonth * activeEmployees.length)) * 100 
    : 0;
  
  const departmentAbsenceData = config.departments.map((dept, index) => {
    const deptEmployees = activeEmployees.filter(e => e.department === dept.name);
    if (deptEmployees.length === 0) return null;

    const deptAbsences = deptEmployees.reduce((sum, emp) => sum + (employeeStats[emp.id]?.absencesCount || 0), 0);
    const totalPossibleDays = deptEmployees.length * workingDaysInMonth;
    const percentage = totalPossibleDays > 0 ? (deptAbsences / totalPossibleDays) * 100 : 0;
    
    return {
      name: dept.name,
      absences: deptAbsences,
      percentage: percentage,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    };
  }).filter((d): d is NonNullable<typeof d> => d !== null).sort((a, b) => b.percentage - a.percentage);

  // 6. Return the final structured data
  return {
    employees: activeEmployees,
    absences: monthAbsences,
    calendarDays,
    stats: {
      totalActiveEmployees: activeEmployees.length,
      workingDaysInMonth,
      totalAbsences,
      overallAbsencePercentage,
      departmentAbsenceData,
    },
    employeeStats,
  };
}

    
