'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MoreHorizontal, Search, Loader2, RotateCcw, Edit, CalendarIcon } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { useFirebaseData } from '@/context/config-context';
import { db } from '@/lib/firebase';
import { ref, update } from "firebase/database";
import { format, parseISO, isWithinInterval } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TerminatedExcelImportButton } from '@/components/terminated-excel-import-button';

const EmployeeForm = dynamic(() => import('@/components/employee-form').then(mod => mod.EmployeeForm), {
  loading: () => <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  ssr: false
});

export default function TerminatedEmployeesPage() {
  const { employees, config, isLoading } = useFirebaseData();
  const { departments, jobTitles, managers, nationalities } = config;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    manager: '',
    jobTitle: '',
  });
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: undefined, to: undefined });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const terminatedEmployees = useMemo(() => employees.filter(e => e.status === 'zwolniony'), [employees]);

  const filteredEmployees = useMemo(() => {
    return terminatedEmployees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();

      const isInDateRange = () => {
        if (!dateRange.from && !dateRange.to) return true;
        if (!employee.terminationDate) return false;
        try {
          const terminationDate = parseISO(employee.terminationDate);
          const from = dateRange.from ? new Date(dateRange.from.setHours(0, 0, 0, 0)) : undefined;
          const to = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : undefined;
          if (from && to) return isWithinInterval(terminationDate, { start: from, end: to });
          if (from) return terminationDate >= from;
          if (to) return terminationDate <= to;
          return true;
        } catch (e) {
          return true; // Ignore invalid dates
        }
      };

      return (
        ((employee.fullName && employee.fullName.toLowerCase().includes(searchLower)) ||
          (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower))) &&
        (filters.department ? employee.department === filters.department : true) &&
        (filters.manager ? employee.manager === filters.manager : true) &&
        (filters.jobTitle ? employee.jobTitle === filters.jobTitle : true) &&
        isInDateRange()
      );
    });
  }, [terminatedEmployees, searchTerm, filters, dateRange]);

  const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value === 'all' ? '' : value }));
  };
  
  const handleDateChange = (type: 'from' | 'to') => (date: Date | undefined) => {
    setDateRange(prev => ({ ...prev, [type]: date }));
  };

  const handleRestoreEmployee = async (employeeId: string) => {
    if (window.confirm('Czy na pewno chcesz przywrócić tego pracownika?')) {
        try {
            const employeeRef = ref(db, `employees/${employeeId}`);
            await update(employeeRef, {
                status: 'aktywny',
                terminationDate: null 
            });
        } catch (error) {
            console.error("Error restoring employee: ", error);
        }
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };
  
  const handleSaveEmployee = async (employeeData: Employee) => {
    if (!editingEmployee) return;
    try {
        const { id, ...dataToSave } = employeeData;
        const employeeRef = ref(db, `employees/${id}`);
        await update(employeeRef, dataToSave);
        setEditingEmployee(null);
        setIsFormOpen(false);
    } catch (error) {
        console.error("Error saving employee: ", error);
    }
  };
  
  if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pracownicy zwolnieni"
        description="Przeglądaj historię zwolnionych pracowników."
      >
        <TerminatedExcelImportButton />
      </PageHeader>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edytuj pracownika</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2">
            <EmployeeForm
              employee={editingEmployee}
              onSave={handleSaveEmployee}
              onCancel={() => setIsFormOpen(false)}
              config={{ departments, jobTitles, managers, nationalities }}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Szukaj po nazwisku, imieniu, karcie..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select onValueChange={handleFilterChange('department')} value={filters.department}>
          <SelectTrigger><SelectValue placeholder="Filtruj po dziale" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie działy</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={handleFilterChange('jobTitle')} value={filters.jobTitle}>
          <SelectTrigger><SelectValue placeholder="Filtruj po stanowisku" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie stanowiska</SelectItem>
            {jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? format(dateRange.from, "PPP", { locale: pl }) : <span>Zwolniony od</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateRange.from} onSelect={handleDateChange('from')} locale={pl} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.to ? format(dateRange.to, "PPP", { locale: pl }) : <span>Zwolniony do</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateRange.to} onSelect={handleDateChange('to')} locale={pl} />
          </PopoverContent>
        </Popover>
      </div>

       {/* Mobile View - Cards */}
       <div className="flex-grow space-y-4 lg:hidden">
        {filteredEmployees.map(employee => (
          <Card key={employee.id} className="w-full" onClick={() => handleEditEmployee(employee)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{employee.fullName}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <span className="sr-only">Otwórz menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                   <DropdownMenuItem onSelect={() => handleEditEmployee(employee)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edytuj
                    </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleRestoreEmployee(employee.id)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Przywróć
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong className="text-muted-foreground">Stanowisko:</strong> {employee.jobTitle}</p>
              <p><strong className="text-muted-foreground">Dział:</strong> {employee.department}</p>
              <p><strong className="text-muted-foreground">Narodowość:</strong> {employee.nationality}</p>
              <p><strong className="text-muted-foreground">Data zwolnienia:</strong> {employee.terminationDate}</p>
            </CardContent>
          </Card>
        ))}
        {filteredEmployees.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-10">Brak zwolnionych pracowników pasujących do kryteriów.</div>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden flex-grow overflow-auto rounded-lg border lg:block">
        <Table>
          <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
            <TableRow>
              <TableHead>Nazwisko i imię</TableHead>
              <TableHead>Data zatrudnienia</TableHead>
              <TableHead>Data zwolnienia</TableHead>
              <TableHead>Stanowisko</TableHead>
              <TableHead>Dział</TableHead>
              <TableHead>Kierownik</TableHead>
              <TableHead>Nr karty</TableHead>
              <TableHead>Narodowość</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? filteredEmployees.map(employee => (
              <TableRow key={employee.id} onClick={() => handleEditEmployee(employee)} className="cursor-pointer">
                <TableCell className="font-medium">{employee.fullName}</TableCell>
                <TableCell>{employee.hireDate}</TableCell>
                <TableCell>{employee.terminationDate}</TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.manager}</TableCell>
                <TableCell>{employee.cardNumber}</TableCell>
                <TableCell>{employee.nationality}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Otwórz menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                           <DropdownMenuItem onSelect={() => handleEditEmployee(employee)}>
                             <Edit className="mr-2 h-4 w-4" />
                              Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleRestoreEmployee(employee.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Przywróć
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : !isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Brak zwolnionych pracowników pasujących do kryteriów.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
