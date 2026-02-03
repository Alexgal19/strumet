import { useState, useEffect, useRef } from 'react';
import {
  ref,
  onValue,
  query,
  orderByChild,
  equalTo
} from 'firebase/database';
import { getFirebaseServices } from '@/lib/firebase';
import type { Employee } from '@/lib/types';

const objectToArray = (obj: Record<string, any> | undefined | null): Employee[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export const useEmployees = (status?: 'aktywny' | 'zwolniony') => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use a ref to track if the component is mounted to avoid state updates on unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const services = getFirebaseServices();
    
    if (!services) {
        setIsLoading(false);
        return;
    }

    const { db } = services;
    let employeesRef = ref(db, 'employees');
    let employeesQuery;

    if (status) {
      employeesQuery = query(employeesRef, orderByChild('status'), equalTo(status));
    } else {
      employeesQuery = employeesRef;
    }

    const unsubscribe = onValue(employeesQuery, (snapshot) => {
      if (isMounted.current) {
        setEmployees(objectToArray(snapshot.val()));
        setIsLoading(false);
      }
    }, (err) => {
      if (isMounted.current) {
        console.error("Firebase read error:", err);
        setError(err);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [status]);

  return { employees, isLoading, error };
};
