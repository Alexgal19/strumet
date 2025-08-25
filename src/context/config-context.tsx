'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { ConfigItem, Employee } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push } from 'firebase/database';

interface ConfigContextType {
  departments: ConfigItem[];
  jobTitles: ConfigItem[];
  managers: ConfigItem[];
  nationalities: ConfigItem[];
  clothingItems: ConfigItem[];
  employees: Employee[];
  updateConfig: (configType: ConfigType, newItems: ConfigItem[]) => Promise<void>;
  isLoading: boolean;
}

export type ConfigType = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const objectToArray = (obj: Record<string, any> | undefined): any[] => {
    return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
}

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    departments: ConfigItem[];
    jobTitles: ConfigItem[];
    managers: ConfigItem[];
    nationalities: ConfigItem[];
    clothingItems: ConfigItem[];
    employees: Employee[];
  }>({
    departments: [],
    jobTitles: [],
    managers: [],
    nationalities: [],
    clothingItems: [],
    employees: [],
  });

  useEffect(() => {
    const configRef = ref(db, 'config');
    const employeesRef = ref(db, 'employees');
    let isMounted = true;

    const handleInitialLoad = async () => {
        const configPromise = new Promise<any>((resolve, reject) => onValue(configRef, (snap) => resolve(snap.val()), reject, { onlyOnce: true }));
        const employeesPromise = new Promise<any>((resolve, reject) => onValue(employeesRef, (snap) => resolve(snap.val()), reject, { onlyOnce: true }));

        try {
            const [configSnapshot, employeesSnapshot] = await Promise.all([configPromise, employeesPromise]);
            
            if (isMounted) {
                setData({
                    departments: objectToArray(configSnapshot?.departments),
                    jobTitles: objectToArray(configSnapshot?.jobTitles),
                    managers: objectToArray(configSnapshot?.managers),
                    nationalities: objectToArray(configSnapshot?.nationalities),
                    clothingItems: objectToArray(configSnapshot?.clothingItems),
                    employees: objectToArray(employeesSnapshot),
                });
            }
        } catch (error) {
            console.error("Firebase initial load failed:", error);
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    };
    
    handleInitialLoad();

    const unsubscribeConfig = onValue(ref(db, 'config'), (snapshot) => {
        const configData = snapshot.val();
        if (isMounted) {
            setData(prevData => ({
                ...prevData,
                departments: objectToArray(configData?.departments),
                jobTitles: objectToArray(configData?.jobTitles),
                managers: objectToArray(configData?.managers),
                nationalities: objectToArray(configData?.nationalities),
                clothingItems: objectToArray(configData?.clothingItems),
            }));
        }
    });

    const unsubscribeEmployees = onValue(ref(db, 'employees'), (snapshot) => {
        if (isMounted) {
            setData(prevData => ({ ...prevData, employees: objectToArray(snapshot.val()) }));
        }
    });

    return () => {
      isMounted = false;
      unsubscribeConfig();
      unsubscribeEmployees();
    };
  }, []);

  const updateConfig = useCallback(async (configType: ConfigType, newItems: ConfigItem[]) => {
      try {
        const configTypeRef = ref(db, `config/${configType}`);
        
        // Convert array to Firebase object format
        const itemsToSet = newItems.reduce((acc, item) => {
          let itemId = item.id;
          // If it's a temporary ID, it means it's a new item.
          // We don't push here, we let Firebase create the key on `set`.
          if (item.id.startsWith(`${configType.slice(0, 2)}-`)) {
             const newItemRef = push(configTypeRef);
             itemId = newItemRef.key!;
          }
          acc[itemId] = { name: item.name };
          return acc;
        }, {} as Record<string, { name: string }>);

        // Find items to remove
        const currentItems = data[configType as keyof typeof data] as ConfigItem[];
        const newItemsIds = new Set(newItems.map(i => i.id));
        const itemsToRemove = currentItems.filter(item => !newItemsIds.has(item.id));
        
        const updates: { [key: string]: any } = {};
        itemsToRemove.forEach(item => {
            updates[item.id] = null;
        });
        
        // Since `set` replaces the entire node, we need to create the final state
        const finalState = { ...itemsToSet };
        
        await set(configTypeRef, finalState);

      } catch (error) {
          console.error("Failed to save config to Firebase", error);
      }
  }, [data]);
  
  return (
    <ConfigContext.Provider value={{ ...data, updateConfig, isLoading }}>
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
