import { useMemo } from 'react';
import type { Employee } from '@/lib/types';
import { useAppContext } from '@/context/app-context';

export const useEmployees = (status?: 'aktywny' | 'zwolniony') => {
  const { employees, isLoading } = useAppContext();

  const filteredEmployees = useMemo(() => {
    if (!status) return employees;
    return employees.filter((e: Employee) => e.status === status);
  }, [employees, status]);

  return { employees: filteredEmployees, isLoading };
};
