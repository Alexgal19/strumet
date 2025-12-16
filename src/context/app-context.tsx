
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ref, onValue, set, push, update, remove, get } from 'firebase/database';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { 
    Employee, 
    AllConfig, 
    Absence,
    AbsenceRecord, 
    CirculationCard, 
    FingerprintAppointment, 
    ClothingIssuance, 
    AppNotification,
    ActiveView,
    ConfigType,
    Order,
    JobTitleClothingSet,
    StatsSnapshot,
    AuthUser,
    UserRole,
} from '@/lib/types';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

interface AppContextType {
    employees: Employee[];
    config: AllConfig;
    notifications: AppNotification[];
    statsHistory: StatsSnapshot[];
    isLoading: boolean;
    isHistoryLoading: boolean;
    activeView: ActiveView;
    toast: (props: any) => void;
    setActiveView: (view: ActiveView) => void;
    handleSaveEmployee: (employeeData: Employee) => Promise<void>;
    handleTerminateEmployee: (id: string) => Promise<void>;
    handleRestoreEmployee: (id: string) => Promise<void>;
    handleDeleteAllHireDates: () => Promise<void>;
    handleDeleteAllEmployees: () => Promise<void>;
    handleRestoreAllTerminatedEmployees: () => Promise<void>;
    addConfigItems: (configType: ConfigType, items: string[]) => Promise<void>;
    updateConfigItem: (configType: ConfigType, itemId: string, newName: string) => Promise<void>;
    removeConfigItem: (configType: ConfigType, itemId: string) => Promise<void>;
    handleSaveJobTitleClothingSet: (jobTitleId: string, description: string) => Promise<void>;
    handleSaveResendApiKey: (apiKey: string) => Promise<void>;
    addAbsence: (employeeId: string, date: string) => Promise<void>;
    deleteAbsence: (absenceId: string) => Promise<void>;
    addAbsenceRecord: (record: Omit<AbsenceRecord, 'id'>) => Promise<void>;
    deleteAbsenceRecord: (recordId: string) => Promise<void>;
    addCirculationCard: (employeeId: string, employeeFullName: string) => Promise<CirculationCard | null>;
    addFingerprintAppointment: (appointment: Omit<FingerprintAppointment, 'id'>) => Promise<void>;
    deleteFingerprintAppointment: (appointmentId: string) => Promise<void>;
    addClothingIssuance: (issuance: Omit<ClothingIssuance, 'id'>) => Promise<ClothingIssuance | null>;
    deleteClothingIssuance: (issuanceId: string) => Promise<void>;
    addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
    updateOrder: (order: Order) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
    currentUser: AuthUser | null;
    isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [activeView, setActiveView] = useState<ActiveView>('statystyki');
    
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [config, setConfig] = useState<AllConfig>({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [], jobTitleClothingSets: [], resendApiKey: '' });
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [statsHistory, setStatsHistory] = useState<StatsSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                const userRoleRef = ref(db, `users/${user.uid}/role`);
                const roleSnapshot = await get(userRoleRef);
                const role = roleSnapshot.val() as UserRole;
                setCurrentUser({
                    uid: user.uid,
                    email: user.email,
                    role: role || 'guest', // Default to guest if no role is found
                });
                
                // For non-admin users, force the view to 'statystyki'
                if (role !== 'admin') {
                    setActiveView('statystyki');
                } else if (activeView !== 'aktywni') {
                    // Default view for admin
                    setActiveView('aktywni');
                }

            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        const dataRef = ref(db);
        const unsubscribeDb = onValue(dataRef, (snapshot) => {
            const data = snapshot.val() || {};
            setEmployees(objectToArray(data.employees));
            setConfig({
                departments: objectToArray(data.config?.departments),
                jobTitles: objectToArray(data.config?.jobTitles),
                managers: objectToArray(data.config?.managers),
                nationalities: objectToArray(data.config?.nationalities),
                clothingItems: objectToArray(data.config?.clothingItems),
                jobTitleClothingSets: objectToArray(data.config?.jobTitleClothingSets),
                resendApiKey: data.config?.resendApiKey || '',
            });
            setNotifications(objectToArray(data.notifications));
            setStatsHistory(objectToArray(data.statisticsHistory).sort((a,b) => new Date(b.id).getTime() - new Date(a.id).getTime()));
            setIsHistoryLoading(false);
        }, (error) => {
            console.error("Firebase read failed: ", error);
            setIsHistoryLoading(false);
            toast({ variant: 'destructive', title: 'Błąd Bazy Danych', description: 'Nie udało się załadować danych.'});
        });

