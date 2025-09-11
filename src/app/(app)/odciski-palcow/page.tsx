
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { Employee, FingerprintAppointment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function FingerprintAppointmentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<FingerprintAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const appointmentsRef = ref(db, 'fingerprintAppointments');

    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      setEmployees(objectToArray(snapshot.val()));
      setIsLoading(false);
    });

    const unsubscribeAppointments = onValue(appointmentsRef, (snapshot) => {
      setAppointments(objectToArray(snapshot.val()));
      setIsLoading(false);
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeAppointments();
    };
  }, []);

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }, [appointments]);

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
    try {
      const newAppointmentRef = push(ref(db, 'fingerprintAppointments'));
      const newAppointment: Omit<FingerprintAppointment, 'id'> = {
        employeeId: selectedEmployee.id,
        employeeFullName: selectedEmployee.fullName,
        appointmentDate: appointmentDate.toISOString(),
      };
      await set(newAppointmentRef, newAppointment);
      toast({
        title: 'Sukces',
        description: 'Termin został pomyślnie dodany.',
      });
      setSelectedEmployeeId('');
      setAppointmentDate(undefined);
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Błąd serwera',
        description: 'Nie udało się zapisać terminu.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAppointment = async (appointmentId: string) => {
      try {
          await remove(ref(db, `fingerprintAppointments/${appointmentId}`));
          toast({
              title: 'Sukces',
              description: 'Termin został usunięty.',
          });
      } catch (error) {
          console.error('Error deleting appointment:', error);
          toast({
              variant: 'destructive',
              title: 'Błąd',
              description: 'Nie udało się usunąć terminu.',
          });
      } finally {
        setDeletingId(null);
      }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Terminy na odciski palców"
        description="Zarządzaj terminami na pobranie odcisków palców."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Dodaj nowy termin</CardTitle>
              <CardDescription>Wybierz pracownika i datę, aby dodać nowy termin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pracownik</label>
                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isComboboxOpen}
                      className="w-full justify-between"
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
                <label className="text-sm font-medium">Data wizyty</label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !appointmentDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {appointmentDate ? format(appointmentDate, "PPP HH:mm", { locale: pl }) : <span>Wybierz datę i godzinę</span>}
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
                            <label className="text-sm font-medium">Godzina</label>
                            <input
                                type="time"
                                className="w-full mt-1 p-2 border rounded-md"
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

              <Button onClick={handleSaveAppointment} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Zapisz termin
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Zaplanowane terminy</CardTitle>
              <CardDescription>Lista nadchodzących wizyt na pobranie odcisków palców.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pracownik</TableHead>
                      <TableHead>Data i godzina</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAppointments.length > 0 ? (
                      sortedAppointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">{apt.employeeFullName}</TableCell>
                          <TableCell>{format(parseISO(apt.appointmentDate), "dd.MM.yyyy HH:mm", { locale: pl })}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => setDeletingId(apt.id)}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          Brak zaplanowanych terminów.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
    </div>
  );
}
