import { useMemo } from 'react';
import type { Employee } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { vacationHasStarted } from '@/lib/date';
import { isActiveEmployee, isEffectivelyTerminated } from '@/lib/employee-status';
import { startOfDay } from 'date-fns';

export const useEmployees = (
  status?: 'aktywny' | 'zwolniony',
  options?: { excludeOnVacation?: boolean }
) => {
  const { employees, isLoading } = useAppContext();
  const excludeOnVacation = options?.excludeOnVacation ?? false;

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (status) {
      const today = startOfDay(new Date());
      result = result.filter((e: Employee) => {
        if (status === 'aktywny') {
          return isActiveEmployee(e, today);
        } else if (status === 'zwolniony') {
          return e.status === 'zwolniony' || (e.status === 'aktywny' && isEffectivelyTerminated(e, today));
        }
        return e.status === status;
      });
    }
    if (excludeOnVacation) {
      result = result.filter((e: Employee) => !vacationHasStarted(e.vacationStartDate));
    }
    return result;
  }, [employees, status, excludeOnVacation]);

  return { employees: filteredEmployees, isLoading };
};
