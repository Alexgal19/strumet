'use client';

import React, { useMemo, useState, useEffect, forwardRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Copy, Building, Briefcase, ChevronRight, PlusCircle, Trash2, FileDown, Edit, ArrowRight, GitCompareArrows, Archive, UserPlus, UserX, CalendarClock } from 'lucide-react';
import { Employee, Order, AllConfig, Stats, User, UserRole, StatsSnapshot } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { EmployeeForm } from '@/components/employee-form';
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatisticsExcelExportButton } from '@/components/statistics-excel-export-button';
import { getDB, getStorage_ } from '@/lib/firebase';
import { ref as dbRef, onValue } from 'firebase/database';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfDay, isEqual, isBefore } from 'date-fns';
import { pl } from 'date-fns/locale';
import { archiveEmployees } from '@/ai/flows/archive-employees-flow';
import { createStatsSnapshot } from '@/ai/flows/create-stats-snapshot';
import { formatDate, parseMaybeDate } from '@/lib/date';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

// ... (existing code)

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
    return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};


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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background/95 p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <div className="col-span-2">
                        <span className="text-sm font-bold text-foreground">{label}</span>
                    </div>
                    {payload.map((p: any) => (
                        <React.Fragment key={p.dataKey}>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.stroke || p.payload.fill }} />
                                <span className="text-xs font-medium text-muted-foreground">{p.name}</span>
                            </div>
                            <span className="text-xs font-bold text-right text-foreground">{p.value}</span>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};

const ReportTab = forwardRef<unknown, {}>((_, ref) => {
    const { employees, config, handleSaveEmployee, isAdmin } = useAppContext();
    const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<DialogContentData | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const { toast } = useToast();

    // Ensure chart rendering is client-side protected if sensitive to hydration, 
    // although "use client" handles most cases. 
    // We can use a mounted check if needed, but Recharts usually behaves.

    const activeEmployees = useMemo(() => {
        return employees.filter(e => e.status === "aktywny");
    }, [employees]);

    const { stats, departmentData, nationalityData, jobTitleData } = useMemo(() => {
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

        return { stats, departmentData, nationalityData, jobTitleData };
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
    };

    // Explicitly typed render function to avoid implicit any errors if any
    const renderPieChart = (data: any[], title: string, description: string, type: "department" | "nationality" | "jobTitle") => (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <ChartContainer config={{}} className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                innerRadius={90}
                                paddingAngle={2}
                                labelLine={false}
                                onClick={(data: any) => handleChartClick(data.name, type)}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={"hsl(var(--card))"} className="cursor-pointer" />
                                ))}
                            </Pie>
                            <Legend
                                iconType="circle"
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                iconSize={10}
                                wrapperStyle={{ lineHeight: "1.8em" }}
                                onClick={(d: any) => handleChartClick(d.value, type)}
                                formatter={(value, entry: any) => (
                                    <span className="text-muted-foreground text-sm pl-2 cursor-pointer hover:text-foreground">
                                        {value} <span className="font-bold">({entry.payload?.value})</span>
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
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
                                        {emps.map(employee => (<div key={employee.id} className={cn("flex items-center justify-between text-xs p-1.5 rounded-md", isAdmin && "hover:bg-muted/50 cursor-pointer")} onClick={() => handleEmployeeClick(employee)}>
                                            <span>{employee.fullName}</span>
                                            <span className="text-xs text-muted-foreground">{employee.cardNumber}</span>
                                        </div>))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>))}
                        </Accordion>
                    </AccordionContent>
                </AccordionItem>))}
            </Accordion>);
        }
        const employeesToShow = dialogContent.data as Employee[];
        return employeesToShow.map(employee => (<div key={employee.id} className={cn("flex items-center justify-between text-sm p-2 rounded-md", isAdmin && "hover:bg-muted/50 cursor-pointer")} onClick={() => handleEmployeeClick(employee)}>
            <span className="font-medium">{employee.fullName}</span>
            <span className="text-muted-foreground text-xs">{employee.cardNumber}</span>
        </div>));
    };
    return (<div className="flex flex-col space-y-6 flex-grow">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Raport bieżący</h3>
            {isAdmin && employees.length > 0 && <StatisticsExcelExportButton stats={stats} departmentData={departmentData} nationalityData={nationalityData} jobTitleData={jobTitleData} employees={activeEmployees} />}
        </div>
        {employees.length === 0 ? (<div className="text-center text-muted-foreground py-10">
            Brak danych do wyświetlenia statystyk. Dodaj pracowników, aby zobaczyć analizę.
        </div>) : (<>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">Aktywni pracownicy</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalActiveEmployees}</div>
                        <p className="text-xs text-muted-foreground">Całkowita liczba pracowników</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">Liczba działów</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDepartments}</div>
                        <p className="text-xs text-muted-foreground">Aktywne działy w firmie</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">Liczba stanowisk</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalJobTitles}</div>
                        <p className="text-xs text-muted-foreground">Liczba unikalnych stanowisk w firmie</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {renderPieChart(departmentData, "Rozkład wg Działów", "Liczba pracowników w poszczególnych działach.", "department")}
                {renderPieChart(nationalityData, "Rozkład wg Narodowości", "Struktura pracowników z podziałem na narodowości.", "nationality")}
                <div className="lg:col-span-2">
                    {renderPieChart(jobTitleData, "Rozkład wg Stanowisk", "Liczba pracowników na poszczególnych stanowiskach.", "jobTitle")}
                </div>
            </div>
        </>)}
        <Dialog open={isStatDialogOpen} onOpenChange={setIsStatDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{dialogContent?.title}</DialogTitle>
                    <DialogDescription>
                        Znaleziono {dialogContent?.total} pracowników.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] my-4">
                    <div className="space-y-1 pr-4">
                        {renderDialogContent()}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Edytuj pracownika</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                    <EmployeeForm employee={editingEmployee} onSave={onSave} onCancel={() => setIsFormOpen(false)} config={config} />
                </div>
            </DialogContent>
        </Dialog>
    </div>);
})
ReportTab.displayName = 'ReportTab';

