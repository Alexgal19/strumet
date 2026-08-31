'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Employee, Absence } from '@/lib/types';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Building, CalendarDays, ChevronRight, UserX, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AbsentOverviewProps {
  employees: Employee[];
  absences: Absence[];
  isLoading?: boolean;
}

interface GroupedDepartment {
  department: string;
  people: Employee[];
}

export function AbsentOverview({ employees, absences, isLoading }: AbsentOverviewProps) {
  const today = useMemo(() => new Date(), []);
  const todayString = format(today, 'yyyy-MM-dd');

  // Indeks: data -> [employeeId]
  const absenteesByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    absences.forEach((a) => {
      if (!a.date) return;
      const set = map.get(a.date) ?? new Set<string>();
      set.add(a.employeeId);
      map.set(a.date, set);
    });
    return map;
  }, [absences]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);

  const getAbsentees = (dateString: string): Employee[] => {
    const ids = absenteesByDate.get(dateString);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => employeeMap.get(id))
      .filter((e): e is Employee => Boolean(e))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pl'));
  };

  // Dzisiejsi nieobecni, pogrupowani według działu
  const groupedToday: GroupedDepartment[] = useMemo(() => {
    const groups = new Map<string, Employee[]>();
    getAbsentees(todayString).forEach((employee) => {
      const dept = employee.department || 'Bez działu';
      const list = groups.get(dept) ?? [];
      list.push(employee);
      groups.set(dept, list);
    });
    return Array.from(groups.entries())
      .map(([department, people]) => ({ department, people }))
      .sort((a, b) => a.department.localeCompare(b.department, 'pl'));
  }, [absenteesByDate, employeeMap, todayString]);

  // Ostatnie 7 dni (włącznie z dzisiaj), tylko dni z nieobecnościami
  const last7Days = useMemo(() => {
      return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dateString = format(date, 'yyyy-MM-dd');
      return { date, dateString, people: getAbsentees(dateString) };
    }).filter((day) => day.people.length > 0);
  }, [absenteesByDate, employeeMap, today]);

  // Statystyki bieżącego miesiąca: dni nieobecności per dział
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const deptCounts = new Map<string, number>();
    let totalDays = 0;
    const peopleThisMonth = new Set<string>();

    absences.forEach((a) => {
      if (!a.date) return;
      const date = parseISO(a.date);
      if (!isWithinInterval(date, { start: monthStart, end: monthEnd })) return;
      const employee = employeeMap.get(a.employeeId);
      if (!employee) return;
      const dept = employee.department || 'Bez działu';
      deptCounts.set(dept, (deptCounts.get(dept) ?? 0) + 1);
      peopleThisMonth.add(a.employeeId);
      totalDays += 1;
    });

    return {
      totalDays,
      peopleCount: peopleThisMonth.size,
      departments: Array.from(deptCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [absences, employeeMap, today]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[320px] rounded-3xl lg:col-span-2" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[150px] rounded-3xl" />
          <Skeleton className="h-[150px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Nieobecni dzisiaj */}
      <Card className="glass-card lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-destructive" />
              <CardTitle className="text-base">Nieobecni dzisiaj</CardTitle>
              {groupedToday.length > 0 && (
                <Badge variant="destructive">
                  {groupedToday.reduce((sum, g) => sum + g.people.length, 0)} os.
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground capitalize">
              {format(today, 'EEEE, d MMMM yyyy', { locale: pl })}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {groupedToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Wszyscy obecni — brak nieobecności dzisiaj.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedToday.map((group) => (
                <div key={group.department}>
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold tracking-tight">{group.department}</span>
                    <Badge variant="secondary">{group.people.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.people.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate">
                            {person.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {person.jobTitle || '—'}{person.manager ? ` • Kierownik: ${person.manager}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button asChild variant="ghost" size="sm" className="mt-4 -ml-2 text-primary">
            <Link href="/odwiedzalnosc">
              Zarządzaj obecnością
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Ostatnie 7 dni + statystyki miesiąca */}
      <div className="flex flex-col gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <CardTitle className="text-base">Ostatnie 7 dni</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {last7Days.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak nieobecności w ostatnich 7 dniach.
              </p>
            ) : (
              <div className="space-y-2">
                {last7Days.map((day) => (
                  <div
                    key={day.dateString}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-2.5',
                      day.dateString === todayString
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/50 bg-card/50'
                    )}
                  >
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground w-16 pt-0.5">
                      {format(day.date, 'EEE dd.MM', { locale: pl })}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed truncate">
                        {day.people.map((p) => p.fullName).join(', ')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {day.people.length} {day.people.length === 1 ? 'osoba' : 'osób'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Statystyki miesiąca</CardTitle>
              </div>
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {format(today, 'LLLL', { locale: pl })}
              </span>
            </div>
            <CardDescription className="text-xs">
              {monthStats.totalDays} dni nieobecności • {monthStats.peopleCount}{' '}
              {monthStats.peopleCount === 1 ? 'osoba' : 'osób'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthStats.departments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak nieobecności w tym miesiącu.
              </p>
            ) : (
              <div className="space-y-1.5">
                {monthStats.departments.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between gap-3">
                    <span className="text-sm truncate">{dept.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{
                            width: `${Math.min(100, (dept.count / (monthStats.departments[0]?.count || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {dept.count} {dept.count === 1 ? 'dzień' : 'dni'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
