
'use client';

import TerminatedEmployeesPage from '@/components/zwolnieni-page';
import type { Employee, AllConfig } from '@/lib/types';

interface ZwolnieniPageProps {
  employees: Employee[];
  config: AllConfig;
  isLoading: boolean;
}

export default function ZwolnieniPage({ employees, config, isLoading }: ZwolnieniPageProps) {
    return <TerminatedEmployeesPage employees={employees} config={config} isLoading={isLoading} />;
}
