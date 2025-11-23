
'use client';

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Copy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Employee } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { EmployeeForm } from '@/components/employee-form';
import { useAppContext } from '@/context/app-context';


const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


export default function StatisticsPage() {
  const { employees, config, isLoading, handleSaveEmployee } = useAppContext();
  const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogEmployees, setDialogEmployees] = useState<Employee[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const { toast } = useToast();
  
  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'aktywny');
  }, [employees]);
  
  const totalActiveEmployees = activeEmployees.length;

  const departmentData = useMemo(() => {
    if (totalActiveEmployees === 0) return [];
    
    const departments: { [key: string]: { employees: Employee[] } } = {};

    activeEmployees.forEach(employee => {
      if (!departments[employee.department]) {
        departments[employee.department] = { employees: [] };
      }
      departments[employee.department].employees.push(employee);
    });

    return Object.entries(departments)
      .map(([name, data], index) => {
        
        const managersMap = new Map<string, Employee[]>();
        data.employees.forEach(e => {
            if(!managersMap.has(e.manager)) {
                managersMap.set(e.manager, []);
            }
            managersMap.get(e.manager)!.push(e);
        });

        const managersArray = Array.from(managersMap.entries()).map(([managerName, managerEmployees]) => {
            const jobTitles: { [key: string]: number } = {};
            managerEmployees.forEach(e => {
                jobTitles[e.jobTitle] = (jobTitles[e.jobTitle] || 0) + 1;
            });
            return {
                name: managerName,
                employeesCount: managerEmployees.length,
                jobTitles: Object.entries(jobTitles)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
            };
        }).sort((a,b) => b.employeesCount - a.employeesCount);

        return { 
          name, 
          value: data.employees.length,
          percentage: (data.employees.length / totalActiveEmployees) * 100,
          fill: CHART_COLORS[index % CHART_COLORS.length],
          managers: managersArray
        }
      })
      .sort((a, b) => b.value - a.value);
  }, [activeEmployees, totalActiveEmployees]);

  const nationalityData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    activeEmployees.forEach(employee => {
      counts[employee.nationality] = (counts[employee.nationality] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], index) => ({ 
      name, 
      value,
      percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
      fill: CHART_COLORS[index % CHART_COLORS.length] 
    }));
  }, [activeEmployees, totalActiveEmployees]);

  const jobTitleData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    activeEmployees.forEach(employee => {
      counts[employee.jobTitle] = (counts[employee.jobTitle] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      percentage: totalActiveEmployees > 0 ? (value / totalActiveEmployees) * 100 : 0,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [activeEmployees, totalActiveEmployees]);

  const handleDepartmentClick = (departmentName: string) => {
    const filtered = activeEmployees.filter(e => e.department === departmentName);
    setDialogTitle(`Pracownicy w dziale: ${departmentName}`);
    setDialogEmployees(filtered);
    setIsStatDialogOpen(true);
  };
  
  const handleManagerClick = (departmentName: string, managerName: string) => {
    const filtered = activeEmployees.filter(e => e.department === departmentName && e.manager === managerName);
    setDialogTitle(`Pracownicy kierownika: ${managerName}`);
    setDialogEmployees(filtered);
    setIsStatDialogOpen(true);
  };
  
  const handleJobTitleClick = (departmentName: string, managerName: string, jobTitleName: string) => {
      const filtered = activeEmployees.filter(e => 
          e.department === departmentName && 
          e.manager === managerName && 
          e.jobTitle === jobTitleName
      );
      setDialogTitle(`${jobTitleName} (Kier. ${managerName})`);
      setDialogEmployees(filtered);
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
    if (dialogEmployees.length === 0) return;
    const names = dialogEmployees.map(e => e.fullName).join('\n');
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

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Statystyki"
        description="Analizuj dane dotyczące pracowników."
      />
      {employees.length === 0 ? (
         <div className="text-center text-muted-foreground py-10">
            Brak danych do wyświetlenia statystyk. Dodaj pracowników, aby zobaczyć analizę.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Rozkład pracowników wg działów</CardTitle>
                    <CardDescription>
                        Liczba pracowników, kierownicy i stanowiska w poszczególnych działach.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full space-y-4">
                      {departmentData.map((dept, index) => (
                          <AccordionItem value={`item-${index}`} key={dept.name} className="border-b-0">
                             <Card className="overflow-hidden">
                                <div className="flex items-center p-4 hover:bg-muted/50">
                                    <AccordionTrigger className="flex-1 text-left p-0 hover:no-underline">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dept.fill }}></div>
                                            <div className="flex-grow">
                                                <p className="font-semibold">{dept.name}</p>
                                                <p className="text-xs text-muted-foreground">{dept.value} pracowników ({dept.percentage.toFixed(1)}%)</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <div className='flex items-center gap-2 pl-4'>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDepartmentClick(dept.name)}
                                            className="h-8 w-8 shrink-0"
                                        >
                                            <Users className="h-4 w-4" />
                                        </Button>
                                        <Badge variant="secondary" className="hidden sm:inline-flex">{dept.value} prac.</Badge>
                                    </div>
                                </div>
                              <AccordionContent>
                                <div className="px-6 pb-6 space-y-6">
                                    {dept.managers.map((manager, managerIndex) => (
                                        <div key={manager.name}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <Button 
                                                    variant="link" 
                                                    className="p-0 h-auto text-base font-semibold"
                                                    onClick={() => handleManagerClick(dept.name, manager.name)}
                                                >
                                                    {manager.name}
                                                </Button>
                                                <Badge variant="outline">{manager.employeesCount} prac.</Badge>
                                            </div>
                                            <div className="space-y-3 pl-4">
                                                {manager.jobTitles.map((job) => (
                                                    <div key={job.name} className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-sm font-medium">
                                                            <Button 
                                                                variant="link" 
                                                                className="p-0 h-auto text-sm"
                                                                onClick={() => handleJobTitleClick(dept.name, manager.name, job.name)}
                                                            >
                                                                {job.name}
                                                            </Button>
                                                            <span className="text-muted-foreground">{job.value} ({ (manager.employeesCount > 0 ? (job.value / manager.employeesCount) * 100 : 0).toFixed(1)}%)</span>
                                                        </div>
                                                        <Progress value={manager.employeesCount > 0 ? (job.value / manager.employeesCount) * 100 : 0} className="h-1.5" />
                                                    </div>
                                                ))}
                                            </div>
                                            {managerIndex < dept.managers.length - 1 && <Separator className="mt-6" />}
                                        </div>
                                    ))}
                                </div>
                              </AccordionContent>
                            </Card>
                          </AccordionItem>
                      ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pracownicy wg narodowości</CardTitle>
                    <CardDescription>Liczba i odsetek pracowników z podziałem na narodowości.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[450px] w-full">
                        <BarChart data={nationalityData} layout="vertical" margin={{ left: 20, right: 40, top: 5, bottom: 5 }} barGap={4}>
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))', width: 100}} 
                                width={100}
                                interval={0}
                            />
                             <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted))' }} 
                                content={<ChartTooltipContent 
                                    formatter={(value, name, props) => {
                                        if (props.payload && typeof props.payload.percentage === 'number') {
                                          return `${value} (${props.payload.percentage.toFixed(1)}%)`;
                                        }
                                        return value;
                                    }}
                                    nameKey="name"
                                    hideIndicator
                                />} 
                            />
                            <Bar dataKey="value" radius={5}>
                                <LabelList 
                                    dataKey="value" 
                                    position="right" 
                                    offset={8} 
                                    className="fill-foreground"
                                    fontSize={12}
                                    formatter={(value: number, props: any) => {
                                      if (props && typeof props.percentage === 'number') {
                                        return `${value} (${props.percentage.toFixed(1)}%)`;
                                      }
                                      return value;
                                    }}
                                />
                                {nationalityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pracownicy wg stanowisk</CardTitle>
                    <CardDescription>Liczba i odsetek pracowników na poszczególnych stanowiskach.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[450px] w-full">
                        <BarChart data={jobTitleData} layout="vertical" margin={{ left: 20, right: 40, top: 5, bottom: 5 }} barGap={4}>
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))', width: 180, whiteSpace: 'normal', wordWrap: 'break-word'}} 
                                width={150} 
                                interval={0} 
                            />
                             <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted))' }} 
                                content={<ChartTooltipContent 
                                    formatter={(value, name, props) => {
                                        if (props.payload && typeof props.payload.percentage === 'number') {
                                          return `${value} (${props.payload.percentage.toFixed(1)}%)`;
                                        }
                                        return value;
                                    }}
                                    nameKey="name"
                                    hideIndicator
                                />} 
                            />
                            <Bar dataKey="value" radius={5}>
                                <LabelList 
                                    dataKey="value" 
                                    position="right" 
                                    offset={8} 
                                    className="fill-foreground"
                                    fontSize={12}
                                    formatter={(value: number, props: any) => {
                                      if (props && typeof props.percentage === 'number') {
                                          return `${value} (${props.percentage.toFixed(1)}%)`;
                                      }
                                      return value;
                                    }}
                                />
                                {jobTitleData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      )}
      
       <Dialog open={isStatDialogOpen} onOpenChange={setIsStatDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>{dialogTitle}</DialogTitle>
                   <DialogDescription>
                        Znaleziono {dialogEmployees.length} pracowników.
                    </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-96 my-4">
                  <div className="space-y-3 pr-6">
                      {dialogEmployees.map(employee => (
                          <div key={employee.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleEmployeeClick(employee)}>
                              <span className="font-medium">{employee.fullName}</span>
                              <span className="text-muted-foreground">{employee.cardNumber}</span>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
              {dialogEmployees.length > 0 && (
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
  );
}
