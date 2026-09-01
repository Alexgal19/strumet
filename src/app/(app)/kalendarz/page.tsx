'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { Employee } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarRange, ChevronLeft, ChevronRight, FileText, Fingerprint, UserX, Umbrella, CalendarClock, Loader2 } from 'lucide-react';

type EventType = 'contract' | 'vacation' | 'termination' | 'fingerprint' | 'absence';

interface CalEvent {
  type: EventType;
  employee: Employee;
  label: string;
}

const EVENT_STYLES: Record<EventType, { dot: string; chip: string; label: string }> = {
  contract: { dot: 'bg-amber-500', chip: 'border-amber-500/40 bg-amber-500/10', label: 'Koniec umowy' },
  vacation: { dot: 'bg-sky-500', chip: 'border-sky-500/40 bg-sky-500/10', label: 'Urlop' },
  termination: { dot: 'bg-destructive', chip: 'border-destructive/40 bg-destructive/10', label: 'Zwolnienie' },
  fingerprint: { dot: 'bg-blue-500', chip: 'border-blue-500/40 bg-blue-500/10', label: 'Odciski palców' },
  absence: { dot: 'bg-muted-foreground', chip: 'border-border bg-muted/50', label: 'Nieobecność' },
};

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

export default function KalendarzPage() {
  const { absences, fingerprintAppointments, isLoading: isContextLoading } = useAppContext();
  const { employees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  const isLoading = isContextLoading || isEmployeesLoading;

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    const add = (raw: string | undefined, type: EventType, employee: Employee, label: string) => {
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const key = format(d, 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push({ type, employee, label });
      map.set(key, list);
    };

    employees.forEach((e) => {
      add(e.contractEndDate, 'contract', e, 'Koniec umowy');
      add(e.vacationStartDate, 'vacation', e, 'Urlop od');
      add(e.vacationEndDate, 'vacation', e, 'Urlop do');
      add(e.plannedTerminationDate, 'termination', e, 'Planowane zwolnienie');
    });

    absences.forEach((a) => {
      const employee = employees.find((e) => e.id === a.employeeId);
      if (employee) add(a.date, 'absence', employee, 'Nieobecność');
    });

    fingerprintAppointments.forEach((f) => {
      const employee = employees.find((e) => e.id === f.employeeId);
      if (employee) add(f.appointmentDate, 'fingerprint', employee, 'Odciski palców');
    });

    return map;
  }, [employees, absences, fingerprintAppointments]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const eventsFor = (day: Date): CalEvent[] =>
    eventsByDate.get(format(day, 'yyyy-MM-dd')) ?? [];

  const selectedEvents = selectedDate ? eventsFor(selectedDate) : [];

  return (
    <div className="min-h-full w-full space-y-6 pb-8">
      <PageHeader
        title="Kalendarz"
        description="Umowy, urlopy, zwolnienia, odciski i nieobecności w jednym widoku."
      >
        <div className="flex items-center gap-1 p-1 rounded-md border bg-card">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setCurrentDate((p) => subMonths(p, 1))}>
            <ChevronLeft />
          </Button>
          <span className="px-2 text-sm font-semibold capitalize min-w-[130px] text-center">
            {format(currentDate, 'LLLL yyyy', { locale: pl })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setCurrentDate((p) => addMonths(p, 1))}>
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }}>
            Dziś
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-[520px] rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <Card className="xl:col-span-3 overflow-hidden">
            <div className="grid grid-cols-7 border-b bg-muted/40">
              {WEEKDAYS.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dayEvents = eventsFor(day);
                const inMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={cn(
                      'relative min-h-[84px] border-b border-r p-1.5 text-left align-top transition-colors hover:bg-muted/50',
                      !inMonth && 'opacity-40',
                      isSelected && 'bg-primary/10 ring-1 ring-inset ring-primary/40'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                        isToday(day) && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev, i) => (
                        <div
                          key={i}
                          className={cn('flex items-center gap-1 rounded border px-1 py-0.5 text-[10px] leading-tight truncate', EVENT_STYLES[ev.type].chip)}
                        >
                          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', EVENT_STYLES[ev.type].dot)} />
                          <span className="truncate">{ev.employee.fullName}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[10px] text-muted-foreground pl-1">
                          +{dayEvents.length - 2} więcej
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDate
                  ? format(selectedDate, 'd MMMM yyyy', { locale: pl })
                  : 'Wybierz dzień'}
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedDate
                  ? `${selectedEvents.length} ${selectedEvents.length === 1 ? 'zdarzenie' : 'zdarzeń'}`
                  : 'Zdarzenia z zaznaczonego dnia.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDate ? (
                selectedEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Brak zdarzeń tego dnia.
                  </p>
                ) : (
                  selectedEvents.map((ev, i) => {
                    const Icon = ev.type === 'contract' ? FileText
                      : ev.type === 'fingerprint' ? Fingerprint
                      : ev.type === 'termination' ? CalendarClock
                      : ev.type === 'vacation' ? Umbrella
                      : UserX;
                    return (
                      <div key={i} className={cn('flex items-start gap-3 rounded-xl border p-3', EVENT_STYLES[ev.type].chip)}>
                        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{ev.employee.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ev.label} • {ev.employee.department || '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                <div className="space-y-2">
                  {(Object.keys(EVENT_STYLES) as EventType[]).map((type) => (
                    <div key={type} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn('h-2 w-2 rounded-full', EVENT_STYLES[type].dot)} />
                      {EVENT_STYLES[type].label}
                    </div>
                  ))}
                </div>
              )}
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Koniec umowy</Badge>
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> Urlop</Badge>
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Zwolnienie</Badge>
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Odciski palców</Badge>
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Nieobecność</Badge>
      </div>
    </div>
  );
}
