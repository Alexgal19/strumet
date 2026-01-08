'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, Search, UserX, Edit, Bot, Loader2, Trash2, XCircle } from 'lucide-react';
import type { Employee, HierarchicalOption } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ExcelImportButton } from '@/components/excel-import-button';
import { HireDateImportButton } from '@/components/hire-date-import-button';
import { ContractEndDateImportButton } from '@/components/contract-end-date-import-button';
import { ExcelExportButton } from '@/components/excel-export-button';
import { MultiSelect } from '@/components/ui/multi-select';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { EmployeeForm } from '@/components/employee-form';
import { DataTable } from '@/components/data-table';
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppContext } from '@/context/app-context';
import { EmployeeCard } from '@/components/employee-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, parseMaybeDate } from '@/lib/date';
import { getStatusColor, legalizationStatuses } from '@/lib/legalization-statuses';
import { Badge } from '@/components/ui/badge';
import { format, getYear } from 'date-fns';
import { pl } from 'date-fns/locale';


const EmployeeSummary = dynamic(() => import('@/components/employee-summary').then(mod => mod.EmployeeSummary), {
  ssr: false
});

const exportColumns = [
  { key: 'fullName' as keyof Employee, name: 'Nazwisko i imię' },
  { key: 'hireDate' as keyof Employee, name: 'Data zatrudnienia' },
  { key: 'contractEndDate' as keyof Employee, name: 'Umowa do' },
  { key: 'jobTitle' as keyof Employee, name: 'Stanowisko' },
  { key: 'department' as keyof Employee, name: 'Dział' },
  { key: 'manager' as keyof Employee, name: 'Kierownik' },
  { key: 'cardNumber' as keyof Employee, name: 'Nr karty' },
  { key: 'nationality' as keyof Employee, name: 'Narodowość' },
  { key: 'legalizationStatus' as keyof Employee, name: 'Status legalizacyjny' },
  { key: 'lockerNumber' as keyof Employee, name: 'Nr szafki' },
  { key: 'departmentLockerNumber' as keyof Employee, name: 'Nr szafki w dziale' },
  { key: 'sealNumber' as keyof Employee, name: 'Nr pieczęci' },
];

const BLANK_FILTER_VALUE = '(Puste)';

