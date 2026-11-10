'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { ChartDatum } from './use-dashboard-data';
import { useI18n } from '@/lib/i18n';

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
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardPieChart
        data={departmentData}
        title={t('dashboard.byDepartment')}
        description={t('dashboard.byDepartmentDesc')}
      />
      <DashboardPieChart
        data={nationalityData}
        title={t('dashboard.byNationality')}
        description={t('dashboard.byNationalityDesc')}
      />
    </div>
  );
}
