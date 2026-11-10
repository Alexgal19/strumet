'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { isInWeek } from '@/lib/dashboard-actions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreHorizontal, PlusCircle, Trash2, Printer } from 'lucide-react';
import type { Employee, ClothingIssuance } from '@/lib/types';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { PageHeader } from '@/components/page-header';
import { ExcelImportButton } from '@/components/excel-import-button';
import { HireDateImportButton } from '@/components/hire-date-import-button';
import { ContractEndDateImportButton } from '@/components/contract-end-date-import-button';
import { DepartmentExcelExportButton } from '@/components/department-excel-export-button';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useI18n, rich } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';
import { EmployeeTable } from '../employees/employee-table';
import { EmployeeForm } from '@/components/employee-form';
import { TerminateEmployeeDialog } from '@/components/terminate-employee-dialog';
import { LegalizationEmailDialog } from '@/components/legalization-email-dialog';
import { AbsenceEmailDialog } from '@/components/absence-email-dialog';
import { EmployeeTimeline } from '@/components/employee-timeline';
import { BulkCertDownloadButton } from '@/components/bulk-cert-download-button';

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
  { key: 'lockerNumber2' as keyof Employee, name: 'Nr szafki 2' },
  { key: 'lockerNumber3' as keyof Employee, name: 'Nr szafki 3' },
  { key: 'departmentLockerNumber' as keyof Employee, name: 'Nr szafki w dziale' },
  { key: 'sealNumber' as keyof Employee, name: 'Nr pieczęci' },
  { key: 'welderLicense' as keyof Employee, name: 'Licencja spawacza' },
];

