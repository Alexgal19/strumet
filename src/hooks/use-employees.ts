import { useMemo } from 'react';
import type { Employee } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { vacationHasStarted } from '@/lib/date';

export const useEmployees = (
  status?: 'aktywny' | 'zwolniony',
  options?: { excludeOnVacation?: boolean }
) => {
  const { employees, isLoading } = useAppContext();
  const excludeOnVacation = options?.excludeOnVacation ?? false;

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (status) {
      result = result.filter((e: Employee) => e.status === status);
    }
    if (excludeOnVacation) {
      result = result.filter((e: Employee) => !vacationHasStarted(e.vacationStartDate));
    }
    return result;
  }, [employees, status, excludeOnVacation]);

  return { employees: filteredEmployees, isLoading };
};
