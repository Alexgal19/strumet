

'use client';

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Copy, Building, Briefcase, ChevronRight, PlusCircle, Trash2, FileDown } from 'lucide-react';
import { Employee, Order } from '@/lib/types';
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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-base uppercase text-muted-foreground">
              {data.name}
            </span>
            <span className="font-bold text-lg text-muted-foreground">
              {data.value} ({data.percentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const ReportTab = () => {
    const { employees, config, handleSaveEmployee } = useAppContext();
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
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="text-base">{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <ChartContainer config={{}} className="h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={160}
                                innerRadius={120}
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
                                iconSize={12}
                                wrapperStyle={{ lineHeight: '2em' }}
                                onClick={(d) => handleChartClick(d.value, type)}
                                formatter={(value, entry) => (
                                    <span className="text-muted-foreground text-base pl-2 cursor-pointer hover:text-foreground">
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
                        <AccordionTrigger className="hover:no-underline text-base">
                            <div className="flex justify-between w-full pr-2">
                            <span className="font-semibold">{manager}</span>
                            <span className="text-muted-foreground">{Object.values(jobTitles).flat().length} os.</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <Accordion type="multiple" className="w-full pl-4">
                                {Object.entries(jobTitles).map(([jobTitle, emps]) => (
                                    <AccordionItem value={jobTitle} key={jobTitle}>
                                        <AccordionTrigger className="hover:no-underline text-sm">
                                            <div className="flex justify-between w-full pr-2">
                                                <span className="font-medium text-muted-foreground">{jobTitle}</span>
                                                <span className="text-muted-foreground">{emps.length} os.</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pl-4 border-l-2 border-border ml-2">
                                                {emps.map(employee => (
                                                    <div key={employee.id} className="flex items-center justify-between text-sm p-1.5 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleEmployeeClick(employee)}>
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
                <span className="text-muted-foreground">{employee.cardNumber}</span>
            </div>
        ));
    };

    return (
        <div className="flex flex-col space-y-6 flex-grow">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Raport ogólny</h3>
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
                            <CardTitle className="text-xl font-medium">Aktywni pracownicy</CardTitle>
                            <Users className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{totalActiveEmployees}</div>
                            <p className="text-base text-muted-foreground">Całkowita liczba pracowników</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-medium">Liczba działów</CardTitle>
                            <Building className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{stats.totalDepartments}</div>
                            <p className="text-base text-muted-foreground">Aktywne działy w firmie</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-medium">Pracownicy / Kierownik</CardTitle>
                            <Briefcase className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{stats.averageEmployeesPerManager}</div>
                            <p className="text-base text-muted-foreground">Średnia liczba pracowników na kierownika</p>
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
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{dialogContent?.title}</DialogTitle>
                        <DialogDescription>
                                Znaleziono {dialogContent?.total} pracowników.
                            </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-96 my-4">
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

const OrdersTab = () => {
    const { config, orders, addOrder, deleteOrder } = useAppContext();
    const { toast } = useToast();
    
    const [department, setDepartment] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [quantity, setQuantity] = useState(1);
    
    const handleAddOrder = async () => {
        if (!department || !jobTitle || quantity < 1) {
            toast({
                variant: 'destructive',
                title: 'Błąd walidacji',
                description: 'Proszę wybrać dział, stanowisko i podać prawidłową ilość.',
            });
            return;
        }
        await addOrder({ department, jobTitle, quantity });
        setDepartment('');
        setJobTitle('');
        setQuantity(1);
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


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Nowe zamówienie</CardTitle>
                        <CardDescription>Dodaj nowe zapotrzebowanie na pracowników.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Dział</Label>
                            <Select value={department} onValueChange={setDepartment}>
                                <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                                <SelectContent>
                                    {config.departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Stanowisko</Label>
                            <Select value={jobTitle} onValueChange={setJobTitle}>
                                <SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                                <SelectContent>
                                    {config.jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Ilość</Label>
                            <Input 
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                min="1"
                            />
                        </div>
                        <Button onClick={handleAddOrder} className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Dodaj zamówienie
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Aktywne zamówienia</CardTitle>
                        <CardDescription>Lista aktualnych zapotrzebowań na personel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(groupedOrders).length > 0 ? (
                           <Accordion type="multiple" className="w-full">
                               {Object.entries(groupedOrders).map(([dept, orderList]) => (
                                   <AccordionItem value={dept} key={dept}>
                                       <AccordionTrigger>
                                            <div className='flex justify-between w-full pr-4'>
                                                <span className='font-bold'>{dept}</span>
                                                <span className='text-muted-foreground'>
                                                    {orderList.reduce((sum, o) => sum + o.quantity, 0)} os.
                                                </span>
                                            </div>
                                       </AccordionTrigger>
                                       <AccordionContent>
                                            <div className="space-y-2 pl-4">
                                                {orderList.map(order => (
                                                    <div key={order.id} className="flex items-center justify-between p-2 rounded-md border">
                                                        <div>
                                                            <p className="font-medium">{order.jobTitle}</p>
                                                            <p className="text-sm text-muted-foreground">Ilość: {order.quantity}</p>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => deleteOrder(order.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                       </AccordionContent>
                                   </AccordionItem>
                               ))}
                           </Accordion>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Brak aktywnych zamówień.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function StatisticsPage() {
  const { isLoading } = useAppContext();
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Statystyki"
        description="Kluczowe wskaźniki i planowanie dotyczące struktury personelu."
      />
      <Tabs defaultValue="report" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="report">Raport</TabsTrigger>
          <TabsTrigger value="orders">Zamówienia</TabsTrigger>
        </TabsList>
        <TabsContent value="report" className="flex-grow h-full">
            <ReportTab />
        </TabsContent>
        <TabsContent value="orders" className="flex-grow h-full">
            <OrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    