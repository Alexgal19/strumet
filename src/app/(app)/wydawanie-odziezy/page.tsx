
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
import { Loader2, ChevronsUpDown, CheckIcon, Printer, History, PlusCircle, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Employee, ClothingIssuance, AllConfig } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { Input } from '@/components/ui/input';

interface ClothingIssuancePageProps {
  employees: Employee[];
  config: AllConfig;
  clothingIssuances: ClothingIssuance[];
  isLoading: boolean;
}

export default function ClothingIssuancePage({ employees, config, clothingIssuances: issuances, isLoading }: ClothingIssuancePageProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const [currentItems, setCurrentItems] = useState<{ id: string; name: string; quantity: number }[]>([]);

  const [printingIssuance, setPrintingIssuance] = useState<ClothingIssuance | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (printingIssuance) {
        const timer = setTimeout(() => {
            window.print();
            setPrintingIssuance(null);
        }, 100);

        return () => clearTimeout(timer);
    }
  }, [printingIssuance]);
  
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, employees]);

  const employeeIssuanceHistory = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return issuances
        .filter(issuance => issuance.employeeId === selectedEmployeeId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [issuances, selectedEmployeeId]);
  
  const clothingOptions: OptionType[] = useMemo(() => config.clothingItems.map(c => ({ value: c.id, label: c.name })), [config.clothingItems]);

  const handleAddItem = (itemId: string) => {
    const itemToAdd = config.clothingItems.find(c => c.id === itemId);
    if(itemToAdd && !currentItems.find(i => i.id === itemId)) {
        setCurrentItems(prev => [...prev, { ...itemToAdd, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
      setCurrentItems(prev => prev.filter(i => i.id !== itemId));
  };
  
  const handleQuantityChange = (itemId: string, quantity: number) => {
      setCurrentItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i));
  }
  
  const handleSaveAndPrint = async () => {
    if (!selectedEmployee || currentItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Proszę wybrać pracownika i przynajmniej jeden element odzieży.',
      });
      return;
    }

    try {
      const newIssuanceRef = push(ref(db, 'clothingIssuances'));
      const newIssuance: Omit<ClothingIssuance, 'id'> = {
        employeeId: selectedEmployee.id,
        employeeFullName: selectedEmployee.fullName,
        date: new Date().toISOString(),
        items: currentItems,
      };
      await set(newIssuanceRef, newIssuance);
      
      const issuanceToPrint = { ...newIssuance, id: newIssuanceRef.key! };
      setPrintingIssuance(issuanceToPrint);

      toast({
        title: 'Sukces',
        description: 'Zapis o wydaniu odzieży został zapisany i jest gotowy do druku.',
      });
      
      // Reset form
      setCurrentItems([]);
      setSelectedEmployeeId('');

    } catch (error) {
      console.error('Error saving clothing issuance:', error);
      toast({
        variant: 'destructive',
        title: 'Błąd serwera',
        description: 'Nie udało się zapisać danych.',
      });
    }
  };
  
  const handleReprint = (issuance: ClothingIssuance) => {
    setPrintingIssuance(issuance);
  };

  const handleDeleteIssuance = async (issuanceId: string) => {
      if (window.confirm('Czy na pewno chcesz usunąć ten zapis?')) {
        try {
            await remove(ref(db, `clothingIssuances/${issuanceId}`));
            toast({
                title: 'Sukces',
                description: 'Zapis został usunięty.',
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Błąd',
                description: 'Nie udało się usunąć zapisu.',
            });
        }
      }
  };

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const selectedEmployeeForPrint = printingIssuance 
    ? employees.find(e => e.id === printingIssuance.employeeId) 
    : null;

  return (
    <>
      <div className="main-content-container h-full flex-col flex">
        <PageHeader
          title="Wydawanie odzieży"
          description="Rejestruj i drukuj potwierdzenia wydania odzieży roboczej."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Nowe wydanie</CardTitle>
                <CardDescription>Wybierz pracownika i dodaj wydane elementy odzieży.</CardDescription>
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
                            {employees.filter(e => e.status === 'aktywny').map((employee) => (
                              <CommandItem
                                key={employee.id}
                                value={employee.fullName}
                                onSelect={() => {
                                  setSelectedEmployeeId(employee.id);
                                  setIsComboboxOpen(false);
                                }}
                              >
                                <CheckIcon className={cn("mr-2 h-4 w-4", selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0")} />
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
                   <label className="text-sm font-medium">Elementy odzieży</label>
                   <MultiSelect
                        options={clothingOptions}
                        selected={currentItems.map(i => i.id)}
                        onChange={(selectedIds) => {
                            const newItems = selectedIds.map(id => {
                                const existing = currentItems.find(i => i.id === id);
                                if (existing) return existing;
                                const item = config.clothingItems.find(c => c.id === id)!;
                                return { ...item, quantity: 1 };
                            });
                            setCurrentItems(newItems);
                        }}
                        title="Wybierz odzież..."
                    />
                </div>

                {currentItems.length > 0 && (
                    <div className="space-y-3 rounded-md border p-4">
                        {currentItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <span className="text-sm">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                                        className="h-8 w-16 text-center"
                                    />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Button onClick={handleSaveAndPrint} disabled={!selectedEmployee || currentItems.length === 0} className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Zapisz i drukuj
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
                    <CardTitle>Historia wydań</CardTitle>
                    <CardDescription>
                      {selectedEmployee ? `dla ${selectedEmployee.fullName}` : 'Wybierz pracownika, aby zobaczyć historię.'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedEmployee ? (
                  employeeIssuanceHistory.length > 0 ? (
                    <ScrollArea className="max-h-96 rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Elementy</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employeeIssuanceHistory.map(issuance => (
                            <TableRow key={issuance.id}>
                              <TableCell className="font-medium">{format(parseISO(issuance.date), "dd.MM.yyyy HH:mm")}</TableCell>
                              <TableCell>{issuance.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleReprint(issuance)}>
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteIssuance(issuance.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-10">Brak historii wydań dla tego pracownika.</p>
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
      {printingIssuance && selectedEmployeeForPrint && (
        <div className="print-only" ref={printComponentRef}>
          <ClothingIssuancePrintForm 
            employee={selectedEmployeeForPrint}
            issuance={printingIssuance}
          />
        </div>
      )}
    </>
  );
}
