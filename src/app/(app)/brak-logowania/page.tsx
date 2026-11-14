'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Loader2, CalendarIcon, FilePlus2, Trash2, Briefcase, Building, Printer } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { GenericExcelExportButton } from '@/components/generic-excel-export-button';
import { AbsenceRecord, Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/date';
import { format, parseISO } from 'date-fns';
import { getDateLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AbsenceRecordPrintForm } from '@/components/absence-record-print-form';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { EmployeeCombobox } from '@/components/employee-combobox';


import { t } from '@/lib/i18n';
export default function NoLoginPage() {
  const { isLoading: isAppLoading, absenceRecords, addAbsenceRecord, deleteAbsenceRecord, employees: allEmployees } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<Date | undefined>();
  const [hours, setHours] = useState<string>('');
  const [reason, setReason] = useState<'no_card' | 'forgot_to_scan' | ''>('forgot_to_scan');

  const [isSaving, setIsSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printingRecord, setPrintingRecord] = useState<AbsenceRecord | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  const sortedRecords = useMemo(() => {
    const records = Array.isArray(absenceRecords) ? absenceRecords : [];
    if (!Array.isArray(records)) return [];
    return records.slice().sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
  }, [absenceRecords]);

  const exportRecords = useMemo(() => {
    const nationalityById = new Map(allEmployees.map(e => [e.id, e.nationality]));
    return sortedRecords.map(r => ({ ...r, nationality: nationalityById.get(r.employeeId) ?? '' }));
  }, [sortedRecords, allEmployees]);

  const selectedEmployee = useMemo(() => {
    return activeEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, activeEmployees]);

  const handlePrint = (record: AbsenceRecord) => {
    setPrintingRecord(record);
    document.body.classList.add('printing');
    requestAnimationFrame(() => {
        window.print();
        document.body.classList.remove('printing');
        setPrintingRecord(null);
    });
  };


  const handleSaveRecord = async () => {
    if (!selectedEmployee || !incidentDate || !reason) {
      toast({
        variant: 'destructive',
        title: t('ops.validationError'),
        description: t('ops.pleaseFillInAllFields'),
      });
      return;
    }

    setIsSaving(true);
    
    const newRecord: Omit<AbsenceRecord, 'id'> = {
      employeeId: selectedEmployee.id,
      employeeFullName: selectedEmployee.fullName,
      incidentDate: incidentDate.toISOString(),
      department: selectedEmployee.department,
      jobTitle: selectedEmployee.jobTitle,
      hours: hours,
      reason: reason as 'no_card' | 'forgot_to_scan',
    };
    
    await addAbsenceRecord(newRecord);
    
    // Reset form
    setSelectedEmployeeId('');
    setIncidentDate(undefined);
    setHours('');
    setReason('forgot_to_scan');
    setIsSaving(false);
  };
  
  const handleDeleteRecord = async (recordId: string) => {
    await deleteAbsenceRecord(recordId);
    setDeletingId(null);
  };

  const isLoading = isAppLoading || isEmployeesLoading;

  return (
    <>
      <div className="main-content-container h-full flex-col flex">
        {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <>
                <PageHeader
                title={t('ops.missedClockIns')}
                description={t('ops.generateReportsOnEmployeesWho')}
                />

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="order-2 lg:order-1 lg:col-span-1">
                    <Card>
                    <CardHeader>
                        <CardTitle>{t('ops.addRecord')}</CardTitle>
                        <CardDescription>{t('ops.selectAnEmployeeAndA2')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label>{t('ops.employee')}</Label>
                        <EmployeeCombobox
                            employees={activeEmployees}
                            value={selectedEmployeeId}
                            onValueChange={setSelectedEmployeeId}
                        />
                        </div>

                        <div className="space-y-2">
                        <Label>{t('ops.date')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !incidentDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {incidentDate ? format(incidentDate, "PPP", { locale: getDateLocale() }) : <span>{t('ops.pickADate')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={incidentDate}
                                    onSelect={setIncidentDate}
                                    locale={getDateLocale()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        </div>
                        
                        <div className="space-y-2">
                        <Label htmlFor="hours">{t('ops.workingHours')}</Label>
                        <Input 
                            id="hours"
                            type="text"
                            placeholder={t('ops.eG8Or08')}
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                        />
                        </div>

                        <div className="space-y-3">
                            <Label>{t('ops.reason')}</Label>
                            <RadioGroup value={reason} onValueChange={(value) => setReason(value as any)} className="space-y-2">
                                <Label
                                    htmlFor="r1"
                                    className={cn(
                                        "flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors",
                                        reason === 'no_card' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                                    )}
                                >
                                    <RadioGroupItem value="no_card" id="r1" />
                                    <span>{t('ops.notClockedInBecauseThe')}</span>
                                </Label>
                                <Label
                                    htmlFor="r2"
                                    className={cn(
                                        "flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors",
                                        reason === 'forgot_to_scan' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                                    )}
                                >
                                    <RadioGroupItem value="forgot_to_scan" id="r2" />
                                    <span>{t('ops.forgotToClockInOut')}</span>
                                </Label>
                            </RadioGroup>
                        </div>

                        <Button onClick={handleSaveRecord} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                        {t('ops.save')}
                        </Button>
                    </CardContent>
                    </Card>
                </div>

                <div className="order-1 lg:order-2 lg:col-span-2">
                    <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                        <div>
                        <CardTitle>{t('ops.recordedIncidents')}</CardTitle>
                        <CardDescription>{t('ops.recordedCasesOfMissedClock')}</CardDescription>
                        </div>
                        {sortedRecords.length > 0 && (
                            <GenericExcelExportButton
                                data={exportRecords}
                                columns={[
                                    { key: 'employeeFullName', name: t('ops.employee') },
                                    { key: 'nationality', name: t('employee.nationality') },
                                    { key: 'incidentDate', name: t('ops.date') },
                                    { key: 'hours', name: t('ops.hours') },
                                    { key: 'reason', name: t('ops.reason') },
                                    { key: 'department', name: t('ops.department') },
                                    { key: 'jobTitle', name: t('ops.jobTitle') },
                                ]}
                                fileName="brak_logowania"
                            />
                        )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>{t('ops.employee')}</TableHead>
                                <TableHead>{t('ops.date')}</TableHead>
                                <TableHead>{t('ops.hours')}</TableHead>
                                <TableHead>{t('ops.reason')}</TableHead>
                                <TableHead className="text-right">{t('ops.actions')}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {sortedRecords.length > 0 ? (
                                sortedRecords.map((rec) => (
                                <TableRow key={rec.id}>
                                    <TableCell className="font-medium">{rec.employeeFullName}</TableCell>
                                    <TableCell>{formatDate(rec.incidentDate, "dd.MM.yyyy")}</TableCell>
                                    <TableCell>{rec.hours}</TableCell>
                                    <TableCell>{rec.reason === 'no_card' ? t('ops.noCard') : t('ops.forgot')}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => handlePrint(rec)}>
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setDeletingId(rec.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t('ops.noRecordedIncidents')}
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        </div>
                        <div className="md:hidden flex flex-col gap-4 mt-4">
                            {sortedRecords.length > 0 ? (
                                sortedRecords.map((rec) => (
                                    <Card key={rec.id} className="bg-card">
                                        <CardContent className="p-4 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-lg">{rec.employeeFullName}</span>
                                                <div className="flex gap-2 shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => handlePrint(rec)}>
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive" onClick={() => setDeletingId(rec.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col text-sm text-muted-foreground gap-1">
                                                <span><strong className="text-foreground font-medium">{t('ops.date2')}</strong> {formatDate(rec.incidentDate, "dd.MM.yyyy")}</span>
                                                <span><strong className="text-foreground font-medium">{t('ops.hours2')}</strong> {rec.hours}</span>
                                                <span><strong className="text-foreground font-medium">{t('ops.reason2')}</strong> {rec.reason === 'no_card' ? t('ops.noCard') : t('ops.forgot')}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">{t('ops.noRecordedIncidents')}</p>
                            )}
                        </div>
                    </CardContent>
                    </Card>
                </div>
                </div>
                <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('ops.areYouSure')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('ops.thisCannotBeUndoneThe2')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeletingId(null)}>{t('ops.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletingId && handleDeleteRecord(deletingId)}>
                                {t('ops.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        )}
      </div>
       <div className="print-only">
          {printingRecord && (
            <AbsenceRecordPrintForm 
                ref={printComponentRef}
                record={printingRecord}
            />
          )}
       </div>
    </>
  );
}
