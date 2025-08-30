
'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Employee, AllConfig } from '@/lib/types';
import { Separator } from './ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';

const employeeSchema = z.object({
  fullName: z.string().min(3, "Imię i nazwisko jest wymagane."),
  hireDate: z.string().optional(),
  jobTitle: z.string().min(1, "Stanowisko jest wymagane."),
  department: z.string().min(1, "Dział jest wymagany."),
  manager: z.string().min(1, "Kierownik jest wymagany."),
  cardNumber: z.string().min(1, "Numer karty jest wymagany."),
  nationality: z.string().min(1, "Narodowość jest wymagana."),
  lockerNumber: z.string().optional(),
  departmentLockerNumber: z.string().optional(),
  sealNumber: z.string().optional(),
  plannedTerminationDate: z.string().optional(),
  vacationStartDate: z.string().optional(),
  vacationEndDate: z.string().optional(),
}).refine(data => {
    if (data.vacationStartDate && data.vacationEndDate) {
        return parseISO(data.vacationEndDate) >= parseISO(data.vacationStartDate);
    }
    return true;
}, {
    message: "Data końcowa urlopu nie może być wcześniejsza niż początkowa.",
    path: ["vacationEndDate"],
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  config: AllConfig;
}

export function EmployeeForm({ employee, onSave, onCancel, config }: EmployeeFormProps) {
  const { departments, jobTitles, managers, nationalities } = config;

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: '',
      hireDate: undefined,
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
    }
  });
  
  useEffect(() => {
    if (employee) {
      form.reset({
        ...employee,
        hireDate: employee.hireDate || undefined,
        plannedTerminationDate: employee.plannedTerminationDate || undefined,
        vacationStartDate: employee.vacationStartDate || undefined,
        vacationEndDate: employee.vacationEndDate || undefined,
      });
    } else {
      form.reset({
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
        plannedTerminationDate: undefined,
        vacationStartDate: undefined,
        vacationEndDate: undefined,
      });
    }
  }, [employee, form]);

  const handleSubmit = (data: EmployeeFormData) => {
    onSave({
      ...data,
      id: employee?.id || '',
      status: employee?.status || 'aktywny',
    });
  };

  const DatePickerInput = ({ field, placeholder }: { field: any, placeholder: string }) => {
    const dateValue = field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={"outline"}
              className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, "PPP", { locale: pl }) : <span>{placeholder}</span>}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
            locale={pl}
          />
          {field.value && (
            <Button variant="ghost" size="sm" className="m-2 mt-0" onClick={() => field.onChange(undefined)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Wyczyść datę
            </Button>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię i nazwisko</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data zatrudnienia</FormLabel>
                    <DatePickerInput field={field} placeholder="Wybierz datę" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stanowisko</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dział</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kierownik</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Wybierz kierownika" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {managers.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narodowość</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Wybierz narodowość" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {nationalities.map(n => <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numer karty</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="lockerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numer szafki</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="departmentLockerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numer szafki w dziale</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="sealNumber"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Numer pieczęci</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
        </div>

        <div className="space-y-4">
            <Separator />
            <h3 className="text-lg font-medium text-foreground">Planowanie</h3>
            
            <FormField
              control={form.control}
              name="plannedTerminationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planowana data zwolnienia</FormLabel>
                  <DatePickerInput field={field} placeholder="Wybierz datę zwolnienia" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vacationStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urlop od</FormLabel>
                      <DatePickerInput field={field} placeholder="Początek urlopu" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vacationEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urlop do</FormLabel>
                      <DatePickerInput field={field} placeholder="Koniec urlopu" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Anuluj</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>Zapisz</Button>
        </div>
      </form>
    </Form>
  );
}
