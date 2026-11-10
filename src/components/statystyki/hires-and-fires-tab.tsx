'use client';

import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { getDateLocale, rich } from '@/lib/i18n';
import type { DateRange } from 'react-day-picker';
import {
  Archive,
  ArrowRight,
  CalendarIcon,
  Loader2,
  UserPlus,
  UserX,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DirectorReportCard } from '@/components/director-report-card';
import { archiveEmployees } from '@/ai/flows/archive-employees-flow';
import { createStatsSnapshot } from '@/ai/flows/create-stats-snapshot';
import { useAppContext } from '@/context/app-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { parseMaybeDate } from '@/lib/date';
import type { StatsSnapshot } from '@/lib/types';
import {
  EmployeeChangeList,
  FieldChangeList,
  PeriodChangeCard,
  SingleDayReportCard,
} from './report-change-cards';
import { TurnoverCards } from './turnover-cards';

import { t } from '@/lib/i18n';
export const HiresAndFiresTab = () => {
    const { isAdmin, currentUser, statsHistory, employees } = useAppContext();
    const isMobile = useIsMobile();
    const [isArchiving, setIsArchiving] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const turnoverStats = useMemo(() => {
        if (!Array.isArray(statsHistory) || statsHistory.length < 2) return null;
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const ninetyDaysAgo = subDays(today, 90);

        const filterByDate = (from: Date) =>
            statsHistory.filter(s => {
                const d = parseMaybeDate(s.id);
                return d ? d >= from : false;
            });

        const calc = (data: StatsSnapshot[]) => {
            if (data.length === 0) return null;
            const totalTerminations = data.reduce((sum, s) => sum + (s.terminations || 0), 0);
            const avgHeadcount = data.reduce((sum, s) => sum + (s.totalActive || 0), 0) / data.length;
            if (avgHeadcount === 0) return null;
            return {
                rate: ((totalTerminations / avgHeadcount) * 100).toFixed(1),
                totalTerminations,
                avgHeadcount: Math.round(avgHeadcount),
                days: data.length,
            };
        };

        return {
            monthly: calc(filterByDate(thirtyDaysAgo)),
            quarterly: calc(filterByDate(ninetyDaysAgo)),
        };
    }, [statsHistory]);

    const handleManualArchive = async () => {
        setIsArchiving(true);
        try {
            const result = await archiveEmployees();
            if (!result.success) {
                throw new Error(result.message);
            }
            toast({
                title: t('stats.archivingFinished'),
                description: t('stats.fileCreatedPath', { path: result.filePath ?? '' }),
            });

        } catch (error: any) {
            console.error("Error creating manual archive:", error);
            toast({ variant: 'destructive', title: t('stats.archivingError'), description: error.message || t('stats.aServerErrorOccurred') });
        } finally {
            setIsArchiving(false);
        }
    };

    const generateReport = async () => {
        if (!date || !date.from) {
            toast({ variant: 'destructive', title: t('stats.error'), description: t('stats.pleasePickADateOr') });
            return;
        }

        setIsLoading(true);
        setReport(null);

        try {
            const reportData = await createStatsSnapshot({
                startDate: format(date.from, 'yyyy-MM-dd'),
                endDate: date.to ? format(date.to, 'yyyy-MM-dd') : undefined,
            });
            setReport(reportData);

        } catch (error: any) {
            console.error("Error generating report:", error);
            toast({ variant: 'destructive', title: t('stats.error'), description: error.message || t('stats.couldNotGenerateTheReport') });
        } finally {
            setIsLoading(false);
        }
    };


    const hasEvents = report && ((report.newHires && report.newHires.length > 0) || (report.terminated && report.terminated.length > 0) || (report.fieldChanges && report.fieldChanges.length > 0));

    const coordinatorName =
        currentUser?.email === 'sanyagal191919@gmail.com'
            ? 'Oleksandr Holiadynets'
            : (currentUser?.email?.split('@')[0] || 'Oleksandr Holiadynets');

    return (
        <div className="space-y-8">
            <DirectorReportCard employees={employees} initialCoordinatorName={coordinatorName} />

            <div className="pt-6 border-t border-border/60">
                <Card className="glass-card">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{t('stats.historicalAnalysis')}</CardTitle>
                            <CardDescription>{t('stats.compareHeadcountBetweenTwoDays')}</CardDescription>
                        </div>
                        {isAdmin && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={isArchiving}>
                                        {isArchiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                                        {t('stats.createArchiveNow')}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('stats.areYouSure')}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t('stats.thisWillCreateANew')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('stats.cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleManualArchive}>{t('stats.continue')}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>{t('stats.pickAPeriodOrA')}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[300px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                    disabled={isLoading}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "dd LLL, y", { locale: getDateLocale() })} -{" "}
                                                {format(date.to, "dd LLL, y", { locale: getDateLocale() })}
                                            </>
                                        ) : (
                                            format(date.from, "dd LLL, y", { locale: getDateLocale() })
                                        )
                                    ) : (
                                        <span>{t('stats.pickADateRange')}</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={isMobile ? 1 : 2}
                                    locale={getDateLocale()}
                                    disabled={isLoading}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={generateReport} disabled={isLoading || !date?.from}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('stats.generateReport')}
                    </Button>
                </CardContent>
            </Card>

            <TurnoverCards
                monthly={turnoverStats?.monthly ?? null}
                quarterly={turnoverStats?.quarterly ?? null}
            />

            {isLoading && !report && (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">{t('stats.generatingTheReportThisMay')}</p>
                </div>
            )}

            {report && report.isRange && (
                <div className="space-y-6 animate-fade-in">
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle>{t('stats.summaryOfChanges')}</CardTitle>
                            <CardDescription>
                                {rich(t('stats.comparisonOfFromAndTo'), { from: <span className="font-bold">{report.start.date}</span>, to: <span className="font-bold">{report.end.date}</span> })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg border bg-background text-center">
                                <p className="text-sm text-muted-foreground">{t('stats.numberOfEmployees')}</p>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <span className="text-2xl font-bold">{report.start.total}</span>
                                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-2xl font-bold">{report.end.total}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border bg-background text-center">
                                <p className="text-sm text-muted-foreground">{t('stats.difference')}</p>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <span className={cn("text-3xl font-bold", report.diff >= 0 ? 'text-green-500' : 'text-destructive')}>
                                        {report.diff > 0 ? '+' : ''}{report.diff}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border bg-background text-center">
                                <p className="text-sm text-muted-foreground">{t('stats.newLeft')}</p>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <span className="text-2xl font-bold text-green-500">+{report.newHires.length}</span>
                                    <span className="text-2xl font-bold text-destructive">-{report.terminated.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Accordion type="multiple" className="w-full">
                        <AccordionItem value="range-unit-changes">
                            <AccordionTrigger>{t('stats.changesInDepartmentsJobTitles')}</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <PeriodChangeCard title={t('stats.departmentChanges')} data={report.deptChanges} />
                                    <PeriodChangeCard title={t('stats.jobTitleChanges')} data={report.jobTitleChanges} />
                                    <PeriodChangeCard title={t('stats.nationalityChanges')} data={report.nationalityChanges} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            )}

            {report && hasEvents && (
                <div className="space-y-6 animate-fade-in">
                    {report.isRange ? (
                        <Accordion type="multiple" className="w-full">
                            <AccordionItem value="range-hires-fires">
                                <AccordionTrigger>{t('stats.turnoverDetailsForThePeriod')}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <EmployeeChangeList
                                            title={t('stats.newHires')}
                                            employees={report.newHires}
                                            icon={<UserPlus className="h-6 w-6 text-green-500" />}
                                            emptyText={t('stats.noHires')}
                                        />
                                        <EmployeeChangeList
                                            title={t('stats.terminated')}
                                            employees={report.terminated}
                                            icon={<UserX className="h-6 w-6 text-destructive" />}
                                            emptyText={t('stats.noTerminations')}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="range-field-changes">
                                <AccordionTrigger>{t('stats.changesInEmployeeData')}</AccordionTrigger>
                                <AccordionContent>
                                    <FieldChangeList changes={report.fieldChanges || []} />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    ) : (
                        <>
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle>{t('stats.reportForDate', { date: report.date })}</CardTitle>
                                    <CardDescription>{t('stats.headcountAndEventsOnThe')}</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-lg border bg-background text-center">
                                        <p className="text-sm text-muted-foreground">{t('stats.totalNumberOfEmployees')}</p>
                                        <div className="flex items-center justify-center gap-4 mt-2">
                                            <span className="text-3xl font-bold">{report.total}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-background text-center">
                                        <p className="text-sm text-muted-foreground">{t('stats.hiredThatDay')}</p>
                                        <div className="flex items-center justify-center gap-4 mt-2">
                                            <span className="text-3xl font-bold text-green-500">+{report.newHires.length}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-background text-center">
                                        <p className="text-sm text-muted-foreground">{t('stats.terminatedThatDay')}</p>
                                        <div className="flex items-center justify-center gap-4 mt-2">
                                            <span className="text-3xl font-bold text-destructive">-{report.terminated.length}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <EmployeeChangeList
                                    title={t('stats.hiredOnThisDay')}
                                    employees={report.newHires}
                                    icon={<UserPlus className="h-6 w-6 text-green-500" />}
                                    emptyText={t('stats.noHires')}
                                />
                                <EmployeeChangeList
                                    title={t('stats.terminatedOnThisDay')}
                                    employees={report.terminated}
                                    icon={<UserX className="h-6 w-6 text-destructive" />}
                                    emptyText={t('stats.noTerminations')}
                                />
                            </div>
                            <FieldChangeList changes={report.fieldChanges || []} />
                        </>
                    )}
                </div>
            )}

            {report && !report.isRange && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-lg font-semibold mt-8">{t('stats.statisticsForDate', { date: report.date })}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SingleDayReportCard title={t('stats.employeesByDepartment')} data={report.deptChanges} />
                        <SingleDayReportCard title={t('stats.employeesByJobTitle')} data={report.jobTitleChanges} />
                        <SingleDayReportCard title={t('stats.employeesByNationality')} data={report.nationalityChanges} />
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};
