'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, X, UserX } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Employee, Absence } from '@/lib/types';

interface AbsenceDateSearchCardProps {
  employees: Employee[];
  absences: Absence[];
}

/**
 * Pulpit: filtr po dniach — pokazuje kto był nieobecny w wybranych dniach,
 * z dokładnymi datami, pogrupowane po działach (spójne z raportem Excel).
 */
export function AbsenceDateSearchCard({ employees, absences }: AbsenceDateSearchCardProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const isActive = selectedDates.length > 0;

  const selectedKeys = useMemo(
    () => new Set(selectedDates.map(d => format(d, 'yyyy-MM-dd'))),
    [selectedDates]
  );

  const results = useMemo(() => {
    if (!isActive) return [];
    return employees
      .map(emp => ({
        employee: emp,
        dates: absences
          .filter(a => a.employeeId === emp.id && selectedKeys.has(a.date))
          .map(a => a.date)
          .sort(),
      }))
      .filter(r => r.dates.length > 0)
      .sort((a, b) => {
        const depCompare = (a.employee.department || '').localeCompare(b.employee.department || '', 'pl');
        if (depCompare !== 0) return depCompare;
        return a.employee.fullName.localeCompare(b.employee.fullName, 'pl');
      });
  }, [employees, absences, isActive, selectedKeys]);

  const sortedSelected = useMemo(
    () => [...selectedDates].sort((a, b) => a.getTime() - b.getTime()),
    [selectedDates]
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Nieobecności — filtr po dniach
          </CardTitle>
          <CardDescription>
            {isActive
              ? `Wyniki dla: ${sortedSelected.map(d => format(d, 'dd.MM.yyyy', { locale: pl })).join(', ')}`
              : 'Wybierz dni, aby zobaczyć kto był wtedy nieobecny.'}
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={isActive ? 'secondary' : 'outline'}
                size="sm"
                className={cn('h-10 justify-start', isActive && 'text-primary border-primary/40')}
              >
                <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
                {isActive ? `Wybrane dni: ${selectedDates.length}` : 'Wybierz dni'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates ?? [])}
                locale={pl}
              />
              <div className="flex gap-2 p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedDates([startOfDay(new Date())])}
                >
                  Dziś
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  disabled={!isActive}
                  onClick={() => setSelectedDates([])}
                >
                  <X className="mr-1 h-4 w-4" />
                  Wyczyść
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {isActive && (
            <Button variant="ghost" size="icon" className="h-10 w-10" title="Wyczyść filtr" onClick={() => setSelectedDates([])}>
              <X className="h-4 w-4" />
              <span className="sr-only">Wyczyść filtr</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isActive ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Filtr jest pusty — wybierz jeden lub więcej dni na kalendarzu.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserX className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              W wybranych dniach nie ma zarejestrowanych nieobecności.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {results.map(({ employee, dates }) => (
              <div key={employee.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{employee.fullName}</p>
                  <p className="text-xs text-muted-foreground">{employee.department || 'Bez działu'}</p>
                </div>
                <p className="text-sm font-semibold">{dates.map(d => format(new Date(d + 'T00:00:00'), 'dd.MM')).join(', ')}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
