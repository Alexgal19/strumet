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
import { RotateCcw, Trash2, Printer, MoreHorizontal } from 'lucide-react';
import type { Employee, ClothingIssuance } from '@/lib/types';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { PageHeader } from '@/components/page-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { TerminatedExcelImportButton } from '@/components/terminated-excel-import-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useI18n, rich } from '@/lib/i18n';
import { EmployeeTable } from '../employees/employee-table';
import { ExcelExportButton } from '@/components/excel-export-button';
import { EmployeeForm } from '@/components/employee-form';
import { LegalizationEmailDialog } from '@/components/legalization-email-dialog';

const exportColumns = [
  { key: 'fullName' as keyof Employee, name: 'Nazwisko i imię' },
  { key: 'hireDate' as keyof Employee, name: 'Data zatrudnienia' },
  { key: 'terminationDate' as keyof Employee, name: 'Data zwolnienia' },
  { key: 'terminationReason' as keyof Employee, name: 'Powód zwolnienia' },
  { key: 'jobTitle' as keyof Employee, name: 'Stanowisko' },
  { key: 'department' as keyof Employee, name: 'Dział' },
  { key: 'manager' as keyof Employee, name: 'Kierownik' },
  { key: 'cardNumber' as keyof Employee, name: 'Nr karty' },
  { key: 'nationality' as keyof Employee, name: 'Narodowość' },
];

export default function ZwolnieniPage() {
  const { config, isLoading: isContextLoading, handleRestoreEmployee, handleDeleteAllEmployees, handleRestoreAllTerminatedEmployees, handleDeleteEmployeePermanently, handleSaveEmployee } = useAppContext();
  const { t } = useI18n();
  const { employees: terminatedEmployees, isLoading: isEmployeesLoading } = useEmployees('zwolniony');
  const isMobile = useIsMobile();

  const [restoringEmployee, setRestoringEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [clothingPrintData, setClothingPrintData] = useState<{ employee: Employee; issuance: ClothingIssuance } | null>(null);
  const [legalizationEmployee, setLegalizationEmployee] = useState<Employee | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
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
    setEditingEmployee(employee);
  };

  return (
    <div className="flex h-full flex-col px-4 pt-4 md:px-6 md:pt-5">
      <PageHeader
        title={t('employee.terminatedTitle')}
        description={t('employee.terminatedDesc')}
      >
        {/* Parzystość z /aktywni: eksport + ⋯ menu dostępne na każdym breakpointcie */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ExcelExportButton
            employees={terminatedEmployees}
            columns={exportColumns}
            fileName="zwolnieni_pracownicy"
            className="min-h-12 md:min-h-10"
          />
          <Popover open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title={t('employee.moreOptions')} className="h-12 w-12 md:h-10 md:w-10">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 flex flex-col gap-1" align="end">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">{t('employee.importAndBulk')}</div>
              <div className="[&>button]:w-full [&>button]:justify-start">
                <TerminatedExcelImportButton />
              </div>

              <div className="my-1 h-px bg-border" />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start h-9" onClick={() => setIsMoreOpen(false)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('employee.restoreAll')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('employee.areYouSure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('employee.restoreAllDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestoreAllTerminatedEmployees}>{t('employee.continue')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setIsMoreOpen(false)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('employee.deleteAll')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('employee.areYouSure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('employee.deleteAllDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllEmployees}>{t('employee.continue')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </PopoverContent>
          </Popover>
        </div>
      </PageHeader>

      <div className="flex flex-col flex-grow min-h-0">
        <EmployeeTable
          data={terminatedEmployees}
          isLoading={isContextLoading || isEmployeesLoading}
          status="zwolniony"
          config={config}
          onEdit={(employee) => {
            console.log('Row clicked - editing employee:', employee.id, employee.fullName);
            handleEditEmployee(employee);
          }}
          onRestore={setRestoringEmployee}
          onDelete={setDeletingEmployee}
          onLegalizationEmail={setLegalizationEmployee}
          exportColumns={exportColumns}
          exportFileName="zwolnieni_pracownicy"
          initialSorting={[{ id: 'terminationDate', desc: true }]}
        />
      </div>

      <AlertDialog open={!!restoringEmployee} onOpenChange={(open) => !open && setRestoringEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('employee.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {rich(t('employee.restoreEmployeeDesc'), { name: <strong>{restoringEmployee?.fullName}</strong> })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoringEmployee(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={async (e) => {
              e.preventDefault();
              if (restoringEmployee) {
                await onRestoreEmployee(restoringEmployee.id, restoringEmployee.fullName);
                setRestoringEmployee(null);
              }
            }}>
              {t('common.restore')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('employee.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {rich(t('employee.deleteEmployeeDesc'), { undo: <strong>{t('employee.cannotUndo')}</strong>, name: <strong>{deletingEmployee?.fullName}</strong> })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingEmployee(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async (e) => {
              e.preventDefault();
              if (deletingEmployee) {
                await onDeletePermanently(deletingEmployee.id);
                setDeletingEmployee(null);
              }
            }}>
              {t('employee.deletePermanently')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!clothingPrintData} onOpenChange={(open) => !open && setClothingPrintData(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-3xl max-h-[90dvh] flex flex-col">
          <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between pr-8">
            <DialogTitle>{t('employee.clothingTitle')}</DialogTitle>
            <Button size="sm" onClick={handleDoPrint}>
              <Printer className="mr-2 h-4 w-4" />
              {t('employee.printPdf')}
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

      {/* Okno formularza pracownika — bottom sheet na mobile, dialog na desktopie */}
      {(() => {
        if (!editingEmployee) return null;
        const form = (
          <EmployeeForm
            employee={editingEmployee}
            onSave={async (data) => {
              const success = await handleSaveEmployee(data);
              if (success) setEditingEmployee(null);
            }}
            onCancel={() => setEditingEmployee(null)}
            onPrintClothing={handlePrintClothingIssuance}
            config={config}
          />
        );

        if (isMobile) {
          return (
            <Sheet open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
              <SheetContent
                side="bottom"
                className="h-[92dvh] p-0 flex flex-col rounded-t-3xl bg-background [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
              >
                <SheetHeader className="p-4 border-b bg-background/80 shrink-0 text-left">
                  <SheetTitle className="text-xl font-bold tracking-tight">{t('employee.editEmployee')}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                  {form}
                </div>
              </SheetContent>
            </Sheet>
          );
        }

        return (
          <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
            <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border-border bg-background p-0 shadow-2xl">
              <DialogHeader className="shrink-0 border-b border-border bg-card px-6 py-5">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {t('employee.editEmployee')}
                </DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-grow overflow-y-auto p-5 custom-scrollbar">
                {form}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      <LegalizationEmailDialog
        isOpen={!!legalizationEmployee}
        onOpenChange={(open) => !open && setLegalizationEmployee(null)}
        employee={legalizationEmployee}
      />

    </div>
  );
}
