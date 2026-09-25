import { useMemo } from 'react';
import type { Employee } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { vacationHasStarted, parseMaybeDate } from '@/lib/date';
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
        // Jeśli ma planowaną datę zwolnienia i już minęła (lub jest dzisiaj),
        // traktujemy go jako zwolnionego, nawet jeśli w bazie figuruje jako 'aktywny'.
        const planned = parseMaybeDate(e.plannedTerminationDate);
        const isEffectivelyTerminated = planned && startOfDay(planned) < today;

        if (status === 'aktywny') {
          return e.status === 'aktywny' && !isEffectivelyTerminated;
        } else if (status === 'zwolniony') {
          return e.status === 'zwolniony' || (e.status === 'aktywny' && isEffectivelyTerminated);
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
