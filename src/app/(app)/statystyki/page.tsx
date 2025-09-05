
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Employee } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';


const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};


export default function StatisticsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
        const data = snapshot.val();
        setEmployees(objectToArray(data));
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);
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
      {activeEmployees.length === 0 ? (
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
                    <Accordion type="multiple" className="w-full">
                      {departmentData.map((dept, index) => (
                          <AccordionItem value={`item-${index}`} key={dept.name}>
                              <AccordionTrigger>
                                  <div className="flex items-center justify-between w-full pr-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.fill }}></div>
                                          <span className="font-semibold">{dept.name}</span>
                                      </div>
                                      <Badge variant="secondary">{dept.value} prac.</Badge>
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-6 space-y-6">
                                    {dept.managers.map((manager, managerIndex) => (
                                        <div key={manager.name}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="font-semibold text-base">{manager.name}</h4>
                                                <Badge variant="outline">{manager.employeesCount} prac.</Badge>
                                            </div>
                                            <div className="space-y-3 pl-4">
                                                {manager.jobTitles.map((job) => (
                                                    <div key={job.name} className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-sm font-medium">
                                                            <span>{job.name}</span>
                                                            <span className="text-muted-foreground">{job.value}</span>
                                                        </div>
                                                        <Progress value={(job.value / manager.employeesCount) * 100} className="h-1.5" />
                                                    </div>
                                                ))}
                                            </div>
                                            {managerIndex < dept.managers.length - 1 && <Separator className="mt-6" />}
                                        </div>
                                    ))}
                                </div>
                              </AccordionContent>
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
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} width={120} />
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
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} width={200} interval={0} />
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
    </div>
  );
}

    