
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Trash2, UserX, ScanId } from 'lucide-react';
import { format as formatFns } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Employee, AllConfig } from '@/lib/types';
import { Separator } from './ui/separator';
import { formatDate, parseMaybeDate } from '@/lib/date';
import { legalizationStatuses } from '@/lib/legalization-statuses';
import { PassportScanner } from './passport-scanner';

interface EmployeeFormProps {
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  onTerminate?: (id: string, fullName: string) => void;
  config: AllConfig;
}

const getInitialFormData = (employee: Employee | null): Omit<Employee, 'id' | 'status'> => {
    if (employee) {
        return {
            fullName: employee.fullName || '',
            hireDate: employee.hireDate || '',
            jobTitle: employee.jobTitle || '',
            department: employee.department || '',
            manager: employee.manager || '',
            cardNumber: employee.cardNumber || '',
            nationality: employee.nationality || '',
            lockerNumber: employee.lockerNumber || '',
            departmentLockerNumber: employee.departmentLockerNumber || '',
            sealNumber: employee.sealNumber || '',
            plannedTerminationDate: employee.plannedTerminationDate,
            vacationStartDate: employee.vacationStartDate,
            vacationEndDate: employee.vacationEndDate,
            contractEndDate: employee.contractEndDate,
            legalizationStatus: employee.legalizationStatus || 'Brak',
            terminationDate: employee.terminationDate,
        };
    }
    return {
        fullName: '',
        hireDate: formatFns(new Date(), 'yyyy-MM-dd'),
        jobTitle: '',
        department: '',
        manager: '',
        cardNumber: '',
        nationality: '',
        lockerNumber: '',
        departmentLockerNumber: '',
        sealNumber: '',
        plannedTerminationDate: undefined,
        vacationStartDate: undefined,
        vacationEndDate: undefined,
        contractEndDate: undefined,
        legalizationStatus: 'Brak',
    };
};

