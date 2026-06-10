'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Trash2, UserX, ClipboardCopy, Shirt } from 'lucide-react';
import { format as formatFns } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Employee, AllConfig, ClothingIssuance } from '@/lib/types';
import { Separator } from './ui/separator';
import { formatDate, parseMaybeDate } from '@/lib/date';
import { legalizationStatuses } from '@/lib/legalization-statuses';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';


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

interface EmployeeFormProps {
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  onTerminate?: (id: string, fullName: string) => void;
  onPrintClothing?: (employee: Employee, issuance: ClothingIssuance) => void;
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
            welderLicense: employee.welderLicense || 'Nie',
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
        welderLicense: 'Nie',
    };
};

export function EmployeeForm({ employee, onSave, onCancel, onTerminate, onPrintClothing, config }: EmployeeFormProps) {
    const { departments, jobTitles, managers, nationalities } = config;
    const { toast } = useToast();
    const [formData, setFormData] = useState<Omit<Employee, 'id' | 'status'>>(getInitialFormData(employee));
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

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
    
    const handleCopyFullName = () => {
        const fullNameForCopy = `${lastName.trim()} ${firstName.trim()}`;
        if (fullNameForCopy.trim()) {
            navigator.clipboard.writeText(fullNameForCopy.trim());
            toast({
                title: "Skopiowano!",
                description: "Nazwisko i imię skopiowane do schowka.",
            });
        }
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

    const clothingSet = React.useMemo(() => {
        if (!formData.jobTitle || !config.jobTitles || !config.jobTitleClothingSets) return null;
        const jobTitleObj = config.jobTitles.find(jt => jt.name === formData.jobTitle);
        if (!jobTitleObj) return null;
        const set = config.jobTitleClothingSets.find(s => s.id === jobTitleObj.id);
        if (!set?.description) return null;
        return [{ id: 'full-set', name: set.description, quantity: 1 }];
    }, [formData.jobTitle, config.jobTitles, config.jobTitleClothingSets]);

    const handleOpenClothingDialog = () => {
        if (!clothingSet || !onPrintClothing) return;
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const tempEmployee: Employee = {
            ...formData,
            id: employee?.id || 'temp',
            status: employee?.status || 'aktywny',
            fullName,
        };
        const issuance: ClothingIssuance = {
            id: `print-temp-${Date.now()}`,
            employeeId: tempEmployee.id,
            employeeFullName: fullName,
            date: new Date().toISOString(),
            items: clothingSet,
        };
        onPrintClothing(tempEmployee, issuance);
    };

    const renderError = (field: string) => {
        return errors[field] && <p className="text-xs font-medium text-destructive mt-1">{errors[field]}</p>;
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Quick Actions Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-6 rounded-xl bg-muted/30 border border-border/50 backdrop-blur-sm mx-6 mt-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyFullName} className="h-9 gap-2 bg-background/50">
                        <ClipboardCopy className="h-4 w-4" />
                        <span>Kopiuj dane</span>
                    </Button>
                </div>
                {clothingSet && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenClothingDialog}
                        className="h-9 gap-2 bg-background/50"
                    >
                        <Shirt className="h-4 w-4" />
                        <span>Wydaj odzież</span>
                    </Button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-6 pb-8">
                
                {/* Panel 1: Dane osobowe */}
                <div className="flex flex-col gap-4 p-5 border border-black/5 bg-white/60 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 rounded-full bg-primary" />
                      <h3 className="font-semibold text-foreground">Dane osobowe</h3>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">Nazwisko</Label>
                        <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="h-10 transition-all focus:ring-2 focus:ring-primary/20" placeholder="np. Kowalski" />
                        {renderError('lastName')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">Imię</Label>
                        <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-10 transition-all focus:ring-2 focus:ring-primary/20" placeholder="np. Jan" />
                        {renderError('firstName')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Narodowość</Label>
                        <Select value={formData.nationality} onValueChange={value => handleChange('nationality', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder="Wybierz" />
                            </SelectTrigger>
                            <SelectContent>
                                {nationalities.map(n => <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('nationality')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Status legalizacyjny</Label>
                        <Select value={formData.legalizationStatus || 'Brak'} onValueChange={value => handleChange('legalizationStatus', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder="Wybierz" />
                            </SelectTrigger>
                            <SelectContent>
                                {legalizationStatuses.map(status => (
                                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderError('legalizationStatus')}
                    </div>
                </div>

                {/* Panel 2: Zatrudnienie */}
                <div className="flex flex-col gap-4 p-5 border border-black/5 bg-white/60 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 rounded-full bg-blue-500" />
                      <h3 className="font-semibold text-foreground">Zatrudnienie</h3>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Dział</Label>
                        <Select value={formData.department} onValueChange={value => handleChange('department', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder="Wybierz" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('department')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Stanowisko</Label>
                        <Select value={formData.jobTitle} onValueChange={value => handleChange('jobTitle', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder="Wybierz" />
                            </SelectTrigger>
                            <SelectContent>
                                {jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('jobTitle')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Kierownik</Label>
                        <Select value={formData.manager} onValueChange={value => handleChange('manager', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder="Wybierz" />
                            </SelectTrigger>
                            <SelectContent>
                                {managers.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('manager')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Data zatrudnienia</Label>
                        <DatePickerInput
                            value={formData.hireDate}
                            onChange={(date) => handleChange('hireDate', date)}
                            placeholder="Wybierz datę"
                        />
                        {renderError('hireDate')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Licencja spawacza</Label>
                        <Select value={formData.welderLicense} onValueChange={value => handleChange('welderLicense', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder="Czy posiada?" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Tak">Tak, posiada</SelectItem>
                                <SelectItem value="Nie">Nie posiada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Panel 3: Identyfikacja */}
                <div className="flex flex-col gap-4 p-5 border border-black/5 bg-white/60 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 rounded-full bg-purple-500" />
                      <h3 className="font-semibold text-foreground">Identyfikacja</h3>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-sm font-medium">Numer karty</Label>
                        <Input id="cardNumber" value={formData.cardNumber} onChange={e => handleChange('cardNumber', e.target.value)} className="h-10" placeholder="0000" />
                        {renderError('cardNumber')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lockerNumber" className="text-sm font-medium">Szafka główna</Label>
                        <Input id="lockerNumber" value={formData.lockerNumber} onChange={e => handleChange('lockerNumber', e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="departmentLockerNumber" className="text-sm font-medium">Szafka działowa</Label>
                        <Input id="departmentLockerNumber" value={formData.departmentLockerNumber} onChange={e => handleChange('departmentLockerNumber', e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sealNumber" className="text-sm font-medium">Numer pieczątki</Label>
                        <Input id="sealNumber" value={formData.sealNumber} onChange={e => handleChange('sealNumber', e.target.value)} className="h-10" />
                    </div>
                </div>

                {/* Panel 4: Planowanie */}
                <div className="flex flex-col gap-4 p-5 border border-black/5 bg-white/60 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 rounded-full bg-orange-500" />
                      <h3 className="font-semibold text-foreground">Planowanie</h3>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Plan. zwolnienie</Label>
                        <DatePickerInput value={formData.plannedTerminationDate} onChange={d => handleChange('plannedTerminationDate', d)} placeholder="Wybierz datę" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Urlop od</Label>
                        <DatePickerInput value={formData.vacationStartDate} onChange={d => handleChange('vacationStartDate', d)} placeholder="Początek" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Urlop do</Label>
                        <DatePickerInput value={formData.vacationEndDate} onChange={d => handleChange('vacationEndDate', d)} placeholder="Koniec" />
                        {renderError('vacationEndDate')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Data zwolnienia</Label>
                        <DatePickerInput value={formData.terminationDate} onChange={d => handleChange('terminationDate', d)} placeholder="Wybierz datę" />
                    </div>
                    {(employee?.status === 'zwolniony' || formData.terminationDate) ? (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Przepracowane dni</Label>
                            <Input 
                                className="h-10 bg-muted/50 text-muted-foreground cursor-default" 
                                readOnly 
                                value={(() => {
                                    const h = parseMaybeDate(formData.hireDate);
                                    const t = parseMaybeDate(formData.terminationDate);
                                    if (h && t) {
                                        const days = Math.floor((t.getTime() - h.getTime()) / (1000 * 60 * 60 * 24));
                                        return Math.max(0, days).toString();
                                    }
                                    return '';
                                })()} 
                            />
                        </div>
                    ) : null}
                </div>

              </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 mt-auto p-4 md:p-6 bg-background/80 backdrop-blur-xl border-t border-black/5 flex flex-wrap gap-4 justify-between items-center z-10">
                    <div>
                        {employee && employee.status === 'aktywny' && onTerminate && (
                            <Button type="button" variant="ghost" onClick={() => onTerminate(employee.id, employee.fullName)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <UserX className="mr-2 h-4 w-4" />
                                Zwolnij
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3 ml-auto">
                        <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-6">Anuluj</Button>
                        <Button type="submit" className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                            Zapisz зміни
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