const DiffBadge = ({ diff }: { diff: number }) => (
    <Badge variant={diff >= 0 ? 'default' : 'destructive'} className={cn(diff >= 0 && "bg-green-500 hover:bg-green-600")}>
        {diff > 0 ? `+${diff}` : diff}
    </Badge>
);

const PeriodChangeCard = ({ title, data }: { title: string, data: { name: string, from: number, to: number, diff: number }[] }) => (
    <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-3">
                {data.length > 0 ? data.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-sm">
                        <span>{item.name || 'Brak'}</span>
                        <div className="flex items-center gap-2 font-mono">
                            <span>{item.from}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-bold">{item.to}</span>
                            <DiffBadge diff={item.diff} />
                        </div>
                    </div>
                )) : <p className="text-sm text-muted-foreground text-center">Brak zmian</p>}
            </div>
        </CardContent>
    </Card>
);

const SingleDayReportCard = ({ title, data }: { title: string, data: { name: string, to: number }[] }) => (
    <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-3">
                {data.length > 0 ? data.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-sm">
                        <span>{item.name || 'Brak'}</span>
                        <span className="font-bold font-mono">{item.to}</span>
                    </div>
                )) : <p className="text-sm text-muted-foreground text-center">Brak danych</p>}
            </div>
        </CardContent>
    </Card>
);

