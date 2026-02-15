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
import { RotateCcw, Trash2 } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TerminatedExcelImportButton } from '@/components/terminated-excel-import-button';
import { EmployeeForm } from '@/components/employee-form';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { EmployeeTable } from '../employees/employee-table';

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
  const { config, isLoading: isContextLoading, handleSaveEmployee, handleRestoreEmployee, handleDeleteAllEmployees, handleRestoreAllTerminatedEmployees, handleDeleteEmployeePermanently } = useAppContext();
  const { employees: terminatedEmployees, isLoading: isEmployeesLoading } = useEmployees('zwolniony');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [restoringEmployee, setRestoringEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

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

  return (
    <div className="flex h-full flex-col">
      <>
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
                  <AlertDialogAction onClick={() => {
                      if(restoringEmployee) {
                          onRestoreEmployee(restoringEmployee.id, restoringEmployee.fullName);
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
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
                      if(deletingEmployee) {
                          onDeletePermanently(deletingEmployee.id);
                          setDeletingEmployee(null);
                      }
                  }}>
                      Usuń trwale
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      </>
    </div>
  );
}
