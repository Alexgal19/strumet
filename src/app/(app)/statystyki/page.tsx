

'use client';

import React, { useMemo, useState, useEffect, forwardRef } from 'react';
import { LineChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Copy, Building, Briefcase, ChevronRight, PlusCircle, Trash2, FileDown, Edit, TrendingUp, TrendingDown, Minus, CalendarIcon, History as HistoryIcon, ClipboardList, Info } from 'lucide-react';
import { Employee, Order, StatsSnapshot, AllConfig, Stats, EmployeeEvent } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, startOfDay, subDays, startOfMonth, endOfMonth, endOfToday, isWithinInterval, isSameDay, getDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { parseMaybeDate } from '@/lib/date';
import { createStatsSnapshot } from '@/ai/flows/create-stats-snapshot';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip"


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
                 <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: p.stroke || p.payload.fill}} />
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
    const activeEmployees = useMemo(() => {
        return employees.filter(e => e.status === "aktywny");
    }, [employees]);
    const totalActiveEmployees = activeEmployees.length;
    const stats: Stats = useMemo(() => {
        const departments = new Set(activeEmployees.map(e => e.department).filter(Boolean));
        const jobTitles = new Set(activeEmployees.map(e => e.jobTitle).filter(Boolean));
        return {
            totalActiveEmployees: totalActiveEmployees,
            totalDepartments: departments.size,
            totalJobTitles: jobTitles.size,
        };
    }, [activeEmployees, totalActiveEmployees]);
    const departmentData = useMemo(() => {
        const counts: {
            [key: string]: number;
        } = {};
        activeEmployees.forEach(employee => {
            if (employee.department)
                counts[employee.department] = (counts[employee.department] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        })).sort((a, b) => b.value - a.value);
    }, [activeEmployees, totalActiveEmployees]);
    const nationalityData = useMemo(() => {
        const counts: {
            [key: string]: number;
        } = {};
        activeEmployees.forEach(employee => {
            if (employee.nationality)
                counts[employee.nationality] = (counts[employee.nationality] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        })).sort((a, b) => b.value - a.value);
    }, [activeEmployees, totalActiveEmployees]);
    const jobTitleData = useMemo(() => {
        const counts: {
            [key: string]: number;
        } = {};
        activeEmployees.forEach(employee => {
            if (employee.jobTitle)
                counts[employee.jobTitle] = (counts[employee.jobTitle] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
            fill: CHART_COLORS[index % CHART_COLORS.length]
        })).sort((a, b) => b.value - a.value);
    }, [activeEmployees, totalActiveEmployees]);
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
    const handleCopyNames = () => {
        if (!dialogContent || !dialogContent.data)
            return;
        let employeesToCopy: Employee[] = [];
        if (dialogContent.type === "list") {
            employeesToCopy = dialogContent.data as Employee[];
        }
        else {
            const hierarchy = dialogContent.data as DepartmentHierarchy;
            Object.values(hierarchy).forEach(manager => {
                Object.values(manager).forEach(jobTitleGroup => {
                    employeesToCopy.push(...jobTitleGroup);
                });
            });
        }
        if (employeesToCopy.length === 0)
            return;
        const names = employeesToCopy.map(e => e.fullName).join("\n");
        navigator.clipboard.writeText(names).then(() => {
            toast({
                title: "Skopiowano!",
                description: "Imiona i nazwiska zostały skopiowane do schowka.",
            });
        }).catch(err => {
            console.error("Could not copy text: ", err);
            toast({
                variant: "destructive",
                title: "Błąd",
                description: "Nie udało się skopiować listy.",
            });
        });
    };
    const renderPieChart = (data: any[], title: string, description: string, type: "department" | "nationality" | "jobTitle") => (<Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <ChartContainer config={{}} className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />}/>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={90} paddingAngle={2} labelLine={false} onClick={(data) => handleChartClick(data.name, type)}>
                                {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} stroke={"hsl(var(--card))"} className="cursor-pointer"/>))}
                            </Pie>
                            <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" iconSize={10} wrapperStyle={{ lineHeight: "1.8em" }} onClick={(d) => handleChartClick(d.value, type)} formatter={(value, entry) => (<span className="text-muted-foreground text-sm pl-2 cursor-pointer hover:text-foreground">
                                    {value} <span className="font-bold">({entry.payload?.value})</span>
                                    </span>)}/>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>);
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
                {isAdmin && employees.length > 0 && <StatisticsExcelExportButton stats={stats} departmentData={departmentData} nationalityData={nationalityData} jobTitleData={jobTitleData} employees={activeEmployees}/>}
            </div>
             {employees.length === 0 ? (<div className="text-center text-muted-foreground py-10">
                    Brak danych do wyświetlenia statystyk. Dodaj pracowników, aby zobaczyć analizę.
                </div>) : (<>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">Aktywni pracownicy</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalActiveEmployees}</div>
                            <p className="text-xs text-muted-foreground">Całkowita liczba pracowników</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">Liczba działów</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
                            <p className="text-xs text-muted-foreground">Aktywne działy w firmie</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">Liczba stanowisk</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground"/>
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
                    <DialogFooter className="sm:justify-between">
                       {isAdmin && dialogContent && dialogContent.total > 0 && <Button onClick={handleCopyNames}>
                           <Copy className="mr-2 h-4 w-4"/>
                           Kopiuj imiona
                       </Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Edytuj pracownika</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                    <EmployeeForm employee={editingEmployee} onSave={onSave} onCancel={() => setIsFormOpen(false)} config={config}/>
                </div>
                </DialogContent>
            </Dialog>
        </div>);
})
ReportTab.displayName = 'ReportTab';


