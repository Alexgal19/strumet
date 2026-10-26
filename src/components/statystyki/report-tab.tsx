'use client';

import { forwardRef, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { startOfDay } from 'date-fns';
import { Briefcase, Building, ChevronRight, Printer, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { StatisticsExcelExportButton } from '@/components/statistics-excel-export-button';
import { MonthlyReportPrint } from '@/components/monthly-report-print';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { parseMaybeDate, vacationHasStarted } from '@/lib/date';
import type { Employee, Stats } from '@/lib/types';
import { EmployeeEditOverlay } from './employee-edit-overlay';

const StatisticsPieChart = dynamic(() => import('@/components/statistics-pie-chart'), {
    ssr: false,
});

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-1) / 0.7)", "hsl(var(--chart-2) / 0.7)"];

interface DialogContentData {
    title: string;
    total: number;
    type: 'list' | 'hierarchy';
    data: Employee[] | DepartmentHierarchy;
}

interface DepartmentHierarchy {
    [manager: string]: {
        [jobTitle: string]: Employee[];
    };
}

export const ReportTab = forwardRef<unknown, {}>((_, ref) => {
    const { config, handleSaveEmployee, handleTerminateEmployee, isAdmin, absences } = useAppContext();
    const { employees: activeEmployees } = useEmployees('aktywny');
    const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<DialogContentData | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isReportReady, setIsReportReady] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const isMobile = useIsMobile();

    // Ensure chart rendering is client-side protected if sensitive to hydration,
    // although "use client" handles most cases.
    // We can use a mounted check if needed, but Recharts usually behaves.

    const { stats, departmentData, nationalityData, jobTitleData, onVacationCount, plannedTerminationCount } = useMemo(() => {
        const deptCounts: { [key: string]: number } = {};
        const nationCounts: { [key: string]: number } = {};
        const jobCounts: { [key: string]: number } = {};

        activeEmployees.forEach(employee => {
            if (employee.department) deptCounts[employee.department] = (deptCounts[employee.department] || 0) + 1;
            if (employee.nationality) nationCounts[employee.nationality] = (nationCounts[employee.nationality] || 0) + 1;
            if (employee.jobTitle) jobCounts[employee.jobTitle] = (jobCounts[employee.jobTitle] || 0) + 1;
        });

        const totalActiveEmployees = activeEmployees.length;

        const formatData = (counts: { [key: string]: number }) =>
            Object.entries(counts).map(([name, value], index) => ({
                name,
                value,
                percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
                fill: CHART_COLORS[index % CHART_COLORS.length]
            })).sort((a, b) => b.value - a.value);

        const departmentData = formatData(deptCounts);
        const nationalityData = formatData(nationCounts);
        const jobTitleData = formatData(jobCounts);

        const stats: Stats = {
            totalActiveEmployees: totalActiveEmployees,
            totalDepartments: Object.keys(deptCounts).length,
            totalJobTitles: Object.keys(jobCounts).length,
        };

        const onVacationCount = activeEmployees.filter(e => vacationHasStarted(e.vacationStartDate)).length;
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        const plannedTerminationCount = activeEmployees.filter(e => {
            const planned = parseMaybeDate(e.plannedTerminationDate);
            if (!planned) return false;
            const plannedMidnight = new Date(planned);
            plannedMidnight.setHours(0, 0, 0, 0);
            return plannedMidnight.getTime() >= todayMidnight.getTime();
        }).length;

        return { stats, departmentData, nationalityData, jobTitleData, onVacationCount, plannedTerminationCount };
    }, [activeEmployees]);

    const handleChartClick = (name: string, type: "department" | "nationality" | "jobTitle") => {
        if (type === "department") {
            const departmentEmployees = activeEmployees.filter(e => e.department === name);
            const hierarchy: DepartmentHierarchy = {};
            departmentEmployees.forEach(emp => {
                const manager = emp.manager || "Brak kierownika";
                const jobTitle = emp.jobTitle || "Brak stanowiska";
                if (!hierarchy[manager]) {
                    hierarchy[manager] = {};
                }
                if (!hierarchy[manager][jobTitle]) {
                    hierarchy[manager][jobTitle] = [];
                }
                hierarchy[manager][jobTitle].push(emp);
            });
            setDialogContent({
                title: `Struktura działu: ${name}`,
                total: departmentEmployees.length,
                type: "hierarchy",
                data: hierarchy
            });
        }
        else {
            const filtered = type === "nationality"
                ? activeEmployees.filter(e => e.nationality === name)
                : activeEmployees.filter(e => e.jobTitle === name);
            const title = type === "nationality"
                ? `Pracownicy narodowości: ${name}`
                : `Pracownicy na stanowisku: ${name}`;
            setDialogContent({
                title,
                total: filtered.length,
                type: "list",
                data: filtered
            });
        }
        setIsStatDialogOpen(true);
    };
    const handleEmployeeClick = (employee: Employee) => {
        if (!isAdmin) return;
        setEditingEmployee(employee);
        setIsStatDialogOpen(false);
        setIsFormOpen(true);
    };
    const onSave = async (employeeData: Employee) => {
        await handleSaveEmployee(employeeData);
        setEditingEmployee(null);
        setIsFormOpen(false);
        setIsStatDialogOpen(true);
    };

    // Explicitly typed render function to avoid implicit any errors if any
    const renderPieChart = (data: any[], title: string, description: string, type: "department" | "nationality" | "jobTitle") => (
        <StatisticsPieChart
            data={data}
            title={title}
            description={description}
            type={type}
            onChartClick={handleChartClick}
        />
    );

    const renderDialogContent = () => {
        if (!dialogContent)
            return null;
        if (dialogContent.type === "hierarchy") {
            const hierarchy = dialogContent.data as DepartmentHierarchy;
            return (<Accordion type="multiple" className="w-full">
                {Object.entries(hierarchy).map(([manager, jobTitles]) => (<AccordionItem value={manager} key={manager}>
                    <AccordionTrigger className="hover:no-underline text-sm">
                        <div className="flex justify-between w-full pr-2">
                            <span className="font-semibold">{manager}</span>
                            <span className="text-muted-foreground text-xs">{Object.values(jobTitles).flat().length} os.</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Accordion type="multiple" className="w-full pl-4">
                            {Object.entries(jobTitles).map(([jobTitle, emps]) => (<AccordionItem value={jobTitle} key={jobTitle}>
                                <AccordionTrigger className="hover:no-underline text-xs">
                                    <div className="flex justify-between w-full pr-2">
                                        <span className="font-medium text-muted-foreground">{jobTitle}</span>
                                        <span className="text-muted-foreground">{emps.length} os.</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-4 border-l-2 border-border ml-2">
                                        {emps.map(employee => (<button key={employee.id} className={cn("flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-2 text-sm text-left", isAdmin && "hover:bg-muted/50 cursor-pointer")} onClick={isAdmin ? () => handleEmployeeClick(employee) : undefined}>
                                            <span className="flex items-center gap-1.5">
                                                {employee.fullName}
                                                {vacationHasStarted(employee.vacationStartDate) && (
                                                    <span className="animate-pulse rounded-full bg-pink-500 px-1.5 py-0.5 text-xs font-semibold text-white">URLOP</span>
                                                )}
                                                {(() => {
                                                    const planned = parseMaybeDate(employee.plannedTerminationDate);
                                                    if (!planned || startOfDay(planned) < startOfDay(new Date())) return null;
                                                    return <span className="rounded-full border border-orange-500/60 px-1.5 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">Zwalnia się</span>;
                                                })()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="text-xs text-muted-foreground">{employee.cardNumber}</span>
                                                {isAdmin && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                                            </span>
                                        </button>))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>))}
                        </Accordion>
                    </AccordionContent>
                </AccordionItem>))}
            </Accordion>);
        }
        const employeesToShow = dialogContent.data as Employee[];
        return employeesToShow.map(employee => (<button key={employee.id} className={cn("flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-2 text-sm text-left", isAdmin && "hover:bg-muted/50 cursor-pointer")} onClick={isAdmin ? () => handleEmployeeClick(employee) : undefined}>
            <span className="flex items-center gap-1.5 font-medium">
                {employee.fullName}
                {vacationHasStarted(employee.vacationStartDate) && (
                    <span className="animate-pulse rounded-full bg-pink-500 px-1.5 py-0.5 text-xs font-semibold text-white">URLOP</span>
                )}
                {(() => {
                    const planned = parseMaybeDate(employee.plannedTerminationDate);
                    if (!planned || startOfDay(planned) < startOfDay(new Date())) return null;
                    return <span className="rounded-full border border-orange-500/60 px-1.5 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">Zwalnia się</span>;
                })()}
            </span>
            <span className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">{employee.cardNumber}</span>
                {isAdmin && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </span>
        </button>));
    };
    const handlePrintReport = () => {
        setIsReportReady(true);
        setTimeout(() => {
            window.print();
            setIsReportReady(false);
        }, 150);
    };
    return (<div className="flex flex-col space-y-6 flex-grow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-xl font-bold">Raport bieżący</h3>
            <div className="flex items-center gap-2">
                {isAdmin && activeEmployees.length > 0 && (
                    <Button
                        variant="outline"
                        onClick={handlePrintReport}
                        title="Raport miesięczny do druku / PDF"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Raport miesięczny
                    </Button>
                )}
                {isAdmin && activeEmployees.length > 0 && <StatisticsExcelExportButton stats={stats} departmentData={departmentData} nationalityData={nationalityData} jobTitleData={jobTitleData} employees={activeEmployees} />}
            </div>
        </div>
        {activeEmployees.length === 0 ? (<div className="text-center text-muted-foreground py-10">
            Brak danych do wyświetlenia statystyk. Dodaj pracowników, aby zobaczyć analizę.
        </div>) : (<div
            className="space-y-6"
        >
            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Card className="glass-card border-0 p-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">Aktywni pracownicy</CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gradient-primary">{stats.totalActiveEmployees}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Całkowita liczba pracowników
                                {(onVacationCount > 0 || plannedTerminationCount > 0) && (
                                    <span className="mt-1 block space-x-2">
                                        {onVacationCount > 0 && (
                                            <span className="inline-flex animate-pulse rounded-full bg-pink-500 px-2 py-0.5 font-semibold text-white">
                                                Na urlopie: {onVacationCount}
                                            </span>
                                        )}
                                        {plannedTerminationCount > 0 && (
                                            <span className="inline-flex rounded-full border border-orange-500/60 px-2 py-0.5 font-semibold text-orange-600 dark:text-orange-400">
                                                Zwalnia się: {plannedTerminationCount}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="glass-card border-0 p-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">Liczba działów</CardTitle>
                            <Building className="h-4 w-4 text-accent" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalDepartments}</div>
                            <p className="text-xs text-muted-foreground mt-1">Aktywne działy w firmie</p>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="glass-card border-0 p-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">Liczba stanowisk</CardTitle>
                            <Briefcase className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalJobTitles}</div>
                            <p className="text-xs text-muted-foreground mt-1">Liczba unikalnych stanowisk</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-3 md:overflow-visible">
                <div className="min-w-[85%] snap-center md:min-w-0">
                    {renderPieChart(departmentData, "Rozkład wg Działów", "Liczba pracowników w poszczególnych działach.", "department")}
                </div>
                <div className="min-w-[85%] snap-center md:min-w-0">
                    {renderPieChart(nationalityData, "Rozkład wg Narodowości", "Struktura pracowników z podziałem na narodowości.", "nationality")}
                </div>
                <div className="min-w-[85%] snap-center md:min-w-0">
                    {renderPieChart(jobTitleData, "Rozkład wg Stanowisk", "Liczba pracowników na poszczególnych stanowiskach.", "jobTitle")}
                </div>
            </div>
        </div>)}
        <Dialog open={isStatDialogOpen} onOpenChange={setIsStatDialogOpen}>
            <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{dialogContent?.title}</DialogTitle>
                    <DialogDescription>
                        Znaleziono {dialogContent?.total} pracowników.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto my-4 pr-1">
                    <div className="space-y-1 pr-3">
                        {renderDialogContent()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <EmployeeEditOverlay
            isMobile={isMobile}
            open={isFormOpen}
            onOpenChange={(open) => { setIsFormOpen(open); if (!open) setIsStatDialogOpen(true); }}
            employee={editingEmployee}
            onSave={onSave}
            onTerminate={async (id, fullName) => {
                await handleTerminateEmployee(id, fullName);
                setIsFormOpen(false);
                setIsStatDialogOpen(true);
            }}
            config={config}
        />

        <div className="print-only">
            {isReportReady && (
                <MonthlyReportPrint
                    employees={activeEmployees}
                    absences={absences}
                    month={new Date()}
                />
            )}
        </div>
    </div>);
})
ReportTab.displayName = 'ReportTab';
