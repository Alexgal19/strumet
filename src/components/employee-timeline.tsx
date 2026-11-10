'use client';

import React, { useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { formatDate, parseMaybeDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface TimelineEvent {
  date: Date;
  label: string;
  type: 'info' | 'success' | 'warning' | 'destructive' | 'muted';
}

const TYPE_STYLES: Record<TimelineEvent['type'], string> = {
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground',
};

export function EmployeeTimeline({ employee }: { employee: Employee }) {
  const { absences, clothingIssuances, circulationCards, fingerprintAppointments } = useAppContext();
  const { t } = useI18n();

  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];

    const push = (raw: string | undefined, label: string, type: TimelineEvent['type']) => {
      const date = parseMaybeDate(raw);
      if (date) list.push({ date, label, type });
    };

    push(employee.hireDate, t('employee.eventHired'), 'success');
    push(employee.contractEndDate, t('employee.eventContractEnd'), 'warning');
    push(employee.vacationStartDate, t('employee.eventVacationStart'), 'info');
    push(employee.vacationEndDate, t('employee.eventVacationEnd'), 'info');
    push(employee.plannedTerminationDate, t('employee.eventPlannedTermination'), 'destructive');
    push(employee.terminationDate, t('employee.eventTermination'), 'destructive');

    absences
      .filter((a) => a.employeeId === employee.id)
      .forEach((a) => push(a.date, t('employee.eventAbsence'), 'muted'));

    clothingIssuances
      .filter((c) => c.employeeId === employee.id)
      .forEach((c) => push(c.date, t('employee.eventClothing'), 'info'));

    circulationCards
      .filter((c) => c.employeeId === employee.id)
      .forEach((c) => push(c.date, t('employee.eventCirculationCard'), 'info'));

    fingerprintAppointments
      .filter((f) => f.employeeId === employee.id)
      .forEach((f) => push(f.appointmentDate, t('employee.eventFingerprints'), 'warning'));

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [employee, absences, clothingIssuances, circulationCards, fingerprintAppointments, t]);

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('employee.historyTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('employee.historyEmpty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('employee.historyTitle')}</CardTitle>
        <CardDescription className="text-xs">
          {t('employee.historyDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-3 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          {events.map((event, idx) => (
            <div key={`${event.label}-${event.date.toISOString()}-${idx}`} className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background',
                  TYPE_STYLES[event.type]
                )}
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground w-24 shrink-0">
                  {formatDate(event.date.toISOString(), 'dd.MM.yyyy')}
                </span>
                <span className="text-sm">{event.label}</span>
                {event.type === 'warning' && <Badge variant="outline" className="text-xs px-1.5">{t('employee.deadline')}</Badge>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
