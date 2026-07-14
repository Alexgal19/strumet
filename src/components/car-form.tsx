'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { format as formatFns } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Car, Employee } from '@/lib/types';
import { formatDate, parseMaybeDate } from '@/lib/date';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const DatePickerInput = ({ value, onChange, placeholder }: { value?: string, onChange: (date?: string) => void, placeholder: string }) => {
    const dateValue = parseMaybeDate(value);
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal h-11 transition-all", !dateValue && "text-muted-foreground")}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue ? formatDate(dateValue, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col">
                <Calendar
                    mode="single"
                    selected={dateValue || undefined}
                    onSelect={(date) => onChange(date ? formatFns(date, 'yyyy-MM-dd') : undefined)}
                    locale={pl}
                    initialFocus
                />
                {value && (
                   <Button type="button" variant="ghost" size="sm" className="m-2 mt-0" onClick={() => onChange(undefined)}>
                     <Trash2 className="mr-2 h-4 w-4" />
                     Wyczyść datę
                   </Button>
                )}
            </PopoverContent>
        </Popover>
    );
};

interface CarFormProps {
  car: Car | null;
  onSave: (car: Car) => void;
  onCancel: () => void;
  employees: Employee[];
}

const getInitialFormData = (car: Car | null): Omit<Car, 'id' | 'status'> => {
    if (car) {
        return {
            registrationNumber: car.registrationNumber || '',
            makeModel: car.makeModel || '',
            vin: car.vin || '',
            insuranceEndDate: car.insuranceEndDate,
            inspectionEndDate: car.inspectionEndDate,
            driverId: car.driverId || '',
            driverFullName: car.driverFullName || '',
            dateFrom: car.dateFrom || formatFns(new Date(), 'yyyy-MM-dd'),
            dateTo: car.dateTo,
        };
    }
    return {
        registrationNumber: '',
        makeModel: '',
        vin: '',
        insuranceEndDate: undefined,
        inspectionEndDate: undefined,
        driverId: '',
        driverFullName: '',
        dateFrom: formatFns(new Date(), 'yyyy-MM-dd'),
        dateTo: undefined,
    };
};

export function CarForm({ car, onSave, onCancel, employees }: CarFormProps) {
    const [formData, setFormData] = useState<Omit<Car, 'id' | 'status'>>(getInitialFormData(car));
    const [openDriverCombo, setOpenDriverCombo] = useState(false);

    useEffect(() => {
        setFormData(getInitialFormData(car));
    }, [car]);

    const handleInputChange = (field: keyof Omit<Car, 'id' | 'status'>, value: string | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDriverSelect = (driverId: string, driverName: string) => {
        setFormData(prev => ({
            ...prev,
            driverId: driverId === "none" ? "" : driverId,
            driverFullName: driverName === "Brak kierowcy" ? "" : driverName
        }));
        setOpenDriverCombo(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: car?.id || '',
            status: car?.status || 'active',
        } as Car);
    };

    const activeEmployees = employees.filter(e => e.status === 'aktywny').sort((a, b) => a.fullName.localeCompare(b.fullName));

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="registrationNumber" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numer Rejestracyjny *</Label>
                    <Input
                        id="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                        placeholder="np. WX 12345"
                        required
                        className="h-11 uppercase"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="makeModel" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marka / Model</Label>
                    <Input
                        id="makeModel"
                        value={formData.makeModel || ''}
                        onChange={(e) => handleInputChange('makeModel', e.target.value)}
                        placeholder="np. Toyota Corolla"
                        className="h-11"
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numer VIN</Label>
                    <Input
                        id="vin"
                        value={formData.vin || ''}
                        onChange={(e) => handleInputChange('vin', e.target.value)}
                        placeholder="17 znaków VIN"
                        className="h-11 uppercase"
                    />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Przypisany Kierowca</Label>
                    <Popover open={openDriverCombo} onOpenChange={setOpenDriverCombo}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openDriverCombo}
                                className="w-full h-11 justify-between font-normal"
                            >
                                {formData.driverFullName || "Brak kierowcy"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Szukaj pracownika..." />
                                <CommandList>
                                    <CommandEmpty>Nie znaleziono pracownika.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => handleDriverSelect("none", "Brak kierowcy")}
                                            className="font-medium text-muted-foreground"
                                        >
                                            <Check
                                                className={cn("mr-2 h-4 w-4", !formData.driverId ? "opacity-100" : "opacity-0")}
                                            />
                                            Brak kierowcy
                                        </CommandItem>
                                        {activeEmployees.map((employee) => (
                                            <CommandItem
                                                key={employee.id}
                                                onSelect={() => handleDriverSelect(employee.id, employee.fullName)}
                                            >
                                                <Check
                                                    className={cn("mr-2 h-4 w-4", formData.driverId === employee.id ? "opacity-100" : "opacity-0")}
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
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ważność Ubezpieczenia (OC/AC)</Label>
                    <DatePickerInput
                        value={formData.insuranceEndDate}
                        onChange={(date) => handleInputChange('insuranceEndDate', date)}
                        placeholder="Wybierz datę ubezpieczenia"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ważność Przeglądu</Label>
                    <DatePickerInput
                        value={formData.inspectionEndDate}
                        onChange={(date) => handleInputChange('inspectionEndDate', date)}
                        placeholder="Wybierz datę przeglądu"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Od kiedy (w firmie)</Label>
                    <DatePickerInput
                        value={formData.dateFrom}
                        onChange={(date) => handleInputChange('dateFrom', date)}
                        placeholder="Wybierz datę"
                    />
                </div>
                {car?.status === 'history' && (
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Do kiedy (w historii)</Label>
                        <DatePickerInput
                            value={formData.dateTo}
                            onChange={(date) => handleInputChange('dateTo', date)}
                            placeholder="Wybierz datę"
                        />
                    </div>
                )}
            </div>
            
            <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="h-11">
                    Anuluj
                </Button>
                <Button type="submit" className="h-11">
                    {car ? 'Zapisz zmiany' : 'Dodaj auto'}
                </Button>
            </div>
        </form>
    );
}