const HistoryTab = forwardRef<unknown, {}>((props, ref) => {
    const { employeeEvents, statsHistory, isHistoryLoading, isAdmin, employees } = useAppContext();
    const { toast } = useToast();
    const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
    const [mode, setMode] = useState<'history' | 'dynamic'>('history');
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(2025, 11, 15), to: endOfToday() });
    const [singleDate, setSingleDate] = useState<Date | undefined>(new Date(2025, 11, 15));

    const liveSnapshot: StatsSnapshot = useMemo(() => {
        const activeEmployees = employees.filter(e => e.status === 'aktywny');
        const departmentCounts: Record<string, number> = {};
        const jobTitleCounts: Record<string, number> = {};
        const nationalityCounts: Record<string, number> = {};

        activeEmployees.forEach(emp => {
            if (emp.department) departmentCounts[emp.department] = (departmentCounts[emp.department] || 0) + 1;
            if (emp.jobTitle) jobTitleCounts[emp.jobTitle] = (jobTitleCounts[emp.jobTitle] || 0) + 1;
            if (emp.nationality) nationalityCounts[emp.nationality] = (nationalityCounts[emp.nationality] || 0) + 1;
        });

        return {
            id: 'live',
            totalActive: activeEmployees.length,
            departments: departmentCounts,
            jobTitles: jobTitleCounts,
            nationalities: nationalityCounts,
            newHires: 0, 
            terminations: 0,
        };
    }, [employees]);
    
    const { comparisonData, snapshotA, snapshotB, newHiresInRange, terminationsInRange } = useMemo(() => {
        let newHiresInRange = 0;
        let terminationsInRange = 0;

        if (mode === 'history') {
            if (!dateRange?.from || !dateRange.to || statsHistory.length < 1) {
                return { comparisonData: null, snapshotA: null, snapshotB: null, newHiresInRange: 0, terminationsInRange: 0 };
            }
            
            const snapshotsInRange = statsHistory.filter(s => {
                const sDate = parseISO(s.id);
                return isWithinInterval(sDate, { start: startOfDay(dateRange.from!), end: dateRange.to! });
            });
            newHiresInRange = snapshotsInRange.reduce((sum, s) => sum + (s.newHires || 0), 0);
            terminationsInRange = snapshotsInRange.reduce((sum, s) => sum + (s.terminations || 0), 0);
            
            const findClosestSnapshot = (targetDate: Date) => statsHistory.reduce((prev, curr) => 
                Math.abs(parseISO(curr.id).getTime() - targetDate.getTime()) < Math.abs(parseISO(prev.id).getTime() - targetDate.getTime()) ? curr : prev
            );

            const snapA = findClosestSnapshot(dateRange.from);
            const snapB = findClosestSnapshot(dateRange.to);

            if (!snapA || !snapB || snapA.id === snapB.id) return { comparisonData: null, snapshotA: snapA, snapshotB: snapB, newHiresInRange, terminationsInRange };
            
             const allDepartmentKeys = new Set([...Object.keys(snapA.departments || {}), ...Object.keys(snapB.departments || {})]);
            const allJobTitleKeys = new Set([...Object.keys(snapA.jobTitles || {}), ...Object.keys(snapB.jobTitles || {})]);

            const departmentChanges = Array.from(allDepartmentKeys).map(name => ({ name, countA: snapA.departments?.[name] || 0, countB: snapB.departments?.[name] || 0, delta: (snapB.departments?.[name] || 0) - (snapA.departments?.[name] || 0) })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
            const jobTitleChanges = Array.from(allJobTitleKeys).map(name => ({ name, countA: snapA.jobTitles?.[name] || 0, countB: snapB.jobTitles?.[name] || 0, delta: (snapB.jobTitles?.[name] || 0) - (snapA.jobTitles?.[name] || 0) })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

            return { comparisonData: { totalDelta: snapB.totalActive - snapA.totalActive, departmentChanges, jobTitleChanges }, snapshotA: snapA, snapshotB: snapB, newHiresInRange, terminationsInRange };
        } else { 
            if (!singleDate || statsHistory.length < 1) {
                return { comparisonData: null, snapshotA: null, snapshotB: null, newHiresInRange: 0, terminationsInRange: 0 };
            }
            
            const snapA = statsHistory.reduce((prev, curr) => 
                Math.abs(parseISO(curr.id).getTime() - singleDate.getTime()) < Math.abs(parseISO(prev.id).getTime() - singleDate.getTime()) ? curr : prev
            );
            const snapB = liveSnapshot;

            if (!snapA) return { comparisonData: null, snapshotA: null, snapshotB: null, newHiresInRange: 0, terminationsInRange: 0 };

            const allDepartmentKeys = new Set([...Object.keys(snapA.departments || {}), ...Object.keys(snapB.departments || {})]);
            const allJobTitleKeys = new Set([...Object.keys(snapA.jobTitles || {}), ...Object.keys(snapB.jobTitles || {})]);

            const departmentChanges = Array.from(allDepartmentKeys).map(name => ({ name, countA: snapA.departments?.[name] || 0, countB: snapB.departments?.[name] || 0, delta: (snapB.departments?.[name] || 0) - (snapA.departments?.[name] || 0) })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
            const jobTitleChanges = Array.from(allJobTitleKeys).map(name => ({ name, countA: snapA.jobTitles?.[name] || 0, countB: snapB.jobTitles?.[name] || 0, delta: (snapB.jobTitles?.[name] || 0) - (snapA.jobTitles?.[name] || 0) })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
            
            const rangeStart = startOfDay(snapA ? parseISO(snapA.id) : new Date());
            newHiresInRange = employeeEvents.filter(e => {
                return e.type === 'hire' && isWithinInterval(parseISO(e.date), { start: rangeStart, end: endOfToday() });
            }).length;
            terminationsInRange = employeeEvents.filter(e => {
                return e.type === 'termination' && isWithinInterval(parseISO(e.date), { start: rangeStart, end: endOfToday() });
            }).length;


            return { comparisonData: { totalDelta: snapB.totalActive - snapA.totalActive, departmentChanges, jobTitleChanges }, snapshotA: snapA, snapshotB: snapB, newHiresInRange, terminationsInRange };
        }
    }, [dateRange, singleDate, mode, statsHistory, liveSnapshot, employeeEvents, employees]);

    const handleCreateSnapshot = async () => {
        setIsCreatingSnapshot(true);
        try {
            const result = await createStatsSnapshot();
            toast({
                title: "Sukces",
                description: `Pomyślnie utworzono zrzut statystyk dla dnia ${result.snapshotId}.`,
            });
        } catch (error) {
            console.error("Error creating snapshot:", error);
            toast({
                variant: 'destructive',
                title: "Błąd",
                description: "Nie udało się utworzyć zrzutu statystyk.",
            });
        } finally {
            setIsCreatingSnapshot(false);
        }
    };
    
    if (isHistoryLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    const DeltaCell = ({ delta, className }: { delta: number, className?: string }) => {
        const baseClasses = "font-bold flex items-center justify-end";
        if (delta === 0) {
            return <span className={cn(baseClasses, "text-muted-foreground", className)}><Minus className="h-4 w-4 mr-1" /> {delta}</span>;
        }
        if (delta > 0) {
            return <span className={cn(baseClasses, "text-green-600", className)}><TrendingUp className="h-4 w-4 mr-1" /> +{delta}</span>;
        }
        return <span className={cn(baseClasses, "text-red-600", className)}><TrendingDown className="h-4 w-4 mr-1" /> {delta}</span>;
    };

    if (!statsHistory.length) {
        return (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-4">
                <HistoryIcon className="w-12 h-12" />
                <p className="max-w-md">Brak danych historycznych. Pierwszy automatyczny zrzut statystyk zostanie utworzony wkrótce. Możesz też utworzyć go ręcznie.</p>
                 {isAdmin && <Button onClick={handleCreateSnapshot} disabled={isCreatingSnapshot}>
                    {isCreatingSnapshot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Utwórz zrzut teraz
                </Button>}
            </div>
        );
    }
    
    return (
        <div className="flex flex-col space-y-6 flex-grow">
            <Card>
                 <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Porównanie historyczne</CardTitle>
                        <CardDescription>Wybierz tryb i daty, aby porównać stan zatrudnienia.</CardDescription>
                    </div>
                     <div className="flex items-center gap-4">
                         <RadioGroup defaultValue="history" onValueChange={(v) => setMode(v as any)} className="flex items-center space-x-2 rounded-md bg-muted/50 p-1">
                              <RadioGroupItem value="history" id="r1" className="peer sr-only" />
                              <Label htmlFor="r1" className="cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-foreground peer-data-[state=checked]:shadow-sm">Historyczne</Label>
                              <RadioGroupItem value="dynamic" id="r2" className="peer sr-only" />
                              <Label htmlFor="r2" className="cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-foreground peer-data-[state=checked]:shadow-sm">Dynamiczne</Label>
                        </RadioGroup>
                         {isAdmin && <Button onClick={handleCreateSnapshot} disabled={isCreatingSnapshot} variant="outline" size="sm">
                            {isCreatingSnapshot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Nowy zrzut
                        </Button>}
                     </div>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center gap-4 p-4 border-b">
                        {mode === 'history' ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date-range"
                                        variant={"outline"}
                                        className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y", { locale: pl })} - {format(dateRange.to, "LLL dd, y", { locale: pl })}</>) : format(dateRange.from, "LLL dd, y", { locale: pl })) : <span>Wybierz zakres dat</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={pl} disabled={(date) => !statsHistory.some(s => isSameDay(parseISO(s.id), date))} />
                                </PopoverContent>
                            </Popover>
                        ) : (
                           <>
                             <Popover>
                                <PopoverTrigger asChild>
                                     <Button variant={"outline"} className={cn("w-[180px] justify-start text-left font-normal", !singleDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {singleDate ? format(singleDate, "LLL dd, y", { locale: pl }) : <span>Wybierz datę</span>}
                                     </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="single" selected={singleDate} onSelect={setSingleDate} locale={pl} disabled={(date) => !statsHistory.some(s => isSameDay(parseISO(s.id), date))} />
                                </PopoverContent>
                             </Popover>
                             <div className="text-sm font-medium text-muted-foreground">vs.</div>
                             <Button variant={"outline"} className="w-[180px] font-semibold" disabled>Teraz</Button>
                           </>
                        )}
                        <TooltipProvider>
                            <UiTooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-auto"><Info className="h-4 w-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Wybierz daty, w których istnieją zrzuty danych (dni podświetlone). System automatycznie wybierze najbliższy dostępny zrzut do wybranej daty.</p>
                                </TooltipContent>
                            </UiTooltip>
                        </TooltipProvider>
                     </div>
                    {!comparisonData || !snapshotA || !snapshotB ? (
                        <p className="text-center text-muted-foreground py-10">Wybierz dwie różne daty, aby zobaczyć porównanie.</p>
                    ) : (
                        <div className="space-y-8 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Podsumowanie ogólne</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Stan na {format(parseISO(snapshotA.id), "dd.MM.yy")}</p>
                                        <p className="text-2xl font-bold">{snapshotA.totalActive}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nowo zatrudnieni</p>
                                        <p className="text-2xl font-bold text-green-600">+{newHiresInRange}</p>
                                    </div>
                                     <div>
                                        <p className="text-sm text-muted-foreground">Zwolnieni</p>
                                        <p className="text-2xl font-bold text-red-600">-{terminationsInRange}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Stan na {snapshotB.id === 'live' ? 'teraz' : format(parseISO(snapshotB.id), "dd.MM.yy")}</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <p className="text-2xl font-bold">{snapshotB.totalActive}</p>
                                            <DeltaCell delta={comparisonData.totalDelta} className="text-lg" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader><CardTitle>Zmiany wg działów</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-72">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Dział</TableHead>
                                                        <TableHead className="text-right">Różnica</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {comparisonData.departmentChanges.map(c => (
                                                        <TableRow key={c.name}>
                                                            <TableCell>{c.name}</TableCell>
                                                            <TableCell><DeltaCell delta={c.delta} /></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader><CardTitle>Zmiany wg stanowisk</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-72">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Stanowisko</TableHead>
                                                        <TableHead className="text-right">Różnica</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                     {comparisonData.jobTitleChanges.map(c => (
                                                        <TableRow key={c.name}>
                                                            <TableCell>{c.name}</TableCell>
                                                            <TableCell><DeltaCell delta={c.delta} /></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
});
HistoryTab.displayName = 'HistoryTab';


const HiresAndFiresTab = () => {
    const { employeeEvents, employees, isAdmin, deleteEmployeeEvent } = useAppContext();
    const today = endOfToday();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(2025, 11, 15),
        to: today,
    });
    const [eventToDelete, setEventToDelete] = useState<EmployeeEvent | null>(null);

    const handlePresetChange = (value: string) => {
        const now = startOfDay(new Date());
        switch (value) {
            case '7':
                setDateRange({ from: subDays(now, 7), to: endOfToday() });
                break;
            case '30':
                setDateRange({ from: subDays(now, 30), to: endOfToday() });
                break;
            case 'month':
                setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
                break;
            case 'custom':
                 setDateRange({ from: new Date(2025, 11, 15), to: endOfToday() });
                break;
        }
    };

    const { newHires, terminations, hiresSummary, terminationsSummary } = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return { newHires: [], terminations: [], hiresSummary: {byDepartment: [], byJobTitle: []}, terminationsSummary: {byDepartment: [], byJobTitle: []} };
        }

        const hires = employeeEvents
            .filter(event => event.type === 'hire' && isWithinInterval(parseISO(event.date), { start: dateRange.from!, end: dateRange.to! }))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const terms = employeeEvents
            .filter(event => event.type === 'termination' && isWithinInterval(parseISO(event.date), { start: dateRange.from!, end: dateRange.to! }))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const createSummary = (events: EmployeeEvent[]) => {
            const byDepartment: Record<string, number> = {};
            const byJobTitle: Record<string, number> = {};

            events.forEach(event => {
                const employee = employees.find(e => e.id === event.employeeId);
                if (employee) {
                    if(employee.department) {
                        byDepartment[employee.department] = (byDepartment[employee.department] || 0) + 1;
                    }
                    if(employee.jobTitle) {
                        byJobTitle[employee.jobTitle] = (byJobTitle[employee.jobTitle] || 0) + 1;
                    }
                }
            });
            return {
                byDepartment: Object.entries(byDepartment).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
                byJobTitle: Object.entries(byJobTitle).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
            };
        };
        
        return { 
            newHires: hires, 
            terminations: terms,
            hiresSummary: createSummary(hires),
            terminationsSummary: createSummary(terms),
        };

    }, [employeeEvents, dateRange, employees]);

    const handleDelete = () => {
        if (eventToDelete) {
            deleteEmployeeEvent(eventToDelete.id);
            setEventToDelete(null);
        }
    };
    
    const SummaryTable = ({ title, data }: { title: string, data: {name: string, count: number}[] }) => (
        <div className='space-y-2'>
            <h4 className='font-semibold text-sm'>{title}</h4>
            {data.length > 0 ? (
                <Table>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.name} className="text-xs">
                                <TableCell className='py-1.5'>{item.name}</TableCell>
                                <TableCell className='text-right font-bold py-1.5'>{item.count}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : <p className='text-xs text-muted-foreground text-center py-4'>Brak danych</p>}
        </div>
    );

    return (
        <>
            <div className="flex flex-col space-y-6 flex-grow">
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <CardTitle>Wybierz okres</CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <Select onValueChange={handlePresetChange} defaultValue="custom">
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Wybierz okres" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom">Od 15.12.2025</SelectItem>
                                        <SelectItem value="7">Ostatnie 7 dni</SelectItem>
                                        <SelectItem value="30">Ostatnie 30 dni</SelectItem>
                                        <SelectItem value="month">Ten miesiąc</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-[300px] justify-start text-left font-normal",
                                                !dateRange && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y", { locale: pl })} -{" "}
                                                        {format(dateRange.to, "LLL dd, y", { locale: pl })}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y", { locale: pl })
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
                                            defaultMonth={dateRange?.from}
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            numberOfMonths={2}
                                            locale={pl}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <Card>
                        <CardHeader>
                            <CardTitle>Podsumowanie zatrudnień ({newHires.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <SummaryTable title="Wg działów" data={hiresSummary.byDepartment} />
                            <SummaryTable title="Wg stanowisk" data={hiresSummary.byJobTitle} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Podsumowanie zwolnień ({terminations.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <SummaryTable title="Wg działów" data={terminationsSummary.byDepartment} />
                            <SummaryTable title="Wg stanowisk" data={terminationsSummary.byJobTitle} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista nowo zatrudnionych</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pracownik</TableHead>
                                            <TableHead>Data</TableHead>
                                            {isAdmin && <TableHead className="text-right">Akcje</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {newHires.length > 0 ? (
                                            newHires.map(event => (
                                                <TableRow key={event.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{event.employeeFullName}</div>
                                                    </TableCell>
                                                    <TableCell>{format(parseISO(event.date), 'dd.MM.yyyy HH:mm')}</TableCell>
                                                    {isAdmin && <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => setEventToDelete(event)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={isAdmin ? 3 : 2} className="text-center h-24">Brak danych</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista zwolnionych</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pracownik</TableHead>
                                            <TableHead>Data</TableHead>
                                            {isAdmin && <TableHead className="text-right">Akcje</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {terminations.length > 0 ? (
                                            terminations.map(event => (
                                                <TableRow key={event.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{event.employeeFullName}</div>
                                                    </TableCell>
                                                    <TableCell>{format(parseISO(event.date), 'dd.MM.yyyy HH:mm')}</TableCell>
                                                     {isAdmin && <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => setEventToDelete(event)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={isAdmin ? 3 : 2} className="text-center h-24">Brak danych</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie zdarzenia
                            dla pracownika <span className="font-bold">{eventToDelete?.employeeFullName}</span> z dnia {' '}
                            {eventToDelete && format(parseISO(eventToDelete.date), 'dd.MM.yyyy HH:mm')}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setEventToDelete(null)}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Usuń</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

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
      const ordersRef = ref(db, 'orders');
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
            toast({ variant: 'destructive', title: 'Błąd walidacji', description: 'Wszystkie pola muszą być wypełnione.'});
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
                                        onValueChange={(value) => setEditFormData(d => d ? {...d, department: value} : null)}
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
                                        onValueChange={(value) => setEditFormData(d => d ? {...d, jobTitle: value} : null)}
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
                                        onChange={(e) => setEditFormData(d => d ? {...d, quantity: Math.max(1, parseInt(e.target.value, 10) || 1)} : null)}
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Ilość zrealizowano</Label>
                                    <Input 
                                        type="number"
                                        value={editFormData.realizedQuantity}
                                        onChange={(e) => setEditFormData(d => d ? {...d, realizedQuantity: Math.max(0, parseInt(e.target.value, 10) || 0)} : null)}
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
  const { isLoading, isAdmin } = useAppContext();
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full">
      <PageHeader
        title="Statystyki i Planowanie"
        description="Kluczowe wskaźniki, zapotrzebowanie na personel oraz analiza historyczna."
      />
       <Tabs defaultValue="report" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="report">Raport Bieżący</TabsTrigger>
            <TabsTrigger value="orders">Zamówienia</TabsTrigger>
            <TabsTrigger value="hires_and_fires">Ruchy kadrowe</TabsTrigger>
            <TabsTrigger value="history">Historia</TabsTrigger>
        </TabsList>
        <TabsContent value="report" className="flex-grow mt-6">
            <ReportTab />
        </TabsContent>
        <TabsContent value="orders" className="flex-grow mt-6">
            <OrdersTab />
        </TabsContent>
        <TabsContent value="hires_and_fires" className="flex-grow mt-6">
            <HiresAndFiresTab />
        </TabsContent>
        <TabsContent value="history" className="flex-grow mt-6">
            <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}





