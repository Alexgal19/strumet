'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Printer, CheckIcon, ChevronsUpDown, Shirt, History } from 'lucide-react';
import { Employee, ClothingIssuanceHistoryItem, AllConfig } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function ClothingIssuancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [config, setConfig] = useState<AllConfig>({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [] });
  const [clothingIssuances, setClothingIssuances] = useState<ClothingIssuanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState<Record<string, boolean>>({});
  
  const [printingIssuance, setPrintingIssuance] = useState<ClothingIssuanceHistoryItem | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const configRef = ref(db, 'config');
    const issuancesRef = ref(db, 'clothingIssuances');

    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      setEmployees(objectToArray(snapshot.val()));
      setIsLoading(false);
    });

    const unsubscribeConfig = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      setConfig({
        departments: objectToArray(data?.departments),
        jobTitles: objectToArray(data?.jobTitles),
        managers: objectToArray(data?.managers),
        nationalities: objectToArray(data?.nationalities),
        clothingItems: objectToArray(data?.clothingItems),
      });
      setIsLoading(false);
    });

    const unsubscribeIssuances = onValue(issuancesRef, (snapshot) => {
      setClothingIssuances(objectToArray(snapshot.val()));
      setIsLoading(false);
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeConfig();
      unsubscribeIssuances();
    };
  }, []);

  useEffect(() => {
    if (printingIssuance) {
        document.body.classList.add('printing');
        const timer = setTimeout(() => {
            window.print();
            setPrintingIssuance(null);
            document.body.classList.remove('printing');
        }, 100);
      return () => {
          clearTimeout(timer);
          document.body.classList.remove('printing');
      };
    }
  }, [printingIssuance]);


  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);
  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return activeEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, activeEmployees]);

  const employeeIssuanceHistory = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return clothingIssuances
        .filter(issuance => issuance.employeeId === selectedEmployeeId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [clothingIssuances, selectedEmployeeId]);
  
  const selectedItemsList = Object.entries(selectedClothing)
    .filter(([, isSelected]) => isSelected)
    .map(([itemName]) => itemName);

  const handleSaveAndPrint = async () => {
    if (!selectedEmployeeId || !selectedEmployee) return;
    if (selectedItemsList.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Proszę wybrać przynajmniej jeden element odzieży.',
      });
      return;
    }

    try {
        const newIssuanceRef = push(ref(db, 'clothingIssuances'));
        const newIssuance: Omit<ClothingIssuanceHistoryItem, 'id'> = {
            employeeId: selectedEmployeeId,
            employeeFullName: selectedEmployee.fullName,
            date: format(new Date(), 'yyyy-MM-dd'),
            items: selectedItemsList,
        };
        await set(newIssuanceRef, newIssuance);
        
        toast({
          title: 'Sukces',
          description: 'Zapis o wydaniu został dodany.',
        });
        
        setPrintingIssuance({ ...newIssuance, id: newIssuanceRef.key! });
        setSelectedClothing({});
        setIsModalOpen(false);
    } catch (error) {
        console.error("Error saving issuance:", error);
        toast({
          variant: 'destructive',
          title: 'Błąd serwera',
          description: 'Nie udało się zapisać wydania.',
        });
    }
  };
  
  const handleToggleClothingItem = (itemName: string) => {
    setSelectedClothing(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
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
      <div className="flex h-full flex-col">
        <PageHeader
          title="Wydawanie odzieży"
          description="Zarządzaj wydawaniem odzieży pracownikom i drukuj wnioski."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle>1. Wybierz pracownika</CardTitle>
                      <CardDescription>Wyszukaj i wybierz pracownika z listy.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                          <PopoverTrigger asChild>
                              <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isComboboxOpen}
                                  className="w-full justify-between"
                              >
                                  {selectedEmployee
                                      ? selectedEmployee.fullName
                                      : "Wybierz pracownika..."}
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
                                                      setSelectedClothing({});
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
                  </CardContent>
              </Card>
              
              {selectedEmployee && (
                  <Card>
                      <CardHeader>
                          <CardTitle>2. Utwórz nowe wydanie</CardTitle>
                          <CardDescription>Wybierz odzież, zapisz i wydrukuj wniosek.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <Button variant="outline" onClick={() => setIsModalOpen(true)} className="w-full">
                              <Shirt className="mr-2 h-4 w-4" />
                              Wybierz odzież ({selectedItemsList.length})
                          </Button>
                      </CardContent>
                  </Card>
              )}
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
                          <>
                               {employeeIssuanceHistory.length > 0 ? (
                                  <ScrollArea className="max-h-96 rounded-lg border">
                                      <Table>
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead>Data</TableHead>
                                                  <TableHead>Wydane elementy</TableHead>
                                                  <TableHead className="text-right">Akcje</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {employeeIssuanceHistory.map(issuance => (
                                                  <TableRow key={issuance.id}>
                                                      <TableCell className="font-medium">{format(parseISO(issuance.date), "dd.MM.yyyy")}</TableCell>
                                                      <TableCell>{issuance.items.join(', ')}</TableCell>
                                                      <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => setPrintingIssuance(issuance)}>
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                      </TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </ScrollArea>
                              ) : (
                                  <p className="text-sm text-muted-foreground text-center py-10">Brak historii wydań dla tego pracownika.</p>
                              )}
                          </>
                     ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground text-center py-10">
                              Wybierz pracownika, aby zobaczyć jego historię wydań odzieży.
                          </div>
                     )}
                  </CardContent>
              </Card>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Wybierz odzież do wydania</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] my-4">
                  <div className="grid gap-4 pr-6">
                      {config.clothingItems.sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                          <div key={item.id} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted">
                              <Checkbox 
                                  id={`clothing-${item.id}`} 
                                  checked={!!selectedClothing[item.name]}
                                  onCheckedChange={() => handleToggleClothingItem(item.name)}
                              />
                              <Label htmlFor={`clothing-${item.id}`} className="font-medium cursor-pointer flex-1">
                                  {item.name}
                              </Label>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
              <DialogFooter>
                  <Button onClick={handleSaveAndPrint} disabled={selectedItemsList.length === 0}>
                      <Printer className="mr-2 h-4 w-4" />
                      Zapisz i drukuj
                  </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
       {printingIssuance && selectedEmployee && (
          <div className="print-container">
            <ClothingIssuancePrintForm
              employee={selectedEmployee}
              issuance={printingIssuance}
            />
          </div>
       )}
    </>
  );
}
