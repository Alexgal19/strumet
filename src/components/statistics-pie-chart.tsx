'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/95 p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          <div className="col-span-2">
            <span className="text-sm font-bold text-foreground">{label}</span>
          </div>
          {payload.map((p: any) => (
            <React.Fragment key={p.name || p.dataKey}>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.stroke || p.payload.fill }}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {p.name}
                </span>
              </div>
              <span className="text-xs font-bold text-right text-foreground">
                {p.value}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface StatisticsPieChartProps {
  data: any[];
  title: string;
  description: string;
  type: 'department' | 'nationality' | 'jobTitle';
  onChartClick: (name: string, type: 'department' | 'nationality' | 'jobTitle') => void;
}

export default function StatisticsPieChart({
  data,
  title,
  description,
  type,
  onChartClick,
}: StatisticsPieChartProps) {
  return (
    <Card className="flex flex-col border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-2 sm:p-6">
        <ChartContainer config={{}} className="h-[260px] sm:h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={55}
                paddingAngle={2}
                cornerRadius={4}
                isAnimationActive={false}
                stroke="none"
                onClick={(entry: any) => onChartClick(entry.name, type)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
                <LabelList
                  dataKey="name"
                  position="outside"
                  className="hidden sm:block"
                  formatter={(value: string, entry: any) =>
                    `${entry?.value ?? ''}`
                  }
                />
              </Pie>
              <Legend
                iconType="circle"
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconSize={10}
                wrapperStyle={{ lineHeight: '1.8em', fontSize: '12px' }}
                className="hidden sm:block"
                onClick={(d: any) => onChartClick(d.value, type)}
                formatter={(value, entry: any) => (
                  <span className="text-muted-foreground text-xs pl-1 cursor-pointer hover:text-primary transition-colors">
                    {value}{' '}
                    <span className="font-bold text-foreground ml-1">
                      {entry.payload?.value}
                    </span>
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
