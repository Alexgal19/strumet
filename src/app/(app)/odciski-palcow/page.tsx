'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Loader2, CalendarIcon, ChevronsUpDown, CheckIcon, UserPlus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { GenericExcelExportButton } from '@/components/generic-excel-export-button';
import { Employee, FingerprintAppointment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDateTime } from '@/lib/date';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';


export default function FingerprintAppointmentsPage() {
  const { isLoading: isAppLoading, fingerprintAppointments, addFingerprintAppointment, deleteFingerprintAppointment } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { toast } = useToast();

  const sortedAppointments = useMemo(() => {
    return [...fingerprintAppointments].sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }, [fingerprintAppointments]);

  const selectedEmployee = useMemo(() => {
    return activeEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, activeEmployees]);

  const handleSaveAppointment = async () => {
    if (!selectedEmployee || !appointmentDate) {
      toast({
        variant: 'destructive',
        title: 'Błąd walidacji',
        description: 'Proszę wybrać pracownika i datę.',
      });
      return;
    }

    setIsSaving(true);
    const newAppointment: Omit<FingerprintAppointment, 'id'> = {
      employeeId: selectedEmployee.id,
      employeeFullName: selectedEmployee.fullName,
      appointmentDate: appointmentDate.toISOString(),
    };
    
    await addFingerprintAppointment(newAppointment);

    setSelectedEmployeeId('');
    setAppointmentDate(undefined);
    setIsSaving(false);
  };
  
  const handleDeleteAppointment = async (appointmentId: string) => {
    await deleteFingerprintAppointment(appointmentId);
    setDeletingId(null);
  };

  const isLoading = isAppLoading || isEmployeesLoading;

  return (
    <div className="flex h-full flex-col">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
      <>
        <PageHeader
          title="Terminy na odciski palców"
          description="Zarządzaj terminami na pobranie odcisków palców."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Dodaj nowy termin</CardTitle>
                <CardDescription className="text-base">Wybierz pracownika i datę, aby dodać nowy termin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-base font-medium">Pracownik</label>
                  <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isComboboxOpen}
                        className="w-full justify-between h-12 text-base"
                      >
                        {selectedEmployee ? selectedEmployee.fullName : "Wybierz pracownika..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Szukaj pracownika..." />
                        <CommandList>
                          <CommandEmpty>Nie znaleziono pracownika.</CommandEmpty>
                          <CommandGroup>
                            {activeEmployees.map((employee) => (
                              <CommandItem
                                key={employee.id}
                                value={employee.fullName}
                                onSelect={() => {
                                  setSelectedEmployeeId(employee.id);
                                  setIsComboboxOpen(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {employee.fullName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-medium">Data wizyty</label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                          variant={"outline"}
                          className={cn(
                              "w-full justify-start text-left font-normal h-12 text-base",
                              !appointmentDate && "text-muted-foreground"
                          )}
                          >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {appointmentDate ? formatDateTime(appointmentDate, "PPP HH:mm") : <span>Wybierz datę i godzinę</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={appointmentDate}
                              onSelect={setAppointmentDate}
                              locale={pl}
                              initialFocus
                          />
                          <div className="p-3 border-t border-border">
                              <label className="text-base font-medium">Godzina</label>
                              <input
                                  type="time"
                                  className="w-full mt-1 p-2 border rounded-md h-12 text-base"
                                  value={appointmentDate ? format(appointmentDate, 'HH:mm') : ''}
                                  onChange={(e) => {
                                      const time = e.target.value;
                                      const [hours, minutes] = time.split(':').map(Number);
                                      setAppointmentDate(prev => {
                                          const newDate = prev ? new Date(prev) : new Date();
                                          newDate.setHours(hours, minutes);
                                          return newDate;
                                      });
                                  }}
                              />
                          </div>
                      </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={handleSaveAppointment} disabled={isSaving} className="w-full h-12 text-base">
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                  Zapisz termin
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                <div>
                <CardTitle className="text-2xl">Zaplanowane terminy</CardTitle>
                <CardDescription className="text-base">Lista nadchodzących wizyt na pobranie odcisków palców.</CardDescription>
                </div>
                {sortedAppointments.length > 0 && (
                    <GenericExcelExportButton
                        data={sortedAppointments}
                        columns={[
                            { key: 'employeeFullName', name: 'Pracownik' },
                            { key: 'appointmentDate', name: 'Data i godzina' },
                        ]}
                        fileName="terminy_odciskow_palcow"
                    />
                )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-base">Pracownik</TableHead>
                        <TableHead className="text-base">Data</TableHead>
                        <TableHead className="text-base">Godzina</TableHead>
                        <TableHead className="text-right text-base">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAppointments.length > 0 ? (
                        sortedAppointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="font-medium text-base">{apt.employeeFullName}</TableCell>
                            <TableCell className="text-base">{formatDate(apt.appointmentDate, "yyyy-MM-dd")}</TableCell>
                            <TableCell className="text-base">{formatDate(apt.appointmentDate, "HH:mm")}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setDeletingId(apt.id)}>
                                <Trash2 className="h-5 w-5 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-base">
                            Brak zaplanowanych terminów.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden flex flex-col gap-4 mt-4">
                    {sortedAppointments.length > 0 ? (
                        sortedAppointments.map((apt) => (
                            <Card key={apt.id} className="bg-card">
                                <CardContent className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-lg">{apt.employeeFullName}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => setDeletingId(apt.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col text-sm text-muted-foreground gap-1">
                                        <span><strong className="text-foreground font-medium">Data:</strong> {formatDate(apt.appointmentDate, "yyyy-MM-dd")}</span>
                                        <span><strong className="text-foreground font-medium">Godzina:</strong> {formatDate(apt.appointmentDate, "HH:mm")}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-4">Brak zaplanowanych terminów.</p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Czy jesteś pewien?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie terminu.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletingId(null)}>Anuluj</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletingId && handleDeleteAppointment(deletingId)}>
                          Usuń
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
        </AlertDialog>
        </>
      )}
    </div>
  );
}
    
