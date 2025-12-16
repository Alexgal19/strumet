
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Copy, Building, Briefcase, ChevronRight, PlusCircle, Trash2, FileDown, Edit, TrendingUp, TrendingDown, Minus, CalendarIcon, History as HistoryIcon } from 'lucide-react';
import { Employee, Order, StatsSnapshot } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { format, parseISO, startOfDay, subDays, startOfMonth, endOfMonth, endOfToday, isWithinInterval } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
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

const ReportTab = () => {
    const { employees, config, handleSaveEmployee, statsHistory, isHistoryLoading } = useAppContext();
    const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<DialogContentData | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    
    const { toast } = useToast();
    
    const activeEmployees = useMemo(() => {
        return employees.filter(e => e.status === 'aktywny');
    }, [employees]);
    
    const totalActiveEmployees = activeEmployees.length;

    const stats = useMemo(() => {
        const departments = new Set(activeEmployees.map(e => e.department).filter(Boolean));
        const managers = new Set(activeEmployees.map(e => e.manager).filter(Boolean));
        const totalManagers = managers.size > 0 ? managers.size : 1;

        return {
            totalActiveEmployees: totalActiveEmployees,
            totalDepartments: departments.size,
            averageEmployeesPerManager: (totalActiveEmployees / totalManagers).toFixed(1),
        };
    }, [activeEmployees, totalActiveEmployees]);

    const departmentData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        activeEmployees.forEach(employee => {
        if(employee.department) counts[employee.department] = (counts[employee.department] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], index) => ({ 
        name, 
        value,
        percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
        fill: CHART_COLORS[index % CHART_COLORS.length] 
        })).sort((a, b) => b.value - a.value);
    }, [activeEmployees, totalActiveEmployees]);
    
    const nationalityData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        activeEmployees.forEach(employee => {
        if(employee.nationality) counts[employee.nationality] = (counts[employee.nationality] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], index) => ({ 
        name, 
        value,
        percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
        fill: CHART_COLORS[index % CHART_COLORS.length] 
        })).sort((a, b) => b.value - a.value);
    }, [activeEmployees, totalActiveEmployees]);

    const jobTitleData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        activeEmployees.forEach(employee => {
        if(employee.jobTitle) counts[employee.jobTitle] = (counts[employee.jobTitle] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value], index) => ({
        name,
        value,
        percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
        fill: CHART_COLORS[index % CHART_COLORS.length]
        })).sort((a, b) => b.value - a.value);
    }, [activeEmployees, totalActiveEmployees]);

    const handleChartClick = (name: string, type: 'department' | 'nationality' | 'jobTitle') => {
        if (type === 'department') {
            const departmentEmployees = activeEmployees.filter(e => e.department === name);
            const hierarchy: DepartmentHierarchy = {};

            departmentEmployees.forEach(emp => {
                const manager = emp.manager || 'Brak kierownika';
                const jobTitle = emp.jobTitle || 'Brak stanowiska';
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
                type: 'hierarchy',
                data: hierarchy
            });

        } else {
            const filtered = type === 'nationality'
                ? activeEmployees.filter(e => e.nationality === name)
                : activeEmployees.filter(e => e.jobTitle === name);
            
            const title = type === 'nationality'
                ? `Pracownicy narodowości: ${name}`
                : `Pracownicy na stanowisku: ${name}`;

            setDialogContent({
                title,
                total: filtered.length,
                type: 'list',
                data: filtered
            });
        }
        
        setIsStatDialogOpen(true);
    };
  
    const handleEmployeeClick = (employee: Employee) => {
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
        if (!dialogContent || !dialogContent.data) return;

        let employeesToCopy: Employee[] = [];
        if (dialogContent.type === 'list') {
            employeesToCopy = dialogContent.data as Employee[];
        } else {
            const hierarchy = dialogContent.data as DepartmentHierarchy;
            Object.values(hierarchy).forEach(manager => {
                Object.values(manager).forEach(jobTitleGroup => {
                    employeesToCopy.push(...jobTitleGroup);
                });
            });
        }

        if (employeesToCopy.length === 0) return;

        const names = employeesToCopy.map(e => e.fullName).join('\n');
        navigator.clipboard.writeText(names).then(() => {
        toast({
            title: 'Skopiowano!',
            description: 'Imiona i nazwiska zostały skopiowane do schowka.',
        });
        }).catch(err => {
        console.error('Could not copy text: ', err);
        toast({
            variant: 'destructive',
            title: 'Błąd',
            description: 'Nie udało się skopiować listy.',
        });
        });
    };
  
    const renderPieChart = (data: any[], title: string, description: string, type: 'department' | 'nationality' | 'jobTitle') => (
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
                                onClick={(data) => handleChartClick(data.name, type)}
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
                                wrapperStyle={{ lineHeight: '1.8em' }}
                                onClick={(d) => handleChartClick(d.value, type)}
                                formatter={(value, entry) => (
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
        if (!dialogContent) return null;

        if (dialogContent.type === 'hierarchy') {
        const hierarchy = dialogContent.data as DepartmentHierarchy;
        return (
            <Accordion type="multiple" className="w-full">
                {Object.entries(hierarchy).map(([manager, jobTitles]) => (
                    <AccordionItem value={manager} key={manager}>
                        <AccordionTrigger className="hover:no-underline text-sm">
                            <div className="flex justify-between w-full pr-2">
                            <span className="font-semibold">{manager}</span>
                            <span className="text-muted-foreground text-xs">{Object.values(jobTitles).flat().length} os.</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <Accordion type="multiple" className="w-full pl-4">
                                {Object.entries(jobTitles).map(([jobTitle, emps]) => (
                                    <AccordionItem value={jobTitle} key={jobTitle}>
                                        <AccordionTrigger className="hover:no-underline text-xs">
                                            <div className="flex justify-between w-full pr-2">
                                                <span className="font-medium text-muted-foreground">{jobTitle}</span>
                                                <span className="text-muted-foreground">{emps.length} os.</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pl-4 border-l-2 border-border ml-2">
                                                {emps.map(employee => (
                                                    <div key={employee.id} className="flex items-center justify-between text-xs p-1.5 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleEmployeeClick(employee)}>
                                                        <span>{employee.fullName}</span>
                                                        <span className="text-xs text-muted-foreground">{employee.cardNumber}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        )
        }

        const employeesToShow = dialogContent.data as Employee[];
        return employeesToShow.map(employee => (
            <div key={employee.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleEmployeeClick(employee)}>
                <span className="font-medium">{employee.fullName}</span>
                <span className="text-muted-foreground text-xs">{employee.cardNumber}</span>
            </div>
        ));
    };

    return (
        <div className="flex flex-col space-y-6 flex-grow">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Raport bieżący</h3>
                <StatisticsExcelExportButton
                    stats={stats}
                    departmentData={departmentData}
                    nationalityData={nationalityData}
                    jobTitleData={jobTitleData}
                    employees={activeEmployees}
                />
            </div>
             {employees.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    Brak danych do wyświetlenia statystyk. Dodaj pracowników, aby zobaczyć analizę.
                </div>
            ) : (
            <>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">Aktywni pracownicy</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalActiveEmployees}</div>
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
                            <CardTitle className="text-base font-medium">Pracownicy / Kierownik</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.averageEmployeesPerManager}</div>
                            <p className="text-xs text-muted-foreground">Średnia liczba pracowników na kierownika</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {renderPieChart(departmentData, 'Rozkład wg Działów', 'Liczba pracowników w poszczególnych działach.', 'department')}
                    {renderPieChart(nationalityData, 'Rozkład wg Narodowości', 'Struktura pracowników z podziałem na narodowości.', 'nationality')}
                    <div className="lg:col-span-2">
                    {renderPieChart(jobTitleData, 'Rozkład wg Stanowisk', 'Liczba pracowników na poszczególnych stanowiskach.', 'jobTitle')}
                    </div>
                </div>
            </>
            )}
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
                    {dialogContent && dialogContent.total > 0 && (
                        <DialogFooter>
                        <Button onClick={handleCopyNames}>
                            <Copy className="mr-2 h-4 w-4" />
                            Kopiuj imiona
                        </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent 
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="sm:max-w-3xl max-h-[90vh] flex flex-col"
                >
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Edytuj pracownika</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                    <EmployeeForm
                    employee={editingEmployee}
                    onSave={onSave}
                    onCancel={() => setIsFormOpen(false)}
                    config={config}
                    />
                </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

const HistoryTab = () => {
    const { statsHistory, isHistoryLoading, toast } = useAppContext();
    const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const chartData = useMemo(() => {
        return statsHistory
            .map(snapshot => ({
                date: format(parseISO(snapshot.id), 'dd.MM'),
                'Ilość ogólna': snapshot.totalActive,
                'Nowozatrudnieni': snapshot.newHires || 0,
                'Zwolnieni': snapshot.terminations || 0,
            }))
            .reverse();
    }, [statsHistory]);

    const comparisonData = useMemo(() => {
        if (!dateRange || !dateRange.from || !dateRange.to || statsHistory.length < 2) {
            return null;
        }

        const findSnapshot = (date: Date) => {
            const dateString = format(date, 'yyyy-MM-dd');
            return statsHistory.find(s => s.id === dateString);
        }

        const snapshotA = findSnapshot(dateRange.from);
        const snapshotB = findSnapshot(dateRange.to);
        
        if (!snapshotA || !snapshotB) {
            return { error: "Brak danych dla wybranych dat. Proszę wybrać daty, dla których istnieją zrzuty." };
        }

        const calculateDelta = (dataA: Record<string, number>, dataB: Record<string, number>) => {
            const allKeys = new Set([...Object.keys(dataA), ...Object.keys(dataB)]);
            const deltas: { name: string; valA: number; valB: number; delta: number }[] = [];

            allKeys.forEach(key => {
                const valA = dataA[key] || 0;
                const valB = dataB[key] || 0;
                if (valA !== valB) {
                    deltas.push({ name: key, valA, valB, delta: valB - valA });
                }
            });
            return deltas.sort((a,b) => b.delta - a.delta);
        }
        
        return {
            totalDelta: snapshotB.totalActive - snapshotA.totalActive,
            departmentDeltas: calculateDelta(snapshotA.departments, snapshotB.departments),
            jobTitleDeltas: calculateDelta(snapshotA.jobTitles, snapshotB.jobTitles)
        };

    }, [dateRange, statsHistory]);


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
    
    if (!statsHistory.length) {
        return (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-4">
                <HistoryIcon className="w-12 h-12" />
                <p className="max-w-md">Brak danych historycznych. Pierwszy automatyczny zrzut statystyk zostanie utworzony w najbliższy poniedziałek. Możesz też utworzyć go ręcznie.</p>
                 <Button onClick={handleCreateSnapshot} disabled={isCreatingSnapshot}>
                    {isCreatingSnapshot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Utwórz zrzut teraz
                </Button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col space-y-6 flex-grow">
            <Card>
                 <CardHeader className="flex-row items-start sm:items-center justify-between">
                    <div>
                        <CardTitle>Historia zmian</CardTitle>
                        <CardDescription>Dzienna dynamika liczby pracowników, zatrudnień i zwolnień.</CardDescription>
                    </div>
                    <Button onClick={handleCreateSnapshot} disabled={isCreatingSnapshot} variant="outline" size="sm">
                        {isCreatingSnapshot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Utwórz zrzut
                    </Button>
                </CardHeader>
                <CardContent className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{fontSize: "14px"}} />
                            <Line type="monotone" dataKey="Ilość ogólna" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="Nowozatrudnieni" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                            <Line type="monotone" dataKey="Zwolnieni" stroke="hsl(var(--destructive))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}


const OrdersTab = () => {
    const { config, addOrder, deleteOrder, updateOrder } = useAppContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const { toast } = useToast();
    
    const [department, setDepartment] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [quantity, setQuantity] = useState(1);
    
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

    const handleAddOrder = async () => {
        if (!department || !jobTitle || quantity < 1) {
            toast({
                variant: 'destructive',
                title: 'Błąd walidacji',
                description: 'Proszę wybrać dział, stanowisko i podać prawidłową ilość.',
            });
            return;
        }
        await addOrder({ department, jobTitle, quantity, realizedQuantity: 0 });
        setDepartment('');
        setJobTitle('');
        setQuantity(1);
    };

    const handleOpenEditDialog = (order: Order) => {
        setEditingOrder(order);
        setEditFormData({ department: order.department, jobTitle: order.jobTitle, quantity: order.quantity, realizedQuantity: order.realizedQuantity || 0 });
        setIsEditDialogOpen(true);
    };
    
    const handleUpdateOrder = async () => {
        if (!editingOrder || !editFormData) return;
        if (!editFormData.department || !editFormData.jobTitle || editFormData.quantity < 1 || editFormData.realizedQuantity < 0) {
            toast({
                variant: 'destructive',
                title: 'Błąd walidacji',
                description: 'Wszystkie pola muszą być wypełnione prawidłowo.',
            });
            return;
        }
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

    if (isLoadingOrders) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Nowe zamówienie</CardTitle>
                        <CardDescription className="text-sm">Dodaj nowe zapotrzebowanie na pracowników.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-sm">Dział</Label>
                            <Select value={department} onValueChange={setDepartment}>
                                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                                <SelectContent>
                                    {config.departments.map(d => <SelectItem key={d.id} value={d.name} className="text-sm">{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label className="text-sm">Stanowisko</Label>
                            <Select value={jobTitle} onValueChange={setJobTitle}>
                                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                                <SelectContent>
                                    {config.jobTitles.map(j => <SelectItem key={j.id} value={j.name} className="text-sm">{j.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label className="text-sm">Ilość</Label>
                            <Input 
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                min="1"
                                className="h-10 text-sm"
                            />
                        </div>
                        <Button onClick={handleAddOrder} className="w-full h-10 text-sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Dodaj zamówienie
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Aktywne zamówienia</CardTitle>
                        <CardDescription className="text-sm">Lista aktualnych zapotrzebowań na personel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(groupedOrders).length > 0 ? (
                           <Accordion type="multiple" className="w-full">
                               {Object.entries(groupedOrders).map(([dept, orderList]) => (
                                   <AccordionItem value={dept} key={dept}>
                                       <AccordionTrigger className="text-base">
                                            <div className='flex justify-between w-full pr-4'>
                                                <span className='font-bold'>{dept}</span>
                                                <span className='text-muted-foreground text-sm'>
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
                                                        <div key={order.id} className="flex items-start justify-between p-3 rounded-md border text-sm">
                                                            <div>
                                                                <p className="font-medium">{order.jobTitle}</p>
                                                                <div className="text-xs text-muted-foreground space-y-1 mt-1">
                                                                    <p>Ilość: <span className='font-semibold'>{order.quantity}</span></p>
                                                                    <p>Zrealizowano: <span className='font-semibold text-green-500'>{realized}</span></p>
                                                                    <p>Pozostało: <span className='font-semibold text-orange-500'>{remaining}</span></p>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(order)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => deleteOrder(order.id)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                       </AccordionContent>
                                   </AccordionItem>
                               ))}
                           </Accordion>
                        ) : (
                            <p className="text-center text-muted-foreground py-10 text-sm">Brak aktywnych zamówień.</p>
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
                            <div className="space-y-1">
                                <Label className="text-sm">Dział</Label>
                                <Select 
                                    value={editFormData.department} 
                                    onValueChange={(value) => setEditFormData(d => d ? {...d, department: value} : null)}
                                >
                                    <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                                    <SelectContent>
                                        {config.departments.map(d => <SelectItem key={d.id} value={d.name} className="text-sm">{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm">Stanowisko</Label>
                                <Select 
                                    value={editFormData.jobTitle} 
                                    onValueChange={(value) => setEditFormData(d => d ? {...d, jobTitle: value} : null)}
                                >
                                    <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                                    <SelectContent>
                                        {config.jobTitles.map(j => <SelectItem key={j.id} value={j.name} className="text-sm">{j.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-sm">Ilość zamówiona</Label>
                                    <Input 
                                        type="number"
                                        value={editFormData.quantity}
                                        onChange={(e) => setEditFormData(d => d ? {...d, quantity: Math.max(1, parseInt(e.target.value, 10) || 1)} : null)}
                                        min="1"
                                        className="h-10 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm">Ilość zrealizowano</Label>
                                    <Input 
                                        type="number"
                                        value={editFormData.realizedQuantity}
                                        onChange={(e) => setEditFormData(d => d ? {...d, realizedQuantity: Math.max(0, parseInt(e.target.value, 10) || 0)} : null)}
                                        min="0"
                                        className="h-10 text-sm"
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

const HiresAndFiresTab = () => {
    const { employees, useAppContext } = useAppContext();
    const today = endOfToday();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(today, 30)),
        to: today,
    });

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
        }
    };

    const { newHires, terminations, hiresSummary, terminationsSummary } = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return { newHires: [], terminations: [], hiresSummary: null, terminationsSummary: null };
        }

        const hires = employees.filter(emp => {
            const hireDate = parseMaybeDate(emp.hireDate);
            return hireDate && isWithinInterval(hireDate, { start: dateRange.from!, end: dateRange.to! });
        }).sort((a,b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime());

        const terms = employees.filter(emp => {
            const termDate = parseMaybeDate(emp.terminationDate);
            return termDate && isWithinInterval(termDate, { start: dateRange.from!, end: dateRange.to! });
        }).sort((a,b) => new Date(b.terminationDate!).getTime() - new Date(a.terminationDate!).getTime());

        const createSummary = (employeeList: Employee[]) => {
            const byDepartment = employeeList.reduce((acc, emp) => {
                const key = emp.department || 'Brak działu';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const byJobTitle = employeeList.reduce((acc, emp) => {
                const key = emp.jobTitle || 'Brak stanowiska';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            return {
                byDepartment: Object.entries(byDepartment).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count),
                byJobTitle: Object.entries(byJobTitle).map(([name, count]) => ({name, count})).sort((a,b) => b.count - a.count),
            }
        };

        return { 
            newHires: hires, 
            terminations: terms,
            hiresSummary: createSummary(hires),
            terminationsSummary: createSummary(terms),
        };

    }, [employees, dateRange]);
    
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
        <div className="flex flex-col space-y-6 flex-grow">
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <CardTitle>Wybierz okres</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                             <Select onValueChange={handlePresetChange} defaultValue='30'>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Wybierz okres" />
                                </SelectTrigger>
                                <SelectContent>
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

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hiresSummary && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Podsumowanie zatrudnień ({newHires.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="multiple" defaultValue={['departments', 'job-titles']}>
                                <AccordionItem value="departments">
                                    <AccordionTrigger>Wg działów</AccordionTrigger>
                                    <AccordionContent>
                                        <SummaryTable title="" data={hiresSummary.byDepartment} />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="job-titles">
                                    <AccordionTrigger>Wg stanowisk</AccordionTrigger>
                                    <AccordionContent>
                                         <SummaryTable title="" data={hiresSummary.byJobTitle} />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                )}
                 {terminationsSummary && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Podsumowanie zwolnień ({terminations.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                              <Accordion type="multiple" defaultValue={['departments', 'job-titles']}>
                                <AccordionItem value="departments">
                                    <AccordionTrigger>Wg działów</AccordionTrigger>
                                    <AccordionContent>
                                        <SummaryTable title="" data={terminationsSummary.byDepartment} />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="job-titles">
                                    <AccordionTrigger>Wg stanowisk</AccordionTrigger>
                                    <AccordionContent>
                                         <SummaryTable title="" data={terminationsSummary.byJobTitle} />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                )}
             </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Lista nowo zatrudnionych ({newHires.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-96">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pracownik</TableHead>
                                        <TableHead>Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {newHires.length > 0 ? (
                                        newHires.map(emp => (
                                            <TableRow key={emp.id}>
                                                <TableCell>
                                                    <div className="font-medium">{emp.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{emp.jobTitle}, {emp.department}</div>
                                                </TableCell>
                                                <TableCell>{format(parseMaybeDate(emp.hireDate)!, 'dd.MM.yyyy')}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center h-24">Brak danych</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Lista zwolnionych ({terminations.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-96">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pracownik</TableHead>
                                        <TableHead>Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {terminations.length > 0 ? (
                                        terminations.map(emp => (
                                            <TableRow key={emp.id}>
                                                <TableCell>
                                                    <div className="font-medium">{emp.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{emp.jobTitle}, {emp.department}</div>
                                                </TableCell>
                                                <TableCell>{format(parseMaybeDate(emp.terminationDate)!, 'dd.MM.yyyy')}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center h-24">Brak danych</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function StatisticsPage() {
  const { isLoading, useAppContext } = useAppContext();
  
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
          <TabsTrigger value="hires_and_fires">Ruchy kadrowe</TabsTrigger>
          <TabsTrigger value="history">Historia</TabsTrigger>
          <TabsTrigger value="orders">Zamówienia</TabsTrigger>
        </TabsList>
        <TabsContent value="report" className="flex-grow mt-6">
            <ReportTab />
        </TabsContent>
         <TabsContent value="hires_and_fires" className="flex-grow mt-6">
            <HiresAndFiresTab />
        </TabsContent>
         <TabsContent value="history" className="flex-grow mt-6">
            <HistoryTab />
        </TabsContent>
        <TabsContent value="orders" className="flex-grow mt-6">
            <OrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
