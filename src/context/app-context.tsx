

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ref, onValue, set, push, update, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { 
    Employee, 
    AllConfig, 
    AbsenceRecord, 
    CirculationCard, 
    FingerprintAppointment, 
    ClothingIssuance, 
    AppNotification,
    ActiveView,
    ConfigType,
    Order,
    JobTitleClothingSet
} from '@/lib/types';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

interface AppContextType {
    employees: Employee[];
    config: AllConfig;
    absenceRecords: AbsenceRecord[];
    circulationCards: CirculationCard[];
    fingerprintAppointments: FingerprintAppointment[];
    clothingIssuances: ClothingIssuance[];
    notifications: AppNotification[];
    orders: Order[];
    isLoading: boolean;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    handleSaveEmployee: (employeeData: Employee) => Promise<void>;
    handleTerminateEmployee: (id: string) => Promise<void>;
    handleRestoreEmployee: (id: string) => Promise<void>;
    handleDeleteAllHireDates: () => Promise<void>;
    handleDeleteAllEmployees: () => Promise<void>;
    addConfigItems: (configType: ConfigType, items: string[]) => Promise<void>;
    updateConfigItem: (configType: ConfigType, itemId: string, newName: string) => Promise<void>;
    removeConfigItem: (configType: ConfigType, itemId: string) => Promise<void>;
    handleSaveJobTitleClothingSet: (jobTitleId: string, clothingItemIds: string[]) => Promise<void>;
    addAbsenceRecord: (record: Omit<AbsenceRecord, 'id'>) => Promise<void>;
    deleteAbsenceRecord: (recordId: string) => Promise<void>;
    addCirculationCard: (employeeId: string, employeeFullName: string) => Promise<CirculationCard | null>;
    addFingerprintAppointment: (appointment: Omit<FingerprintAppointment, 'id'>) => Promise<void>;
    deleteFingerprintAppointment: (appointmentId: string) => Promise<void>;
    addClothingIssuance: (issuance: Omit<ClothingIssuance, 'id'>) => Promise<ClothingIssuance | null>;
    deleteClothingIssuance: (issuanceId: string) => Promise<void>;
    addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [activeView, setActiveView] = useState<ActiveView>('aktywni');
    
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [config, setConfig] = useState<AllConfig>({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [], jobTitleClothingSets: [] });
    const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
    const [circulationCards, setCirculationCards] = useState<CirculationCard[]>([]);
    const [fingerprintAppointments, setFingerprintAppointments] = useState<FingerprintAppointment[]>([]);
    const [clothingIssuances, setClothingIssuances] = useState<ClothingIssuance[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const dataRef = ref(db);
        const unsubscribe = onValue(dataRef, (snapshot) => {
            const data = snapshot.val() || {};
            setEmployees(objectToArray(data.employees));
            setConfig({
                departments: objectToArray(data.config?.departments),
                jobTitles: objectToArray(data.config?.jobTitles),
                managers: objectToArray(data.config?.managers),
                nationalities: objectToArray(data.config?.nationalities),
                clothingItems: objectToArray(data.config?.clothingItems),
                jobTitleClothingSets: objectToArray(data.config?.jobTitleClothingSets)
            });
            setAbsenceRecords(objectToArray(data.absenceRecords));
            setCirculationCards(objectToArray(data.circulationCards));
            setFingerprintAppointments(objectToArray(data.fingerprintAppointments));
            setClothingIssuances(objectToArray(data.clothingIssuances));
            setNotifications(objectToArray(data.notifications));
            setOrders(objectToArray(data.orders));
            setIsLoading(false);
        }, (error) => {
            console.error("Firebase read failed: ", error);
            setIsLoading(false);
            toast({ variant: 'destructive', title: 'Błąd Bazy Danych', description: 'Nie udało się załadować danych.'});
        });

        return () => unsubscribe();
    }, [toast]);
    
    // --- Employee Actions ---
    const handleSaveEmployee = useCallback(async (employeeData: Employee) => {
        try {
            const { id, ...dataToSave } = employeeData;
            Object.keys(dataToSave).forEach(key => {
                if ((dataToSave as any)[key] === undefined) { (dataToSave as any)[key] = null; }
            });

            if (id) {
                await update(ref(db, `employees/${id}`), dataToSave);
                toast({ title: 'Sukces', description: 'Dane pracownika zostały zaktualizowane.' });
            } else {
                const newEmployeeRef = push(ref(db, 'employees'));
                await set(newEmployeeRef, { ...dataToSave, status: 'aktywny', id: newEmployeeRef.key });
                toast({ title: 'Sukces', description: 'Nowy pracownik został dodany.' });
            }
        } catch (error) {
            console.error("Error saving employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać danych pracownika.' });
        }
    }, [toast]);

    const handleTerminateEmployee = useCallback(async (id: string) => {
        try {
            await update(ref(db, `employees/${id}`), {
                status: 'zwolniony',
                terminationDate: format(new Date(), 'yyyy-MM-dd')
            });
            toast({ title: 'Pracownik zwolniony', description: 'Status pracownika został zmieniony na "zwolniony".' });
        } catch (error) {
            console.error("Error terminating employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zwolnić pracownika.' });
        }
    }, [toast]);

    const handleRestoreEmployee = useCallback(async (employeeId: string) => {
        try {
            await update(ref(db, `employees/${employeeId}`), {
                status: 'aktywny',
                terminationDate: null 
            });
            toast({ title: 'Sukces', description: 'Pracownik został przywrócony.' });
        } catch (error) {
            console.error("Error restoring employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracownika.' });
        }
    }, [toast]);

    const handleDeleteAllHireDates = useCallback(async () => {
        try {
            const updates: Record<string, any> = {};
            employees.forEach(employee => {
                updates[`/employees/${employee.id}/hireDate`] = null;
            });
            await update(ref(db), updates);
            toast({ title: 'Sukces', description: 'Wszystkie daty zatrudnienia zostały usunięte.' });
        } catch (error) {
            console.error("Error deleting all hire dates: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć dat zatrudnienia.' });
        }
    }, [employees, toast]);

    const handleDeleteAllEmployees = useCallback(async () => {
        try {
            await remove(ref(db, 'employees'));
            toast({ title: 'Sukces', description: 'Wszyscy pracownicy zostali usunięci.' });
        } catch (error) {
            console.error("Error deleting all employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracowników.' });
        }
    }, [toast]);

    // --- Config Actions ---
    const addConfigItems = useCallback(async (configType: ConfigType, items: string[]) => {
        const configRef = ref(db, `config/${configType}`);
        items.forEach(itemName => {
            const newItemRef = push(configRef);
            set(newItemRef, { name: itemName });
        });
    }, []);

    const updateConfigItem = useCallback(async (configType: ConfigType, itemId: string, newName: string) => {
        const itemToUpdate = config[configType].find(i => i.id === itemId);
        if (!itemToUpdate) return;
        
        const oldName = itemToUpdate.name;
        
        try {
            const updates: Record<string, any> = {};
            updates[`/config/${configType}/${itemId}/name`] = newName;
            
            const employeeFieldToUpdate = configType === 'departments' ? 'department' : configType === 'jobTitles' ? 'jobTitle' : configType === 'managers' ? 'manager' : configType === 'nationalities' ? 'nationality' : null;
            
            if (employeeFieldToUpdate) {
                employees.forEach(employee => {
                    if (employee[employeeFieldToUpdate as keyof Employee] === oldName) {
                        updates[`/employees/${employee.id}/${employeeFieldToUpdate}`] = newName;
                    }
                });
            }
            
            await update(ref(db), updates);
            toast({ title: "Sukces", description: "Element został zaktualizowany."});
        } catch (error) {
            console.error("Error updating item:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zaktualizować elementu."});
        }
    }, [config, employees, toast]);

    const removeConfigItem = useCallback(async (configType: ConfigType, itemId: string) => {
        await remove(ref(db, `config/${configType}/${itemId}`));
        toast({ title: "Sukces", description: "Element został usunięty."});
    }, [toast]);
    
    const handleSaveJobTitleClothingSet = useCallback(async (jobTitleId: string, clothingItemIds: string[]) => {
        try {
            await set(ref(db, `config/jobTitleClothingSets/${jobTitleId}`), {
                id: jobTitleId,
                clothingItemIds
            });
            toast({ title: "Sukces", description: "Zestaw odzieży dla stanowiska został zapisany." });
        } catch (error) {
            console.error("Error saving clothing set:", error);
            toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zapisać zestawu odzieży." });
        }
    }, [toast]);

    // --- Other Actions ---
    const addAbsenceRecord = useCallback(async (record: Omit<AbsenceRecord, 'id'>) => {
        try {
            await set(push(ref(db, 'absenceRecords')), record);
            toast({ title: 'Sukces', description: 'Zapis został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving record:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać rekordu.' });
        }
    }, [toast]);
    
    const deleteAbsenceRecord = useCallback(async (recordId: string) => {
        try {
            await remove(ref(db, `absenceRecords/${recordId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            console.error('Error deleting record:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [toast]);
    
    const addCirculationCard = useCallback(async (employeeId: string, employeeFullName: string) => {
        try {
            const newCardRef = push(ref(db, 'circulationCards'));
            const newCard: Omit<CirculationCard, 'id'> = {
                employeeId, employeeFullName, date: new Date().toISOString(),
            };
            await set(newCardRef, newCard);
            toast({ title: 'Sukces', description: 'Karta obiegowa została wygenerowana.' });
            return { ...newCard, id: newCardRef.key! };
        } catch (error) {
            console.error('Error saving circulation card:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać karty.' });
            return null;
        }
    }, [toast]);
    
    const addFingerprintAppointment = useCallback(async (appointment: Omit<FingerprintAppointment, 'id'>) => {
        try {
            await set(push(ref(db, 'fingerprintAppointments')), appointment);
            toast({ title: 'Sukces', description: 'Termin został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać terminu.' });
        }
    }, [toast]);
    
    const deleteFingerprintAppointment = useCallback(async (appointmentId: string) => {
        try {
            await remove(ref(db, `fingerprintAppointments/${appointmentId}`));
            toast({ title: 'Sukces', description: 'Termin został usunięty.' });
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć terminu.' });
        }
    }, [toast]);
    
    const addClothingIssuance = useCallback(async (issuance: Omit<ClothingIssuance, 'id'>) => {
        try {
            const newIssuanceRef = push(ref(db, 'clothingIssuances'));
            await set(newIssuanceRef, issuance);
            toast({ title: 'Sukces', description: 'Zapis o wydaniu odzieży został zapisany.' });
            return { ...issuance, id: newIssuanceRef.key! };
        } catch (error) {
            console.error('Error saving clothing issuance:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać danych.' });
            return null;
        }
    }, [toast]);

    const deleteClothingIssuance = useCallback(async (issuanceId: string) => {
        try {
            await remove(ref(db, `clothingIssuances/${issuanceId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [toast]);

    const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt'>) => {
        try {
            const newOrderRef = push(ref(db, 'orders'));
            await set(newOrderRef, { ...order, createdAt: new Date().toISOString() });
            toast({ title: 'Sukces', description: 'Nowe zamówienie zostało dodane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać zamówienia.'});
        }
    }, [toast]);

    const deleteOrder = useCallback(async (orderId: string) => {
        try {
            await remove(ref(db, `orders/${orderId}`));
            toast({ title: 'Sukces', description: 'Zamówienie zostało usunięte.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zamówienia.'});
        }
    }, [toast]);

    const value = {
        employees,
        config,
        absenceRecords,
        circulationCards,
        fingerprintAppointments,
        clothingIssuances,
        notifications,
        orders,
        isLoading,
        activeView,
        setActiveView,
        handleSaveEmployee,
        handleTerminateEmployee,
        handleRestoreEmployee,
        handleDeleteAllHireDates,
        handleDeleteAllEmployees,
        addConfigItems,
        updateConfigItem,
        removeConfigItem,
        handleSaveJobTitleClothingSet,
        addAbsenceRecord,
        deleteAbsenceRecord,
        addCirculationCard,
        addFingerprintAppointment,
        deleteFingerprintAppointment,
        addClothingIssuance,
        deleteClothingIssuance,
        addOrder,
        deleteOrder
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