        return () => {
            unsubscribeAuth();
            unsubscribeDb();
        };
    }, [toast]);
    
    // --- Employee Actions ---
    const handleSaveEmployee = useCallback(async (employeeData: Employee) => {
        try {
            const { id, ...dataToSave } = employeeData;
            
            // Ensure undefined values are converted to null for Firebase
            const finalData: { [key: string]: any } = {};
            for (const key in dataToSave) {
                const typedKey = key as keyof typeof dataToSave;
                finalData[key] = dataToSave[typedKey] === undefined ? null : dataToSave[typedKey];
            }

            if (id) {
                await update(ref(db, `employees/${id}`), finalData);
                toast({ title: 'Sukces', description: 'Dane pracownika zostały zaktualizowane.' });
            } else {
                const newEmployeeRef = push(ref(db, 'employees'));
                await set(newEmployeeRef, { ...finalData, status: 'aktywny', id: newEmployeeRef.key });
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

    const handleRestoreAllTerminatedEmployees = useCallback(async () => {
        try {
            const updates: Record<string, any> = {};
            const terminatedEmployees = employees.filter(e => e.status === 'zwolniony');
            if (terminatedEmployees.length === 0) {
                toast({ title: 'Informacja', description: 'Brak zwolnionych pracowników do przywrócenia.' });
                return;
            }

            terminatedEmployees.forEach(employee => {
                updates[`/employees/${employee.id}/status`] = 'aktywny';
                updates[`/employees/${employee.id}/terminationDate`] = null;
            });
            await update(ref(db), updates);
            toast({ title: 'Sukces', description: `Przywrócono ${terminatedEmployees.length} pracowników.` });
        } catch (error) {
            console.error("Error restoring all terminated employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracowników.' });
        }
    }, [employees, toast]);

    // --- Config Actions ---
    const addConfigItems = useCallback(async (configType: ConfigType, items: string[]) => {
        const configRef = ref(db, `config/${configType}`);
        const updates: Record<string, any> = {};
        items.forEach(itemName => {
            const newItemRef = push(configRef);
            updates[newItemRef.key!] = { name: itemName };
        });
         await update(configRef, updates);
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
    
    const handleSaveJobTitleClothingSet = useCallback(async (jobTitleId: string, description: string) => {
        try {
            await set(ref(db, `config/jobTitleClothingSets/${jobTitleId}`), {
                id: jobTitleId,
                description: description
            });
            toast({ title: "Sukces", description: "Zestaw odzieży dla stanowiska został zaktualizowany."});
        } catch(error) {
            console.error("Error saving job title clothing set:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać zestawu odzieży."});
        }
    }, [toast]);

    const handleSaveResendApiKey = useCallback(async (apiKey: string) => {
        try {
            await set(ref(db, 'config/resendApiKey'), apiKey);
            toast({ title: "Sukces", description: "Klucz API Resend został zapisany."});
        } catch (error) {
            console.error("Error saving Resend API key:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać klucza API."});
        }
    }, [toast]);

    // --- Absence Actions ---
    const addAbsence = useCallback(async (employeeId: string, date: string) => {
        const newAbsenceRef = push(ref(db, 'absences'));
        await set(newAbsenceRef, { employeeId, date });
    }, []);

    const deleteAbsence = useCallback(async (absenceId: string) => {
        await remove(ref(db, `absences/${absenceId}`));
    }, []);
    
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
            const dataToSet: Omit<Order, 'id'> = {
                ...order,
                createdAt: new Date().toISOString(),
                realizedQuantity: order.realizedQuantity || 0
            };
            await set(newOrderRef, dataToSet);
            toast({ title: 'Sukces', description: 'Nowe zamówienie zostało dodane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać zamówienia.'});
        }
    }, [toast]);
    
    const updateOrder = useCallback(async (order: Order) => {
        try {
            const { id, ...dataToUpdate } = order;
            await update(ref(db, `orders/${id}`), dataToUpdate);
            toast({ title: 'Sukces', description: 'Zamówienie zostało zaktualizowane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować zamówienia.'});
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
        notifications,
        statsHistory,
        isLoading,
        isHistoryLoading,
        activeView,
        toast,
        setActiveView,
        handleSaveEmployee,
        handleTerminateEmployee,
        handleRestoreEmployee,
        handleDeleteAllHireDates,
        handleDeleteAllEmployees,
        handleRestoreAllTerminatedEmployees,
        addConfigItems,
        updateConfigItem,
        removeConfigItem,
        handleSaveJobTitleClothingSet,
        handleSaveResendApiKey,
        addAbsence,
        deleteAbsence,
        addAbsenceRecord,
        deleteAbsenceRecord,
        addCirculationCard,
        addFingerprintAppointment,
        deleteFingerprintAppointment,
        addClothingIssuance,
        deleteClothingIssuance,
        addOrder,
        updateOrder,
        deleteOrder,
        currentUser,
        isAdmin,
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
