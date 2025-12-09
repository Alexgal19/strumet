
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
import { Loader2, ChevronsUpDown, CheckIcon, Printer, Trash2, UserX } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Employee, ClothingIssuance, ClothingSet } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/app-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function NewHireClothingIssuancePage() {
  const { employees, config, addClothingIssuance, isLoading } = useAppContext();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const [currentItems, setCurrentItems] = useState<{ id: string; name: string; quantity: number }[]>([]);

  const [printingIssuance, setPrintingIssuance] = useState<ClothingIssuance | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);
  
  const selectedEmployee = useMemo(() => {
    return activeEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, activeEmployees]);

  useEffect(() => {
    if (selectedSetId) {
        const clothingSet = config.clothingSets.find(set => set.id === selectedSetId);
        if (clothingSet && clothingSet.clothingItemIds) {
            const items = clothingSet.clothingItemIds.map(itemId => {
                const clothingItem = config.clothingItems.find(ci => ci.id === itemId);
                return clothingItem ? { ...clothingItem, quantity: 1 } : null;
            }).filter(Boolean) as { id: string; name: string; quantity: number }[];
            setCurrentItems(items);
        } else {
            setCurrentItems([]);
        }
    } else {
        setCurrentItems([]);
    }
  }, [selectedSetId, config.clothingSets, config.clothingItems]);
  
  useEffect(() => {
    // Reset selected set when employee changes
    setSelectedSetId('');
  }, [selectedEmployeeId])


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
        description: 'Proszę wybrać pracownika i zestaw odzieży.',
      });
      return;
    }
    const newIssuanceData: Omit<ClothingIssuance, 'id'> = {
      employeeId: selectedEmployee.id,
      employeeFullName: selectedEmployee.fullName,
      date: new Date().toISOString(),
      items: currentItems,
    };
    const issuance = await addClothingIssuance(newIssuanceData);
    
    if (issuance) {
      setPrintingIssuance(issuance);
      document.body.classList.add('printing');
      setTimeout(() => {
          window.print();
          document.body.classList.remove('printing');
          setPrintingIssuance(null);
      }, 100);
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
          title="Wydawanie odzieży dla nowych"
          description="Automatycznie generuj listy odzieży na podstawie stanowiska."
        />

        <div className="flex justify-center">
            <div className="w-full max-w-2xl">
                 <Card>
                    <CardHeader>
                        <CardTitle>Nowe wydanie</CardTitle>
                        <CardDescription>Wybierz pracownika, a następnie zastosuj zdefiniowany zestaw odzieży.</CardDescription>
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
                        
                        {selectedEmployee && (
                           <div className="space-y-2">
                                <Label>Zastosuj zestaw odzieży</Label>
                                <Select value={selectedSetId} onValueChange={setSelectedSetId} disabled={!selectedEmployee}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wybierz zestaw..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {config.clothingSets.map((set) => (
                                            <SelectItem key={set.id} value={set.id}>{set.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                           </div>
                        )}

                        {selectedEmployee && selectedSetId && currentItems.length === 0 && (
                             <div className="text-center text-muted-foreground p-4 border rounded-md bg-muted/50">
                                <UserX className="mx-auto h-8 w-8 mb-2"/>
                                <p className="font-semibold">Pusty zestaw</p>
                                <p className="text-sm">Wybrany zestaw nie zawiera żadnych elementów odzieży. Możesz je dodać w zakładce Konfiguracja &gt; Zestawy odzieży.</p>
                            </div>
                        )}

                        {currentItems.length > 0 && (
                            <div className="space-y-3 rounded-md border p-4">
                                <h4 className="font-medium">Wybrane elementy: <span className="text-primary">{config.clothingSets.find(s=>s.id === selectedSetId)?.name}</span></h4>
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
        </div>
      </div>
      <div className="print-only">
        {printingIssuance && selectedEmployeeForPrint && (
            <ClothingIssuancePrintForm 
                ref={printComponentRef}
                employee={selectedEmployeeForPrint}
                issuance={printingIssuance}
            />
        )}
      </div>
    </>
  );
}
