'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarClock } from 'lucide-react';
import { EmployeeCard } from '@/components/planning-cards';
import type { Employee } from '@/lib/types';
import { ExpandableList } from './expandable-list';

type VacationsCardProps = {
  onVacation: Employee[];
  upcomingVacations: Employee[];
};

export function VacationsCard({ onVacation, upcomingVacations }: VacationsCardProps) {
  const vacationItems = [
    ...onVacation.map((e) => ({
      key: `vac-${e.id}`,
      employee: e,
      type: 'vacation' as const,
    })),
    ...upcomingVacations.map((e) => ({
      key: `upv-${e.id}`,
      employee: e,
      type: 'vacation-planned' as const,
    })),
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
          <CardTitle className="text-base">
            Urlopy ({onVacation.length + upcomingVacations.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {vacationItems.length > 0 ? (
          <>
            <div className="hidden lg:block">
              <ScrollArea className="h-[280px]">
                <div className="space-y-3 pr-4">
                  {onVacation.map((employee) => (
                    <EmployeeCard
                      key={`vac-${employee.id}`}
                      employee={employee}
                      type="vacation"
                    />
                  ))}
                  {upcomingVacations.map((employee) => (
                    <EmployeeCard
                      key={`upv-${employee.id}`}
                      employee={employee}
                      type="vacation-planned"
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:hidden">
              <ExpandableList
                items={vacationItems}
                renderItem={(item) => (
                  <EmployeeCard
                    key={item.key}
                    employee={item.employee}
                    type={item.type}
                  />
                )}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Brak pracowników na urlopie i zaplanowanych urlopów.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
