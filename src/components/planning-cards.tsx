'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Employee, FingerprintAppointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import { CalendarClock, FileText, Fingerprint } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export const EmployeeCard = ({ employee, type }: { employee: Employee; type: 'termination' | 'vacation' | 'vacation-planned' }) => {
  const { t, dateLocale } = useI18n();
  let dateLabel: string | undefined;

  if (type === 'termination') {
    const dateString = formatDate(employee.plannedTerminationDate, 'PPP', dateLocale);
    dateLabel = t('dashboard.cardTermination', { date: dateString });
  } else if (type === 'vacation') {
    const dateString = formatDate(employee.vacationEndDate, 'PPP', dateLocale);
    dateLabel = t('dashboard.cardVacationEnd', { date: dateString });
  } else if (type === 'vacation-planned') {
    const startDate = formatDate(employee.vacationStartDate, 'dd.MM');
    const endDate = formatDate(employee.vacationEndDate, 'dd.MM.yyyy');
    dateLabel = t('dashboard.cardVacation', { start: startDate, end: endDate });
  }

  return (
    <Card
      className={cn(
        'w-full animate-fade-in-up',
        type === 'termination' && 'border-destructive/50 bg-destructive/10',
        (type === 'vacation' || type === 'vacation-planned') && 'border-yellow-500/50 bg-yellow-500/10'
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{employee.fullName}</CardTitle>
          <CardDescription className="text-xs">
            {employee.jobTitle} - {employee.department}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <CalendarClock className="mr-2 h-4 w-4" />
          <strong className="text-foreground text-xs">{dateLabel}</strong>
        </div>
      </CardContent>
    </Card>
  );
};

export const ContractCard = ({ employee }: { employee: Employee }) => {
  const { t, dateLocale } = useI18n();
  const dateLabel = t('dashboard.cardContractEnd', { date: formatDate(employee.contractEndDate, 'PPP', dateLocale) });
  return (
    <Card className="w-full animate-fade-in-up border-orange-500/50 bg-orange-500/10">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{employee.fullName}</CardTitle>
          <CardDescription className="text-xs">
            {employee.jobTitle} - {employee.department}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <FileText className="mr-2 h-4 w-4" />
          <strong className="text-foreground text-xs">{dateLabel}</strong>
        </div>
      </CardContent>
    </Card>
  );
};

export const FingerprintCard = ({ appointment }: { appointment: FingerprintAppointment }) => {
  const { t, dateLocale } = useI18n();
  const dateLabel = t('dashboard.cardDate', { date: formatDate(appointment.appointmentDate, 'PPP', dateLocale) });
  return (
    <Card className="w-full animate-fade-in-up border-blue-500/50 bg-blue-500/10">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{appointment.employeeFullName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <Fingerprint className="mr-2 h-4 w-4" />
          <strong className="text-foreground text-xs">{dateLabel}</strong>
        </div>
      </CardContent>
    </Card>
  );
};
