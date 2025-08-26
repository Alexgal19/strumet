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
import { MoreHorizontal, Search, Loader2, RotateCcw } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { useFirebaseData } from '@/context/config-context';
import { db } from '@/lib/firebase';
import { ref, update } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TerminatedEmployeesPage() {
  const { employees, config, isLoading } = useFirebaseData();
  const { departments, jobTitles, managers } = config;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    manager: '',
    jobTitle: '',
  });

  const terminatedEmployees = useMemo(() => employees.filter(e => e.status === 'zwolniony'), [employees]);

  const filteredEmployees = useMemo(() => {
    return terminatedEmployees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();
      return (
        ((employee.fullName && employee.fullName.toLowerCase().includes(searchLower)) ||
          (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower))) &&
        (filters.department ? employee.department === filters.department : true) &&
        (filters.manager ? employee.manager === filters.manager : true) &&
        (filters.jobTitle ? employee.jobTitle === filters.jobTitle : true)
      );
    });
  }, [terminatedEmployees, searchTerm, filters]);

  const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value === 'all' ? '' : value }));
  };

  const handleRestoreEmployee = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz przywrócić tego pracownika?')) {
        try {
            const employeeRef = ref(db, `employees/${id}`);
            await update(employeeRef, {
                status: 'aktywny',
                terminationDate: null 
            });
        } catch (error) {
            console.error("Error restoring employee: ", error);
        }
    }
  };
  
  if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pracownicy zwolnieni"
        description="Przeglądaj historię zwolnionych pracowników."
      />
      
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
      </div>

       {/* Mobile View - Cards */}
       <div className="flex-grow space-y-4 md:hidden">
        {filteredEmployees.map(employee => (
          <Card key={employee.id} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{employee.fullName}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Otwórz menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                  <DropdownMenuItem className="text-destructive" onSelect={() => handleRestoreEmployee(employee.id)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Przywróć
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong className="text-muted-foreground">Stanowisko:</strong> {employee.jobTitle}</p>
              <p><strong className="text-muted-foreground">Dział:</strong> {employee.department}</p>
              <p><strong className="text-muted-foreground">Data zwolnienia:</strong> {employee.terminationDate}</p>
            </CardContent>
          </Card>
        ))}
        {filteredEmployees.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-10">Brak zwolnionych pracowników.</div>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden flex-grow overflow-auto rounded-lg border md:block">
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
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? filteredEmployees.map(employee => (
              <TableRow key={employee.id} className="cursor-pointer">
                <TableCell className="font-medium">{employee.fullName}</TableCell>
                <TableCell>{employee.hireDate}</TableCell>
                <TableCell>{employee.terminationDate}</TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.manager}</TableCell>
                <TableCell>{employee.cardNumber}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Otwórz menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                          <DropdownMenuItem className="text-destructive" onSelect={() => handleRestoreEmployee(employee.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Przywróć
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : !isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Brak zwolnionych pracowników.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

    