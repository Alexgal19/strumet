'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { ConfigItem, Employee, FingerprintAppointment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, runTransaction } from 'firebase/database';
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
    fingerprintAppointments: FingerprintAppointment[];
  }>({
    departments: departments,
    jobTitles: jobTitles,
    managers: managers,
    nationalities: nationalities,
    clothingItems: clothingItems,
    employees: [],
    fingerprintAppointments: [],
  });

  useEffect(() => {
    let isMounted = true;
    
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
            return currentData; 
        });
    };

    initializeConfigData();

    const listeners = [
        onValue(ref(db, 'config'), (snapshot) => {
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
            }
        }),
        onValue(ref(db, 'employees'), (snapshot) => {
            if (isMounted) setData(prevData => ({ ...prevData, employees: objectToArray(snapshot.val()) }));
        }),
        onValue(ref(db, 'fingerprintAppointments'), (snapshot) => {
          if(isMounted) setData(prevData => ({ ...prevData, fingerprintAppointments: objectToArray(snapshot.val()) }));
        })
    ];
    
    // Once all initial data is potentially loaded (or listeners are set up)
    Promise.all(listeners).then(() => {
      if(isMounted) setIsLoading(false);
    }).catch(error => {
      console.error("Firebase initial data load failed:", error);
      if(isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateConfig = useCallback(async (configType: ConfigType, newItems: ConfigItem[]) => {
    try {
        const configTypeRef = ref(db, `config/${configType}`);
        const currentItems = (data as any)[configType] as ConfigItem[];
        
        const updates: { [key: string]: any } = {};

        const newItemsMap = new Map(newItems.map(item => [item.id, item]));

        for(const currentItem of currentItems) {
            if (!newItemsMap.has(currentItem.id)) {
                updates[currentItem.id] = null;
            }
        }

        for (const newItem of newItems) {
            let itemId = newItem.id;
            if (itemId.startsWith(`${configType.slice(0, 2)}-`)) {
               const newItemRef = push(configTypeRef);
               itemId = newItemRef.key!;
               updates[itemId] = { name: newItem.name };
            } else {
               updates[itemId] = { name: newItem.name };
            }
        }
        
        await set(configTypeRef, updates);

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
