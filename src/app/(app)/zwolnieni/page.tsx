
'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { MoreHorizontal, Search, Loader2, RotateCcw, Edit, Trash2, XCircle } from 'lucide-react';
import type { Employee, HierarchicalOption } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TerminatedExcelImportButton } from '@/components/terminated-excel-import-button';
import { ExcelExportButton } from '@/components/excel-export-button';
import { useToast } from '@/hooks/use-toast';
import { EmployeeForm } from '@/components/employee-form';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { UserX } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppContext } from '@/context/app-context';
import { EmployeeCard } from '@/components/employee-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, parseMaybeDate } from '@/lib/date';
import { format, getYear } from 'date-fns';
import { pl } from 'date-fns/locale';


const exportColumns = [
  { key: 'fullName' as keyof Employee, name: 'Nazwisko i imię' },
  { key: 'hireDate' as keyof Employee, name: 'Data zatrudnienia' },
  { key: 'terminationDate' as keyof Employee, name: 'Data zwolnienia' },
  { key: 'jobTitle' as keyof Employee, name: 'Stanowisko' },
  { key: 'department' as keyof Employee, name: 'Dział' },
  { key: 'manager' as keyof Employee, name: 'Kierownik' },
  { key: 'cardNumber' as keyof Employee, name: 'Nr karty' },
  { key: 'nationality' as keyof Employee, name: 'Narodowość' },
];

const BLANK_FILTER_VALUE = '(Puste)';

