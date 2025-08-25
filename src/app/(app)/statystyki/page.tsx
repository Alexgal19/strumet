'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '@/components/page-header';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useConfig } from '@/context/config-context';
import { Loader2 } from 'lucide-react';


export default function StatisticsPage() {
    const { employees, departments, jobTitles, managers, nationalities, isLoading } = useConfig();
    
    const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

    const statsByDepartment = useMemo(() => {
      const data = departments.map(d => ({
        name: d.name,
        'Liczba pracowników': activeEmployees.filter(e => e.department === d.name).length,
      }));
      return data.filter(d => d['Liczba pracowników'] > 0);
    }, [departments, activeEmployees]);
    
    const statsByJobTitle = useMemo(() => {
      const data = jobTitles.map(j => ({
        name: j.name,
        'Liczba pracowników': activeEmployees.filter(e => e.jobTitle === j.name).length,
      }));
      return data.filter(d => d['Liczba pracowników'] > 0);
    }, [jobTitles, activeEmployees]);

    const statsByManager = useMemo(() => {
      const data = managers.map(m => ({
        name: m.name,
        'Liczba pracowników': activeEmployees.filter(e => e.manager === m.name).length,
      }));
      return data.filter(d => d['Liczba pracowników'] > 0);
    }, [managers, activeEmployees]);

    const statsByNationality = useMemo(() => {
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
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} />
                  <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="Liczba pracowników" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
              </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );

    if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
      <div>
        <PageHeader
          title="Statystyki"
          description="Analiza danych dotyczących zatrudnienia."
        />
        <Tabs defaultValue="department">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="department">Wg działów</TabsTrigger>
            <TabsTrigger value="jobTitle">Wg stanowisk</TabsTrigger>
            <TabsTrigger value="manager">Wg kierowników</TabsTrigger>
            <TabsTrigger value="nationality">Wg narodowości</TabsTrigger>
          </TabsList>
          <TabsContent value="department" className="mt-4">
            {renderChart(statsByDepartment, 'Liczba pracowników według działów')}
          </TabsContent>
          <TabsContent value="jobTitle" className="mt-4">
            {renderChart(statsByJobTitle, 'Liczba pracowników według stanowisk')}
          </TabsContent>
          <TabsContent value="manager" className="mt-4">
            {renderChart(statsByManager, 'Liczba pracowników według kierowników')}
          </TabsContent>
          <TabsContent value="nationality" className="mt-4">
            {renderChart(statsByNationality, 'Liczba pracowników według narodowości')}
          </TabsContent>
        </Tabs>
      </div>
    );
}
