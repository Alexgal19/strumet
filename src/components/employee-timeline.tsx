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

  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];

    const push = (raw: string | undefined, label: string, type: TimelineEvent['type']) => {
      const date = parseMaybeDate(raw);
      if (date) list.push({ date, label, type });
    };

    push(employee.hireDate, 'Zatrudnienie', 'success');
    push(employee.contractEndDate, 'Koniec umowy', 'warning');
    push(employee.vacationStartDate, 'Początek urlopu', 'info');
    push(employee.vacationEndDate, 'Koniec urlopu', 'info');
    push(employee.plannedTerminationDate, 'Planowane zwolnienie', 'destructive');
    push(employee.terminationDate, 'Zwolnienie', 'destructive');

    absences
      .filter((a) => a.employeeId === employee.id)
      .forEach((a) => push(a.date, 'Nieobecność', 'muted'));

    clothingIssuances
      .filter((c) => c.employeeId === employee.id)
      .forEach((c) => push(c.date, 'Wydanie odzieży', 'info'));

    circulationCards
      .filter((c) => c.employeeId === employee.id)
      .forEach((c) => push(c.date, 'Karta obiegowa', 'info'));

    fingerprintAppointments
      .filter((f) => f.employeeId === employee.id)
      .forEach((f) => push(f.appointmentDate, 'Wizyta na odciski', 'warning'));

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [employee, absences, clothingIssuances, circulationCards, fingerprintAppointments]);

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Historia pracownika</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Brak zdarzeń do wyświetlenia.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Historia pracownika</CardTitle>
        <CardDescription className="text-xs">
          Zatrudnienie, umowy, urlopy, nieobecności, odzież, karty i odciski — chronologicznie.
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
                {event.type === 'warning' && <Badge variant="outline" className="text-[10px] px-1.5">termin</Badge>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