const EmployeeChangeList = ({ title, employees, icon, emptyText }: { title: string, employees: any[], icon: React.ReactNode, emptyText: string }) => (
    <Card className="flex flex-col">
        <CardHeader>
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{employees.length} pracowników</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            {employees.length > 0 ? (
                <ScrollArea className="h-80">
                    <div className="space-y-4 pr-4">
                        {employees.map((emp, index) => (
                            <div key={index} className="flex items-center gap-4 p-2 rounded-lg bg-muted/50">
                                <div className="flex-grow">
                                    <p className="font-semibold">{emp.fullName}</p>
                                    <p className="text-xs text-muted-foreground">{emp.jobTitle}, {emp.department}</p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <p>{formatDate(emp.date, 'dd.MM.yyyy')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
            )}
        </CardContent>
    </Card>
);

const FieldChangeList = ({ changes }: { changes: any[] }) => {
    const groupedChanges = changes.reduce((acc, change) => {
        if (!acc[change.type]) acc[change.type] = [];
        acc[change.type].push(change);
        return acc;
    }, {} as Record<string, any[]>);

    if (changes.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <GitCompareArrows className="h-6 w-6 text-blue-500" />
                    <div>
                        <CardTitle className="text-lg">Zmiany w danych pracowników</CardTitle>
                        <CardDescription>{changes.length} zarejestrowanych zmian</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={Object.keys(groupedChanges)}>
                    {Object.entries(groupedChanges).map(([type, items]) => (
                        <AccordionItem value={type} key={type}>
                            <AccordionTrigger>Zmiany działów ({(items as any[]).length})</AccordionTrigger>
                            <AccordionContent>
                                <ScrollArea className="max-h-80">
                                    <div className="space-y-4 pr-4">
                                        {(items as any[]).map((item, index) => (
                                            <div key={index} className="flex items-center gap-4 p-2 rounded-lg bg-muted/50">
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.fullName}</p>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span>{item.from}</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                        <span className="font-bold">{item.to}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}

const HiresAndFiresTab = () => {
    const { isAdmin, currentUser } = useAppContext();
    const [isArchiving, setIsArchiving] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleManualArchive = async () => {
        setIsArchiving(true);
        try {
            const result = await archiveEmployees();
            if (!result.success) {
                throw new Error(result.message);
            }
            toast({
                title: 'Archiwizacja zakończona',
                description: `Pomyślnie utworzono plik: ${result.filePath}`,
            });

        } catch (error: any) {
            console.error("Error creating manual archive:", error);
            toast({ variant: 'destructive', title: 'Błąd archiwizacji', description: error.message || 'Wystąpił błąd po stronie serwera.' });
        } finally {
            setIsArchiving(false);
        }
    };

    const generateReport = async () => {
        if (!date || !date.from) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Proszę wybrać datę lub zakres dat.' });
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
            toast({ variant: 'destructive', title: 'Błąd', description: error.message || 'Nie udało się wygenerować raportu.' });
        } finally {
            setIsLoading(false);
        }
    };


    const hasEvents = report && ((report.newHires && report.newHires.length > 0) || (report.terminated && report.terminated.length > 0) || (report.fieldChanges && report.fieldChanges.length > 0));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Analiza historyczna</CardTitle>
                            <CardDescription>Porównaj stan zatrudnienia między dwoma dniami lub zobacz stan na jeden dzień.</CardDescription>
                        </div>
                        {isAdmin && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={isArchiving}>
                                        {isArchiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                                        Utwórz archiwum teraz
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Czy jesteś pewien?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Spowoduje to utworzenie nowego archiwum na dzień dzisiejszy. Jeśli archiwum na dziś już istnieje, zostanie ono nadpisane.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleManualArchive}>Kontynuuj</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Wybierz okres lub jeden dzień</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[300px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                    disabled={isLoading}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "dd LLL, y", { locale: pl })} -{" "}
                                                {format(date.to, "dd LLL, y", { locale: pl })}
                                            </>
                                        ) : (
                                            format(date.from, "dd LLL, y", { locale: pl })
                                        )
                                    ) : (
                                        <span>Wybierz zakres dat</span>
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
                                    numberOfMonths={2}
                                    locale={pl}
                                    disabled={isLoading}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={generateReport} disabled={isLoading || !date?.from}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generuj raport
                    </Button>
                </CardContent>
            </Card>

            {isLoading && !report && (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Generowanie raportu, to może potrwać chwilę...</p>
                </div>
            )}

            {report && report.isRange && (
                <div className="space-y-6 animate-fade-in">
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle>Podsumowanie zmian</CardTitle>
                            <CardDescription>
                                Porównanie stanu z dnia <span className="font-bold">{report.start.date}</span> i <span className="font-bold">{report.end.date}</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg border bg-background text-center">
                                <p className="text-sm text-muted-foreground">Liczba pracowników</p>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <span className="text-2xl font-bold">{report.start.total}</span>
                                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-2xl font-bold">{report.end.total}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border bg-background text-center">
                                <p className="text-sm text-muted-foreground">Różnica</p>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <span className={cn("text-3xl font-bold", report.diff >= 0 ? 'text-green-500' : 'text-destructive')}>
                                        {report.diff > 0 ? '+' : ''}{report.diff}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border bg-background text-center">
                                <p className="text-sm text-muted-foreground">Nowi / Odeszli</p>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <span className="text-2xl font-bold text-green-500">+{report.newHires.length}</span>
                                    <span className="text-2xl font-bold text-destructive">-{report.terminated.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PeriodChangeCard title="Zmiany w działach" data={report.deptChanges} />
                        <PeriodChangeCard title="Zmiany na stanowiskach" data={report.jobTitleChanges} />
                        <PeriodChangeCard title="Zmiany narodowości" data={report.nationalityChanges} />
                    </div>
                </div>
            )}

            {report && hasEvents && (
                <div className="space-y-6 animate-fade-in">
                    {report.isRange ? (
                        <h3 className="text-lg font-semibold mt-8">Szczegóły rotacji w okresie</h3>
                    ) : (
                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle>Raport na dzień: {report.date}</CardTitle>
                                <CardDescription>Stan zatrudnienia i zdarzenia w wybranym dniu.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg border bg-background text-center">
                                    <p className="text-sm text-muted-foreground">Całkowita liczba pracowników</p>
                                    <div className="flex items-center justify-center gap-4 mt-2">
                                        <span className="text-3xl font-bold">{report.total}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg border bg-background text-center">
                                    <p className="text-sm text-muted-foreground">Zatrudnieni tego dnia</p>
                                    <div className="flex items-center justify-center gap-4 mt-2">
                                        <span className="text-3xl font-bold text-green-500">+{report.newHires.length}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg border bg-background text-center">
                                    <p className="text-sm text-muted-foreground">Zwolnieni tego dnia</p>
                                    <div className="flex items-center justify-center gap-4 mt-2">
                                        <span className="text-3xl font-bold text-destructive">-{report.terminated.length}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <EmployeeChangeList
                            title={report.isRange ? "Nowo zatrudnieni" : "Zatrudnieni w tym dniu"}
                            employees={report.newHires}
                            icon={<UserPlus className="h-6 w-6 text-green-500" />}
                            emptyText="Brak zatrudnień."
                        />
                        <EmployeeChangeList
                            title={report.isRange ? "Zwolnieni" : "Zwolnieni w tym dniu"}
                            employees={report.terminated}
                            icon={<UserX className="h-6 w-6 text-destructive" />}
                            emptyText="Brak zwolnień."
                        />
                    </div>
                    <FieldChangeList changes={report.fieldChanges || []} />
                </div>
            )}

            {report && !report.isRange && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-lg font-semibold mt-8">Statystyki na dzień {report.date}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SingleDayReportCard title="Liczba pracowników w działach" data={report.deptChanges} />
                        <SingleDayReportCard title="Liczba pracowników na stanowiskach" data={report.jobTitleChanges} />
                        <SingleDayReportCard title="Liczba pracowników wg narodowości" data={report.nationalityChanges} />
                    </div>
                </div>
            )}
        </div>
    );
};

const OrdersTab = () => {
    const { config, addOrder, updateOrder, deleteOrder, isLoading: isAppLoading, isAdmin } = useAppContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const { toast } = useToast();

    const [newOrderDepartment, setNewOrderDepartment] = useState('');
    const [newOrderJobTitle, setNewOrderJobTitle] = useState('');
    const [newOrderQuantity, setNewOrderQuantity] = useState(1);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editFormData, setEditFormData] = useState<{ department: string; jobTitle: string; quantity: number; realizedQuantity: number; } | null>(null);

    useEffect(() => {
        const db = getDB();
        if (!db) return;
        
        const ordersRef = dbRef(db, 'orders');
        const unsubscribe = onValue(ordersRef, (snapshot) => {
            setOrders(objectToArray(snapshot.val()));
            setIsLoadingOrders(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setNewOrderDepartment('');
        setNewOrderJobTitle('');
        setNewOrderQuantity(1);
    }

    const handleAddNewOrder = async (type: 'new' | 'replacement') => {
        if (!newOrderDepartment || !newOrderJobTitle || newOrderQuantity < 1) {
            toast({ variant: 'destructive', title: 'Błąd walidacji', description: 'Wszystkie pola muszą być wypełnione.' });
            return;
        }
        await addOrder({
            department: newOrderDepartment,
            jobTitle: newOrderJobTitle,
            quantity: newOrderQuantity,
            realizedQuantity: 0,
            type: type,
        });
        resetForm();
    };

    const handleOpenEditDialog = (order: Order) => {
        setEditingOrder(order);
        setEditFormData({ department: order.department, jobTitle: order.jobTitle, quantity: order.quantity, realizedQuantity: order.realizedQuantity || 0 });
        setIsEditDialogOpen(true);
    };

    const handleUpdateOrder = async () => {
        if (!editingOrder || !editFormData) return;
        await updateOrder({ ...editingOrder, ...editFormData });
        setIsEditDialogOpen(false);
        setEditingOrder(null);
    };

    const groupedOrders = useMemo(() => {
        return orders.reduce((acc, order) => {
            if (!acc[order.department]) {
                acc[order.department] = [];
            }
            acc[order.department].push(order);
            return acc;
        }, {} as Record<string, Order[]>);
    }, [orders]);

    const isLoading = isAppLoading || isLoadingOrders;

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {isAdmin && (
                <div className="lg:col-span-1">
                    <Tabs defaultValue="new" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="new">Nowy pracownik</TabsTrigger>
                            <TabsTrigger value="replacement">Zastępstwo</TabsTrigger>
                        </TabsList>
                        <TabsContent value="new">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Zamówienie na nowego pracownika</CardTitle>
                                    <CardDescription>Wypełnij formularz, aby utworzyć nowe zamówienie.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label>Dział</Label>
                                        <Select value={newOrderDepartment} onValueChange={setNewOrderDepartment}>
                                            <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                                            <SelectContent>
                                                {config.departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Stanowisko</Label>
                                        <Select value={newOrderJobTitle} onValueChange={setNewOrderJobTitle}>
                                            <SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                                            <SelectContent>
                                                {config.jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Ilość</Label>
                                        <Input
                                            type="number"
                                            value={newOrderQuantity}
                                            onChange={(e) => setNewOrderQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                            min="1"
                                        />
                                    </div>
                                    <Button onClick={() => handleAddNewOrder('new')} className="w-full">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Dodaj zamówienie
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="replacement">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Zamówienie na zastępstwo</CardTitle>
                                    <CardDescription>Wypełnij formularz, aby utworzyć zamówienie na zastępstwo.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label>Dział</Label>
                                        <Select value={newOrderDepartment} onValueChange={setNewOrderDepartment}>
                                            <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                                            <SelectContent>
                                                {config.departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Stanowisko</Label>
                                        <Select value={newOrderJobTitle} onValueChange={setNewOrderJobTitle}>
                                            <SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                                            <SelectContent>
                                                {config.jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Ilość</Label>
                                        <Input
                                            type="number"
                                            value={newOrderQuantity}
                                            onChange={(e) => setNewOrderQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                            min="1"
                                        />
                                    </div>
                                    <Button onClick={() => handleAddNewOrder('replacement')} className="w-full">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Dodaj zastępstwo
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
            <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
                <Card>
                    <CardHeader>
                        <CardTitle>Aktywne zamówienia</CardTitle>
                        <CardDescription>Lista aktualnych zapotrzebowań na personel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(groupedOrders).length > 0 ? (
                            <Accordion type="multiple" className="w-full">
                                {Object.entries(groupedOrders).map(([dept, orderList]) => {
                                    const hasNewOrders = orderList.some(o => o.type === 'new');
                                    const hasReplacementOrders = orderList.some(o => o.type === 'replacement');

                                    return (
                                        <AccordionItem value={dept} key={dept}>
                                            <AccordionTrigger>
                                                <div className='flex justify-between w-full pr-4 items-center'>
                                                    <div className="flex items-center gap-2">
                                                        <span className='font-bold text-base'>{dept}</span>
                                                        {hasNewOrders && <Badge variant="outline">Nowe</Badge>}
                                                        {hasReplacementOrders && <Badge variant="secondary" className="border-orange-500/80 text-orange-800">Zastępstwo</Badge>}
                                                    </div>
                                                    <span className='text-muted-foreground text-sm font-normal'>
                                                        {orderList.reduce((sum, o) => sum + o.quantity, 0)} os.
                                                    </span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-2 pl-4">
                                                    {orderList.map(order => {
                                                        const realized = order.realizedQuantity || 0;
                                                        const remaining = order.quantity - realized;
                                                        return (
                                                            <div key={order.id} className="flex items-start justify-between p-3 rounded-md border">
                                                                <div>
                                                                    <p className="font-medium">{order.jobTitle}</p>
                                                                    <div className="text-xs text-muted-foreground space-y-1 mt-2">
                                                                        <p>Ilość: <span className='font-semibold'>{order.quantity}</span></p>
                                                                        <p>Zrealizowano: <span className='font-semibold text-green-500'>{realized}</span></p>
                                                                        <p>Pozostało: <span className='font-semibold text-orange-500'>{remaining}</span></p>
                                                                    </div>
                                                                </div>
                                                                {isAdmin && <div>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(order)}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => deleteOrder(order.id)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </div>}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Brak aktywnych zamówień.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edytuj zamówienie</DialogTitle>
                        <DialogDescription>
                            Zmień dane dotyczące zapotrzebowania na personel.
                        </DialogDescription>
                    </DialogHeader>
                    {editFormData && (
                        <div className="grid gap-4 py-4">
                            {editingOrder?.type === 'new' && (
                                <>
                                    <div className="space-y-1">
                                        <Label>Dział</Label>
                                        <Select
                                            value={editFormData.department}
                                            onValueChange={(value) => setEditFormData(d => d ? { ...d, department: value } : null)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                                            <SelectContent>
                                                {config.departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Stanowisko</Label>
                                        <Select
                                            value={editFormData.jobTitle}
                                            onValueChange={(value) => setEditFormData(d => d ? { ...d, jobTitle: value } : null)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                                            <SelectContent>
                                                {config.jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Ilość zamówiona</Label>
                                    <Input
                                        type="number"
                                        value={editFormData.quantity}
                                        onChange={(e) => setEditFormData(d => d ? { ...d, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) } : null)}
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Ilość zrealizowano</Label>
                                    <Input
                                        type="number"
                                        value={editFormData.realizedQuantity}
                                        onChange={(e) => setEditFormData(d => d ? { ...d, realizedQuantity: Math.max(0, parseInt(e.target.value, 10) || 0) } : null)}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Anuluj</Button>
                        <Button onClick={handleUpdateOrder}>Zapisz zmiany</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}

export default function StatisticsPage() {
    const { isLoading, employees } = useAppContext();

    return (
        <div className="h-full flex flex-col w-full">
            <PageHeader
                title="Statystyki i Planowanie"
                description="Kluczowe wskaźniki i zapotrzebowanie na personel."
            />
            {isLoading && employees.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="report" className="flex-grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="report">Raport Bieżący</TabsTrigger>
                        <TabsTrigger value="hires_fires">Analiza</TabsTrigger>
                        <TabsTrigger value="orders">Zamówienia</TabsTrigger>
                    </TabsList>
                    <TabsContent value="report" className="flex-grow mt-6">
                        <ReportTab />
                    </TabsContent>
                    <TabsContent value="hires_fires" className="flex-grow mt-6">
                        <HiresAndFiresTab />
                    </TabsContent>
                    <TabsContent value="orders" className="flex-grow mt-6">
                        <OrdersTab />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
