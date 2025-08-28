
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MoreHorizontal, Search, Loader2, RotateCcw, Edit, CalendarIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Employee, AllConfig } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { db } from '@/lib/firebase';
import { ref, update, remove, onValue } from "firebase/database";
import { format, parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TerminatedExcelImportButton } from '@/components/terminated-excel-import-button';
import { useToast } from '@/hooks/use-toast';
import { EmployeeForm } from '@/components/employee-form';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const ITEMS_PER_PAGE = 50;

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};


export default function TerminatedEmployeesPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [config, setConfig] = useState<AllConfig>({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: []});
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: undefined, to: undefined });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const configRef = ref(db, 'config');
    
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
        const data = snapshot.val();
        setEmployees(objectToArray(data));
        setIsLoading(false);
    });
    
    const unsubscribeConfig = onValue(configRef, (snapshot) => {
        const data = snapshot.val();
        setConfig({
            departments: objectToArray(data?.departments),
            jobTitles: objectToArray(data?.jobTitles),
            managers: objectToArray(data?.managers),
            nationalities: objectToArray(data?.nationalities),
            clothingItems: objectToArray(data?.clothingItems),
        });
    });

    return () => {
        unsubscribeEmployees();
        unsubscribeConfig();
    }
  }, []);

  const departmentOptions: OptionType[] = useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);
  const jobTitleOptions: OptionType[] = useMemo(() => config.jobTitles.map(j => ({ value: j.name, label: j.name })), [config.jobTitles]);
  const managerOptions: OptionType[] = useMemo(() => config.managers.map(m => ({ value: m.name, label: m.name })), [config.managers]);

  const terminatedEmployees = useMemo(() => employees.filter(e => e.status === 'zwolniony'), [employees]);

  const filteredEmployees = useMemo(() => {
    return terminatedEmployees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();

      const isInDateRange = () => {
        if (!dateRange.from && !dateRange.to) return true;
        if (!employee.terminationDate || typeof employee.terminationDate !== 'string') return false;
        
        try {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(employee.terminationDate)) return false;

          const terminationDate = parse(employee.terminationDate, 'yyyy-MM-dd', new Date());
          if (isNaN(terminationDate.getTime())) return false;

          const from = dateRange.from ? startOfDay(dateRange.from) : undefined;
          const to = dateRange.to ? endOfDay(dateRange.to) : undefined;
          
          if (from && to) return isWithinInterval(terminationDate, { start: from, end: to });
          if (from) return terminationDate >= from;
          if (to) return terminationDate <= to;
          return true;
        } catch (e) {
          console.error("Error parsing termination date:", e);
          return false;
        }
      };

      return (
        ((employee.fullName && employee.fullName.toLowerCase().includes(searchLower)) ||
          (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower))) &&
        (selectedDepartments.length === 0 || selectedDepartments.includes(employee.department)) &&
        (selectedManagers.length === 0 || selectedManagers.includes(employee.manager)) &&
        (selectedJobTitles.length === 0 || selectedJobTitles.includes(employee.jobTitle)) &&
        isInDateRange()
      );
    });
  }, [terminatedEmployees, searchTerm, selectedDepartments, selectedManagers, selectedJobTitles, dateRange]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartments, selectedManagers, selectedJobTitles, dateRange]);

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

  const handleDeleteAllHireDates = async () => {
    try {
      const updates: Record<string, any> = {};
      employees.forEach(employee => {
        updates[`/employees/${employee.id}/hireDate`] = null;
      });
      await update(ref(db), updates);
      toast({
        title: 'Sukces',
        description: 'Wszystkie daty zatrudnienia zostały usunięte.',
      });
    } catch (error) {
      console.error("Error deleting all hire dates: ", error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się usunąć dat zatrudnienia.',
      });
    }
  };

  const handleDeleteAllEmployees = async () => {
    try {
      await remove(ref(db, 'employees'));
      toast({
        title: 'Sukces',
        description: 'Wszyscy pracownicy zostali usunięci.',
      });
    } catch (error) {
      console.error("Error deleting all employees: ", error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się usunąć pracowników.',
      });
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
            disabled={currentPage >= totalPages}
        >
            Następna
            <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
    </div>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {paginatedEmployees.map(employee => (
        <Card key={employee.id} onClick={() => handleEditEmployee(employee)} className="cursor-pointer">
          <CardHeader>
            <CardTitle>{employee.fullName}</CardTitle>
            <CardDescription>{employee.jobTitle}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Data zwolnienia: {employee.terminationDate}</p>
            <p>Dział: {employee.department}</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                  <span className="sr-only">Otwórz menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleEditEmployee(employee); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edytuj
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleRestoreEmployee(employee.id); }}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Przywróć
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
  
  const renderDesktopView = () => (
    <div className="flex-grow overflow-auto rounded-lg border">
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
          {paginatedEmployees.length > 0 ? paginatedEmployees.map(employee => (
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
  );
  
  if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pracownicy zwolnieni"
        description="Przeglądaj historię zwolnionych pracowników."
      >
        <div className="hidden md:flex shrink-0 items-center space-x-2">
            <TerminatedExcelImportButton />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Usuń daty
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie wszystkich
                    dat zatrudnienia dla wszystkich pracowników (aktywnych i zwolnionych).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllHireDates}>Kontynuuj</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Usuń wszystkich
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie wszystkich
                    pracowników (aktywnych i zwolnionych) z bazy danych.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllEmployees}>Kontynuuj</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
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
              config={config}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mb-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Szukaj po nazwisku, imieniu, karcie..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <MultiSelect
              options={departmentOptions}
              selected={selectedDepartments}
              onChange={setSelectedDepartments}
              placeholder="Filtruj po dziale"
            />
            <MultiSelect
              options={jobTitleOptions}
              selected={selectedJobTitles}
              onChange={setSelectedJobTitles}
              placeholder="Filtruj po stanowisku"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
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
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP", { locale: pl }) : <span>Zwolniony do</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateRange.to} onSelect={handleDateChange('to')} locale={pl} />
              </PopoverContent>
            </Popover>
        </div>
      </div>


      <div className="flex flex-col flex-grow">
        {isMobile ? renderMobileView() : renderDesktopView()}
        {totalPages > 1 && <PaginationControls />}
      </div>
    </div>
  );
}

    

    