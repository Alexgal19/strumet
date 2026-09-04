'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref as dbRef } from 'firebase/database';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import { objectToArray } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import {
  buildPlannedTerminations,
  buildRecentTerminations,
  buildStaffingHints,
  buildVacationPeople,
  filterCurrentlyOnVacation,
  filterUpcomingVacations,
  UPCOMING_VACATION_HORIZON_DAYS,
  TERMINATION_WINDOW_DAYS,
} from '@/lib/staffing';
import type { Employee, Order, StaffingHint, VacationPerson } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarOff,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Loader2,
  Plus,
  UserMinus,
  UserX,
} from 'lucide-react';

const EmployeeMiniRow = ({ employee, right }: { employee: Employee; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 rounded-md border bg-background/50 px-3 py-2">
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{employee.fullName}</p>
      <p className="truncate text-xs text-muted-foreground">
        {employee.department} · {employee.jobTitle}
      </p>
    </div>
    {right}
  </div>
);

const SummarySection = ({
  title,
  icon,
  employees,
  emptyText,
  dateField,
}: {
  title: string;
  icon: React.ReactNode;
  employees: Employee[];
  emptyText: string;
  dateField: 'plannedTerminationDate' | 'terminationDate' | 'vacationStartDate';
}) => (
  <Card className="flex flex-col">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        {icon}
        {title} ({employees.length})
      </CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      {employees.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ScrollArea className="max-h-[320px]">
          <div className="space-y-2 pr-3">
            {employees.map(employee => (
              <EmployeeMiniRow
                key={`${employee.id}-${dateField}`}
                employee={employee}
                right={
                  <Badge variant="outline" className="shrink-0 tabular-nums">
                    {formatDate(employee[dateField])}
                  </Badge>
                }
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </CardContent>
  </Card>
);

const HintCard = ({
  hint,
  onCreateOrder,
  isCreating,
}: {
  hint: StaffingHint;
  onCreateOrder: (hint: StaffingHint) => void;
  isCreating: boolean;
}) => {
  const isVacation = hint.reason === 'urlop';
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isVacation ? 'secondary' : 'destructive'}>
            {isVacation ? 'Urlop (czasowo)' : 'Odejście (na stałe)'}
          </Badge>
          {hint.orderedOutstanding > 0 && (
            <Badge variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-400">
              Już zamówione: {hint.orderedOutstanding}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base">
          {hint.department} · {hint.jobTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          <span className="font-bold text-primary">{hint.count}</span>{' '}
          {hint.count === 1 ? 'osoba do zastępstwa' : 'osoby do zastępstwa'}
          {hint.to && (
            <>
              {' '}
              — okres: <span className="font-medium">{formatDate(hint.from)}</span> →{' '}
              <span className="font-medium">{formatDate(hint.to)}</span>
            </>
          )}
          {!hint.to && (
            <>
              {' '}
              — od: <span className="font-medium">{formatDate(hint.from)}</span> (stałe, rekrutacja)
            </>
          )}
        </p>
        <div className="space-y-1.5">
          {hint.employees.map(employee => (
            <div key={employee.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{employee.fullName}</span>
              <span className="shrink-0 tabular-nums">
                {isVacation
                  ? `${formatDate(employee.vacationStartDate)} – ${formatDate(employee.vacationEndDate) || '—'}`
                  : formatDate(employee.plannedTerminationDate ?? employee.terminationDate)}
              </span>
            </div>
          ))}
        </div>
        <Button
          size="sm"
          className="w-full gap-2"
          disabled={hint.count === 0 || isCreating}
          onClick={() => onCreateOrder(hint)}
        >
          {hint.count === 0 ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {hint.count === 0 ? 'Zapotrzebowanie objęte zamówieniem' : `Utwórz zamówienie (${hint.count} os.)`}
        </Button>
      </CardContent>
    </Card>
  );
};

const VacationPersonRow = ({
  person,
  onEndVacation,
}: {
  person: VacationPerson;
  onEndVacation: (person: VacationPerson) => void;
}) => {
  const { employee, phase } = person;
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{employee.fullName}</p>
          {phase === 'na-urlopie' && <Badge>Na urlopie</Badge>}
          {phase === 'zakończony' && (
            <Badge variant="destructive">Urlop zakończony — czeka na potwierdzenie</Badge>
          )}
          {phase === 'planowany' && (
            <Badge variant="outline" className="border-blue-500/60 text-blue-700 dark:text-blue-400">
              Startuje {formatDate(employee.vacationStartDate)}
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {employee.department} · {employee.jobTitle} · {formatDate(employee.vacationStartDate)}
          {employee.vacationEndDate ? ` – ${formatDate(employee.vacationEndDate)}` : ''}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-2 border-primary/30 text-primary hover:bg-primary/5"
        onClick={() => onEndVacation(person)}
      >
        <CheckCircle2 className="h-4 w-4" />
        Zakończ urlop
      </Button>
    </div>
  );
};

export default function ZastepstwaPage() {
  const { isLoading: isContextLoading, addOrder, handleEndVacation } = useAppContext();
  const { employees, isLoading: isEmployeesLoading } = useEmployees();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [personToEndVacation, setPersonToEndVacation] = useState<VacationPerson | null>(null);
  const [isEndingVacation, setIsEndingVacation] = useState(false);

  useEffect(() => {
    const db = getDB();
    if (!db) return;
    const ordersRef = dbRef(db, 'orders');
    const unsubscribe = onValue(ordersRef, snapshot => {
      setOrders(objectToArray(snapshot.val()));
    });
    return () => unsubscribe();
  }, []);

  const now = useMemo(() => new Date(), []);

  const plannedTerminations = useMemo(() => buildPlannedTerminations(employees, now), [employees, now]);
  const recentTerminations = useMemo(() => buildRecentTerminations(employees, now), [employees, now]);
  const currentVacations = useMemo(() => filterCurrentlyOnVacation(employees, now), [employees, now]);
  const upcomingVacations = useMemo(() => filterUpcomingVacations(employees, now), [employees, now]);
  const hints = useMemo(() => buildStaffingHints(employees, orders, now), [employees, orders, now]);
  const vacationPeople = useMemo(() => buildVacationPeople(employees, now), [employees, now]);

  const handleCreateOrder = async (hint: StaffingHint) => {
    setIsCreatingOrder(true);
    try {
      await addOrder({
        department: hint.department,
        jobTitle: hint.jobTitle,
        quantity: hint.count,
        realizedQuantity: 0,
        type: 'replacement',
        neededUntil: hint.to ? formatDate(hint.to, 'yyyy-MM-dd') : undefined,
      });
      toast({
        title: 'Zamówienie utworzone',
        description: `${hint.department} · ${hint.jobTitle} — ${hint.count} os.${hint.to ? ` do ${formatDate(hint.to)}` : ''}`,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się utworzyć zamówienia.' });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const confirmEndVacation = async () => {
    if (!personToEndVacation) return;
    setIsEndingVacation(true);
    const success = await handleEndVacation(personToEndVacation.employee.id, personToEndVacation.employee.fullName);
    setIsEndingVacation(false);
    if (success) setPersonToEndVacation(null);
  };

  const isLoading = isContextLoading || isEmployeesLoading;

  return (
    <div className="h-full flex flex-col">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Zastępstwa"
            description={`Podsumowanie odejść i urlopów, wskazówki kadrowe oraz osoby nieobecne. Urlopy: horyzont ${UPCOMING_VACATION_HORIZON_DAYS} dni · odejścia: ${TERMINATION_WINDOW_DAYS} dni.`}
          />

          <Tabs defaultValue="podsumowanie" className="flex-grow flex flex-col gap-4">
            <TabsList className="w-full grid grid-cols-3 max-w-md">
              <TabsTrigger value="podsumowanie" className="gap-1.5">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Podsumowanie</span>
              </TabsTrigger>
              <TabsTrigger value="wskazowki" className="gap-1.5">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Wskazówki ({hints.length})</span>
              </TabsTrigger>
              <TabsTrigger value="urlopy" className="gap-1.5">
                <CalendarOff className="h-4 w-4" />
                <span className="hidden sm:inline">Na urlopie ({vacationPeople.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="podsumowanie" className="flex-grow">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SummarySection
                  title="Planowane odejścia"
                  icon={<UserMinus className="h-4 w-4 text-orange-500" />}
                  employees={plannedTerminations}
                  emptyText="Brak zaplanowanych odejść."
                  dateField="plannedTerminationDate"
                />
                <SummarySection
                  title={`Odejścia (ostatnie ${TERMINATION_WINDOW_DAYS} dni)`}
                  icon={<UserX className="h-4 w-4 text-red-500" />}
                  employees={recentTerminations}
                  emptyText="Brak odejść w ostatnich 30 dniach."
                  dateField="terminationDate"
                />
                <SummarySection
                  title="Na urlopie teraz"
                  icon={<CalendarOff className="h-4 w-4 text-blue-500" />}
                  employees={currentVacations}
                  emptyText="Obecnie nikt nie przebywa na urlopie."
                  dateField="vacationStartDate"
                />
                <SummarySection
                  title={`Nadchodzące urlopy (${UPCOMING_VACATION_HORIZON_DAYS} dni)`}
                  icon={<CalendarOff className="h-4 w-4 text-emerald-500" />}
                  employees={upcomingVacations}
                  emptyText="Brak zaplanowanych urlopów."
                  dateField="vacationStartDate"
                />
              </div>
            </TabsContent>

            <TabsContent value="wskazowki" className="flex-grow">
              {hints.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    <Lightbulb className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    Brak potrzeb zastępstw — wszystkie nieobecności są pokryte zamówieniami.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {hints.map(hint => (
                    <HintCard key={hint.id} hint={hint} onCreateOrder={handleCreateOrder} isCreating={isCreatingOrder} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="urlopy" className="flex-grow">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Osoby na urlopie ({vacationPeople.length})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Osoby z aktywnym urlopem nie widnieją na liście „Pracownicy aktywni”. Wpis pozostaje
                    na liście do ręcznego zakończenia — także po upływie daty końcowej.
                  </p>
                </CardHeader>
                <CardContent>
                  {vacationPeople.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Nikt nie jest na urlopie ani nie ma zaplanowanego urlopu.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {vacationPeople.map(person => (
                        <VacationPersonRow key={person.employee.id} person={person} onEndVacation={setPersonToEndVacation} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <AlertDialog open={!!personToEndVacation} onOpenChange={open => !open && setPersonToEndVacation(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Zakończyć urlop?</AlertDialogTitle>
                <AlertDialogDescription>
                  {personToEndVacation?.employee.fullName} wróci do listy „Pracownicy aktywni”, a daty urlopu
                  zostaną usunięte. Tej operacji nie można cofnąć z tej widoku.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={confirmEndVacation} disabled={isEndingVacation} className="gap-2">
                  {isEndingVacation && <Loader2 className="h-4 w-4 animate-spin" />}
                  Zakończ urlop
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
