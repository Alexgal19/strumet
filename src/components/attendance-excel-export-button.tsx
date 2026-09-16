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
    /** Filtr dat z aplikacji — gdy ustawiony, eksport obejmuje tylko wybrane dni i tylko nieobecnych */
    selectedDates?: Date[];
}

export function AttendanceExcelExportButton({
    currentDate,
    employees,
    absences,
    workingDays,
    selectedDates,
}: AttendanceExcelExportButtonProps) {

    const handleExport = async () => {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const monthName = format(currentDate, 'LLLL yyyy', { locale: pl });
        const holidays = getPolishHolidays(currentDate.getFullYear());

        // Zakres eksportu: wybrane dni (filtr z aplikacji) albo cały miesiąc
        const hasDateFilter = !!selectedDates && selectedDates.length > 0;
        const scopeDates = hasDateFilter
            ? [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
            : daysInMonth;
        const scopeKeys = new Set(scopeDates.map(d => format(d, 'yyyy-MM-dd')));

        // Nieobecności w zakresie
        const monthAbsences = absences.filter(a => scopeKeys.has(a.date));

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

        // Przy aktywnym filtrze dat — tylko pracownicy z nieobecnością w wybranych dniach
        const exportEmployees = hasDateFilter
            ? sortedEmployees.filter(emp => absenceMap.has(emp.id))
            : sortedEmployees;

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
        const summaryData = exportEmployees.map(emp => {
            const empAbsences = absenceMap.get(emp.id);
            const absenceCount = empAbsences ? empAbsences.size : 0;

            if (hasDateFilter) {
                return {
                    'Dział': departmentOf(emp),
                    'Imię i nazwisko': emp.fullName,
                    'Stanowisko': emp.jobTitle,
                    'Liczba dni': absenceCount,
                    'Daty nieobecności': formatDateList(empAbsences),
                };
            }

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

        // Format percentage column (tylko pełny miesięczny wariant — 6. kolumna, index 5)
        if (!hasDateFilter) {
            const range = XLSX.utils.decode_range(summaryWs['!ref']!);
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                const ref = XLSX.utils.encode_cell({ r: R, c: 5 });
                if (!summaryWs[ref]) continue;
                summaryWs[ref].z = '0.00%';
                summaryWs[ref].t = 'n'; // ensure it's a number
            }
        }

        summaryWs['!cols'] = hasDateFilter
            ? [{ wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 30 }]
            : [{ wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 15 }];
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

        // 3. Attendance Matrix Sheet — pogrupowana po działach;
        // przy filtrze dat kolumny = wybrane dni (dd.MM), bez filtra = dni miesiąca (1..31)
        const matrixHeaders = [
            'Dział',
            'Imię i nazwisko',
            ...scopeDates.map(d => (hasDateFilter ? format(d, 'dd.MM') : getDate(d).toString())),
        ];
        const matrixData = [matrixHeaders];

        exportEmployees.forEach(emp => {
            const row: any[] = [departmentOf(emp), emp.fullName];
            const empAbsences = absenceMap.get(emp.id);

            scopeDates.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isWknd = isWeekend(day);
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
        for (let i = 0; i < scopeDates.length; i++) {
            matrixCols.push({ wch: hasDateFilter ? 8 : 3 }); // Wybrane dni czytelniej opisane
        }
        matrixWs['!cols'] = matrixCols;

        XLSX.utils.book_append_sheet(workbook, matrixWs, hasDateFilter ? 'Kalendarz (wybrane dni)' : 'Kalendarz Obecności');

        // Save file
        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        const filterSuffix = hasDateFilter ? '_wybrane_dni' : '';
        XLSX.writeFile(workbook, `obecnosc${filterSuffix}_${monthName.replace(/\s+/g, '_')}_${timestamp}.xlsx`);
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={employees.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Eksportuj Raport (Excel)
        </Button>
    );
}
