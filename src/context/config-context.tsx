'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { ConfigItem, Employee } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, runTransaction } from 'firebase/database';
import { departments, jobTitles, managers, nationalities, clothingItems, activeEmployees } from '@/lib/mock-data';

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
    // Load initial empty structure immediately
    departments: [],
    jobTitles: [],
    managers: [],
    nationalities: [],
    clothingItems: [],
    employees: [],
  });

  useEffect(() => {
    let isMounted = true;
    
    // Function to initialize config data if it's empty
    const initializeConfigData = async () => {
        const configRef = ref(db, 'config');
        runTransaction(configRef, (currentData) => {
            if (currentData === null) {
                return {
                    departments: departments.reduce((acc, item) => ({...acc, [item.id]: {name: item.name}}), {}),
                    jobTitles: jobTitles.reduce((acc, item) => ({...acc, [item.id]: {name: item.name}}), {}),
                    managers: managers.reduce((acc, item) => ({...acc, [item.id]: {name: item.name}}), {}),
                    nationalities: nationalities.reduce((acc, item) => ({...acc, [item.id]: {name: item.name}}), {}),
                    clothingItems: clothingItems.reduce((acc, item) => ({...acc, [item.id]: {name: item.name}}), {}),
                };
            }
            return currentData; // Abort transaction
        });
    };

    initializeConfigData();

    // Listener for config
    const configRef = ref(db, 'config');
    const unsubscribeConfig = onValue(configRef, (snapshot) => {
        if (isMounted) {
            const configData = snapshot.val();
            setData(prevData => ({
                ...prevData,
                departments: objectToArray(configData?.departments),
                jobTitles: objectToArray(configData?.jobTitles),
                managers: objectToArray(configData?.managers),
                nationalities: objectToArray(configData?.nationalities),
                clothingItems: objectToArray(configData?.clothingItems),
            }));
            // We can consider loading done when config is loaded
            setIsLoading(false);
        }
    }, (error) => {
        console.error("Firebase config listener failed:", error);
        if(isMounted) setIsLoading(false);
    });

    // Listener for employees
    const employeesRef = ref(db, 'employees');
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
        if (isMounted) {
            setData(prevData => ({ ...prevData, employees: objectToArray(snapshot.val()) }));
        }
    }, (error) => {
        console.error("Firebase employees listener failed:", error);
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
        const currentItems = data[configType as keyof typeof data] as ConfigItem[];
        const currentItemsMap = new Map(currentItems.map(item => [item.id, item]));
        const newItemsMap = new Map(newItems.map(item => [item.id, item]));

        const updates: { [key: string]: any } = {};

        // Add or update items
        for (const newItem of newItems) {
            if (!currentItemsMap.has(newItem.id) || currentItemsMap.get(newItem.id)?.name !== newItem.name) {
                let itemId = newItem.id;
                // If it's a temporary ID, it means it's a new item.
                if (itemId.startsWith(`${configType.slice(0, 2)}-`)) {
                   const newItemRef = push(configTypeRef);
                   itemId = newItemRef.key!;
                }
                updates[itemId] = { name: newItem.name };
            }
        }
        
        // Remove items
        for(const currentItem of currentItems) {
            if (!newItemsMap.has(currentItem.id)) {
                updates[currentItem.id] = null;
            }
        }
        
        const finalState = { ...updates };
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
