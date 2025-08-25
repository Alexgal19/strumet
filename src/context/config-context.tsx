'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { ConfigItem, Employee } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, remove } from 'firebase/database';

interface ConfigContextType {
  departments: ConfigItem[];
  jobTitles: ConfigItem[];
  managers: ConfigItem[];
  nationalities: ConfigItem[];
  clothingItems: ConfigItem[];
  employees: Employee[];
  updateConfig: (configType: ConfigType, newItems: ConfigItem[]) => void;
  isLoading: boolean;
}

export type ConfigType = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [configData, setConfigData] = useState<Omit<ConfigContextType, 'updateConfig' | 'isLoading' | 'employees'>>({
    departments: [],
    jobTitles: [],
    managers: [],
    nationalities: [],
    clothingItems: [],
  });

  useEffect(() => {
    setIsLoading(true);
    const configRef = ref(db, 'config');
    const employeesRef = ref(db, 'employees');

    const unsubscribeConfig = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setConfigData({
            departments: data.departments ? Object.keys(data.departments).map(key => ({ id: key, ...data.departments[key] })) : [],
            jobTitles: data.jobTitles ? Object.keys(data.jobTitles).map(key => ({ id: key, ...data.jobTitles[key] })) : [],
            managers: data.managers ? Object.keys(data.managers).map(key => ({ id: key, ...data.managers[key] })) : [],
            nationalities: data.nationalities ? Object.keys(data.nationalities).map(key => ({ id: key, ...data.nationalities[key] })) : [],
            clothingItems: data.clothingItems ? Object.keys(data.clothingItems).map(key => ({ id: key, ...data.clothingItems[key] })) : [],
        });
      }
    }, (error) => {
        console.error("Failed to load config from Firebase", error);
    });

    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEmployees = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setEmployees(loadedEmployees);
    });
    
    // Set loading to false once both have been tried
    Promise.allSettled([
        new Promise(resolve => onValue(configRef, resolve, { onlyOnce: true })),
        new Promise(resolve => onValue(employeesRef, resolve, { onlyOnce: true }))
    ]).then(() => {
        setIsLoading(false);
    });


    return () => {
      unsubscribeConfig();
      unsubscribeEmployees();
    };
  }, []);

  const updateConfig = useCallback(async (configType: ConfigType, newItems: ConfigItem[]) => {
      try {
        const configTypeRef = ref(db, `config/${configType}`);
        const updates: { [key: string]: any } = {};
        
        // Create a map of new items for quick lookup
        const newItemsMap = new Map(newItems.map(item => [item.id, item]));
        
        // Get current items from state to compare
        const currentItems = configData[configType];
        
        // Identify added or updated items
        const itemsToSet = newItems.reduce((acc, item) => {
            if(item.id.startsWith(`${configType.slice(0,2)}-`)) { // Existing item
                acc[item.id] = { name: item.name };
            } else { // New item
                const newItemRef = push(ref(db, `config/${configType}`));
                acc[newItemRef.key!] = { name: item.name };
            }
            return acc;
        }, {} as any);
        
        await set(configTypeRef, itemsToSet);

      } catch (error) {
          console.error("Failed to save config to Firebase", error);
      }
  }, [configData]);
  
  return (
    <ConfigContext.Provider value={{ ...configData, employees, updateConfig, isLoading }}>
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
