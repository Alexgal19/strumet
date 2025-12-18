

'use client';

import React, { useMemo, useState, useEffect, forwardRef } from 'react';
import { LineChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Copy, Building, Briefcase, ChevronRight, PlusCircle, Trash2, FileDown, Edit, TrendingUp, TrendingDown, Minus, CalendarIcon, History as HistoryIcon, ClipboardList, Info, ArrowRight, Camera } from 'lucide-react';
import { Employee, Order, StatsSnapshot, AllConfig, Stats } from '@/lib/types';
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
import { format, parseISO, startOfDay, subDays, endOfDay, isWithinInterval, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { parseMaybeDate } from '@/lib/date';
import { createStatsSnapshot } from '@/ai/flows/create-stats-snapshot';


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

const SummaryTable = ({ title, data }: { title: string; data: { name: string; count: number }[] }) => {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">Brak danych.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-60">
                    <Table>
                        <TableBody>
                            {data.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right font-bold">{item.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
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


const HiresAndFiresTab = () => {
    const { employees, statsHistory, isHistoryLoading, isAdmin } = useAppContext();
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 1),
        to: subDays(new Date(), 1),
    });
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isSnapshotting, setIsSnapshotting] = useState(false);

    type PointInTimeReportType = { date: Date; snapshot: StatsSnapshot } | null;
    type ComparisonReportType = { start: StatsSnapshot; end: StatsSnapshot; deptChanges: any[] } | null;

    const [pointInTimeReport, setPointInTimeReport] = useState<PointInTimeReportType>(null);
    const [comparisonReport, setComparisonReport] = useState<ComparisonReportType>(null);


    const periodReport = useMemo(() => {
        const today = startOfDay(new Date());

        const calculateChanges = (days: number) => {
            const startDate = startOfDay(subDays(today, days));
            const interval = { start: startDate, end: endOfDay(today) };
            let hires = 0;
            let terminations = 0;

            for (const e of employees) {
                const hireDate = parseMaybeDate(e.hireDate);
                if (hireDate && isWithinInterval(hireDate, interval)) {
                    hires++;
                }
                const termDate = parseMaybeDate(e.terminationDate);
                if (termDate && isWithinInterval(termDate, interval)) {
                    terminations++;
                }
            }
            return { hires, terminations, netChange: hires - terminations };
        };

        const daily = (() => {
             const yesterday = subDays(today, 1);
            
            const hiresToday = employees.filter(e => {
                const hireDate = parseMaybeDate(e.hireDate);
                return hireDate && isSameDay(hireDate, today);
            }).length;

            const terminationsToday = employees.filter(e => {
                const termDate = parseMaybeDate(e.terminationDate);
                return e.status === 'zwolniony' && termDate && isSameDay(termDate, today);
            }).length;

            const activeYesterday = employees.filter(e => {
                const hireDate = parseMaybeDate(e.hireDate);
                // Zatrudniony wczoraj lub wcześniej
                if (!hireDate || hireDate > yesterday) return false;

                const termDate = parseMaybeDate(e.terminationDate);
                // Zwolniony dzisiaj lub później (lub wcale)
                if (termDate && termDate <= yesterday) return false;
                
                return true;
            }).length;

            return {
                yesterdayTotal: activeYesterday,
                hiresToday: hiresToday,
                terminationsToday: terminationsToday,
                currentTotal: employees.filter(e => e.status === 'aktywny').length,
            };
        })();
        
        return {
            daily,
            last7days: calculateChanges(7),
            last30days: calculateChanges(30),
        };

    }, [employees]);
    
    const generateReport = () => {
        setPointInTimeReport(null);
        setComparisonReport(null);

        if (statsHistory && date?.from) {
             if (isSameDay(date.from, new Date()) && (!date.to || isSameDay(date.from, date.to))) {
                 setIsReportDialogOpen(true);
                 return;
            } 
            
            if (!date.to || isSameDay(date.from, date.to)) {
                const fromDateStr = format(date.from, 'yyyy-MM-dd');
                const startSnapshot = statsHistory.find(s => s.id === fromDateStr);
                if (startSnapshot) {
                    setPointInTimeReport({
                        date: date.from,
                        snapshot: startSnapshot,
                    });
                }
            } else { // Comparison Mode
                const fromDateStr = format(date.from, 'yyyy-MM-dd');
                const toDateStr = format(date.to, 'yyyy-MM-dd');
                const startSnapshot = statsHistory.find(s => s.id === fromDateStr);
                const endSnapshot = statsHistory.find(s => s.id === toDateStr);

                if (startSnapshot && endSnapshot) {
                    const allDepts = Array.from(new Set([...Object.keys(startSnapshot.departments || {}), ...Object.keys(endSnapshot.departments || {})]));

                    setComparisonReport({
                        start: startSnapshot,
                        end: endSnapshot,
                        deptChanges: allDepts.map(dept => {
                            const startCount = startSnapshot.departments?.[dept] || 0;
                            const endCount = endSnapshot.departments?.[dept] || 0;
                            return { name: dept, start: startCount, end: endCount, diff: endCount - startCount };
                        }).sort((a,b) => b.diff - a.diff),
                    });
                }
            }
        }
        setIsReportDialogOpen(true);
    };

    const handleManualSnapshot = async () => {
        setIsSnapshotting(true);
        try {
            const result = await createStatsSnapshot();
            toast({
                title: "Sukces",
                description: `Ręczna migawka statystyk dla dnia ${result.snapshotId} została pomyślnie utworzona.`,
            });
        } catch (error) {
            console.error("Manual snapshot failed:", error);
            toast({
                variant: 'destructive',
                title: "Błąd",
                description: "Nie udało się utworzyć migawki statystyk. Spróbuj ponownie.",
            });
        } finally {
            setIsSnapshotting(false);
        }
    };


    const DiffBadge = ({ diff }: { diff: number}) => {
        if (diff === 0) return <span className="text-muted-foreground">-</span>;
        const isPositive = diff > 0;
        return (
            <Badge variant={isPositive ? 'default' : 'destructive'} className={cn("font-bold", isPositive && "bg-green-600 hover:bg-green-700")}>
                {isPositive ? `+${diff}`: diff}
            </Badge>
        );
    }
    
    const PeriodChangeCard = ({ title, data }: { title: string; data: { hires: number; terminations: number; netChange: number; }}) => {
        const netChangeLabel = data.netChange > 0 ? "Przyrost" : data.netChange < 0 ? "Spadek" : "Zmiana netto";

        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-around items-center pt-2">
                     <div className="text-center">
                        <p className="text-sm text-muted-foreground">Zatrudnieni</p>
                        <p className="text-xl font-bold text-green-600">+{data.hires}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm text-muted-foreground">Zwolnieni</p>
                        <p className="text-xl font-bold text-red-600">-{data.terminations}</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm text-muted-foreground">{netChangeLabel}</p>
                         <p className={cn("text-xl font-bold", data.netChange > 0 && "text-green-600", data.netChange < 0 && "text-red-600")}>
                           {data.netChange > 0 ? `+${data.netChange}` : data.netChange}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex flex-col space-y-6 flex-grow">
            <Card>
                <CardHeader>
                    <CardTitle>Dobowy Raport Zmian</CardTitle>
                    <CardDescription>Automatyczne podsumowanie zmian w stanie zatrudnienia z ostatniej doby.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Stan na wczoraj</p>
                            <p className="text-2xl font-bold">{periodReport.daily.yesterdayTotal}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Zatrudnieni dzisiaj</p>
                            <p className="text-2xl font-bold text-green-600">+{periodReport.daily.hiresToday}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Zwolnieni dzisiaj</p>
                            <p className="text-2xl font-bold text-red-600">-{periodReport.daily.terminationsToday}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Stan na teraz</p>
                            <p className="text-2xl font-bold">{periodReport.daily.currentTotal}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PeriodChangeCard title="Raport za ostatnich 7 dni" data={periodReport.last7days} />
                <PeriodChangeCard title="Raport za ostatnich 30 dni" data={periodReport.last30days} />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div>
                            <CardTitle>Analiza</CardTitle>
                            <CardDescription>Wybierz dzień, aby zobaczyć stan z przeszłości, lub dwa dni, aby je porównać. Migawki danych są tworzone automatycznie każdego dnia.</CardDescription>
                        </div>
                        {isAdmin && (
                            <Button onClick={handleManualSnapshot} disabled={isSnapshotting} variant="secondary" className="w-full sm:w-auto">
                                {isSnapshotting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                                Utwórz migawkę teraz
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn("w-full sm:w-auto justify-start text-left font-normal", !date?.from && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        format(date.from, "dd.MM.yyyy")
                                    ) : (
                                        <span>Data początkowa</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="single"
                                    defaultMonth={date?.from}
                                    selected={date?.from}
                                    onSelect={(day) => setDate(prev => ({...prev, from: day}))}
                                    locale={pl}
                                />
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-to"
                                    variant={"outline"}
                                    className={cn("w-full sm:w-auto justify-start text-left font-normal", !date?.to && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.to ? (
                                        format(date.to, "dd.MM.yyyy")
                                    ) : (
                                        <span>Data końcowa</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="single"
                                    defaultMonth={date?.to}
                                    selected={date?.to}
                                    onSelect={(day) => setDate(prev => ({...prev, to: day}))}
                                    locale={pl}
                                />
                            </PopoverContent>
                        </Popover>

                        <Button onClick={generateReport} disabled={!date?.from || isHistoryLoading}>
                            {isHistoryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HistoryIcon className="mr-2 h-4 w-4" />}
                            Generuj Raport
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Raport Historyczny</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                        {isHistoryLoading ? (
                             <div className="flex h-full w-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : date?.from && isSameDay(date.from, new Date()) && (!date.to || isSameDay(date.from, date.to)) ? (
                            <div className="text-muted-foreground text-center py-10 flex items-center justify-center gap-2">
                               <Info className="h-5 w-5"/>
                               <span>Dane dla dnia dzisiejszego są dostępne na żywo w "Dobowym Raporcie Zmian".</span>
                            </div>
                        ) : pointInTimeReport ? (
                            <div className="space-y-6">
                                <h3 className="font-semibold text-lg">Stan na dzień {format(pointInTimeReport.date, 'dd MMMM yyyy', { locale: pl })}</h3>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-5xl font-bold">{pointInTimeReport.snapshot.totalActive}</p>
                                  <span className="text-muted-foreground">aktywnych pracowników</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <SummaryTable title="Wg działów" data={Object.entries(pointInTimeReport.snapshot.departments || {}).map(([name, count]) => ({name, count})).sort((a,b)=>b.count - a.count)} />
                                     <SummaryTable title="Wg narodowości" data={Object.entries(pointInTimeReport.snapshot.nationalities || {}).map(([name, count]) => ({name, count})).sort((a,b)=>b.count - a.count)} />
                                </div>
                            </div>
                        ) : comparisonReport ? (
                             <div className="space-y-6">
                                 <h3 className="font-semibold text-lg">
                                    Porównanie od {format(parseISO(comparisonReport.start.id), 'dd.MM.yyyy')} do {format(parseISO(comparisonReport.end.id), 'dd.MM.yyyy')}
                                 </h3>
                                <div className="text-center bg-muted/50 p-6 rounded-lg">
                                    <h3 className="font-semibold text-muted-foreground">Porównanie całkowitego zatrudnienia</h3>
                                    <div className="flex items-center justify-center gap-4 text-3xl font-bold mt-2">
                                        <span>{comparisonReport.start.totalActive}</span>
                                        <ArrowRight className="h-8 w-8 text-muted-foreground" />
                                        <span>{comparisonReport.end.totalActive}</span>
                                        <DiffBadge diff={comparisonReport.end.totalActive - comparisonReport.start.totalActive} />
                                    </div>
                                </div>
                                 <div className="grid grid-cols-1 gap-6">
                                    <Card>
                                        <CardHeader><CardTitle className="text-lg">Zmiany w Działach</CardTitle></CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                  <TableRow>
                                                    <TableHead>Dział</TableHead>
                                                    <TableHead className="text-center">Stan początkowy</TableHead>
                                                    <TableHead className="text-center">Stan końcowy</TableHead>
                                                    <TableHead className="text-center">Zmiana</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {comparisonReport.deptChanges.map(c => (
                                                        <TableRow key={c.name}>
                                                            <TableCell className="font-medium">{c.name}</TableCell>
                                                            <TableCell className="text-center">{c.start}</TableCell>
                                                            <TableCell className="text-center">{c.end}</TableCell>
                                                            <TableCell className="text-center"><DiffBadge diff={c.diff}/></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </div>
                             </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">
                                Brak danych migawkowych dla wybranego dnia lub zakresu. Upewnij się, że migawki zostały utworzone dla obu wybranych dat.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
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
        description="Kluczowe wskaźniki, zapotrzebowanie na personel oraz analiza."
      />
       <Tabs defaultValue="report" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="report">Raport Bieżący</TabsTrigger>
            <TabsTrigger value="orders">Zamówienia</TabsTrigger>
            <TabsTrigger value="hires_fires">Analiza</TabsTrigger>
        </TabsList>
        <TabsContent value="report" className="flex-grow mt-6">
            <ReportTab />
        </TabsContent>
        <TabsContent value="orders" className="flex-grow mt-6">
            <OrdersTab />
        </TabsContent>
        <TabsContent value="hires_fires" className="flex-grow mt-6">
            <HiresAndFiresTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    