export default function ZwolnieniPage() {
  const { employees, config, isLoading, handleSaveEmployee, handleRestoreEmployee, handleDeleteAllHireDates, handleDeleteAllEmployees, handleRestoreAllTerminatedEmployees, handleDeleteEmployeePermanently } = useAppContext();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [selectedTerminationPeriods, setSelectedTerminationPeriods] = useState<string[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectedEmployeeIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

  const departmentOptions: OptionType[] = useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);
  const jobTitleOptions: OptionType[] = useMemo(() => config.jobTitles.map(j => ({ value: j.name, label: j.name })), [config.jobTitles]);
  const managerOptions: OptionType[] = useMemo(() => config.managers.map(m => ({ value: m.name, label: m.name })), [config.managers]);

  const terminatedEmployees = useMemo(() => {
    return employees
      .filter(e => e.status === 'zwolniony')
      .sort((a, b) => {
        const dateA = parseMaybeDate(a.terminationDate);
        const dateB = parseMaybeDate(b.terminationDate);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      });
  }, [employees]);

  const terminationPeriodOptions: HierarchicalOption[] = useMemo(() => {
    const hierarchy: Record<string, Record<string, Set<string>>> = {};
    let hasBlank = false;
  
    terminatedEmployees.forEach(emp => {
      const date = parseMaybeDate(emp.terminationDate);
      if (date) {
        const year = getYear(date).toString();
        const monthKey = format(date, 'MM-LLLL', { locale: pl }); // e.g., "07-Lipiec"
        const day = format(date, 'dd.MM.yyyy');
  
        if (!hierarchy[year]) hierarchy[year] = {};
        if (!hierarchy[year][monthKey]) hierarchy[year][monthKey] = new Set();
        hierarchy[year][monthKey].add(day);
      } else {
        hasBlank = true;
      }
    });
  
    const options: HierarchicalOption[] = Object.keys(hierarchy)
      .sort((a, b) => b.localeCompare(a))
      .map(year => ({
        label: year,
        value: year,
        children: Object.keys(hierarchy[year]).sort().map(monthKey => {
            const [monthNum, monthName] = monthKey.split('-');
            return {
                label: monthName,
                value: `${year}-${monthNum}`,
                children: Array.from(hierarchy[year][monthKey]).sort().map(day => ({
                    label: day,
                    value: day,
                })),
            }
        }),
      }));
  
    if (hasBlank) {
      options.push({ label: BLANK_FILTER_VALUE, value: BLANK_FILTER_VALUE });
    }
  
    return options;
  }, [terminatedEmployees]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDepartments([]);
    setSelectedJobTitles([]);
    setSelectedManagers([]);
    setSelectedTerminationPeriods([]);
    setRowSelection({});
  };

  const filteredEmployees = useMemo(() => {
    let filtered = terminatedEmployees;

    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(employee =>
            (employee.fullName && employee.fullName.toLowerCase().includes(searchLower)) ||
            (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower))
        );
    }
    
    if (selectedDepartments.length > 0) {
        filtered = filtered.filter(employee => selectedDepartments.includes(employee.department));
    }
    if (selectedManagers.length > 0) {
        filtered = filtered.filter(employee => selectedManagers.includes(employee.manager));
    }
    if (selectedJobTitles.length > 0) {
        filtered = filtered.filter(employee => selectedJobTitles.includes(employee.jobTitle));
    }

    const dateFilter = (employee: Employee, dateField: 'terminationDate', selectedPeriods: string[]) => {
        if (selectedPeriods.length === 0) return true;
        
        const empDate = parseMaybeDate(employee[dateField]);
        if (!empDate) return selectedPeriods.includes(BLANK_FILTER_VALUE);

        const year = empDate.getFullYear().toString();
        const monthYear = format(empDate, 'yyyy-MM');
        const dayMonthYear = format(empDate, 'dd.MM.yyyy');
        
        return selectedPeriods.some(period => {
            if (period.length === 4) return period === year; // Year
            if (period.length === 7) return period === monthYear; // Month-Year
            if (period.length === 10) return period === dayMonthYear; // Day-Month-Year
            return false;
        });
    };
    
    filtered = filtered.filter(emp => dateFilter(emp, 'terminationDate', selectedTerminationPeriods));
    
    return filtered;
  }, [terminatedEmployees, searchTerm, selectedDepartments, selectedManagers, selectedJobTitles, selectedTerminationPeriods]);
  
  const displayedEmployees = useMemo(() => {
    if (selectedEmployeeIds.length === 0) return filteredEmployees;
    return filteredEmployees.filter(employee => selectedEmployeeIds.includes(employee.id));
  }, [filteredEmployees, selectedEmployeeIds]);

  const onRestoreEmployee = async (employeeId: string, employeeFullName: string) => {
    await handleRestoreEmployee(employeeId, employeeFullName);
  };
  
  const onDeletePermanently = async (id: string) => {
    await handleDeleteEmployeePermanently(id);
    setIsFormOpen(false);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };
  
  const onSave = async (employeeData: Employee) => {
    await handleSaveEmployee(employeeData);
    setEditingEmployee(null);
    setIsFormOpen(false);
  };

  const columns = useMemo<ColumnDef<Employee>[]>(() => [
      { 
          accessorKey: "fullName", 
          header: "Nazwisko i imię",
          cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatarDataUri || `https://avatar.vercel.sh/${employee.fullName}.png`} alt={employee.fullName} />
                        <AvatarFallback>{employee.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{employee.fullName}</span>
                </div>
            )
        }
      },
      { accessorKey: "hireDate", header: "Data zatrudnienia", cell: ({row}) => formatDate(row.original.hireDate, 'yyyy-MM-dd')},
      { accessorKey: "terminationDate", header: "Data zwolnienia", cell: ({row}) => formatDate(row.original.terminationDate, 'yyyy-MM-dd') },
      { accessorKey: "jobTitle", header: "Stanowisko" },
      { accessorKey: "department", header: "Dział" },
      { accessorKey: "manager", header: "Kierownik" },
      { accessorKey: "cardNumber", header: "Nr karty" },
      { accessorKey: "nationality", header: "Narodowość" },
      {
        id: "actions",
        cell: ({ row }) => {
          const employee = row.original;
          return (
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
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Przywróć
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                     <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usuń trwale
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
              </DropdownMenu>
          );
        },
      },
  ], []);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: displayedEmployees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 170, // Approximate height of a card
    overscan: 5,
  });

  const renderMobileView = () => {
    if (displayedEmployees.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
          <UserX className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold">Brak pracowników</h3>
          <p className="text-sm">Nie znaleziono pracowników pasujących do wybranych kryteriów filtrowania.</p>
        </div>
      )
    }
    return (
      <div ref={parentRef} className="w-full h-full overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const employee = displayedEmployees[virtualItem.index];
            return (
              <div
                key={employee.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="p-2"
              >
                <EmployeeCard 
                    employee={employee}
                    onEdit={() => handleEditEmployee(employee)}
                    onRestore={() => onRestoreEmployee(employee.id, employee.fullName)}
                    onDeletePermanently={() => onDeletePermanently(employee.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  if (isLoading || !hasMounted) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const hasActiveFilters = searchTerm || selectedDepartments.length > 0 || selectedJobTitles.length > 0 || selectedManagers.length > 0 || selectedTerminationPeriods.length > 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pracownicy zwolnieni"
        description="Przeglądaj historię zwolnionych pracowników."
      >
        <div className="hidden md:flex shrink-0 items-center space-x-2">
            <ExcelExportButton employees={displayedEmployees} fileName="zwolnieni_pracownicy" columns={exportColumns} />
            <TerminatedExcelImportButton />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Przywróć wszystkich
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej akcji nie można cofnąć. Spowoduje to przywrócenie wszystkich zwolnionych
                    pracowników do listy aktywnych.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestoreAllTerminatedEmployees}>Kontynuuj</AlertDialogAction>
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
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-3xl max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edytuj pracownika</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto -mr-6 pr-6">
            <EmployeeForm
              employee={editingEmployee}
              onSave={onSave}
              onCancel={() => setIsFormOpen(false)}
              config={config}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Szukaj po nazwisku, imieniu, karcie..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              <XCircle className="mr-2 h-4 w-4" />
              Wyczyść filtry
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <MultiSelect
              title="Dział"
              options={departmentOptions}
              selected={selectedDepartments}
              onChange={setSelectedDepartments}
            />
            <MultiSelect
              title="Stanowisko"
              options={jobTitleOptions}
              selected={selectedJobTitles}
              onChange={setSelectedJobTitles}
            />
            <MultiSelect
              title="Okres zwolnienia"
              options={terminationPeriodOptions}
              selected={selectedTerminationPeriods}
              onChange={setSelectedTerminationPeriods}
            />
        </div>
      </div>
      
       <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <span>
          Znaleziono: <span className="font-bold text-foreground">{displayedEmployees.length}</span> z {terminatedEmployees.length}
        </span>
      </div>

       <div className="flex flex-col flex-grow">
        {hasMounted && isMobile 
          ? renderMobileView() 
          : (
             <AlertDialog>
                <DataTable 
                  columns={columns} 
                  data={displayedEmployees} 
                  onRowClick={handleEditEmployee}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                />
                 <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tej akcji nie można cofnąć. Pracownik zostanie przywrócony do listy aktywnych.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                      <AlertDialogAction onClick={() => displayedEmployees[0] && onRestoreEmployee(displayedEmployees[0].id, displayedEmployees[0].fullName)}>
                        Przywróć
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                   <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie pracownika i wszystkich jego danych z bazy danych.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                      <AlertDialogAction onClick={() => displayedEmployees[0] && onDeletePermanently(displayedEmployees[0].id)}>
                        Usuń trwale
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
             </AlertDialog>
           )
        }
      </div>
    </div>
  );
}
