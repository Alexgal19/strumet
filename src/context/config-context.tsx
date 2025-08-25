'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Department, JobTitle, Manager, Nationality, ClothingItem, ConfigItem } from '@/lib/types';
import { departments, jobTitles, managers, nationalities, clothingItems } from '@/lib/mock-data';

interface ConfigContextType {
  departments: Department[];
  jobTitles: JobTitle[];
  managers: Manager[];
  nationalities: Nationality[];
  clothingItems: ClothingItem[];
  updateConfig: (configType: ConfigType, newItems: ConfigItem[]) => void;
}

export type ConfigType = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';


const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [configData, setConfigData] = useState({
    departments,
    jobTitles,
    managers,
    nationalities,
    clothingItems,
  });

  const updateConfig = (configType: ConfigType, newItems: ConfigItem[]) => {
    setConfigData(prev => ({ ...prev, [configType]: newItems }));
  };
  
  return (
    <ConfigContext.Provider value={{ ...configData, updateConfig }}>
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
