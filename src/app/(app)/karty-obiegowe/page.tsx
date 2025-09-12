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
import { Loader2, ChevronsUpDown, CheckIcon, Printer, History } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Employee, CirculationCard } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CirculationCardPrintForm } from '@/components/circulation-card-print-form';
import { ScrollArea } from '@/components/ui/scroll-area';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function CirculationCardsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [circulationCards, setCirculationCards] = useState<CirculationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const [printingCard, setPrintingCard] = useState<CirculationCard | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const cardsRef = ref(db, 'circulationCards');

    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      setEmployees(objectToArray(snapshot.val()));
      if (isLoading) setIsLoading(false);
    });

    const unsubscribeCards = onValue(cardsRef, (snapshot) => {
      setCirculationCards(objectToArray(snapshot.val()));
      if (isLoading) setIsLoading(false);
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeCards();
    };
  }, [isLoading]);
  
  useEffect(() => {
    if (printingCard) {
        document.body.classList.add('printing');
        const timer = setTimeout(() => {
            window.print();
            setPrintingCard(null);
            document.body.classList.remove('printing');
        }, 100);
      return () => {
          clearTimeout(timer);
          document.body.classList.remove('printing');
      };
    }
  }, [printingCard]);

  const terminatedEmployees = useMemo(() => employees.filter(e => e.status === 'zwolniony'), [employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, employees]);

  const employeeCardHistory = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return circulationCards
        .filter(card => card.employeeId === selectedEmployeeId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [circulationCards, selectedEmployeeId]);

  const handlePrint = async () => {
    if (!selectedEmployee) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Proszę wybrać pracownika.',
      });
      return;
    }

    try {
      const newCardRef = push(ref(db, 'circulationCards'));
      const newCard: Omit<CirculationCard, 'id'> = {
        employeeId: selectedEmployee.id,
        employeeFullName: selectedEmployee.fullName,
        date: new Date().toISOString(),
      };
      await set(newCardRef, newCard);
      
      const cardToPrint = { ...newCard, id: newCardRef.key! };
      setPrintingCard(cardToPrint);

      toast({
        title: 'Sukces',
        description: 'Karta obiegowa została wygenerowana i dodana do historii.',
      });
    } catch (error) {
      console.error('Error saving circulation card:', error);
      toast({
        variant: 'destructive',
        title: 'Błąd serwera',
        description: 'Nie udało się zapisać karty obiegowej.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const selectedEmployeeForPrint = printingCard 
    ? employees.find(e => e.id === printingCard.employeeId) 
    : null;

  return (
    <>
      <div className="flex h-full flex-col">
        <PageHeader
          title="Karty obiegowe"
          description="Generuj i drukuj karty obiegowe dla pracowników."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Utwórz nową kartę</CardTitle>
                <CardDescription>Wybierz pracownika (aktywnego lub zwolnionego), aby wygenerować kartę.</CardDescription>
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
                            {employees.map((employee) => (
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

                <Button onClick={handlePrint} disabled={!selectedEmployee} className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Drukuj kartę
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <History className="h-6 w-6" />
                  <div>
                    <CardTitle>Historia kart obiegowych</CardTitle>
                    <CardDescription>
                      {selectedEmployee ? `dla ${selectedEmployee.fullName}` : 'Wybierz pracownika, aby zobaczyć historię.'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedEmployee ? (
                  employeeCardHistory.length > 0 ? (
                    <ScrollArea className="max-h-96 rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data wygenerowania</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employeeCardHistory.map(card => (
                            <TableRow key={card.id}>
                              <TableCell className="font-medium">{format(parseISO(card.date), "dd.MM.yyyy HH:mm")}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => setPrintingCard(card)}>
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-10">Brak historii kart dla tego pracownika.</p>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-center py-10">
                    Wybierz pracownika, aby zobaczyć historię.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {printingCard && selectedEmployeeForPrint && (
        <div className="print-container">
          <CirculationCardPrintForm 
            employee={selectedEmployeeForPrint}
            card={printingCard}
          />
        </div>
      )}
    </>
  );
}
