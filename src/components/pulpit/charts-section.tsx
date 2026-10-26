'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { ChartDatum } from './use-dashboard-data';

const DashboardPieChart = dynamic(() => import('@/components/dashboard-pie-chart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] w-full items-center justify-center rounded-xl border border-border-subtle bg-background-secondary p-6">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

type ChartsSectionProps = {
  departmentData: ChartDatum[];
  nationalityData: ChartDatum[];
};

export function ChartsSection({ departmentData, nationalityData }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardPieChart
        data={departmentData}
        title="Rozkład wg Działów"
        description="Liczba pracowników w poszczególnych działach."
      />
      <DashboardPieChart
        data={nationalityData}
        title="Rozkład wg Narodowości"
        description="Struktura pracowników z podziałem na narodowości."
      />
    </div>
  );
}
