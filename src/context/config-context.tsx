'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Department, JobTitle, Manager, Nationality, ClothingItem, ConfigItem } from '@/lib/types';
import { departments as initialDepartments, jobTitles as initialJobTitles, managers as initialManagers, nationalities as initialNationalities, clothingItems as initialClothingItems } from '@/lib/mock-data';

interface ConfigContextType {
  departments: Department[];
  jobTitles: JobTitle[];
  managers: Manager[];
  nationalities: Nationality[];
  clothingItems: ClothingItem[];
  updateConfig: (configType: ConfigType, newItems: ConfigItem[]) => void;
  isLoading: boolean;
}

export type ConfigType = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';


const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kadry-online-config';

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [configData, setConfigData] = useState({
    departments: initialDepartments,
    jobTitles: initialJobTitles,
    managers: initialManagers,
    nationalities: initialNationalities,
    clothingItems: initialClothingItems,
  });

  useEffect(() => {
    try {
      const storedConfig = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedConfig) {
        setConfigData(JSON.parse(storedConfig));
      }
    } catch (error) {
      console.error("Failed to load config from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = (configType: ConfigType, newItems: ConfigItem[]) => {
    setConfigData(prev => {
        const newState = { ...prev, [configType]: newItems };
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
            console.error("Failed to save config to localStorage", error);
        }
        return newState;
    });
  };
  
  return (
    <ConfigContext.Provider value={{ ...configData, updateConfig, isLoading }}>
      {isLoading ? null : children}
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
