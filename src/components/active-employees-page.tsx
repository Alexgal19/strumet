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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, Search, UserX, Edit, Bot, Loader2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { useFirebaseData } from '@/context/config-context';
import { db } from '@/lib/firebase';
import { ref, set, push, update } from "firebase/database";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ExcelImportButton } from './excel-import-button';

const EmployeeForm = dynamic(() => import('./employee-form').then(mod => mod.EmployeeForm), {
  loading: () => <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  ssr: false
});

const EmployeeSummary = dynamic(() => import('./employee-summary').then(mod => mod.EmployeeSummary), {
  ssr: false
});

const ITEMS_PER_PAGE = 50;

export default function ActiveEmployeesPage() {
  const { employees, config, isLoading } = useFirebaseData();
  const { departments, jobTitles, managers, nationalities } = config;
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    manager: '',
    jobTitle: '',
    nationality: '',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();
      return (
        ((employee.fullName && employee.fullName.toLowerCase().includes(searchLower)) ||
          (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower))) &&
        (filters.department ? employee.department === filters.department : true) &&
        (filters.manager ? employee.manager === filters.manager : true) &&
        (filters.jobTitle ? employee.jobTitle === filters.jobTitle : true) &&
        (filters.nationality ? employee.nationality === filters.nationality : true)
      );
    });
  }, [activeEmployees, searchTerm, filters]);
  
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage]);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value === 'all' ? '' : value }));
  };

  const handleSaveEmployee = async (employeeData: Employee) => {
    try {
        const { id, ...dataToSave } = employeeData;
        if (id) {
            const employeeRef = ref(db, `employees/${id}`);
            await update(employeeRef, dataToSave);
        } else {
            const newEmployeeRef = push(ref(db, 'employees'));
            await set(newEmployeeRef, { ...dataToSave, id: newEmployeeRef.key });
        }
        setEditingEmployee(null);
        setIsFormOpen(false);
    } catch (error) {
        console.error("Error saving employee: ", error);
    }
  };
  
  const handleTerminateEmployee = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz zwolnić tego pracownika?')) {
        try {
            const employeeRef = ref(db, `employees/${id}`);
            await update(employeeRef, {
                status: 'zwolniony',
                terminationDate: format(new Date(), 'yyyy-MM-dd')
            });
        } catch (error) {
            console.error("Error terminating employee: ", error);
        }
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  }

  const handleCopy = (employee: Employee) => {
    const textToCopy = `${employee.fullName}\n${employee.jobTitle}\n${employee.department}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        toast({
            title: 'Skopiowano!',
            description: 'Dane pracownika zostały skopiowane do schowka.',
        });
    });
  };
  
  const PaginationControls = () => (
    <div className="flex items-center justify-center space-x-4 pt-4">
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
        >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Poprzednia
        </Button>
        <span className="text-sm font-medium">
            Strona {currentPage} z {totalPages}
        </span>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
        >
            Następna
            <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
    </div>
  );

  if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader
        title="Pracownicy aktywni"
        description="Przeglądaj, filtruj i zarządzaj aktywnymi pracownikami."
      >
        <ExcelImportButton />
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Dodaj pracownika
        </Button>
      </PageHeader>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingEmployee ? 'Edytuj pracownika' : 'Dodaj nowego pracownika'}</DialogTitle>
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
      
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
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
        <Select onValueChange={handleFilterChange('manager')} value={filters.manager}>
          <SelectTrigger><SelectValue placeholder="Filtruj po kierowniku" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy kierownicy</SelectItem>
            {managers.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

       {/* Mobile View - Cards */}
       <div className="flex-grow space-y-4 lg:hidden">
        {paginatedEmployees.map(employee => (
          <Card key={employee.id} className="w-full" onClick={() => handleEditEmployee(employee)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{employee.fullName}</CardTitle>
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleCopy(employee)}>
                    <span className="sr-only">Kopiuj dane</span>
                    <Copy className="h-4 w-4" />
                </Button>
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
                      <DropdownMenuItem>
                        <Bot className="mr-2 h-4 w-4" />
                        Generuj podsumowanie
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onSelect={() => handleTerminateEmployee(employee.id)}>
                        <UserX className="mr-2 h-4 w-4" />
                        Zwolnij
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </EmployeeSummary>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong className="text-muted-foreground">Stanowisko:</strong> {employee.jobTitle}</p>
              <p><strong className="text-muted-foreground">Dział:</strong> {employee.department}</p>
              <p><strong className="text-muted-foreground">Nr karty:</strong> {employee.cardNumber}</p>
            </CardContent>
          </Card>
        ))}
        {totalPages > 1 && <PaginationControls />}
        {filteredEmployees.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-10">Brak aktywnych pracowników pasujących do kryteriów.</div>
        )}
      </div>


      {/* Desktop View - Table */}
      <div className="hidden flex-col flex-grow lg:flex">
        <div className="flex-grow overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
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
                {paginatedEmployees.length > 0 ? paginatedEmployees.map(employee => (
                  <TableRow key={employee.id} onClick={() => handleEditEmployee(employee)} className="cursor-pointer">
                    <TableCell className="font-medium">{employee.fullName}</TableCell>
                    <TableCell>{employee.hireDate}</TableCell>
                    <TableCell>{employee.jobTitle}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.manager}</TableCell>
                    <TableCell>{employee.cardNumber}</TableCell>
                    <TableCell>{employee.nationality}</TableCell>
                    <TableCell>{employee.lockerNumber}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                                   <DropdownMenuItem onSelect={() => handleCopy(employee)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Kopiuj dane
                                  </DropdownMenuItem>
                                   <DropdownMenuItem>
                                      <Bot className="mr-2 h-4 w-4" />
                                       Generuj podsumowanie
                                   </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onSelect={() => handleTerminateEmployee(employee.id)}>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Zwolnij
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </EmployeeSummary>
                    </TableCell>
                  </TableRow>
                )) : !isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      Brak aktywnych pracowników pasujących do kryteriów.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
        {totalPages > 1 && <PaginationControls />}
      </div>
    </div>
  );
}
