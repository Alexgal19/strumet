'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import {
  Copy,
  Printer,
  Calendar as CalendarIcon,
  Check,
  UserCheck,
  UserX,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  Sparkles,
  Edit2,
  Share2,
  Table,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ref as dbRef, onValue } from 'firebase/database';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { getDB } from '@/lib/firebase';
import { objectToArray, cn } from '@/lib/utils';
import type { Employee, Recruitment } from '@/lib/types';
import {
  calculateDirectorReport,
  generateDirectorReportText,
  formatPolishPersons,
  DirectorReportData,
} from '@/lib/director-report';

interface DirectorReportCardProps {
  employees: Employee[];
  initialCoordinatorName?: string;
}

type PresetKey = 'lastWeek' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom';

export function DirectorReportCard({
  employees,
  initialCoordinatorName = 'Oleksandr Holiadynets',
}: DirectorReportCardProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Rekrutacje (Zapotrzebowania) z bazy
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [isLoadingRecruitment, setIsLoadingRecruitment] = useState(true);

  // Nazwisko koordynatora / nadawcy
  const [coordinatorName, setCoordinatorName] = useState(initialCoordinatorName);
  const [isEditingName, setIsEditingName] = useState(false);

  // Stan wybranego okresu (domyślnie: Poprzedni tydzień, tak jak w przesłanym wzorze użytkownika)
  const [preset, setPreset] = useState<PresetKey>('lastWeek');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  // Przełączniki widoku szczegółów
  const [showTerminatedDetails, setShowTerminatedDetails] = useState(true);
  const [showHiredDetails, setShowHiredDetails] = useState(true);
  const [copiedType, setCopiedType] = useState<'full' | 'short' | null>(null);

  // Nasłuchiwanie na Zapotrzebowania w czasie rzeczywistym
  useEffect(() => {
    const db = getDB();
    if (!db) return;
    const rRef = dbRef(db, 'recruitment');
    const unsubscribe = onValue(
      rRef,
      snapshot => {
        const rows = objectToArray(snapshot.val()).map(row => {
          const positions = row.positions
            ? objectToArray(row.positions).map((p: any) => ({
                ...p,
                toRecruit: Number(p.toRecruit) || 0,
              }))
            : row.jobTitle
              ? [{ id: 'legacy', jobTitle: row.jobTitle, toRecruit: Number(row.toRecruit) || 0 }]
              : [];
          return { ...row, positions, arrivals: objectToArray(row.arrivals) };
        }) as Recruitment[];
        setRecruitments(rows);
        setIsLoadingRecruitment(false);
      },
      () => {
        setIsLoadingRecruitment(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Wyliczanie dat z presetów
  const { dateRange, periodLabel } = useMemo(() => {
    const now = new Date();
    if (preset === 'lastWeek') {
      const prevWeek = subWeeks(now, 1);
      const from = startOfWeek(prevWeek, { weekStartsOn: 1 });
      const to = endOfWeek(prevWeek, { weekStartsOn: 1 });
      return {
        dateRange: { from, to },
        periodLabel: 'w zeszłym tygodniu',
      };
    }
    if (preset === 'thisWeek') {
      const from = startOfWeek(now, { weekStartsOn: 1 });
      const to = now; // do dzisiaj
      return {
        dateRange: { from, to },
        periodLabel: 'w tym tygodniu',
      };
    }
    if (preset === 'thisMonth') {
      const from = startOfMonth(now);
      const to = now;
      return {
        dateRange: { from, to },
        periodLabel: 'w bieżącym miesiącu',
      };
    }
    if (preset === 'lastMonth') {
      const prevMonth = subMonths(now, 1);
      const from = startOfMonth(prevMonth);
      const to = endOfMonth(prevMonth);
      return {
        dateRange: { from, to },
        periodLabel: 'w poprzednim miesiącu',
      };
    }
    // Custom
    if (customRange?.from) {
      const from = customRange.from;
      const to = customRange.to || customRange.from;
      return {
        dateRange: { from, to },
        periodLabel: `w okresie ${format(from, 'dd.MM')} - ${format(to, 'dd.MM.yyyy')}`,
      };
    }
    // Domyślny fallback: zeszły tydzień
    const prevWeek = subWeeks(now, 1);
    return {
      dateRange: {
        from: startOfWeek(prevWeek, { weekStartsOn: 1 }),
        to: endOfWeek(prevWeek, { weekStartsOn: 1 }),
      },
      periodLabel: 'w zeszłym tygodniu',
    };
  }, [preset, customRange]);

  // Przeliczenie danych raportu
  const report: DirectorReportData = useMemo(() => {
    return calculateDirectorReport({
      employees,
      recruitments,
      from: dateRange.from,
      to: dateRange.to,
      periodLabel,
      coordinatorName,
      companyName: 'STRUMET',
    });
  }, [employees, recruitments, dateRange, periodLabel, coordinatorName]);

  // Kopiowanie do schowka
  const handleCopy = (fullDetails: boolean) => {
    try {
      const text = generateDirectorReportText(report, { includeEmployeeList: fullDetails });
      navigator.clipboard.writeText(text);
      setCopiedType(fullDetails ? 'full' : 'short');
      setTimeout(() => setCopiedType(null), 2500);

      toast({
        title: 'Skopiowano do schowka!',
        description: fullDetails
          ? 'Pełny raport ze szczegółami pracowników i datami jest gotowy do wklejenia (WhatsApp / E-mail).'
          : 'Zwięzły raport liczbowy został skopiowany.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Błąd kopiowania',
        description: 'Nie udało się uzyskać dostępu do schowka.',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Obecny stan
      const currentData = report.currentJobTitleBreakdown.map(item => ({
        Stanowisko: item.name,
        Liczba: item.count
      }));
      const wsCurrent = XLSX.utils.json_to_sheet(currentData);
      XLSX.utils.book_append_sheet(wb, wsCurrent, 'Stan obecny');

      // 2. Odeszli
      const terminatedData = report.terminatedEmployees.map(emp => ({
        'Imię i nazwisko': emp.fullName,
        'Stanowisko': emp.jobTitle,
        'Dział': emp.department,
        'Koniec pracy': emp.formattedDate
      }));
      const wsTerminated = XLSX.utils.json_to_sheet(terminatedData);
      XLSX.utils.book_append_sheet(wb, wsTerminated, 'Odeszli');

      // 3. Zatrudnieni
      const hiredData = report.hiredEmployees.map(emp => ({
        'Imię i nazwisko': emp.fullName,
        'Stanowisko': emp.jobTitle,
        'Dział': emp.department,
        'Data zatrudnienia': emp.formattedDate
      }));
      const wsHired = XLSX.utils.json_to_sheet(hiredData);
      XLSX.utils.book_append_sheet(wb, wsHired, 'Zatrudnieni');

      // 4. Zapotrzebowanie (Rekrutacja)
      const recruitmentData = report.recruitmentByDept.flatMap(dept => 
        dept.positions.map(pos => ({
          'Dział': dept.department,
          'Stanowisko': pos.jobTitle,
          'Zapotrzebowanie': pos.toRecruit
        }))
      );
      const wsRecruitment = XLSX.utils.json_to_sheet(recruitmentData);
      XLSX.utils.book_append_sheet(wb, wsRecruitment, 'Zapotrzebowanie');

      // Save file
      const fileName = `Raport_${report.companyName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Eksport zakończony',
        description: `Pobrano plik: ${fileName}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Błąd eksportu',
        description: 'Nie udało się wygenerować pliku Excel.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pasek sterowania i szybkiego wyboru */}
      <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold tracking-tight">
                  Raport dla Dyrektora
                </CardTitle>
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                  Gotowy do wysyłki
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Aktualny stan zatrudnienia, bilans odejść z datami, nowych przyjęć oraz aktualne zapotrzebowanie rekrutacyjne.
              </CardDescription>
            </div>

            {/* Przyciski akcji (Kopiuj / Drukuj) */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Button
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-1.5"
                onClick={() => handleCopy(true)}
              >
                {copiedType === 'full' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>Kopiuj pełny raport (z nazwiskami i datami)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleCopy(false)}
                title="Kopiuje zwięzłą wersję bez imiennej listy"
              >
                {copiedType === 'short' ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span className="hidden sm:inline">Kopiuj skrócony</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handlePrint}
                title="Drukuj lub zapisz jako PDF"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Drukuj / PDF</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExportExcel}
                title="Pobierz jako arkusz Excel"
              >
                <Table className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Wybór okresu (Presety) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 print:hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              Okres:
            </span>

            <Button
              variant={preset === 'lastWeek' ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 text-xs', preset === 'lastWeek' && 'font-semibold')}
              onClick={() => setPreset('lastWeek')}
            >
              Zeszły tydzień
            </Button>

            <Button
              variant={preset === 'thisWeek' ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 text-xs', preset === 'thisWeek' && 'font-semibold')}
              onClick={() => setPreset('thisWeek')}
            >
              Ten tydzień
            </Button>

            <Button
              variant={preset === 'thisMonth' ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 text-xs', preset === 'thisMonth' && 'font-semibold')}
              onClick={() => setPreset('thisMonth')}
            >
              Bieżący miesiąc
            </Button>

            <Button
              variant={preset === 'lastMonth' ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 text-xs', preset === 'lastMonth' && 'font-semibold')}
              onClick={() => setPreset('lastMonth')}
            >
              Poprzedni miesiąc
            </Button>

            {/* Kalendarz zakresu własnego */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={preset === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('h-8 text-xs gap-1.5', preset === 'custom' && 'font-semibold')}
                  onClick={() => setPreset('custom')}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {preset === 'custom' && customRange?.from ? (
                    customRange.to ? (
                      `${format(customRange.from, 'dd.MM')} - ${format(customRange.to, 'dd.MM.yyyy')}`
                    ) : (
                      format(customRange.from, 'dd.MM.yyyy')
                    )
                  ) : (
                    'Własny zakres'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customRange?.from || dateRange.from}
                  selected={customRange}
                  onSelect={range => {
                    setCustomRange(range);
                    if (range?.from) setPreset('custom');
                  }}
                  numberOfMonths={isMobile ? 1 : 2}
                  locale={pl}
                />
              </PopoverContent>
            </Popover>

            <div className="ml-auto text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              <span>Zakres: {report.formattedRange}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GŁÓWNA KARTA RAPORTU - Zgodna z makietą użytkownika */}
      <Card className="border-2 border-border shadow-md bg-card overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8 max-w-4xl mx-auto">
          {/* 1. Nagłówek: Koordynator i Stan aktualny */}
          <div className="space-y-4">
            <div className="flex items-baseline justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={coordinatorName}
                        onChange={e => setCoordinatorName(e.target.value)}
                        className="h-8 text-lg font-bold w-64"
                        placeholder="Imię i nazwisko"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setIsEditingName(false)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <h2
                      className="text-2xl sm:text-3xl font-black tracking-tight cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                      onClick={() => setIsEditingName(true)}
                      title="Kliknij, aby edytować podpis"
                    >
                      {report.coordinatorName}
                      <Edit2 className="h-4 w-4 text-muted-foreground opacity-50 hover:opacity-100 print:hidden" />
                    </h2>
                  )}
                  <span className="text-xl sm:text-2xl font-bold text-muted-foreground">
                    ({formatPolishPersons(report.totalActive)})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Wygenerowano dla: Zarząd / Dyrekcja • Okres: {report.formattedRange}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  Aktywnych: {report.totalActive}
                </span>
              </div>
            </div>

            {/* STRUMET - 294 osób */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
                <span className="inline-block w-3 h-3 rounded-full bg-red-600 shadow-sm shrink-0" />
                <span className="underline decoration-2 underline-offset-4">{report.companyName}</span>
                <span className="text-muted-foreground font-semibold">– {formatPolishPersons(report.totalActive)}</span>
              </div>

              <div className="pl-5 space-y-1 text-sm sm:text-base">
                <p className="font-bold text-foreground">W tym</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground font-medium">
                  {report.currentJobTitleBreakdown.map(item => (
                    <div key={item.name} className="flex items-center justify-between border-b border-border/20 py-0.5">
                      <span>- {item.name}</span>
                      <span className="font-bold text-foreground">– {item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Czerwony banner: OSOBY KTÓRE SKOŃCZYŁY PRACĘ */}
          <div className="space-y-4">
            <div className="bg-red-600 text-white font-extrabold text-center py-2.5 px-4 rounded-md shadow-sm text-base sm:text-lg tracking-wide uppercase">
              {formatPolishPersons(report.terminatedTotal)} skończyło pracę {report.periodLabel}
            </div>

            {report.terminatedTotal === 0 ? (
              <p className="text-center text-sm text-muted-foreground italic py-2">
                Brak zarejestrowanych zakończeń pracy w wybranym okresie.
              </p>
            ) : (
              <div className="pl-4 space-y-3">
                {/* Podział sumaryczny wg stanowisk */}
                <div className="space-y-1 text-sm sm:text-base font-medium">
                  {report.terminatedByJobTitle.map(item => (
                    <div key={item.name} className="flex items-center justify-between max-w-md py-0.5 border-b border-border/20">
                      <span>- {item.name}</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        – {formatPolishPersons(item.count)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dokładna lista pracowników z datami zakończenia pracy */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTerminatedDetails(prev => !prev)}
                    className="flex items-center gap-2 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:underline print:hidden cursor-pointer"
                  >
                    <span>
                      {showTerminatedDetails ? 'Ukryj' : 'Pokaż'} dokładną listę pracowników z datami ({report.terminatedEmployees.length})
                    </span>
                    {showTerminatedDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {(showTerminatedDetails || typeof window !== 'undefined') && (
                    <div className={cn('mt-3 space-y-2', !showTerminatedDetails && 'hidden print:block')}>
                      <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                          Szczegółowa lista osób (kto i kiedy zakończył pracę):
                        </p>
                        <div className="divide-y divide-red-200/60 dark:divide-red-900/40 text-xs sm:text-sm">
                          {report.terminatedEmployees.map((emp, idx) => (
                            <div key={emp.id || idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                <span className="text-red-500 font-bold">•</span>
                                <span>{emp.fullName}</span>
                                <span className="text-xs font-normal text-muted-foreground">
                                  ({emp.jobTitle} • {emp.department})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200 border-red-300 text-xs font-bold">
                                  Koniec pracy: {emp.formattedDate}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Zielony banner: OSOBY KTÓRE ZACZĘŁY PRACĘ */}
          <div className="space-y-4">
            <div className="bg-green-600 text-white font-extrabold text-center py-2.5 px-4 rounded-md shadow-sm text-base sm:text-lg tracking-wide uppercase">
              {formatPolishPersons(report.hiredTotal)} zaczęło pracę {report.periodLabel}
            </div>

            {report.hiredTotal === 0 ? (
              <p className="text-center text-sm text-muted-foreground italic py-2">
                Brak nowych zatrudnień w wybranym okresie.
              </p>
            ) : (
              <div className="pl-4 space-y-3">
                {/* Podział sumaryczny wg stanowisk */}
                <div className="space-y-1 text-sm sm:text-base font-medium">
                  {report.hiredByJobTitle.map(item => (
                    <div key={item.name} className="flex items-center justify-between max-w-md py-0.5 border-b border-border/20">
                      <span>- {item.name}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        – {formatPolishPersons(item.count)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dokładna lista nowo zatrudnionych z datami */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHiredDetails(prev => !prev)}
                    className="flex items-center gap-2 text-xs sm:text-sm font-bold text-green-600 dark:text-green-400 hover:underline print:hidden cursor-pointer"
                  >
                    <span>
                      {showHiredDetails ? 'Ukryj' : 'Pokaż'} dokładną listę nowo zatrudnionych ({report.hiredEmployees.length})
                    </span>
                    {showHiredDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {(showHiredDetails || typeof window !== 'undefined') && (
                    <div className={cn('mt-3 space-y-2', !showHiredDetails && 'hidden print:block')}>
                      <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20 p-3 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-300">
                          Szczegółowa lista nowo zatrudnionych (kto i kiedy rozpoczął pracę):
                        </p>
                        <div className="divide-y divide-green-200/60 dark:divide-green-900/40 text-xs sm:text-sm">
                          {report.hiredEmployees.map((emp, idx) => (
                            <div key={emp.id || idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                <span className="text-green-500 font-bold">•</span>
                                <span>{emp.fullName}</span>
                                <span className="text-xs font-normal text-muted-foreground">
                                  ({emp.jobTitle} • {emp.department})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-200 border-green-300 text-xs font-bold">
                                  Data zatrudnienia: {emp.formattedDate}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Żółty banner: DO ZREKRUTOWANIA (ZAPOTRZEBOWANIA) */}
          <div className="space-y-4">
            <div className="bg-amber-400 dark:bg-amber-500 text-slate-900 font-extrabold py-2.5 px-4 rounded-md shadow-sm text-base sm:text-lg tracking-wide uppercase flex items-center justify-between">
              <span>Do zrekrutowania:</span>
              <span className="text-sm font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                Łącznie: {formatPolishPersons(report.recruitmentTotal)}
              </span>
            </div>

            {report.recruitmentTotal === 0 ? (
              <p className="text-center text-sm text-muted-foreground italic py-2">
                Brak otwartych zapotrzebowań w module Rekrutacja.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Grupowanie wg Działów */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.recruitmentByDept.map(dept => (
                    <div
                      key={dept.department}
                      className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-amber-200/70 dark:border-amber-900/50 pb-2">
                        <span className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-amber-600" />
                          {dept.department}
                        </span>
                        <Badge variant="secondary" className="font-bold text-xs bg-amber-200/70 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                          {dept.total} os.
                        </Badge>
                      </div>

                      <ul className="space-y-1.5 text-sm pt-1">
                        {dept.positions.map((pos, pIdx) => (
                          <li key={pIdx} className="flex items-center justify-between font-medium">
                            <span className="text-muted-foreground">• {pos.jobTitle}</span>
                            <span className="font-bold text-foreground">{pos.toRecruit} os.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Zbiorcze podsumowanie stanowisk */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Zbiorcze zapotrzebowanie wg stanowisk:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {report.recruitmentByJobTitle.map(item => (
                      <Badge key={item.name} variant="outline" className="px-3 py-1 font-semibold text-xs border-amber-300 dark:border-amber-700 bg-background">
                        {item.name}: <span className="font-bold text-amber-600 dark:text-amber-400 ml-1">{item.count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stopka raportu dla wydruku */}
          <div className="hidden print:flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
            <span>Baza-ST • Raport Wygenerowany Automatycznie</span>
            <span>Podpis koordynatora: ____________________</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
