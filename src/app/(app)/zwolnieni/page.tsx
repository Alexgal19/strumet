'use client';

import React, { useState } from 'react';
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
import { RotateCcw, Trash2, Printer } from 'lucide-react';
import type { Employee, ClothingIssuance } from '@/lib/types';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TerminatedExcelImportButton } from '@/components/terminated-excel-import-button';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useRouter } from 'next/navigation';
import { EmployeeTable } from '../employees/employee-table';
import { ExcelExportButton } from '@/components/excel-export-button';

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

export default function ZwolnieniPage() {
  const { config, isLoading: isContextLoading, handleRestoreEmployee, handleDeleteAllEmployees, handleRestoreAllTerminatedEmployees, handleDeleteEmployeePermanently } = useAppContext();
  const { employees: terminatedEmployees, isLoading: isEmployeesLoading } = useEmployees('zwolniony');
  const router = useRouter();

  const [restoringEmployee, setRestoringEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [clothingPrintData, setClothingPrintData] = useState<{ employee: Employee; issuance: ClothingIssuance } | null>(null);
  const clothingPrintRef = React.useRef<HTMLDivElement>(null);

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

const onRestoreEmployee = async (employeeId: string, employeeFullName: string) => {
    console.log('[zwolnieni] onRestoreEmployee called:', { employeeId, employeeFullName });
    const result = await handleRestoreEmployee(employeeId, employeeFullName);
    console.log('[zwolnieni] handleRestoreEmployee result:', result);
};

  const onDeletePermanently = async (id: string) => {
    await handleDeleteEmployeePermanently(id);
  };

  const handleEditEmployee = (employee: Employee) => {
    router.push(`/pracownicy/${employee.id}`);
  };

  return (
    <div className="flex h-full flex-col px-4 pt-4 md:px-6 md:pt-5">
      <PageHeader
        title="Pracownicy zwolnieni"
        description="Przeglądaj historię zwolnionych pracowników."
      >
        <div className="hidden md:flex shrink-0 items-center space-x-2">
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
        <div className="flex md:hidden items-center gap-2 mt-2">
          <ExcelExportButton
            employees={terminatedEmployees}
            columns={exportColumns}
            fileName="zwolnieni_pracownicy"
          />
        </div>
      </PageHeader>

      <div className="flex flex-col flex-grow min-h-0">
         <EmployeeTable
            data={terminatedEmployees}
            isLoading={isContextLoading || isEmployeesLoading}
            status="zwolniony"
            config={config}
            onEdit={handleEditEmployee}
            onRestore={setRestoringEmployee}
            onDelete={setDeletingEmployee}
            exportColumns={exportColumns}
            exportFileName="zwolnieni_pracownicy"
            initialSorting={[{ id: 'terminationDate', desc: true }]}
         />
      </div>

      <AlertDialog open={!!restoringEmployee} onOpenChange={(open) => !open && setRestoringEmployee(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Pracownik <strong>{restoringEmployee?.fullName}</strong> zostanie przywrócony do listy aktywnych.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setRestoringEmployee(null)}>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={async (e) => {
                      e.preventDefault();
                      if(restoringEmployee) {
                          await onRestoreEmployee(restoringEmployee.id, restoringEmployee.fullName);
                          setRestoringEmployee(null);
                      }
                  }}>
                      Przywróć
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tej akcji <strong>nie można cofnąć</strong>. Spowoduje to trwałe usunięcie pracownika <strong>{deletingEmployee?.fullName}</strong> i wszystkich jego danych z bazy danych.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeletingEmployee(null)}>Anuluj</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async (e) => {
                      e.preventDefault();
                      if(deletingEmployee) {
                          await onDeletePermanently(deletingEmployee.id);
                          setDeletingEmployee(null);
                      }
                  }}>
                      Usuń trwale
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

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
    </div>
  );
}
