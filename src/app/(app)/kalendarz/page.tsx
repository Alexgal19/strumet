'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useIsMobile } from '@/hooks/use-mobile';
import { Employee } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  format, addMonths, subMonths, addDays, startOfDay, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { getDateLocale } from '@/lib/i18n';
import { CalendarRange, ChevronLeft, ChevronRight, FileText, Fingerprint, UserX, Umbrella, CalendarClock, Loader2 } from 'lucide-react';

import { t } from '@/lib/i18n';
type EventType = 'contract' | 'vacation' | 'termination' | 'fingerprint' | 'absence';

interface CalEvent {
  type: EventType;
  employee: Employee;
  label: string;
}

const EVENT_STYLES: Record<EventType, { dot: string; chip: string }> = {
  contract: { dot: 'bg-amber-500', chip: 'border-amber-500/40 bg-amber-500/10' },
  vacation: { dot: 'bg-sky-500', chip: 'border-sky-500/40 bg-sky-500/10' },
  termination: { dot: 'bg-destructive', chip: 'border-destructive/40 bg-destructive/10' },
  fingerprint: { dot: 'bg-blue-500', chip: 'border-blue-500/40 bg-blue-500/10' },
  absence: { dot: 'bg-muted-foreground', chip: 'border-border bg-muted/50' },
};

// Teksty liczone w trakcie renderu — po zmianie języka strona jest przemontowywana
const eventLabel = (type: EventType): string =>
  ({ contract: t('calendar.contractEnds'), vacation: t('calendar.leave'), termination: t('calendar.termination'), fingerprint: t('calendar.fingerprints'), absence: t('calendar.absence') })[type];

const weekdays = () => [t('calendar.mo'), t('calendar.tu'), t('calendar.we'), t('calendar.th'), t('calendar.fr'), t('calendar.sa'), t('calendar.su')];

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
      add(e.contractEndDate, 'contract', e, t('calendar.contractEnds'));
      add(e.vacationStartDate, 'vacation', e, t('calendar.leaveFrom'));
      add(e.vacationEndDate, 'vacation', e, t('calendar.leaveUntil'));
      add(e.plannedTerminationDate, 'termination', e, t('calendar.plannedTermination'));
    });

    absences.forEach((a) => {
      const employee = employees.find((e) => e.id === a.employeeId);
      if (employee) add(a.date, 'absence', employee, t('calendar.absence'));
    });

    fingerprintAppointments.forEach((f) => {
      const employee = employees.find((e) => e.id === f.employeeId);
      if (employee) add(f.appointmentDate, 'fingerprint', employee, t('calendar.fingerprints'));
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

  const isMobile = useIsMobile();

  const agendaDays = useMemo(() => {
    const today = startOfDay(new Date());
    const horizon = addDays(today, 13);
    const byKey = new Map<string, Date>();
    days.forEach((d) => {
      if ((eventsByDate.get(format(d, 'yyyy-MM-dd')) ?? []).length > 0) {
        byKey.set(format(d, 'yyyy-MM-dd'), d);
      }
    });
    eachDayOfInterval({ start: today, end: horizon }).forEach((d) => {
      byKey.set(format(d, 'yyyy-MM-dd'), d);
    });
    return Array.from(byKey.values()).sort((a, b) => a.getTime() - b.getTime());
  }, [days, eventsByDate]);

  return (
    <div className="min-h-full w-full space-y-6 pb-8">
      <PageHeader
        title={t('calendar.calendar')}
        description={t('calendar.contractsLeaveTerminationsFingerprintsAnd')}
      >
        <div className="flex items-center gap-1 p-1 rounded-md border bg-card">
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => setCurrentDate((p) => subMonths(p, 1))}>
            <ChevronLeft />
          </Button>
          <span className="px-2 text-sm font-semibold capitalize min-w-[130px] text-center">
            {format(currentDate, 'LLLL yyyy', { locale: getDateLocale() })}
          </span>
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => setCurrentDate((p) => addMonths(p, 1))}>
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="sm" className="h-11 px-4" onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }}>
            {t('calendar.today')}
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <Skeleton className="h-[520px] rounded-2xl" />
      ) : isMobile ? (
          <div className="space-y-4">
            {agendaDays.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {t('calendar.noEventsThisMonthOr')}
                </CardContent>
              </Card>
            ) : (
              agendaDays.map((day) => {
                const dayEvents = eventsFor(day);
                return (
                  <Card key={day.toISOString()}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold capitalize">
                        {format(day, 'EEEE, dd.MM', { locale: getDateLocale() })}
                        {isToday(day) && <Badge>{t('calendar.today')}</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {dayEvents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t('calendar.noEvents')}</p>
                      ) : (
                        dayEvents.map((ev, i) => (
                          <div
                            key={i}
                            className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-xs', EVENT_STYLES[ev.type].chip)}
                          >
                            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', EVENT_STYLES[ev.type].dot)} />
                            <div className="min-w-0">
                              <p className="line-clamp-2 font-medium leading-snug">{ev.employee.fullName}</p>
                              <p className="line-clamp-2 leading-snug text-muted-foreground">
                                {eventLabel(ev.type)} • {ev.employee.department || '—'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <Card className="xl:col-span-3 overflow-hidden">
            <div className="grid grid-cols-7 border-b bg-muted/40">
              {weekdays().map((d) => (
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
                          className={cn('flex items-center gap-1 rounded border px-1 py-0.5 text-xs leading-tight truncate', EVENT_STYLES[ev.type].chip)}
                        >
                          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', EVENT_STYLES[ev.type].dot)} />
                          <span className="truncate">{ev.employee.fullName}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <button
                          type="button"
                          className="text-left text-xs text-muted-foreground pl-1"
                          onClick={(e) => { e.stopPropagation(); setSelectedDate(day); }}
                        >
                          {t('calendar.countMore', { count: dayEvents.length - 2 })}
                        </button>
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
                  ? format(selectedDate, 'd MMMM yyyy', { locale: getDateLocale() })
                  : t('calendar.pickADay')}
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedDate
                  ? selectedEvents.length === 1 ? t('calendar.countEvent', { count: 1 }) : t('calendar.countEvents', { count: selectedEvents.length })
                  : t('calendar.eventsOnTheSelectedDay')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDate ? (
                selectedEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {t('calendar.noEventsOnThisDay')}
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
                      {eventLabel(type)}
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
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> {t('calendar.contractEnds')}</Badge>
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> {t('calendar.leave')}</Badge>
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> {t('calendar.termination')}</Badge>
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> {t('calendar.fingerprints')}</Badge>
        <Badge variant="outline" className="gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> {t('calendar.absence')}</Badge>
      </div>
    </div>
  );
}
