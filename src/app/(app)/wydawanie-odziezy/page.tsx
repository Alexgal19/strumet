'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Employee } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon, PlusCircle, Printer, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfig } from '@/context/config-context';

export default function ClothingIssuancePage() {
  const { employees, clothingItems, isLoading } = useConfig();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [issuanceDate, setIssuanceDate] = useState<Date | undefined>(new Date());
  const [selectedClothing, setSelectedClothing] = useState<string[]>([]);
  
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = activeEmployees.find(e => e.id === employeeId);
    setSelectedEmployee(employee || null);
  };
  
  const handleClothingSelect = (itemId: string, checked: boolean | string) => {
    setSelectedClothing(prev => 
      checked ? [...prev, itemId] : prev.filter(id => id !== itemId)
    );
  }
  
  if (isLoading) return <div>Ładowanie...</div>;

  return (
    <div>
      <PageHeader
        title="Wydawanie odzieży"
        description="Rejestruj wydawanie odzieży pracownikom."
      >
        <Button>
          <Printer className="mr-2 h-4 w-4" />
          Drukuj
        </Button>
      </PageHeader>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>Formularz wydania</CardTitle>
                <CardDescription>Wybierz pracownika i przypisz elementy odzieży.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Wybierz pracownika</Label>
                    <Select onValueChange={handleEmployeeSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder="Wybierz pracownika..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Pracownicy aktywni</SelectLabel>
                            {activeEmployees.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.lastName} {e.firstName}</SelectItem>
                            ))}
                        </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {selectedEmployee && (
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-semibold">Imię i nazwisko:</span> {selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                            <div><span className="font-semibold">Dział:</span> {selectedEmployee.department}</div>
                            <div><span className="font-semibold">Stanowisko:</span> {selectedEmployee.jobTitle}</div>
                            <div><span className="font-semibold">Numer karty:</span> {selectedEmployee.cardNumber}</div>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    <Label>Wybierz odzież</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-md border p-4">
                        {clothingItems.map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={item.id}
                                    onCheckedChange={(checked) => handleClothingSelect(item.id, checked)}
                                    disabled={!selectedEmployee}
                                />
                                <label
                                    htmlFor={item.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {item.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Data wydania</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !issuanceDate && "text-muted-foreground")}
                            disabled={!selectedEmployee}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {issuanceDate ? format(issuanceDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={issuanceDate}
                                onSelect={setIssuanceDate}
                                initialFocus
                                locale={pl}
                            />
                        </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signature">Podpis pracownika</Label>
                        <Input id="signature" placeholder="Miejsce na podpis..." disabled={!selectedEmployee} />
                    </div>
                </div>

                <Button className="w-full" disabled={!selectedEmployee || selectedClothing.length === 0}>Zapisz wydanie</Button>

            </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Historia wydań</CardTitle>
                    <CardDescription>Poprzednie wydania dla wybranego pracownika.</CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedEmployee ? (
                         <div className="text-sm text-muted-foreground">Brak historii wydań dla tego pracownika.</div>
                    ) : (
                        <div className="text-sm text-center text-muted-foreground py-8">Wybierz pracownika, aby zobaczyć historię.</div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
