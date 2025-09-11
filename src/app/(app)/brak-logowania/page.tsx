
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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

import { Loader2, CalendarIcon, ChevronsUpDown, CheckIcon, FilePlus2, Trash2, Briefcase, Building, Printer } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Employee, AbsenceRecord } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AbsenceRecordPrintForm } from '@/components/absence-record-print-form';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function NoLoginPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<Date | undefined>();
  const [hours, setHours] = useState<string>('');
  const [reason, setReason] = useState<'no_card' | 'forgot_to_scan' | ''>('');

  const [isSaving, setIsSaving] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printingRecord, setPrintingRecord] = useState<AbsenceRecord | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);


  const { toast } = useToast();

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const recordsRef = ref(db, 'absenceRecords');

    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      setEmployees(objectToArray(snapshot.val()));
      if (isLoading) setIsLoading(false);
    });

    const unsubscribeRecords = onValue(recordsRef, (snapshot) => {
      setRecords(objectToArray(snapshot.val()));
      if (isLoading) setIsLoading(false);
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeRecords();
    };
  }, [isLoading]);
  
  useEffect(() => {
    if (printingRecord) {
        const timer = setTimeout(() => {
            window.print();
            setPrintingRecord(null);
        }, 100);
      return () => clearTimeout(timer);
    }
  }, [printingRecord]);

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
  }, [records]);

  const selectedEmployee = useMemo(() => {
    return activeEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, activeEmployees]);

  const handleSaveRecord = async () => {
    if (!selectedEmployee || !incidentDate || !hours || !reason) {
      toast({
        variant: 'destructive',
        title: 'Błąd walidacji',
        description: 'Proszę wypełnić wszystkie pola: pracownik, data, godziny i przyczyna.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const newRecordRef = push(ref(db, 'absenceRecords'));
      const newRecord: Omit<AbsenceRecord, 'id'> = {
        employeeId: selectedEmployee.id,
        employeeFullName: selectedEmployee.fullName,
        incidentDate: incidentDate.toISOString(),
        department: selectedEmployee.department,
        jobTitle: selectedEmployee.jobTitle,
        hours: hours,
        reason: reason as 'no_card' | 'forgot_to_scan',
      };
      await set(newRecordRef, newRecord);
      toast({
        title: 'Sukces',
        description: 'Zapis został pomyślnie dodany.',
      });
      // Reset form
      setSelectedEmployeeId('');
      setIncidentDate(undefined);
      setHours('');
      setReason('');
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        variant: 'destructive',
        title: 'Błąd serwera',
        description: 'Nie udało się zapisać rekordu.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteRecord = async (recordId: string) => {
      try {
          await remove(ref(db, `absenceRecords/${recordId}`));
          toast({
              title: 'Sukces',
              description: 'Zapis został usunięty.',
          });
      } catch (error) {
          console.error('Error deleting record:', error);
          toast({
              variant: 'destructive',
              title: 'Błąd',
              description: 'Nie udało się usunąć zapisu.',
          });
      } finally {
        setDeletingId(null);
      }
  };
  
  const handlePrint = (record: AbsenceRecord) => {
    setPrintingRecord(record);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="flex h-full flex-col print:hidden">
      <PageHeader
        title="Brak logowania"
        description="Generuj raporty dotyczące braku logowania przez pracowników."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Dodaj nowy zapis</CardTitle>
              <CardDescription>Wybierz pracownika i datę, aby dodać nowy incydent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pracownik</Label>
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

              {selectedEmployee && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Building className="mr-2 h-4 w-4" />
                    <span>{selectedEmployee.department}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>{selectedEmployee.jobTitle}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Data incydentu</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !incidentDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {incidentDate ? format(incidentDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={incidentDate}
                            onSelect={setIncidentDate}
                            locale={pl}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hours">Liczba godzin</Label>
                <Input 
                  id="hours"
                  type="text"
                  placeholder="np. 8 lub 08:00-16:00"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>

               <div className="space-y-3">
                    <Label>Przyczyna</Label>
                    <RadioGroup value={reason} onValueChange={(value) => setReason(value as any)} className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no_card" id="r1" />
                            <Label htmlFor="r1">Nieodbicie dyskietki spowodowane było jej brakiem</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="forgot_to_scan" id="r2" />
                            <Label htmlFor="r2">Nieodbicie dyskietki na wejściu/wyjściu wynikło z zapomnienia</Label>
                        </div>
                    </RadioGroup>
                </div>

              <Button onClick={handleSaveRecord} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                Zapisz
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Zarejestrowane incydenty</CardTitle>
              <CardDescription>Lista zarejestrowanych przypadków braku logowania.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pracownik</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Godziny</TableHead>
                      <TableHead>Przyczyna</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRecords.length > 0 ? (
                      sortedRecords.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-medium">{rec.employeeFullName}</TableCell>
                          <TableCell>{format(parseISO(rec.incidentDate), "dd.MM.yyyy", { locale: pl })}</TableCell>
                          <TableCell>{rec.hours}</TableCell>
                           <TableCell>{rec.reason === 'no_card' ? 'Brak karty' : 'Zapomnienie'}</TableCell>
                          <TableCell className="text-right space-x-2">
                             <Button variant="ghost" size="icon" onClick={() => handlePrint(rec)}>
                               <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingId(rec.id)}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Brak zarejestrowanych incydentów.
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
                        Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie tego zapisu.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingId(null)}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deletingId && handleDeleteRecord(deletingId)}>
                        Usuń
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
       </AlertDialog>
    </div>
     <div className="hidden print:block">
        {printingRecord && (
             <AbsenceRecordPrintForm 
                ref={printComponentRef}
                record={printingRecord}
            />
        )}
      </div>
    </>
  );
}

    

    