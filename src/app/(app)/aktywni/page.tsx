
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
import { MoreHorizontal, PlusCircle, Search, UserX, Edit, Bot, Loader2, Copy, Trash2, XCircle } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ExcelImportButton } from '@/components/excel-import-button';
import { ExcelExportButton } from '@/components/excel-export-button';
import { MultiSelect, OptionType, GroupedOptionType } from '@/components/ui/multi-select';
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
import { format } from 'date-fns';
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
  const { employees, config, isLoading, handleSaveEmployee, handleTerminateEmployee, handleDeleteAllHireDates, handleDeleteAllEmployees } = useAppContext();
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectedEmployeeIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);
  
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const { hirePeriodOptions, contractPeriodOptions } = useMemo(() => {
    const createGroupedOptions = (dateField: 'hireDate' | 'contractEndDate'): GroupedOptionType => {
      const periods: Record<string, Set<string>> = {};
      let hasBlank = false;
  
      activeEmployees.forEach(emp => {
        const date = parseMaybeDate(emp[dateField]);
        if (date) {
          const year = format(date, 'yyyy');
          const month = format(date, 'yyyy-MM');
          if (!periods[year]) {
            periods[year] = new Set();
          }
          periods[year].add(month);
        } else {
          hasBlank = true;
        }
      });
  
      const groupedOptions: GroupedOptionType = {};
      
      // Add blank option first if it exists
      if (hasBlank) {
        groupedOptions[BLANK_FILTER_VALUE] = [{ value: BLANK_FILTER_VALUE, label: BLANK_FILTER_VALUE }];
      }

      // Sort years descending
      const sortedYears = Object.keys(periods).sort((a, b) => b.localeCompare(a));
  
      sortedYears.forEach(year => {
        const sortedMonths = Array.from(periods[year]).sort();
        groupedOptions[year] = sortedMonths.map(month => ({
          value: month,
          label: format(new Date(month), 'LLLL', { locale: pl }),
        }));
      });
  
      return groupedOptions;
    };
  
    return {
      hirePeriodOptions: createGroupedOptions('hireDate'),
      contractPeriodOptions: createGroupedOptions('contractEndDate'),
    };
  }, [activeEmployees]);


  const departmentOptions: OptionType[] = useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);
  const jobTitleOptions: OptionType[] = useMemo(() => config.jobTitles.map(j => ({ value: j.name, label: j.name })), [config.jobTitles]);
  const managerOptions: OptionType[] = useMemo(() => config.managers.map(m => ({ value: m.name, label: m.name })), [config.managers]);
  const nationalityOptions: OptionType[] = useMemo(() => config.nationalities.map(n => ({ value: n.name, label: n.name })), [config.nationalities]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDepartments([]);
    setSelectedJobTitles([]);
    setSelectedManagers([]);
    setSelectedNationalities([]);
    setSelectedHirePeriods([]);
    setSelectedContractPeriods([]);
    setRowSelection({});
  };

  const filteredEmployees = useMemo(() => {
    let filtered = activeEmployees;

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
    if (selectedNationalities.length > 0) {
      filtered = filtered.filter(employee => selectedNationalities.includes(employee.nationality));
    }
    
    if (selectedHirePeriods.length > 0) {
      filtered = filtered.filter(employee => {
        const hireDate = parseMaybeDate(employee.hireDate);
        if (!hireDate) return selectedHirePeriods.includes(BLANK_FILTER_VALUE);
        const period = format(hireDate, 'yyyy-MM');
        return selectedHirePeriods.includes(period);
      });
    }
    
    if (selectedContractPeriods.length > 0) {
      filtered = filtered.filter(employee => {
        const contractDate = parseMaybeDate(employee.contractEndDate);
        if (!contractDate) return selectedContractPeriods.includes(BLANK_FILTER_VALUE);
        const period = format(contractDate, 'yyyy-MM');
        return selectedContractPeriods.includes(period);
      });
    }

    return filtered.filter(employee => {
      if (selectedEmployeeIds.length === 0) return true;
      return selectedEmployeeIds.includes(employee.id);
    });
  }, [activeEmployees, searchTerm, selectedDepartments, selectedManagers, selectedJobTitles, selectedNationalities, selectedHirePeriods, selectedContractPeriods, selectedEmployeeIds]);


  const onSave = async (employeeData: Employee) => {
    await handleSaveEmployee(employeeData);
    setEditingEmployee(null);
    setIsFormOpen(false);
  };
  
  const onTerminate = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz zwolnić tego pracownika?')) {
        await handleTerminateEmployee(id);
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
    const textToCopy = employee.fullName;
    navigator.clipboard.writeText(textToCopy).then(() => {
        toast({
            title: 'Skopiowano!',
            description: 'Imię i nazwisko pracownika zostało skopiowane.',
        });
    });
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
                   <DropdownMenuItem onSelect={() => handleCopy(employee)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Kopiuj imię
                  </DropdownMenuItem>
                   <DropdownMenuItem>
                      <Bot className="mr-2 h-4 w-4" />
                       Generuj podsumowanie
                   </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onSelect={() => onTerminate(employee.id)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Zwolnij
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </EmployeeSummary>
        );
      },
    },
  ], [onTerminate]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredEmployees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 170, // Approximate height of a card
    overscan: 5,
  });

  const renderMobileView = () => {
    if (filteredEmployees.length === 0) {
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
            const employee = filteredEmployees[virtualItem.index];
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
                    onTerminate={() => onTerminate(employee.id)}
                    onCopy={() => handleCopy(employee)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasActiveFilters = searchTerm || selectedDepartments.length > 0 || selectedJobTitles.length > 0 || selectedManagers.length > 0 || selectedNationalities.length > 0 || selectedHirePeriods.length > 0 || selectedContractPeriods.length > 0;

  if (isLoading || !hasMounted) {
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
            <ExcelExportButton employees={filteredEmployees} fileName="aktywni_pracownicy" columns={exportColumns} />
            <ExcelImportButton />
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
            <MultiSelect
              title="Okres zatrudnienia"
              options={hirePeriodOptions}
              selected={selectedHirePeriods}
              onChange={setSelectedHirePeriods}
            />
            <MultiSelect
              title="Okres umowy do"
              options={contractPeriodOptions}
              selected={selectedContractPeriods}
              onChange={setSelectedContractPeriods}
            />
        </div>
      </div>

       <div className="flex flex-col flex-grow">
        {hasMounted && isMobile 
          ? renderMobileView() 
          : <DataTable 
              columns={columns} 
              data={filteredEmployees} 
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
        }
      </div>
    </div>
  );
}