export default function AktywniPage() {
  const { employees: initialEmployees, config, isLoading: isContextLoading, handleSaveEmployee, handleTerminateEmployee, handleDeleteAllHireDates, handleDeleteAllEmployees, handleDeleteEmployeePermanently, fetchEmployees, hasMore, isFetchingNextPage } = useAppContext();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  const [selectedHirePeriods, setSelectedHirePeriods] = useState<string[]>([]);
  const [selectedContractPeriods, setSelectedContractPeriods] = useState<string[]>([]);
  const [selectedPlannedTerminationPeriods, setSelectedPlannedTerminationPeriods] = useState<string[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectedEmployeeIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);
  
  // Local state for employees to handle infinite scroll
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  useEffect(() => {
    // We only update if the initialEmployees from context has actually changed
    // This avoids re-setting the state on every render
    if (initialEmployees.length > 0 && initialEmployees !== employees) {
      setEmployees(initialEmployees);
    } else if (initialEmployees.length === 0) {
      setEmployees([]);
    }
  }, [initialEmployees]);


  // Effect for fetching initial and filtered data
  useEffect(() => {
    // Reset employees list when filters change
    setEmployees([]);
    fetchEmployees({
        status: 'aktywny',
        limit: 50,
        searchTerm,
        departments: selectedDepartments,
        jobTitles: selectedJobTitles,
        managers: selectedManagers,
    });
  }, [searchTerm, selectedDepartments, selectedJobTitles, selectedManagers, fetchEmployees]);


  const departmentOptions = useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);
  const jobTitleOptions = useMemo(() => config.jobTitles.map(j => ({ value: j.name, label: j.name })), [config.jobTitles]);
  const managerOptions = useMemo(() => config.managers.map(m => ({ value: m.name, label: m.name })), [config.managers]);
  const nationalityOptions = useMemo(() => config.nationalities.map(n => ({ value: n.name, label: n.name })), [config.nationalities]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDepartments([]);
    setSelectedJobTitles([]);
    setSelectedManagers([]);
    setSelectedNationalities([]);
    setSelectedHirePeriods([]);
    setSelectedContractPeriods([]);
    setSelectedPlannedTerminationPeriods([]);
    setRowSelection({});
  };

  const displayedEmployees = useMemo(() => {
     if (selectedEmployeeIds.length === 0) return employees;
     return employees.filter(employee => selectedEmployeeIds.includes(employee.id));
  }, [employees, selectedEmployeeIds]);

  const onSave = async (employeeData: Employee) => {
    await handleSaveEmployee(employeeData);
    setEditingEmployee(null);
    setIsFormOpen(false);
  };
  
  const onTerminate = async (id: string, fullName: string) => {
     await handleTerminateEmployee(id, fullName);
     setIsFormOpen(false);
  };
  
  const onDeletePermanently = async (id: string) => {
    await handleDeleteEmployeePermanently(id);
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
    { accessorKey: "hireDate", header: "Data zatrudnienia", cell: ({row}) => formatDate(row.original.hireDate, 'yyyy-MM-dd') },
    { accessorKey: "contractEndDate", header: "Umowa do", cell: ({row}) => formatDate(row.original.contractEndDate, 'yyyy-MM-dd') },
    { accessorKey: "jobTitle", header: "Stanowisko" },
    { accessorKey: "department", header: "Dział" },
    { accessorKey: "manager", header: "Kierownik" },
    { accessorKey: "cardNumber", header: "Nr karty" },
    { accessorKey: "nationality", header: "Narodowość" },
    { 
        accessorKey: "legalizationStatus", 
        header: "Status legalizacyjny",
        cell: ({ row }) => {
            const status = row.original.legalizationStatus;
            if (!status || status === "Brak") {
                return <span className="text-muted-foreground">—</span>;
            }
            const colorClass = getStatusColor(status);
            return (
                <Badge className={cn("text-xs font-semibold", colorClass)}>
                    {status}
                </Badge>
            );
        }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original;
        return (
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
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                      <UserX className="mr-2 h-4 w-4" />
                      Zwolnij
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
          </EmployeeSummary>
        );
      },
    },
  ], []);

  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: hasMore ? employees.length + 1 : employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 170 : 53),
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) {
        return;
    }

    if (lastItem.index >= employees.length - 1 && hasMore && !isFetchingNextPage) {
        const lastEmployee = employees[employees.length - 1];
        fetchEmployees({
            status: 'aktywny',
            limit: 50,
            startAfter: lastEmployee?.fullName,
            lastEmployeeId: lastEmployee?.id,
            searchTerm,
            departments: selectedDepartments,
            jobTitles: selectedJobTitles,
            managers: selectedManagers,
        });
    }
  }, [virtualItems, employees, hasMore, isFetchingNextPage, fetchEmployees, searchTerm, selectedDepartments, selectedJobTitles, selectedManagers]);


  const renderMobileView = () => {
    if (isContextLoading && employees.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    if (employees.length === 0 && !hasMore) {
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
          {virtualItems.map((virtualItem) => {
             const isLoaderRow = virtualItem.index > employees.length - 1;
             const employee = employees[virtualItem.index];
            return (
               <div
                key={isLoaderRow ? 'loader' : employee.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="p-2"
              >
                {isLoaderRow ? (
                    <div className="flex justify-center items-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <EmployeeCard 
                        employee={employee} 
                        onEdit={() => handleEditEmployee(employee)}
                        onTerminate={() => onTerminate(employee.id, employee.fullName)}
                        onDeletePermanently={() => onDeletePermanently(employee.id)}
                    />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasActiveFilters = searchTerm || selectedDepartments.length > 0 || selectedJobTitles.length > 0 || selectedManagers.length > 0 || selectedNationalities.length > 0 || selectedHirePeriods.length > 0 || selectedContractPeriods.length > 0 || selectedPlannedTerminationPeriods.length > 0;

  if (isContextLoading && employees.length === 0 || !hasMounted) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 opacity-100">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader
        title="Pracownicy aktywni"
        description="Przeglądaj, filtruj i zarządzaj aktywnymi pracownikami."
      >
        <div className="hidden md:flex shrink-0 items-center space-x-2">
            <ExcelExportButton employees={employees} fileName="aktywni_pracownicy" columns={exportColumns} />
            <ExcelImportButton />
            <HireDateImportButton />
            <ContractEndDateImportButton />
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
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Dodaj pracownika
            </Button>
        </div>
        <div className="md:hidden">
             <Button onClick={handleAddNew} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Dodaj
            </Button>
        </div>
      </PageHeader>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent 
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="sm:max-w-3xl max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingEmployee ? 'Edytuj pracownika' : 'Dodaj nowego pracownika'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto -mr-6 pr-6">
            <EmployeeForm
              employee={editingEmployee}
              onSave={onSave}
              onCancel={() => setIsFormOpen(false)}
              onTerminate={onTerminate}
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
              title="Kierownik"
              options={managerOptions}
              selected={selectedManagers}
              onChange={setSelectedManagers}
            />
             <MultiSelect
              title="Narodowość"
              options={nationalityOptions}
              selected={selectedNationalities}
              onChange={setSelectedNationalities}
            />
        </div>
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
                getRowProps={(row) => {
                  const status = row.original.legalizationStatus;
                  if (!status || status === 'Brak') return {};
                  const colorClass = getStatusColor(status, true); // Get background color
                  return { className: colorClass };
                }}
              />
               <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej akcji nie można cofnąć. Pracownik zostanie przeniesiony do archiwum.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={() => displayedEmployees[0] && onTerminate(displayedEmployees[0].id, displayedEmployees[0].fullName)}>
                    Kontynuuj
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
