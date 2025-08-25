'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { ConfigItem, Employee, FingerprintAppointment } from '@/lib/types';

export type ConfigType = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

interface FirebaseDataContextType {
  fetchConfig: (type: ConfigType) => Promise<ConfigItem[]>;
  fetchEmployees: () => Promise<Employee[]>;
  fetchFingerprintAppointments: () => Promise<FingerprintAppointment[]>;
  updateConfig: (configType: ConfigType, newItems: ConfigItem[]) => Promise<void>;
}

const FirebaseDataContext = createContext<FirebaseDataContextType | undefined>(undefined);

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export const ConfigProvider = ({ children }: { children: ReactNode }) => {

  const fetchConfig = useCallback(async (type: ConfigType): Promise<ConfigItem[]> => {
    const snapshot = await get(ref(db, `config/${type}`));
    return objectToArray(snapshot.val());
  }, []);

  const fetchEmployees = useCallback(async (): Promise<Employee[]> => {
    const snapshot = await get(ref(db, 'employees'));
    return objectToArray(snapshot.val());
  }, []);

  const fetchFingerprintAppointments = useCallback(async (): Promise<FingerprintAppointment[]> => {
      const snapshot = await get(ref(db, `fingerprintAppointments`));
      return objectToArray(snapshot.val());
  }, []);

  const updateConfig = useCallback(async (configType: ConfigType, newItems: ConfigItem[]) => {
    try {
      const configTypeRef = ref(db, `config/${configType}`);
      const updates = newItems.reduce((acc, item) => {
        const { id, ...rest } = item;
        const key = id.startsWith(`${configType.slice(0, 2)}-`) ? '' : id; // Assuming new items dont have a real ID
        if(key) {
           acc[key] = rest;
        }
        return acc;
      }, {} as Record<string, {name: string}>);

      // Need to handle adding new items correctly
      // For now, let's just set the whole thing
      const newObject = newItems.reduce((acc, item) => {
        const { id, ...rest } = item;
        acc[id] = rest;
        return acc;
      }, {} as Record<string, {name: string}>)

      await set(configTypeRef, newObject);
    } catch (error) {
        console.error("Failed to save config to Firebase", error);
    }
  }, []);

  return (
    <FirebaseDataContext.Provider value={{ fetchConfig, fetchEmployees, fetchFingerprintAppointments, updateConfig }}>
      {children}
    </FirebaseDataContext.Provider>
  );
};

export const useFirebaseData = () => {
  const context = useContext(FirebaseDataContext);
  if (context === undefined) {
    throw new Error('useFirebaseData must be used within a ConfigProvider');
  }
  return context;
};
