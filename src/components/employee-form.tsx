'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Employee, ConfigItem } from '@/lib/types';

const getInitialFormData = (employee: Employee | null): Omit<Employee, 'id' | 'status'> => {
  if (employee) {
    return { ...employee };
  }
  return {
    fullName: '',
    hireDate: new Date().toISOString().split('T')[0],
    jobTitle: '',
    department: '',
    manager: '',
    cardNumber: '',
    nationality: '',
    lockerNumber: '',
    departmentLockerNumber: '',
    sealNumber: '',
  };
};

interface EmployeeFormProps {
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  config: {
    departments: ConfigItem[];
    jobTitles: ConfigItem[];
    managers: ConfigItem[];
    nationalities: ConfigItem[];
  };
}

export function EmployeeForm({ employee, onSave, onCancel, config }: EmployeeFormProps) {
  const { departments, jobTitles, managers, nationalities } = config;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'status'>>(getInitialFormData(employee));

  useEffect(() => {
    setFormData(getInitialFormData(employee));
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof Omit<Employee, 'id' | 'status'>) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, hireDate: format(date, 'yyyy-MM-dd') }));
      setIsCalendarOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: employee?.id || '',
      status: employee?.status || 'aktywny',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Imię i nazwisko</Label>
          <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hireDate">Data zatrudnienia</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.hireDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.hireDate ? format(new Date(formData.hireDate), "PPP", { locale: pl }) : <span>Wybierz datę</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.hireDate ? new Date(formData.hireDate) : undefined}
                onSelect={handleDateChange}
                initialFocus
                locale={pl}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Stanowisko</Label>
          <Select name="jobTitle" onValueChange={handleSelectChange('jobTitle')} value={formData.jobTitle || ''} required>
            <SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
            <SelectContent>
              {jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Dział</Label>
          <Select name="department" onValueChange={handleSelectChange('department')} value={formData.department || ''} required>
            <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
            <SelectContent>
              {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="manager">Kierownik</Label>
          <Select name="manager" onValueChange={handleSelectChange('manager')} value={formData.manager || ''} required>
            <SelectTrigger><SelectValue placeholder="Wybierz kierownika" /></SelectTrigger>
            <SelectContent>
              {managers.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Narodowość</Label>
          <Select name="nationality" onValueChange={handleSelectChange('nationality')} value={formData.nationality || ''} required>
            <SelectTrigger><SelectValue placeholder="Wybierz narodowość" /></SelectTrigger>
            <SelectContent>
              {nationalities.map(n => <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Numer karty</Label>
          <Input id="cardNumber" name="cardNumber" value={formData.cardNumber || ''} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lockerNumber">Numer szafki</Label>
          <Input id="lockerNumber" name="lockerNumber" value={formData.lockerNumber || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="departmentLockerNumber">Numer szafki w dziale</Label>
          <Input id="departmentLockerNumber" name="departmentLockerNumber" value={formData.departmentLockerNumber || ''} onChange={handleChange} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="sealNumber">Numer pieczęci</Label>
          <Input id="sealNumber" name="sealNumber" value={formData.sealNumber || ''} onChange={handleChange} />
        </div>
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Anuluj</Button>
        <Button type="submit">Zapisz</Button>
      </div>
    </form>
  );
}
