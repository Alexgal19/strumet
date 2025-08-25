
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '@/components/page-header';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useFirebaseData } from '@/context/config-context';
import { Loader2 } from 'lucide-react';
import type { Employee, ConfigItem } from '@/lib/types';


function StatisticsPageComponent() {
    const { fetchEmployees, fetchConfig } = useFirebaseData();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<ConfigItem[]>([]);
    const [jobTitles, setJobTitles] = useState<ConfigItem[]>([]);
    const [managers, setManagers] = useState<ConfigItem[]>([]);
    const [nationalities, setNationalities] = useState<ConfigItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [
                employeesData,
                departmentsData,
                jobTitlesData,
                managersData,
                nationalitiesData
            ] = await Promise.all([
                fetchEmployees(),
                fetchConfig('departments'),
                fetchConfig('jobTitles'),
                fetchConfig('managers'),
                fetchConfig('nationalities')
            ]);
            setEmployees(employeesData);
            setDepartments(departmentsData);
            setJobTitles(jobTitlesData);
            setManagers(managersData);
            setNationalities(nationalitiesData);
            setIsLoading(false);
        };
        loadData();
    }, [fetchEmployees, fetchConfig]);
    
    const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

    const statsByDepartment = useMemo(() => {
      if (!departments.length || !activeEmployees.length) return [];
      const data = departments.map(d => ({
        name: d.name,
        'Liczba pracowników': activeEmployees.filter(e => e.department === d.name).length,
      }));
      return data.filter(d => d['Liczba pracowników'] > 0);
    }, [departments, activeEmployees]);
    
    const statsByJobTitle = useMemo(() => {
      if (!jobTitles.length || !activeEmployees.length) return [];
      const data = jobTitles.map(j => ({
        name: j.name,
        'Liczba pracowników': activeEmployees.filter(e => e.jobTitle === j.name).length,
      }));
      return data.filter(d => d['Liczba pracowników'] > 0);
    }, [jobTitles, activeEmployees]);

    const statsByManager = useMemo(() => {
      if (!managers.length || !activeEmployees.length) return [];
      const data = managers.map(m => ({
        name: m.name,
        'Liczba pracowników': activeEmployees.filter(e => e.manager === m.name).length,
      }));
      return data.filter(d => d['Liczba pracowników'] > 0);
    }, [managers, activeEmployees]);

    const statsByNationality = useMemo(() => {
      if (!nationalities.length || !activeEmployees.length) return [];
      const data = nationalities.map(n => ({
        name: n.name,
        'Liczba pracowników': activeEmployees.filter(e => e.nationality === n.name).length,
      }));
      return data.filter(d => d['Liczba pracowników'] > 0);
    }, [nationalities, activeEmployees]);

    const chartConfig = {
      'Liczba pracowników': {
        label: 'Liczba pracowników',
        color: 'hsl(var(--primary))',
      },
    };

    const renderChart = (data: { name: string; 'Liczba pracowników': number }[], title: string) => (
      <Card className="flex flex-col flex-grow">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    tickMargin={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="Liczba pracowników" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
              </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );

    if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
      <div className="flex h-full flex-col">
        <PageHeader
          title="Statystyki"
          description="Analiza danych dotyczących zatrudnienia."
        />
        <Tabs defaultValue="department" className="flex flex-col flex-grow">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="department">Wg działów</TabsTrigger>
            <TabsTrigger value="jobTitle">Wg stanowisk</TabsTrigger>
            <TabsTrigger value="manager">Wg kierowników</TabsTrigger>
            <TabsTrigger value="nationality">Wg narodowości</TabsTrigger>
          </TabsList>
          <TabsContent value="department" className="mt-4 flex flex-col flex-grow">
            {renderChart(statsByDepartment, 'Liczba pracowników według działów')}
          </TabsContent>
          <TabsContent value="jobTitle" className="mt-4 flex flex-col flex-grow">
            {renderChart(statsByJobTitle, 'Liczba pracowników według stanowisk')}
          </TabsContent>
          <TabsContent value="manager" className="mt-4 flex flex-col flex-grow">
            {renderChart(statsByManager, 'Liczba pracowników według kierowników')}
          </TabsContent>
          <TabsContent value="nationality" className="mt-4 flex flex-col flex-grow">
            {renderChart(statsByNationality, 'Liczba pracowników według narodowości')}
          </TabsContent>
        </Tabs>
      </div>
    );
}

const StatisticsPage = React.memo(StatisticsPageComponent);
export default StatisticsPage;
