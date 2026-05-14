'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Loader2 } from 'lucide-react';
import { isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseMaybeDate } from '@/lib/date';
import { EmployeeCard, ContractCard, FingerprintCard } from '@/components/planning-cards';

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
            />

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
