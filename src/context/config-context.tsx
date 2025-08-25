'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { ConfigItem, Employee, FingerprintAppointment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { departments, jobTitles, managers, nationalities, clothingItems } from '@/lib/mock-data';

interface ConfigContextType {
  departments: ConfigItem[];
  jobTitles: ConfigItem[];
  managers: ConfigItem[];
  nationalities: ConfigItem[];
  clothingItems: ConfigItem[];
  employees: Employee[];
  fingerprintAppointments: FingerprintAppointment[];
  updateConfig: (configType: ConfigType, newItems: ConfigItem[]) => Promise<void>;
  isLoading: boolean;
}

export type ConfigType = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
    return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
}

const arrayToObject = (arr: ConfigItem[]) => {
    return arr.reduce((acc, item) => {
        const { id, ...rest } = item;
        acc[id] = rest;
        return acc;
    }, {} as Record<string, {name: string}>);
};

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    departments: ConfigItem[];
    jobTitles: ConfigItem[];
    managers: ConfigItem[];
    nationalities: ConfigItem[];
    clothingItems: ConfigItem[];
    employees: Employee[];
    fingerprintAppointments: FingerprintAppointment[];
  }>({
    departments,
    jobTitles,
    managers,
    nationalities,
    clothingItems,
    employees: [],
    fingerprintAppointments: [],
  });

  useEffect(() => {
    let isMounted = true;
    const dbRef = ref(db);

    const fetchData = async () => {
      try {
        const snapshot = await get(dbRef);
        if (!isMounted) return;

        const dbData = snapshot.val();
        
        let configData = dbData?.config;
        
        // Seed initial config data if it doesn't exist
        if (!configData) {
          const initialConfig = {
            departments: arrayToObject(departments),
            jobTitles: arrayToObject(jobTitles),
            managers: arrayToObject(managers),
            nationalities: arrayToObject(nationalities),
            clothingItems: arrayToObject(clothingItems),
          };
          await set(ref(db, 'config'), initialConfig);
          configData = initialConfig;
        }

        setData({
          departments: objectToArray(configData.departments),
          jobTitles: objectToArray(configData.jobTitles),
          managers: objectToArray(configData.managers),
          nationalities: objectToArray(configData.nationalities),
          clothingItems: objectToArray(configData.clothingItems),
          employees: objectToArray(dbData?.employees),
          fingerprintAppointments: objectToArray(dbData?.fingerprintAppointments),
        });

      } catch (error) {
        console.error("Firebase initial data load failed:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Set up real-time listeners after initial fetch
    const configListener = onValue(ref(db, 'config'), (snapshot) => {
        if (!isMounted || !snapshot.exists()) return;
        const configData = snapshot.val();
        setData(prev => ({
            ...prev,
            departments: objectToArray(configData.departments),
            jobTitles: objectToArray(configData.jobTitles),
            managers: objectToArray(configData.managers),
            nationalities: objectToArray(configData.nationalities),
            clothingItems: objectToArray(configData.clothingItems),
        }));
    });

    const employeesListener = onValue(ref(db, 'employees'), (snapshot) => {
        if (isMounted) setData(prev => ({ ...prev, employees: objectToArray(snapshot.val()) }));
    });

    const appointmentsListener = onValue(ref(db, 'fingerprintAppointments'), (snapshot) => {
      if (isMounted) setData(prev => ({ ...prev, fingerprintAppointments: objectToArray(snapshot.val()) }));
    });

    return () => {
      isMounted = false;
      // Detach listeners - onValue returns an unsubscribe function
      configListener();
      employeesListener();
      appointmentsListener();
    };
  }, []);

  const updateConfig = useCallback(async (configType: ConfigType, newItems: ConfigItem[]) => {
    try {
        const configTypeRef = ref(db, `config/${configType}`);
        const updates = newItems.reduce((acc, item) => {
          const { id, ...rest } = item;
          // If it's a new item, Firebase will generate an ID, but we need a key here.
          // For simplicity, we convert the whole array to an object and 'set' it.
          const key = id.startsWith(`${configType.slice(0, 2)}-`) ? push(configTypeRef).key! : id;
          acc[key] = rest;
          return acc;
        }, {} as Record<string, {name: string}>);
        
        await set(configTypeRef, updates);

      } catch (error) {
          console.error("Failed to save config to Firebase", error);
      }
  }, []);

  const memoizedValue = useMemo(() => ({
    ...data,
    updateConfig,
    isLoading,
  }), [data, updateConfig, isLoading]);
  
  return (
    <ConfigContext.Provider value={memoizedValue}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
