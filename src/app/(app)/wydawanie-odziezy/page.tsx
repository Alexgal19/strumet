
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
import { Loader2, Printer, CheckIcon, ChevronsUpDown } from 'lucide-react';
import { Employee, ClothingIssuanceHistoryItem, AllConfig } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, onValue } from 'firebase/database';
import { format } from 'date-fns';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
  const [isSaving, setIsSaving] = useState(false);

  const printComponentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const configRef = ref(db, 'config');
    const issuancesRef = ref(db, 'clothingIssuances');

    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      setEmployees(objectToArray(snapshot.val()));
      if(isLoading) setIsLoading(false);
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
      if(isLoading) setIsLoading(false);
    });

    const unsubscribeIssuances = onValue(issuancesRef, (snapshot) => {
      setClothingIssuances(objectToArray(snapshot.val()));
      if(isLoading) setIsLoading(false);
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeConfig();
      unsubscribeIssuances();
    };
  }, [isLoading]);

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

  const handlePrint = () => {
    window.print();
    
    if (!selectedEmployeeId || !selectedEmployee) return;
    if (selectedItemsList.length === 0) return;

    setIsSaving(true);
    try {
        const newIssuanceRef = push(ref(db, 'clothingIssuances'));
        const newIssuance: Omit<ClothingIssuanceHistoryItem, 'id'> = {
            employeeId: selectedEmployeeId,
            employeeFullName: selectedEmployee.fullName,
            date: format(new Date(), 'yyyy-MM-dd'),
            items: selectedItemsList,
        };
        set(newIssuanceRef, newIssuance);
        // Reset state after saving
        setSelectedClothing({});
    } catch (error) {
        console.error("Error saving issuance:", error);
    } finally {
        setIsSaving(false);
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
      <div className="flex h-full flex-col print:hidden">
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
                          <CardTitle>2. Wybierz odzież</CardTitle>
                          <CardDescription>Wybierz elementy odzieży do wydania.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Button onClick={() => setIsModalOpen(true)} className="w-full">
                              Wybierz z listy ({selectedItemsList.length})
                          </Button>
                      </CardContent>
                  </Card>
              )}

              {selectedEmployee && selectedItemsList.length > 0 && (
                   <Card>
                      <CardHeader>
                          <CardTitle>3. Drukuj wniosek</CardTitle>
                          <CardDescription>Wygeneruj i wydrukuj dokument wydania.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Button onClick={handlePrint} disabled={isSaving} className="w-full">
                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                              Drukuj wniosek
                          </Button>
                      </CardContent>
                  </Card>
              )}
          </div>
          
          <div className="lg:col-span-2">
              <Card className="h-full">
                  <CardHeader>
                      <CardTitle>Podgląd wniosku i historia</CardTitle>
                      <CardDescription>Tutaj zobaczysz podgląd dokumentu oraz historię wydań dla pracownika.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {selectedEmployee ? (
                          <>
                              <div className="border rounded-lg p-4 mb-6">
                                  <ClothingIssuancePrintForm
                                      employee={selectedEmployee}
                                      clothingItems={selectedItemsList}
                                      issuanceDate={new Date()}
                                  />
                              </div>
                              <h3 className="text-lg font-semibold mb-4">Historia wydań</h3>
                               {employeeIssuanceHistory.length > 0 ? (
                                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                                      <Table>
                                          <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
                                              <TableRow>
                                                  <TableHead>Data</TableHead>
                                                  <TableHead>Wydane elementy</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {employeeIssuanceHistory.map(issuance => (
                                                  <TableRow key={issuance.id}>
                                                      <TableCell className="font-medium">{issuance.date}</TableCell>
                                                      <TableCell>{issuance.items.join(', ')}</TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </div>
                              ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">Brak historii wydań dla tego pracownika.</p>
                              )}
                          </>
                     ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                              Wybierz pracownika, aby zobaczyć podgląd i historię.
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
              <div className="max-h-[60vh] overflow-y-auto p-1">
                  <div className="grid gap-4 py-4">
                      {config.clothingItems.map(item => (
                          <div key={item.id} className="flex items-center space-x-3">
                              <Checkbox 
                                  id={`clothing-${item.id}`} 
                                  checked={!!selectedClothing[item.name]}
                                  onCheckedChange={() => handleToggleClothingItem(item.name)}
                              />
                              <Label htmlFor={`clothing-${item.id}`} className="font-medium cursor-pointer">
                                  {item.name}
                              </Label>
                          </div>
                      ))}
                  </div>
              </div>
              <DialogFooter>
                  <Button type="button" onClick={() => setIsModalOpen(false)}>Zatwierdź</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="hidden print:block">
        <ClothingIssuancePrintForm
            ref={printComponentRef}
            employee={selectedEmployee}
            clothingItems={selectedItemsList}
            issuanceDate={new Date()}
        />
      </div>
    </>
  );
}
