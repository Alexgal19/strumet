'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Loader2, Download } from 'lucide-react';
import { isWithinInterval, startOfDay, endOfDay, addDays, format } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseMaybeDate } from '@/lib/date';
import { EmployeeCard, ContractCard, FingerprintCard } from '@/components/planning-cards';
import { Button } from '@/components/ui/button';

export default function PlanningPage() {
  const { isLoading: isContextLoading, fingerprintAppointments } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  const isLoading = isContextLoading || isEmployeesLoading;

  const plannedTerminations = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.plannedTerminationDate) return false;
        const terminationDate = parseMaybeDate(e.plannedTerminationDate);
        return terminationDate ? startOfDay(terminationDate) >= today : false;
      })
      .sort((a, b) => new Date(a.plannedTerminationDate!).getTime() - new Date(b.plannedTerminationDate!).getTime());
  }, [activeEmployees]);

  const onVacation = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.vacationStartDate || !e.vacationEndDate) return false;
        const start = parseMaybeDate(e.vacationStartDate);
        const end = parseMaybeDate(e.vacationEndDate);
        if (!start || !end) return false;
        return isWithinInterval(today, { start: startOfDay(start), end: endOfDay(end) });
      })
      .sort((a, b) => new Date(a.vacationEndDate!).getTime() - new Date(b.vacationEndDate!).getTime());
  }, [activeEmployees]);

  const upcomingVacations = useMemo(() => {
    const today = startOfDay(new Date());
    return activeEmployees
      .filter(e => {
        if (!e.vacationStartDate) return false;
        const startDate = parseMaybeDate(e.vacationStartDate);
        if (!startDate) return false;
        return startOfDay(startDate) >= today && !onVacation.some(onVac => onVac.id === e.id);
      })
      .sort((a, b) => new Date(a.vacationStartDate!).getTime() - new Date(b.vacationStartDate!).getTime());
  }, [activeEmployees, onVacation]);

  const expiringContracts = useMemo(() => {
    const today = startOfDay(new Date());
    const threshold = addDays(today, 30);
    return activeEmployees
      .filter(e => {
        if (!e.contractEndDate) return false;
        const endDate = parseMaybeDate(e.contractEndDate);
        return endDate ? startOfDay(endDate) >= today && startOfDay(endDate) <= threshold : false;
      })
      .sort((a, b) => new Date(a.contractEndDate!).getTime() - new Date(b.contractEndDate!).getTime());
  }, [activeEmployees]);

  const upcomingAppointments = useMemo(() => {
    const today = startOfDay(new Date());
    const threshold = addDays(today, 30);
    return fingerprintAppointments
      .filter(a => {
        const apptDate = parseMaybeDate(a.appointmentDate);
        return apptDate ? startOfDay(apptDate) >= today && startOfDay(apptDate) <= threshold : false;
      })
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }, [fingerprintAppointments]);

  const handleExport = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');
      const wb = new ExcelJS.Workbook();

      const addSheetWithTable = (sheetName: string, data: any[], columns: string[]) => {
        const ws = wb.addWorksheet(sheetName);
        if (data.length === 0) {
          ws.addRow(['Brak danych']);
          return;
        }

        const tableColumns = columns.map(c => ({ name: c, filterButton: true }));
        const rows = data.map(item => columns.map(c => item[c] ?? ''));

        ws.addTable({
          name: sheetName.replace(/[^a-zA-Z0-9]/g, '_'),
          ref: 'A1',
          headerRow: true,
          totalsRow: false,
          style: {
            theme: 'TableStyleMedium2',
            showRowStripes: true,
          },
          columns: tableColumns,
          rows: rows,
        });

        ws.columns.forEach((column, i) => {
          let maxLen = columns[i].length;
          rows.forEach(row => {
            const val = row[i];
            if (val) {
              const len = val.toString().length;
              if (len > maxLen) maxLen = len;
            }
          });
          column.width = Math.min(Math.max(12, maxLen + 2), 50);
        });

        // Wyróżnienie wierszy ze zwolnieniami
        ws.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          const typeColIndex = columns.indexOf('Typ Zdarzenia') + 1;
          if (typeColIndex > 0) {
            const cellValue = row.getCell(typeColIndex).value;
            if (cellValue === 'Planowane zwolnienie') {
              row.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFE5E5' } // Bardzo jasny czerwony (pastlowy)
                };
                cell.font = {
                  color: { argb: 'FFD32F2F' }, // Czerwony kolor tekstu
                  bold: true
                };
              });
            }
          }
        });
      };

      const formatEmployeeData = (e: any) => ({
        'Nazwisko i imię': e.fullName || '',
        Stanowisko: e.jobTitle,
        Dział: e.department,
        Obywatelstwo: e.nationality,
      });

      const combinedData: any[] = [];

      plannedTerminations.forEach(e => {
        combinedData.push({
          ...formatEmployeeData(e),
          'Typ Zdarzenia': 'Planowane zwolnienie',
          'Data od': e.plannedTerminationDate ? format(new Date(e.plannedTerminationDate), 'dd.MM.yyyy') : '',
          'Data do': '-',
        });
      });

      onVacation.forEach(e => {
        combinedData.push({
          ...formatEmployeeData(e),
          'Typ Zdarzenia': 'Urlop (Trwający)',
          'Data od': e.vacationStartDate ? format(new Date(e.vacationStartDate), 'dd.MM.yyyy') : '',
          'Data do': e.vacationEndDate ? format(new Date(e.vacationEndDate), 'dd.MM.yyyy') : '',
        });
      });

      upcomingVacations.forEach(e => {
        combinedData.push({
          ...formatEmployeeData(e),
          'Typ Zdarzenia': 'Urlop (Nadchodzący)',
          'Data od': e.vacationStartDate ? format(new Date(e.vacationStartDate), 'dd.MM.yyyy') : '',
          'Data do': e.vacationEndDate ? format(new Date(e.vacationEndDate), 'dd.MM.yyyy') : '',
        });
      });

      addSheetWithTable('Zestawienie', combinedData, [
        'Nazwisko i imię', 'Stanowisko', 'Dział', 'Obywatelstwo', 'Typ Zdarzenia', 'Data od', 'Data do'
      ]);

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Planowanie_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Błąd podczas eksportu:', error);
      alert('Nie udało się wyeksportować danych do pliku Excel.');
    }
  };


  return (
    <div className="h-full flex flex-col">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        ) : (
        <>
            <PageHeader
                title="Planowanie"
                description="Zarządzaj nadchodzącymi wygającymi umowami, odciskami palców, zwolnieniami i urlopami pracowników."
            >
                <Button onClick={handleExport} variant="outline" className="gap-2 bg-white/50 dark:bg-black/50 border-primary/20 hover:bg-primary/5 text-primary">
                    <Download className="h-4 w-4" />
                    Pobierz Excel
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 flex-grow">

                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Wygające umowy ({expiringContracts.length})</h2>
                    <div className="flex-grow rounded-lg border bg-card/50 p-4 min-h-[200px]">
                        {expiringContracts.length > 0 ? (
                            <ScrollArea className="h-full">
                                <div className="space-y-3 pr-4">
                                {expiringContracts.map(employee => (
                                    <ContractCard key={employee.id} employee={employee} />
                                ))}
                                </div>
                            </ScrollArea>
                            ) : (
                            <p className="text-center text-sm text-muted-foreground py-6">Brak umów wygających w ciągu 30 dni.</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Odciski palców ({upcomingAppointments.length})</h2>
                    <div className="flex-grow rounded-lg border bg-card/50 p-4 min-h-[200px]">
                        {upcomingAppointments.length > 0 ? (
                            <ScrollArea className="h-full">
                                <div className="space-y-3 pr-4">
                                {upcomingAppointments.map(appointment => (
                                    <FingerprintCard key={appointment.id} appointment={appointment} />
                                ))}
                                </div>
                            </ScrollArea>
                            ) : (
                            <p className="text-center text-sm text-muted-foreground py-6">Brak zaplanowanych wizyt w ciągu 30 dni.</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Planowane zwolnienia ({plannedTerminations.length})</h2>
                    <div className="flex-grow rounded-lg border bg-card/50 p-4 min-h-[200px]">
                        {plannedTerminations.length > 0 ? (
                            <ScrollArea className="h-full">
                                <div className="space-y-3 pr-4">
                                {plannedTerminations.map(employee => (
                                    <EmployeeCard key={employee.id} employee={employee} type="termination" />
                                ))}
                                </div>
                            </ScrollArea>
                            ) : (
                            <p className="text-center text-sm text-muted-foreground py-6">Brak zaplanowanych zwolnień.</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Pracownicy na urlopie ({onVacation.length})</h2>
                    <div className="flex-grow rounded-lg border bg-card/50 p-4 min-h-[200px]">
                        {onVacation.length > 0 ? (
                            <ScrollArea className="h-full">
                                <div className="space-y-3 pr-4">
                                {onVacation.map(employee => (
                                    <EmployeeCard key={employee.id} employee={employee} type="vacation" />
                                ))}
                                </div>
                            </ScrollArea>
                            ) : (
                            <p className="text-center text-sm text-muted-foreground py-6">Obecnie nikt nie przebywa na urlopie.</p>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-bold tracking-tight">Nadchodzące urlopy ({upcomingVacations.length})</h2>
                    <div className="flex-grow rounded-lg border bg-card/50 p-4 min-h-[200px]">
                        {upcomingVacations.length > 0 ? (
                            <ScrollArea className="h-full">
                                <div className="space-y-3 pr-4">
                                {upcomingVacations.map(employee => (
                                    <EmployeeCard key={employee.id} employee={employee} type="vacation-planned" />
                                ))}
                                </div>
                            </ScrollArea>
                            ) : (
                            <p className="text-center text-sm text-muted-foreground py-6">Brak zaplanowanych urlopów.</p>
                        )}
                    </div>
                </div>

            </div>
        </>
        )}
    </div>
  );
}
