
'use client';

import ActiveEmployeesPage from '@/components/active-employees-page';
import type { Employee, AllConfig } from '@/lib/types';

interface AktywniPageProps {
  employees: Employee[];
  config: AllConfig;
  isLoading: boolean;
}

export default function AktywniPage({ employees, config, isLoading }: AktywniPageProps) {
    return <ActiveEmployeesPage employees={employees} config={config} isLoading={isLoading} />;
}
