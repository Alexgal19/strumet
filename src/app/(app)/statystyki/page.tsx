'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { PageHeader } from '@/components/page-header';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Employee } from '@/lib/types';


const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function StatisticsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

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
    const counts: { [key: string]: number } = {};
    activeEmployees.forEach(employee => {
      counts[employee.department] = (counts[employee.department] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], index) => ({ 
        name, 
        value, 
        percentage: (value / totalActiveEmployees) * 100,
        fill: CHART_COLORS[index % CHART_COLORS.length] 
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeEmployees, totalActiveEmployees]);

  const jobTitlesByDepartmentData = useMemo(() => {
    if (!selectedDepartment) return [];
    const deptEmployees = activeEmployees.filter(e => e.department === selectedDepartment);
    const totalInDept = deptEmployees.length;
    const counts: { [key: string]: number } = {};
    deptEmployees.forEach(employee => {
      counts[employee.jobTitle] = (counts[employee.jobTitle] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalInDept > 0 ? (value / totalInDept) * 100 : 0,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeEmployees, selectedDepartment]);

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
    if (selectedDepartment === departmentName) {
      setSelectedDepartment(null);
    } else {
      setSelectedDepartment(departmentName);
    }
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
      {activeEmployees.length === 0 ? (
         <div className="text-center text-muted-foreground py-10">
            Brak danych do wyświetlenia statystyk. Dodaj pracowników, aby zobaczyć analizę.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {selectedDepartment && (
                      <Button variant="ghost" size="icon" onClick={() => setSelectedDepartment(null)}>
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <div>
                      <CardTitle>
                        {selectedDepartment 
                          ? `Rozkład stanowisk w dziale: ${selectedDepartment}`
                          : "Rozkład pracowników wg działów"}
                      </CardTitle>
                      <CardDescription>
                        {selectedDepartment
                          ? `Liczba i odsetek pracowników na poszczególnych stanowiskach.`
                          : `Liczba i odsetek pracowników w poszczególnych działach. Kliknij na dział, aby zobaczyć szczegóły.`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedDepartment ? (
                    <div className="space-y-4">
                      {departmentData.map((dept) => (
                          <div key={dept.name} className="space-y-1 cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => handleDepartmentClick(dept.name)}>
                              <div className="flex justify-between items-center text-sm font-medium">
                                  <span style={{ color: dept.fill }}>{dept.name}</span>
                                  <span>{dept.value} ({dept.percentage.toFixed(1)}%)</span>
                              </div>
                              <Progress value={dept.percentage} className="h-2" indicatorClassName="bg-[var(--progress-indicator-fill)]" style={{'--progress-indicator-fill': dept.fill} as React.CSSProperties} />
                          </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobTitlesByDepartmentData.map((job) => (
                        <div key={job.name} className="space-y-1 p-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span style={{ color: job.fill }}>{job.name}</span>
                                <span>{job.value} ({job.percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={job.percentage} className="h-2" indicatorClassName="bg-[var(--progress-indicator-fill)]" style={{'--progress-indicator-fill': job.fill} as React.CSSProperties} />
                        </div>
                      ))}
                    </div>
                  )}
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
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{fontSize: 12}} width={120} />
                             <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted))' }} 
                                content={<ChartTooltipContent 
                                    formatter={(value, name, props) => {
                                        if (props.payload) {
                                          return `${value} (${props.payload.percentage.toFixed(1)}%)`;
                                        }
                                        return value;
                                    }}
                                    labelKey="name"
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
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{fontSize: 12}} width={200} interval={0} />
                             <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted))' }} 
                                content={<ChartTooltipContent 
                                    formatter={(value, name, props) => {
                                        if (props.payload) {
                                          return `${value} (${props.payload.percentage.toFixed(1)}%)`;
                                        }
                                        return value;
                                    }}
                                    labelKey="name"
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