export default function AktywniPage() {
  const { config, isLoading: isContextLoading, handleTerminateEmployee, handleDeleteAllHireDates, handleDeleteAllEmployees, handleDeleteEmployeePermanently, handleSaveEmployee } = useAppContext();
  // Pracownik na urlopie NIE znika z listy — wiersz pulsuje na różowo (patrz employee-table/columns)
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  const router = useRouter();
  const { t } = useI18n();
  const isMobile = useIsMobile();

  const [terminatingEmployee, setTerminatingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [clothingPrintData, setClothingPrintData] = useState<{ employee: Employee; issuance: ClothingIssuance } | null>(null);
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | 'new' | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [hireWeekOnly, setHireWeekOnly] = useState(false);

  // Deep link z Pulpitu: /aktywni?zatrudnienie=tydzien
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setHireWeekOnly(params.get('zatrudnienie') === 'tydzien');
  }, []);

  const visibleEmployees = useMemo(
    () => (hireWeekOnly ? activeEmployees.filter((employee) => isInWeek(employee.hireDate)) : activeEmployees),
    [activeEmployees, hireWeekOnly]
  );

  const clearHireWeekFilter = () => {
    setHireWeekOnly(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('zatrudnienie');
    window.history.replaceState(null, '', url);
  };
  const [legalizationEmployee, setLegalizationEmployee] = useState<Employee | null>(null);
  const [absenceEmployee, setAbsenceEmployee] = useState<Employee | null>(null);

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

  // Zwolnienie: najpierw okno z datą i powodem, dopiero potem zmiana statusu.
  const confirmTerminate = async (employee: Employee, details: { terminationDate: string; terminationReason?: string }) => {
    const success = await handleTerminateEmployee(employee.id, employee.fullName, details);
    if (success && editingEmployee && editingEmployee !== 'new' && editingEmployee.id === employee.id) {
      setEditingEmployee(null);
    }
    return success;
  };

  const onDeletePermanently = async (id: string) => {
    await handleDeleteEmployeePermanently(id);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleAddNew = () => {
    setEditingEmployee('new');
  };

  const handleDuplicateEmployee = (employee: Employee) => {
    const template: Employee = {
      ...employee,
      id: '',
      fullName: '',
      cardNumber: '',
      lockerNumber: '',
      lockerNumber2: '',
      lockerNumber3: '',
      departmentLockerNumber: '',
      sealNumber: '',
      hireDate: '',
      terminationDate: '',
      plannedTerminationDate: '',
      vacationStartDate: '',
      vacationEndDate: '',
      contractEndDate: '',
      legalizationStatus: 'Brak',
      status: 'aktywny',
    };
    setEditingEmployee(template);
  };

  return (
    <div className="flex h-full w-full flex-col px-4 pt-4 md:px-6 md:pt-5">
          <PageHeader
            title={t('employee.activeTitle')}
            description={t('employee.activeDesc')}
          >
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <DepartmentExcelExportButton
                employees={visibleEmployees}
                departments={config.departments?.map(d => d.name) ?? []}
                columns={exportColumns}
              />
              <Popover open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" title={t('employee.moreOptions')} className="h-12 w-12 md:h-10 md:w-10">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 flex flex-col gap-1" align="end">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">{t('employee.importUpdate')}</div>
                  <ExcelImportButton variant="ghost" className="w-full justify-start min-h-12 md:min-h-9" />
                  <HireDateImportButton variant="ghost" className="w-full justify-start min-h-12 md:min-h-9" />
                  <ContractEndDateImportButton variant="ghost" className="w-full justify-start min-h-12 md:min-h-9" />

                  <div className="my-1 h-px bg-border" />
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">{t('employee.bulkManagement')}</div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start min-h-12 md:min-h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setIsMoreOpen(false)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('employee.deleteHireDates')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('employee.areYouSure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('employee.deleteHireDatesDesc')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllHireDates}>{t('employee.continue')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start min-h-12 md:min-h-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setIsMoreOpen(false)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('employee.deleteAllEmployees')}
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

              <BulkCertDownloadButton employees={visibleEmployees} className="hidden md:inline-flex" />

              <Button onClick={handleAddNew} className="hidden md:inline-flex">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('employee.addEmployee')}
              </Button>
            </div>
          </PageHeader>

          {/* FAB — dodawanie pracownika (mobile, strefa kciuka) */}
          <Button
            onClick={handleAddNew}
            size="icon"
            className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 h-14 w-14 rounded-full shadow-lg shadow-primary/30 md:hidden"
            title={t('employee.addEmployee')}
          >
            <PlusCircle className="h-6 w-6" />
            <span className="sr-only">{t('employee.addEmployee')}</span>
          </Button>

          <div className="flex flex-col flex-grow min-h-0">
             {hireWeekOnly && (
               <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
                 <Badge variant="secondary" className="min-h-8 gap-1.5 px-2.5 text-xs">
                   {t('employee.hiredThisWeek', { count: visibleEmployees.length })}
                 </Badge>
                 <Button variant="ghost" size="sm" onClick={clearHireWeekFilter}>
                   {t('employee.clearFilter')}
                 </Button>
               </div>
             )}
             <EmployeeTable
                data={visibleEmployees}
                isLoading={isContextLoading || isEmployeesLoading}
                status="aktywny"
                config={config}
                onEdit={handleEditEmployee}
                onTerminate={setTerminatingEmployee}
                onDelete={setDeletingEmployee}
                onLegalizationEmail={setLegalizationEmployee}
                onAbsenceEmail={setAbsenceEmployee}
                onDuplicate={handleDuplicateEmployee}
                exportColumns={exportColumns}
                exportFileName="aktywni_pracownicy"
                initialSorting={[{ id: 'hireDate', desc: true }]}
             />
          </div>

          <TerminateEmployeeDialog
            employee={terminatingEmployee}
            reasons={config.terminationReasons ?? []}
            onCancel={() => setTerminatingEmployee(null)}
            onConfirm={confirmTerminate}
          />

          <AlertDialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>{t('employee.deleteEmployeeTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                          {rich(t('employee.deleteEmployeeDesc'), { undo: <strong>{t('employee.cannotUndo')}</strong>, name: <strong>{deletingEmployee?.fullName}</strong> })}
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletingEmployee(null)}>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async (e) => {
                          e.preventDefault();
                          if(deletingEmployee) {
                              await onDeletePermanently(deletingEmployee.id)
                              setDeletingEmployee(null)
                          }
                      }}>
                          {t('employee.deletePermanently')}
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>

        {/* Dialog wydania odzieży - renderowany na poziomie strony, poza dialogiem pracownika */}
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
          const form = editingEmployee && (
            <EmployeeForm
              employee={editingEmployee === 'new' ? null : editingEmployee}
              onSave={async (data) => {
                const success = await handleSaveEmployee(data);
                if (success) setEditingEmployee(null);
              }}
              onCancel={() => setEditingEmployee(null)}
              onTerminate={() => {
                if (editingEmployee && editingEmployee !== 'new') setTerminatingEmployee(editingEmployee);
              }}
              onPrintClothing={handlePrintClothingIssuance}
              config={config}
            />
          );

          const title = !editingEmployee || editingEmployee === 'new' || !editingEmployee.id
            ? t('employee.addEmployee')
            : t('employee.editEmployee');

          const timeline = editingEmployee && editingEmployee !== 'new' && editingEmployee.id ? (
            <div className="mt-6">
              <EmployeeTimeline employee={editingEmployee} />
            </div>
          ) : null;

          if (isMobile) {
            return (
              <Sheet open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
                <SheetContent
                  side="bottom"
                  className="h-[92dvh] p-0 flex flex-col rounded-t-3xl bg-background [&>button]:hidden"
                  onInteractOutside={(e) => e.preventDefault()}
                >
                  <SheetHeader className="p-4 border-b bg-background/80 shrink-0 text-left">
                    <SheetTitle className="text-xl font-bold tracking-tight">{title}</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                    {form}
                    {timeline}
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          return (
            <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
              <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border-border bg-background p-0 shadow-2xl">
                <DialogHeader className="shrink-0 border-b border-border bg-card px-6 py-5">
                  <DialogTitle className="text-xl font-bold tracking-tight">{title}</DialogTitle>
                </DialogHeader>
                <div className="min-h-0 flex-grow overflow-y-auto p-5 custom-scrollbar">
                  {form}
                  {timeline}
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

        <AbsenceEmailDialog
          isOpen={!!absenceEmployee}
          onOpenChange={(open) => !open && setAbsenceEmployee(null)}
          employee={absenceEmployee}
        />

    </div>
  );
}
