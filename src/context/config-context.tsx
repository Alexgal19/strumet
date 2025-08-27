
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { ConfigItem, Employee, FingerprintAppointment, Absence } from '@/lib/types';

export type ConfigType = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

interface AllConfig {
  departments: ConfigItem[];
  jobTitles: ConfigItem[];
  managers: ConfigItem[];
  nationalities: ConfigItem[];
  clothingItems: ConfigItem[];
}

interface FirebaseDataContextType {
  employees: Employee[];
  fingerprintAppointments: FingerprintAppointment[];
  absences: Absence[];
  config: AllConfig;
  isLoading: boolean;
  updateConfig: (configType: ConfigType, newItems: ConfigItem[]) => Promise<void>;
}

const FirebaseDataContext = createContext<FirebaseDataContextType | undefined>(undefined);

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const initialConfig: AllConfig = {
    departments: [],
    jobTitles: [],
    managers: [],
    nationalities: [],
    clothingItems: [],
}

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [fingerprintAppointments, setFingerprintAppointments] = useState<FingerprintAppointment[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [config, setConfig] = useState<AllConfig>(initialConfig);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const refs = [
            ref(db, 'employees'),
            ref(db, 'config'),
            ref(db, 'fingerprintAppointments'),
            ref(db, 'absences'),
        ];

        const unsubscribers = refs.map((r, index) => {
            return onValue(r, (snapshot) => {
                const data = snapshot.val();
                switch (index) {
                    case 0:
                        setEmployees(objectToArray(data));
                        break;
                    case 1:
                        setConfig({
                            departments: objectToArray(data?.departments),
                            jobTitles: objectToArray(data?.jobTitles),
                            managers: objectToArray(data?.managers),
                            nationalities: objectToArray(data?.nationalities),
                            clothingItems: objectToArray(data?.clothingItems),
                        });
                        break;
                    case 2:
                        setFingerprintAppointments(objectToArray(data));
                        break;
                    case 3:
                        setAbsences(objectToArray(data));
                        break;
                }
                setIsLoading(false);
            }, (error) => {
                console.error(error);
                setIsLoading(false);
            });
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, []);
    

  const updateConfig = async (configType: ConfigType, newItems: ConfigItem[]) => {};


  return (
    <FirebaseDataContext.Provider value={{ employees, fingerprintAppointments, absences, config, isLoading, updateConfig }}>
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
