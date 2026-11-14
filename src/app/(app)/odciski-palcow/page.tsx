'use client';

import React, { useState, useMemo } from 'react';
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
import { EmployeeCombobox } from '@/components/employee-combobox';
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

import { Loader2, CalendarIcon, UserPlus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { GenericExcelExportButton } from '@/components/generic-excel-export-button';
import { FingerprintAppointment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDateTime } from '@/lib/date';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';


import { t } from '@/lib/i18n';
export default function FingerprintAppointmentsPage() {
  const { isLoading: isAppLoading, fingerprintAppointments, addFingerprintAppointment, deleteFingerprintAppointment, employees: allEmployees } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { toast } = useToast();

  const sortedAppointments = useMemo(() => {
    return [...fingerprintAppointments].sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }, [fingerprintAppointments]);

  const exportAppointments = useMemo(() => {
    const nationalityById = new Map(allEmployees.map(e => [e.id, e.nationality]));
    return sortedAppointments.map(a => ({ ...a, nationality: nationalityById.get(a.employeeId) ?? '' }));
  }, [sortedAppointments, allEmployees]);

  const selectedEmployee = useMemo(() => {
    return activeEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, activeEmployees]);

  const handleSaveAppointment = async () => {
    if (!selectedEmployee || !appointmentDate) {
      toast({
        variant: 'destructive',
        title: t('ops.validationError'),
        description: t('ops.pleaseSelectAnEmployeeAnd2'),
      });
      return;
    }

    setIsSaving(true);
    const newAppointment: Omit<FingerprintAppointment, 'id'> = {
      employeeId: selectedEmployee.id,
      employeeFullName: selectedEmployee.fullName,
      appointmentDate: appointmentDate.toISOString(),
    };
    
    await addFingerprintAppointment(newAppointment);

    setSelectedEmployeeId('');
    setAppointmentDate(undefined);
    setIsSaving(false);
  };
  
  const handleDeleteAppointment = async (appointmentId: string) => {
    await deleteFingerprintAppointment(appointmentId);
    setDeletingId(null);
  };

  const isLoading = isAppLoading || isEmployeesLoading;

  return (
    <div className="flex h-full flex-col">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
      <>
        <PageHeader
          title={t('ops.fingerprintAppointments')}
          description={t('ops.manageFingerprintingAppointments')}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t('ops.addAppointment')}</CardTitle>
                <CardDescription className="text-base">{t('ops.selectAnEmployeeAndA')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-base font-medium">{t('ops.employee')}</label>
                  <EmployeeCombobox
                    employees={activeEmployees}
                    value={selectedEmployeeId}
                    onValueChange={setSelectedEmployeeId}
                    triggerClassName="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-base font-medium">{t('ops.appointmentDate')}</label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                          variant={"outline"}
                          className={cn(
                              "w-full justify-start text-left font-normal h-12 text-base",
                              !appointmentDate && "text-muted-foreground"
                          )}
                          >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {appointmentDate ? formatDateTime(appointmentDate, "PPP HH:mm") : <span>{t('ops.pickDateAndTime')}</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={appointmentDate}
                              onSelect={setAppointmentDate}
                              locale={getDateLocale()}
                              initialFocus
                          />
                          <div className="p-3 border-t border-border">
                              <label className="text-base font-medium">{t('ops.time')}</label>
                              <input
                                  type="time"
                                  className="w-full mt-1 p-2 border rounded-md h-12 text-base"
                                  value={appointmentDate ? format(appointmentDate, 'HH:mm') : ''}
                                  onChange={(e) => {
                                      const time = e.target.value;
                                      const [hours, minutes] = time.split(':').map(Number);
                                      setAppointmentDate(prev => {
                                          const newDate = prev ? new Date(prev) : new Date();
                                          newDate.setHours(hours, minutes);
                                          return newDate;
                                      });
                                  }}
                              />
                          </div>
                      </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={handleSaveAppointment} disabled={isSaving} className="w-full h-12 text-base">
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                  {t('ops.saveAppointment')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                <CardTitle className="text-2xl">{t('ops.scheduledAppointments')}</CardTitle>
                <CardDescription className="text-base">{t('ops.upcomingFingerprintingAppointments')}</CardDescription>
                </div>
                {sortedAppointments.length > 0 && (
                    <GenericExcelExportButton
                        data={exportAppointments}
                        columns={[
                            { key: 'employeeFullName', name: t('ops.employee') },
                            { key: 'nationality', name: t('employee.nationality') },
                            { key: 'appointmentDate', name: t('ops.dateAndTime') },
                        ]}
                        fileName="terminy_odciskow_palcow"
                    />
                )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-base">{t('ops.employee')}</TableHead>
                        <TableHead className="text-base">{t('ops.date')}</TableHead>
                        <TableHead className="text-base">{t('ops.time')}</TableHead>
                        <TableHead className="text-right text-base">{t('ops.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAppointments.length > 0 ? (
                        sortedAppointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="font-medium text-base">{apt.employeeFullName}</TableCell>
                            <TableCell className="text-base">{formatDate(apt.appointmentDate, "yyyy-MM-dd")}</TableCell>
                            <TableCell className="text-base">{formatDate(apt.appointmentDate, "HH:mm")}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setDeletingId(apt.id)}>
                                <Trash2 className="h-5 w-5 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-base">
                            {t('ops.noScheduledAppointments')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden flex flex-col gap-4 mt-4">
                    {sortedAppointments.length > 0 ? (
                        sortedAppointments.map((apt) => (
                            <Card key={apt.id} className="bg-card">
                                <CardContent className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-lg">{apt.employeeFullName}</span>
                                        <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive shrink-0" onClick={() => setDeletingId(apt.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col text-sm text-muted-foreground gap-1">
                                        <span><strong className="text-foreground font-medium">{t('ops.date2')}</strong> {formatDate(apt.appointmentDate, "yyyy-MM-dd")}</span>
                                        <span><strong className="text-foreground font-medium">{t('ops.time2')}</strong> {formatDate(apt.appointmentDate, "HH:mm")}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-4">{t('ops.noScheduledAppointments')}</p>
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
                          {t('ops.thisCannotBeUndoneThe')}
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletingId(null)}>{t('ops.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletingId && handleDeleteAppointment(deletingId)}>
                          {t('ops.delete')}
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
        </AlertDialog>
        </>
      )}
    </div>
  );
}
    
