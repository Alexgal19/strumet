'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreHorizontal, PlusCircle, Trash2, Printer } from 'lucide-react';
import type { Employee, ClothingIssuance } from '@/lib/types';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { PageHeader } from '@/components/page-header';
import { ExcelImportButton } from '@/components/excel-import-button';
import { HireDateImportButton } from '@/components/hire-date-import-button';
import { ContractEndDateImportButton } from '@/components/contract-end-date-import-button';
import { EmployeeForm } from '@/components/employee-form';
import { DepartmentExcelExportButton } from '@/components/department-excel-export-button';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { EmployeeTable } from '../employees/employee-table';

const PassportScanner = dynamic(() => import('@/components/passport-scanner').then(mod => mod.PassportScanner), {
  ssr: false,
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
  { key: 'welderLicense' as keyof Employee, name: 'Licencja spawacza' },
];

export default function AktywniPage() {
  const { config, isLoading: isContextLoading, handleSaveEmployee, handleTerminateEmployee, handleDeleteAllHireDates, handleDeleteAllEmployees, handleDeleteEmployeePermanently } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [terminatingEmployee, setTerminatingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [clothingPrintData, setClothingPrintData] = useState<{ employee: Employee; issuance: ClothingIssuance } | null>(null);
  const clothingPrintRef = React.useRef<HTMLDivElement>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [passportScanData, setPassportScanData] = useState<{ firstName: string; lastName: string } | null>(null);

  const handlePrintClothingIssuance = (employee: Employee, issuance: ClothingIssuance) => {
    setClothingPrintData({ employee, issuance });
  };

  const handleDoPrint = () => {
    document.body.classList.add('printing');
    requestAnimationFrame(() => {
      window.print();
      document.body.classList.remove('printing');
    });
  };

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
    setPassportScanData(null);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    setPassportScanData(null);
    setIsFormOpen(true);
  }

  return (
    <div className="flex h-full w-full flex-col">
        <>
          <PageHeader
            title="Pracownicy aktywni"
            description="Przeglądaj, filtruj i zarządzaj aktywnymi pracownikami."
          >
            <div className="hidden md:flex shrink-0 items-center gap-2">
              <DepartmentExcelExportButton
                employees={activeEmployees}
                departments={config.departments?.map(d => d.name) ?? []}
                columns={exportColumns}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" title="Więcej opcji">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 flex flex-col gap-1" align="end">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Import i Aktualizacja</div>
                  <ExcelImportButton variant="ghost" className="w-full justify-start h-9" />
                  <HireDateImportButton variant="ghost" className="w-full justify-start h-9" />
                  <ContractEndDateImportButton variant="ghost" className="w-full justify-start h-9" />

                  <div className="my-1 h-px bg-border" />
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Zarządzanie masowe</div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start h-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usuń daty zatrudnienia
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
                      <Button variant="ghost" className="w-full justify-start h-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usuń wszystkich pracowników
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
                </PopoverContent>
              </Popover>

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
              className="w-[calc(100vw-1rem)] sm:max-w-3xl max-h-[90dvh] flex flex-col"
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
                  onPrintClothing={handlePrintClothingIssuance}
                  onScanPassport={() => setIsScannerOpen(true)}
                  passportScanData={passportScanData || undefined}
                  config={config}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* PassportScanner renderowany na poziomie strony, poza dialogiem pracownika */}
          <PassportScanner
            open={isScannerOpen}
            onOpenChange={setIsScannerOpen}
            onScanComplete={(data) => {
              setPassportScanData(data);
              setIsScannerOpen(false);
            }}
          />

          <div className="flex flex-col flex-grow min-h-0">
             <EmployeeTable 
                data={activeEmployees}
                isLoading={isContextLoading || isEmployeesLoading}
                status="aktywny"
                config={config}
                onEdit={handleEditEmployee}
                onTerminate={setTerminatingEmployee}
                onDelete={setDeletingEmployee}
                exportColumns={exportColumns}
                exportFileName="aktywni_pracownicy"
                initialSorting={[{ id: 'hireDate', desc: true }]}
             />
          </div>
          
          <AlertDialog open={!!terminatingEmployee} onOpenChange={(open) => !open && setTerminatingEmployee(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz zwolnić pracownika?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Pracownik <strong>{terminatingEmployee?.fullName}</strong> zostanie przeniesiony do archiwum.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTerminatingEmployee(null)}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        if (terminatingEmployee) {
                            onTerminate(terminatingEmployee.id, terminatingEmployee.fullName);
                            setTerminatingEmployee(null);
                        }
                    }}>
                    Zwolnij
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Czy na pewno chcesz trwale usunąć pracownika?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Tej akcji <strong>nie można cofnąć</strong>. Spowoduje to trwałe usunięcie pracownika <strong>{deletingEmployee?.fullName}</strong> i wszystkich jego danych z bazy.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletingEmployee(null)}>Anuluj</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
                          if(deletingEmployee) {
                              onDeletePermanently(deletingEmployee.id)
                              setDeletingEmployee(null)
                          }
                      }}>
                          Usuń trwale
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>

        {/* Dialog wydania odzieży - renderowany na poziomie strony, poza dialogiem pracownika */}
        <Dialog open={!!clothingPrintData} onOpenChange={(open) => !open && setClothingPrintData(null)}>
          <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-3xl max-h-[90dvh] flex flex-col">
            <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between pr-8">
              <DialogTitle>Wydawanie odzieży roboczej</DialogTitle>
              <Button size="sm" onClick={handleDoPrint}>
                <Printer className="mr-2 h-4 w-4" />
                Drukuj / PDF
              </Button>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto">
              {clothingPrintData && (
                <div className="bg-white border rounded-md">
                  <ClothingIssuancePrintForm
                    ref={clothingPrintRef}
                    employee={clothingPrintData.employee}
                    issuance={clothingPrintData.issuance}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="print-only">
          {clothingPrintData && (
            <ClothingIssuancePrintForm
              ref={clothingPrintRef}
              employee={clothingPrintData.employee}
              issuance={clothingPrintData.issuance}
            />
          )}
        </div>
        </>
    </div>
  );
}
