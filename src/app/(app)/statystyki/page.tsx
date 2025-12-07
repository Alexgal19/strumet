
'use client';

import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2, Users, Copy, Building, Briefcase } from 'lucide-react';
import { Employee } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { EmployeeForm } from '@/components/employee-form';
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';


const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-1) / 0.7)", "hsl(var(--chart-2) / 0.7)"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {data.name}
            </span>
            <span className="font-bold text-muted-foreground">
              {data.value} ({data.percentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

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

  const stats = useMemo(() => {
    const departments = new Set(activeEmployees.map(e => e.department));
    const managers = new Set(activeEmployees.map(e => e.manager));
    const totalManagers = managers.size > 0 ? managers.size : 1;

    return {
        totalDepartments: departments.size,
        averageEmployeesPerManager: (totalActiveEmployees / totalManagers).toFixed(1),
    };
  }, [activeEmployees, totalActiveEmployees]);

  const departmentData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    activeEmployees.forEach(employee => {
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
    const counts: { [key: string]: number } = {};
    activeEmployees.forEach(employee => {
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

  const handleChartClick = (name: string, type: 'department' | 'nationality' | 'jobTitle') => {
    let filtered: Employee[] = [];
    let title = '';
    
    switch(type) {
        case 'department':
            filtered = activeEmployees.filter(e => e.department === name);
            title = `Pracownicy w dziale: ${name}`;
            break;
        case 'nationality':
            filtered = activeEmployees.filter(e => e.nationality === name);
            title = `Pracownicy narodowości: ${name}`;
            break;
        case 'jobTitle':
            filtered = activeEmployees.filter(e => e.jobTitle === name);
            title = `Pracownicy na stanowisku: ${name}`;
            break;
    }
    
    setDialogTitle(title);
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
  
  const renderPieChart = (data: any[], title: string, description: string, type: 'department' | 'nationality' | 'jobTitle') => (
      <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={60}
                            paddingAngle={5}
                            labelLine={false}
                            onClick={(d) => handleChartClick(d.name, type)}
                            className="cursor-pointer"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                            ))}
                        </Pie>
                        <Legend
                            iconType="circle"
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            formatter={(value, entry) => (
                                <span className="text-muted-foreground text-sm">
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
        title="Statystyki - Raport"
        description="Kluczowe wskaźniki dotyczące struktury personelu."
      />
      {employees.length === 0 ? (
         <div className="text-center text-muted-foreground py-10">
            Brak danych do wyświetlenia statystyk. Dodaj pracowników, aby zobaczyć analizę.
        </div>
      ) : (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktywni pracownicy</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalActiveEmployees}</div>
                        <p className="text-xs text-muted-foreground">Całkowita liczba pracowników</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Liczba działów</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDepartments}</div>
                        <p className="text-xs text-muted-foreground">Aktywne działy w firmie</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pracownicy / Kierownik</CardTitle>
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