export function EmployeeForm({ employee, onSave, onCancel, onTerminate, config }: EmployeeFormProps) {
    const { departments, jobTitles, managers, nationalities } = config;
    const [formData, setFormData] = useState<Omit<Employee, 'id' | 'status'>>(getInitialFormData(employee));
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    useEffect(() => {
        setFormData(getInitialFormData(employee));
        if (employee?.fullName) {
            const nameParts = employee.fullName.trim().split(' ');
            const lName = nameParts.pop() || '';
            const fName = nameParts.join(' ');
            setFirstName(fName);
            setLastName(lName);
        } else {
            setFirstName('');
            setLastName('');
        }
        setErrors({});
    }, [employee]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!firstName.trim()) newErrors.firstName = "Imię jest wymagane.";
        if (!lastName.trim()) newErrors.lastName = "Nazwisko jest wymagane.";
        if (!formData.jobTitle) newErrors.jobTitle = "Stanowisko jest wymagane.";
        if (!formData.department) newErrors.department = "Dział jest wymagany.";
        if (!formData.manager) newErrors.manager = "Kierownik jest wymagany.";
        if (!formData.cardNumber.trim()) newErrors.cardNumber = "Numer karty jest wymagany.";
        if (!formData.nationality) newErrors.nationality = "Narodowość jest wymagana.";
        if (!formData.hireDate) newErrors.hireDate = "Data zatrudnienia jest wymagana.";
        if (!formData.contractEndDate) newErrors.contractEndDate = "Data końca umowy jest wymagana.";
        if (!formData.legalizationStatus || formData.legalizationStatus === 'Brak') newErrors.legalizationStatus = "Status legalizacyjny jest wymagany.";


        if (formData.vacationStartDate && formData.vacationEndDate) {
            const startDate = parseMaybeDate(formData.vacationStartDate);
            const endDate = parseMaybeDate(formData.vacationEndDate);
            if (startDate && endDate && endDate < startDate) {
                newErrors.vacationEndDate = "Data końcowa nie może być wcześniejsza niż początkowa.";
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleScanComplete = (data: { firstName: string, lastName: string }) => {
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setIsScannerOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const newFullName = `${firstName.trim()} ${lastName.trim()}`;
            let dataToSave = { ...formData, fullName: newFullName };
            
            onSave({
                ...dataToSave,
                id: employee?.id || '',
                status: employee?.status || 'aktywny',
            });
        }
    };

    const handleChange = (field: keyof typeof formData, value: string | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const DatePickerInput = ({ value, onChange, placeholder }: { value?: string, onChange: (date?: string) => void, placeholder: string }) => {
        const dateValue = parseMaybeDate(value);
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !dateValue && "text-muted-foreground")}
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
                       <Button variant="ghost" size="sm" className="m-2 mt-0" onClick={() => onChange(undefined)}>
                         <Trash2 className="mr-2 h-4 w-4" />
                         Wyczyść datę
                       </Button>
                    )}
                </PopoverContent>
            </Popover>
        );
    };

    const renderError = (field: string) => {
        return errors[field] && <p className="text-xs font-medium text-destructive mt-1">{errors[field]}</p>;
    };

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-foreground">Dane osobowe</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsScannerOpen(true)}>
                        <ScanId className="mr-2 h-4 w-4" />
                        Skanuj Paszport
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <Label htmlFor="lastName">Nazwisko</Label>
                        <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
                        {renderError('lastName')}
                    </div>
                    <div>
                        <Label htmlFor="firstName">Imię</Label>
                        <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        {renderError('firstName')}
                    </div>
                    <div>
                        <Label>Narodowość</Label>
                        <Select value={formData.nationality} onValueChange={value => handleChange('nationality', value)}>
                            <SelectTrigger><SelectValue placeholder="Wybierz narodowość" /></SelectTrigger>
                            <SelectContent>
                                {nationalities.map(n => <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('nationality')}
                    </div>
                     <div>
                        <Label>Status legalizacyjny</Label>
                        <Select value={formData.legalizationStatus || 'Brak'} onValueChange={value => handleChange('legalizationStatus', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz status" />
                            </SelectTrigger>
                            <SelectContent>
                                {legalizationStatuses.map(status => (
                                    <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderError('legalizationStatus')}
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Dane zatrudnienia</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                    <div>
                        <Label>Dział</Label>
                        <Select value={formData.department} onValueChange={value => handleChange('department', value)}>
                            <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                            <SelectContent>
                                {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('department')}
                    </div>
                    <div>
                        <Label>Stanowisko</Label>
                        <Select value={formData.jobTitle} onValueChange={value => handleChange('jobTitle', value)}>
                            <SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                            <SelectContent>
                                {jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('jobTitle')}
                    </div>
                        <div>
                        <Label>Kierownik</Label>
                        <Select value={formData.manager} onValueChange={value => handleChange('manager', value)}>
                            <SelectTrigger><SelectValue placeholder="Wybierz kierownika" /></SelectTrigger>
                            <SelectContent>
                                {managers.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('manager')}
                    </div>
                     <div>
                        <Label>Data zatrudnienia</Label>
                        <DatePickerInput
                            value={formData.hireDate}
                            onChange={(date) => handleChange('hireDate', date)}
                            placeholder="Wybierz datę"
                        />
                        {renderError('hireDate')}
                    </div>
                     <div>
                        <Label>Umowa do</Label>
                        <DatePickerInput
                            value={formData.contractEndDate}
                            onChange={(date) => handleChange('contractEndDate', date)}
                            placeholder="Data końcowa umowy"
                        />
                        {renderError('contractEndDate')}
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Dane identyfikacyjne</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div>
                        <Label htmlFor="cardNumber">Numer karty</Label>
                        <Input id="cardNumber" value={formData.cardNumber} onChange={e => handleChange('cardNumber', e.target.value)} />
                        {renderError('cardNumber')}
                    </div>
                        <div>
                        <Label htmlFor="lockerNumber">Numer szafki</Label>
                        <Input id="lockerNumber" value={formData.lockerNumber} onChange={e => handleChange('lockerNumber', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="departmentLockerNumber">Szafka w dziale</Label>
                        <Input id="departmentLockerNumber" value={formData.departmentLockerNumber} onChange={e => handleChange('departmentLockerNumber', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="sealNumber">Numer pieczęci</Label>
                        <Input id="sealNumber" value={formData.sealNumber} onChange={e => handleChange('sealNumber', e.target.value)} />
                    </div>
                </div>
            </div>
            
            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Planowanie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                      <Label>Planowana data zwolnienia</Label>
                      <DatePickerInput 
                          value={formData.plannedTerminationDate} 
                          onChange={(date) => handleChange('plannedTerminationDate', date)}
                          placeholder="Wybierz planowaną datę"
                      />
                  </div>
                  <div>
                      <Label>Data zwolnienia</Label>
                      <DatePickerInput 
                          value={formData.terminationDate} 
                          onChange={(date) => handleChange('terminationDate', date)}
                          placeholder="Wybierz datę zwolnienia"
                      />
                  </div>
                  <div>
                    <Label>Urlop od</Label>
                    <DatePickerInput 
                        value={formData.vacationStartDate} 
                        onChange={(date) => handleChange('vacationStartDate', date)}
                        placeholder="Początek urlopu"
                    />
                  </div>
                  <div>
                    <Label>Urlop do</Label>
                    <DatePickerInput 
                        value={formData.vacationEndDate} 
                        onChange={(date) => handleChange('vacationEndDate', date)}
                        placeholder="Koniec urlopu"
                    />
                    {renderError('vacationEndDate')}
                  </div>
                </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-2">
                <div>
                  {employee && employee.status === 'aktywny' && onTerminate && (
                      <Button 
                          type="button" 
                          variant="destructive" 
                          onClick={() => onTerminate(employee.id, employee.fullName)}
                      >
                         <UserX className="mr-2 h-4 w-4" />
                         Zwolnij
                      </Button>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>Anuluj</Button>
                    <Button type="submit">Zapisz</Button>
                </div>
            </div>
        </form>
        
        {isScannerOpen && (
            <PassportScanner
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                onScanComplete={handleScanComplete}
            />
        )}
        </>
    );
}
