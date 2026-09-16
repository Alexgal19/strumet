'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, getDate, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Employee, Absence } from '@/lib/types';
import { getPolishHolidays } from '@/lib/holidays';

interface AttendanceExcelExportButtonProps {
    currentDate: Date;
    employees: Employee[];
    absences: Absence[];
    workingDays: number;
}

export function AttendanceExcelExportButton({
    currentDate,
    employees,
    absences,
    workingDays,
}: AttendanceExcelExportButtonProps) {

    const handleExport = async () => {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const monthName = format(currentDate, 'LLLL yyyy', { locale: pl });
        const holidays = getPolishHolidays(currentDate.getFullYear());

        // Filter absences for this month
        const monthAbsences = absences.filter(a => {
            const d = new Date(a.date);
            return d >= monthStart && d <= monthEnd;
        });

        // Map for quick lookup: employeeId -> Set of dates (YYYY-MM-DD)
        const absenceMap = new Map<string, Set<string>>();
        monthAbsences.forEach(a => {
            if (!absenceMap.has(a.employeeId)) {
                absenceMap.set(a.employeeId, new Set());
            }
            absenceMap.get(a.employeeId)?.add(a.date);
        });

        // Grupowanie po działach: sortowanie (dział, nazwisko)
        const departmentOf = (emp: Employee) => emp.department || 'Bez działu';
        const sortedEmployees = [...employees].sort((a, b) => {
            const depCompare = departmentOf(a).localeCompare(departmentOf(b), 'pl');
            if (depCompare !== 0) return depCompare;
            return a.fullName.localeCompare(b.fullName, 'pl');
        });

        // Daty nieobecności pracownika — chronologicznie, format dd.MM
        const formatDateList = (dates: Set<string> | undefined): string => {
            if (!dates || dates.size === 0) return '';
            return [...dates]
                .sort()
                .map(d => {
                    try {
                        return format(parseISO(d), 'dd.MM');
                    } catch {
                        return d;
                    }
                })
                .join(', ');
        };

        // 1. Employee Summary Sheet — pogrupowana po działach, z datami nieobecności
        const summaryData = sortedEmployees.map(emp => {
            const empAbsences = absenceMap.get(emp.id);
            const absenceCount = empAbsences ? empAbsences.size : 0;
            const absencePercentage = workingDays > 0 ? (absenceCount / workingDays) : 0;

            return {
                'Dział': departmentOf(emp),
                'Imię i nazwisko': emp.fullName,
                'Stanowisko': emp.jobTitle,
                'Liczba nieobecności': absenceCount,
                'Dni nieobecności': formatDateList(empAbsences),
                '% Nieobecności': absencePercentage
            };
        });

        const summaryWs = XLSX.utils.json_to_sheet(summaryData);

        // Format percentage column (6th column, index 5)
        const range = XLSX.utils.decode_range(summaryWs['!ref']!);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const ref = XLSX.utils.encode_cell({ r: R, c: 5 });
            if (!summaryWs[ref]) continue;
            summaryWs[ref].z = '0.00%';
            summaryWs[ref].t = 'n'; // ensure it's a number
        }

        summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, summaryWs, 'Podsumowanie');

        // 2. Absence Dates Sheet — jeden wiersz na nieobecność, pogrupowany po działach
        const listHeaders = ['Dział', 'Pracownik', 'Data', 'Dzień tygodnia'];
        const listRows: any[][] = [listHeaders];

        const employeeById = new Map(employees.map(e => [e.id, e]));
        monthAbsences
            .slice()
            .sort((a, b) => {
                const depA = departmentOf(employeeById.get(a.employeeId) ?? ({ department: '' } as Employee));
                const depB = departmentOf(employeeById.get(b.employeeId) ?? ({ department: '' } as Employee));
                if (depA !== depB) return depA.localeCompare(depB, 'pl');
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (employeeById.get(a.employeeId)?.fullName ?? '').localeCompare(employeeById.get(b.employeeId)?.fullName ?? '', 'pl');
            })
            .forEach(a => {
                const emp = employeeById.get(a.employeeId);
                const dateObj = parseISO(a.date);
                listRows.push([
                    departmentOf(emp ?? ({ department: '' } as Employee)),
                    emp?.fullName ?? a.employeeId,
                    format(dateObj, 'dd.MM.yyyy'),
                    format(dateObj, 'EEEE', { locale: pl }),
                ]);
            });

        const listWs = XLSX.utils.aoa_to_sheet(listRows);
        listWs['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 14 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(workbook, listWs, 'Nieobecności (daty)');

        // 3. Attendance Matrix Sheet — również pogrupowana po działach
        // Headers: Employee Info + Days 1..31
        const matrixHeaders = ['Dział', 'Imię i nazwisko', ...daysInMonth.map(d => getDate(d).toString())];
        const matrixData = [matrixHeaders];

        sortedEmployees.forEach(emp => {
            const row: any[] = [departmentOf(emp), emp.fullName];
            const empAbsences = absenceMap.get(emp.id);

            daysInMonth.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isWknd = isWeekend(day);
                const isHoliday = holidays.some(h => h.getTime() === day.getTime()); // Simple comparison might fail due to time, use string or simpler comp
                // Ideally compare using date strings or set hours to 0
                const isHolidayStr = holidays.some(h => format(h, 'yyyy-MM-dd') === dateStr);
                
                if (isWknd || isHolidayStr) {
                    row.push('-'); // Weekend/Holiday placeholder
                } else if (empAbsences?.has(dateStr)) {
                    row.push('X'); // Absent
                } else {
                    row.push(''); // Present
                }
            });
            matrixData.push(row);
        });

        const matrixWs = XLSX.utils.aoa_to_sheet(matrixData);
        
        // Basic styling for matrix columns
        const matrixCols = [{ wch: 20 }, { wch: 30 }];
        for (let i = 0; i < daysInMonth.length; i++) {
            matrixCols.push({ wch: 3 }); // Narrow columns for days
        }
        matrixWs['!cols'] = matrixCols;

        XLSX.utils.book_append_sheet(workbook, matrixWs, 'Kalendarz Obecności');

        // Save file
        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        XLSX.writeFile(workbook, `obecnosc_${monthName.replace(/\s+/g, '_')}_${timestamp}.xlsx`);
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={employees.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Eksportuj Raport (Excel)
        </Button>
    );
}
