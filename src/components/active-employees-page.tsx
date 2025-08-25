'use client';

import React, { useState, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, Bot } from 'lucide-react';
import { activeEmployees } from '@/lib/mock-data';
import type { Employee } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { EmployeeForm } from './employee-form';
import { EmployeeSummary } from './employee-summary';
import { useConfig } from '@/context/config-context';

export default function ActiveEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(activeEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const { departments, jobTitles, managers, nationalities } = useConfig();
  const [filters, setFilters] = useState({
    department: '',
    manager: '',
    jobTitle: '',
    nationality: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (employee.firstName.toLowerCase().includes(searchLower) ||
          employee.lastName.toLowerCase().includes(searchLower) ||
          employee.cardNumber.toLowerCase().includes(searchLower)) &&
        (filters.department ? employee.department === filters.department : true) &&
        (filters.manager ? employee.manager === filters.manager : true) &&
        (filters.jobTitle ? employee.jobTitle === filters.jobTitle : true) &&
        (filters.nationality ? employee.nationality === filters.nationality : true)
      );
    });
  }, [employees, searchTerm, filters]);

  const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value === 'all' ? '' : value }));
  };

  const handleSaveEmployee = (employee: Employee) => {
    if (editingEmployee) {
      setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
    } else {
      setEmployees(prev => [...prev, { ...employee, id: `e${prev.length + 10}` }]);
    }
    setEditingEmployee(null);
    setIsFormOpen(false);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  }

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Pracownicy aktywni"
        description="Przeglądaj, filtruj i zarządzaj aktywnymi pracownikami."
      >
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Dodaj pracownika
        </Button>
      </PageHeader>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edytuj pracownika' : 'Dodaj nowego pracownika'}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={editingEmployee}
            onSave={handleSaveEmployee}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Szukaj po nazwisku, imieniu, karcie..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select onValueChange={handleFilterChange('department')}>
          <SelectTrigger><SelectValue placeholder="Filtruj po dziale" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie działy</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={handleFilterChange('jobTitle')}>
          <SelectTrigger><SelectValue placeholder="Filtruj po stanowisku" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie stanowiska</SelectItem>
            {jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={handleFilterChange('manager')}>
          <SelectTrigger><SelectValue placeholder="Filtruj po kierowniku" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy kierownicy</SelectItem>
            {managers.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-grow overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50">
            <TableRow>
              <TableHead>Nazwisko i imię</TableHead>
              <TableHead>Data zatrudnienia</TableHead>
              <TableHead>Stanowisko</TableHead>
              <TableHead>Dział</TableHead>
              <TableHead>Kierownik</TableHead>
              <TableHead>Nr karty</TableHead>
              <TableHead>Narodowość</TableHead>
              <TableHead>Nr szafki</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map(employee => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.lastName} {employee.firstName}</TableCell>
                <TableCell>{employee.hireDate}</TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.manager}</TableCell>
                <TableCell>{employee.cardNumber}</TableCell>
                <TableCell>{employee.nationality}</TableCell>
                <TableCell>{employee.lockerNumber}</TableCell>
                <TableCell className="text-right">
                    <EmployeeSummary employee={employee}>
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
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Bot className="mr-2 h-4 w-4" />
                                   Generuj podsumowanie
                               </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteEmployee(employee.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Usuń
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </EmployeeSummary>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
