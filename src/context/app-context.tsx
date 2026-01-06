
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ref, onValue, set, push, update, remove, get } from 'firebase/database';
import { getFirebaseServices } from '@/lib/firebase';
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
    User,
    UserRole,
} from '@/lib/types';
import type { Database } from 'firebase/database';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

interface AppContextType {
    employees: Employee[];
    users: User[];
    absences: Absence[];
    config: AllConfig;
    notifications: AppNotification[];
    statsHistory: StatsSnapshot[];
    isLoading: boolean;
    isHistoryLoading: boolean;
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
    handleSaveEmployee: (employeeData: Employee) => Promise<void>;
    handleTerminateEmployee: (employeeId: string, employeeFullName: string) => Promise<void>;
    handleRestoreEmployee: (employeeId: string, employeeFullName: string) => Promise<void>;
    handleDeleteEmployeePermanently: (employeeId: string) => Promise<void>;
    handleDeleteAllHireDates: () => Promise<void>;
    handleUpdateHireDates: (updates: { fullName: string; hireDate: string }[]) => Promise<void>;
    handleUpdateContractEndDates: (updates: { fullName: string; contractEndDate: string }[]) => Promise<void>;
    handleDeleteAllEmployees: () => Promise<void>;
    handleRestoreAllTerminatedEmployees: () => Promise<void>;
    addConfigItems: (configType: ConfigType, items: string[]) => Promise<void>;
    updateConfigItem: (configType: ConfigType, itemId: string, newName: string) => Promise<void>;
    removeConfigItem: (configType: ConfigType, itemId: string) => Promise<void>;
    handleSaveJobTitleClothingSet: (jobTitleId: string, description: string) => Promise<void>;
    handleSaveResendApiKey: (apiKey: string) => Promise<void>;
    handleUpdateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
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
    const [users, setUsers] = useState<User[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [config, setConfig] = useState<AllConfig>({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [], jobTitleClothingSets: [], resendApiKey: '' });
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [statsHistory, setStatsHistory] = useState<StatsSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

    const { db, auth } = getFirebaseServices();

    const isAdmin = currentUser?.role === 'admin';

    const handleSaveEmployee = useCallback(async (employeeData: Employee) => {
        try {
            const { id, ...dataToSave } = employeeData;
            
            if (id) {
                const originalEmployee = employees.find(e => e.id === id) || {};
                
                let dataWithPreservedStatus = Object.assign({}, originalEmployee, dataToSave);

                const finalData: { [key: string]: any } = {};
                for (const key in dataWithPreservedStatus) {
                    if (key === 'id') continue;
                    
                    const typedKey = key as keyof typeof dataWithPreservedStatus;
                    finalData[key] = dataWithPreservedStatus[typedKey] === undefined ? null : dataWithPreservedStatus[typedKey];
                }
                
                await update(ref(db, `employees/${id}`), finalData);
                toast({ title: 'Sukces', description: 'Dane pracownika zostały zaktualizowane.' });

            } else {
                const finalData: { [key: string]: any } = {};
                 for (const key in dataToSave) {
                    const typedKey = key as keyof typeof dataToSave;
                    finalData[key] = dataToSave[typedKey] === undefined ? null : dataToSave[typedKey];
                }

                const newEmployeeRef = push(ref(db, 'employees'));
                await set(newEmployeeRef, { ...finalData, status: 'aktywny', id: newEmployeeRef.key });
                toast({ title: 'Sukces', description: 'Nowy pracownik został dodany.' });
            }
        } catch (error) {
            console.error("Error saving employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać danych pracownika.' });
        }
    }, [db, toast, employees]);

    const handleTerminateEmployee = useCallback(async (employeeId: string, employeeFullName: string) => {
        try {
            await update(ref(db, `employees/${employeeId}`), {
                status: 'zwolniony',
                terminationDate: format(new Date(), 'yyyy-MM-dd')
            });
            toast({ title: 'Pracownik zwolniony', description: 'Status pracownika został zmieniony na "zwolniony".' });
        } catch (error) {
            console.error("Error terminating employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zwolnić pracownika.' });
        }
    }, [db, toast]);

    const handleRestoreEmployee = useCallback(async (employeeId: string, employeeFullName: string) => {
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
    }, [db, toast]);

    const handleDeleteEmployeePermanently = useCallback(async (employeeId: string) => {
        try {
            await remove(ref(db, `employees/${employeeId}`));
            toast({ title: 'Sukces', description: 'Pracownik został trwale usunięty z bazy danych.' });
        } catch (error) {
            console.error("Error deleting employee permanently: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracownika.' });
        }
    }, [db, toast]);

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
    }, [db, employees, toast]);

    const handleUpdateHireDates = useCallback(async (dateUpdates: { fullName: string; hireDate: string }[]) => {
        const updates: Record<string, any> = {};
        let updatedCount = 0;
        const notFound: string[] = [];

        dateUpdates.forEach(updateData => {
            const employeeToUpdate = employees.find(emp => emp.fullName === updateData.fullName);
            if (employeeToUpdate) {
                updates[`/employees/${employeeToUpdate.id}/hireDate`] = updateData.hireDate;
                updatedCount++;
            } else {
                notFound.push(updateData.fullName);
            }
        });

        if (Object.keys(updates).length > 0) {
            try {
                await update(ref(db), updates);
                toast({
                    title: 'Aktualizacja zakończona',
                    description: `Zaktualizowano daty zatrudnienia dla ${updatedCount} pracowników.`,
                });
            } catch (error) {
                console.error("Error updating hire dates:", error);
                toast({ variant: 'destructive', title: 'Błąd', description: 'Wystąpił błąd podczas aktualizacji dat.' });
                return;
            }
        }
        
        if (notFound.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Nie znaleziono pracowników',
                description: `Nie można było znaleźć ${notFound.length} pracowników: ${notFound.slice(0, 3).join(', ')}...`,
            });
        }
    }, [db, employees, toast]);

    const handleUpdateContractEndDates = useCallback(async (dateUpdates: { fullName: string; contractEndDate: string }[]) => {
        const updates: Record<string, any> = {};
        let updatedCount = 0;
        const notFound: string[] = [];

        dateUpdates.forEach(updateData => {
            const employeeToUpdate = employees.find(emp => emp.fullName === updateData.fullName);
            if (employeeToUpdate) {
                updates[`/employees/${employeeToUpdate.id}/contractEndDate`] = updateData.contractEndDate;
                updatedCount++;
            } else {
                notFound.push(updateData.fullName);
            }
        });

        if (Object.keys(updates).length > 0) {
            try {
                await update(ref(db), updates);
                toast({
                    title: 'Aktualizacja zakończona',
                    description: `Zaktualizowano daty końca umowy dla ${updatedCount} pracowników.`,
                });
            } catch (error) {
                console.error("Error updating contract end dates:", error);
                toast({ variant: 'destructive', title: 'Błąd', description: 'Wystąpił błąd podczas aktualizacji dat.' });
                return;
            }
        }
        
        if (notFound.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Nie znaleziono pracowników',
                description: `Nie można było znaleźć ${notFound.length} pracowników: ${notFound.slice(0, 3).join(', ')}...`,
            });
        }
    }, [db, employees, toast]);


    const handleDeleteAllEmployees = useCallback(async () => {
        try {
            await remove(ref(db, 'employees'));
            toast({ title: 'Sukces', description: 'Wszyscy pracownicy zostali usunięci.' });
        } catch (error) {
            console.error("Error deleting all employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracowników.' });
        }
    }, [db, toast]);

    const handleRestoreAllTerminatedEmployees = useCallback(async () => {
        try {
            const updates: Record<string, any> = {};
            const terminatedEmployees = employees.filter(e => e.status === 'zwolniony');
            if (terminatedEmployees.length === 0) {
                toast({ title: 'Informacja', description: 'Brak zwolnionych pracowników do przywrócenia.' });
                return;
            }

            for (const employee of terminatedEmployees) {
                 updates[`/employees/${employee.id}/status`] = 'aktywny';
                 updates[`/employees/${employee.id}/terminationDate`] = null;
            }
            await update(ref(db), updates);
            toast({ title: 'Sukces', description: `Przywrócono ${terminatedEmployees.length} pracowników.` });
        } catch (error) {
            console.error("Error restoring all terminated employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracowników.' });
        }
    }, [db, employees, toast]);

    const addConfigItems = useCallback(async (configType: ConfigType, items: string[]) => {
        const configRef = ref(db, `config/${configType}`);
        const updates: Record<string, any> = {};
        items.forEach(itemName => {
            const newItemRef = push(configRef);
            updates[newItemRef.key!] = { name: itemName };
        });
         await update(configRef, updates);
    }, [db]);

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
    }, [db, config, employees, toast]);

    const removeConfigItem = useCallback(async (configType: ConfigType, itemId: string) => {
        await remove(ref(db, `config/${configType}/${itemId}`));
        toast({ title: "Sukces", description: "Element został usunięty."});
    }, [db, toast]);
    
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
    }, [db, toast]);

    const handleSaveResendApiKey = useCallback(async (apiKey: string) => {
        try {
            await set(ref(db, 'config/resendApiKey'), apiKey);
            toast({ title: "Sukces", description: "Klucz API Resend został zapisany."});
        } catch (error) {
            console.error("Error saving Resend API key:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać klucza API."});
        }
    }, [db, toast]);

    const handleUpdateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
        try {
            await update(ref(db, `users/${userId}`), { role: newRole });
            toast({ title: 'Sukces', description: 'Rola użytkownika została zaktualizowana.' });
        } catch (error) {
            console.error("Error updating user role: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować roli użytkownika.' });
        }
    }, [db, toast]);

    const addAbsence = useCallback(async (employeeId: string, date: string) => {
        const newAbsenceRef = push(ref(db, 'absences'));
        await set(newAbsenceRef, { employeeId, date });
    }, [db]);

    const deleteAbsence = useCallback(async (absenceId: string) => {
        await remove(ref(db, `absences/${absenceId}`));
    }, [db]);
    
    const addAbsenceRecord = useCallback(async (record: Omit<AbsenceRecord, 'id'>) => {
        try {
            await set(push(ref(db, 'absenceRecords')), record);
            toast({ title: 'Sukces', description: 'Zapis został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving record:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać rekordu.' });
        }
    }, [db, toast]);
    
    const deleteAbsenceRecord = useCallback(async (recordId: string) => {
        try {
            await remove(ref(db, `absenceRecords/${recordId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            console.error('Error deleting record:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [db, toast]);
    
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
    }, [db, toast]);
    
    const addFingerprintAppointment = useCallback(async (appointment: Omit<FingerprintAppointment, 'id'>) => {
        try {
            await set(push(ref(db, 'fingerprintAppointments')), appointment);
            toast({ title: 'Sukces', description: 'Termin został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać terminu.' });
        }
    }, [db, toast]);
    
    const deleteFingerprintAppointment = useCallback(async (appointmentId: string) => {
        try {
            await remove(ref(db, `fingerprintAppointments/${appointmentId}`));
            toast({ title: 'Sukces', description: 'Termin został usunięty.' });
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć terminu.' });
        }
    }, [db, toast]);
    
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
    }, [db, toast]);

    const deleteClothingIssuance = useCallback(async (issuanceId: string) => {
        try {
            await remove(ref(db, `clothingIssuances/${issuanceId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [db, toast]);

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
    }, [db, toast]);
    
    const updateOrder = useCallback(async (order: Order) => {
        try {
            const { id, ...dataToUpdate } = order;
            await update(ref(db, `orders/${id}`), dataToUpdate);
            toast({ title: 'Sukces', description: 'Zamówienie zostało zaktualizowane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować zamówienia.'});
        }
    }, [db, toast]);

    const deleteOrder = useCallback(async (orderId: string) => {
        try {
            await remove(ref(db, `orders/${orderId}`));
            toast({ title: 'Sukces', description: 'Zamówienie zostało usunięte.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zamówienia.'});
        }
    }, [db, toast]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                const userRoleRef = ref(db, `users/${user.uid}/role`);
                const roleSnapshot = await get(userRoleRef);
                const role = roleSnapshot.val() as UserRole;
                setCurrentUser({
                    uid: user.uid,
                    email: user.email,
                    role: role || 'guest', 
                });
            } else {
                setCurrentUser(null);
                setIsLoading(true);
            }
        });

        return () => unsubscribeAuth();
    }, [db, auth]);


    useEffect(() => {
        if (!currentUser) {
            return;
        };

        setIsLoading(true);
        const dataRef = ref(db);
        const unsubscribeDb = onValue(dataRef, (snapshot) => {
            const data = snapshot.val() || {};
            setEmployees(objectToArray(data.employees));
            setUsers(objectToArray(data.users));
            setAbsences(objectToArray(data.absences));
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
            setIsLoading(false);
            setIsHistoryLoading(false);
        }, (error) => {
            console.error("Firebase read failed: ", error);
            setIsLoading(false);
            setIsHistoryLoading(false);
            toast({ variant: 'destructive', title: 'Błąd Bazy Danych', description: 'Nie udało się załadować danych.'});
        });

        return () => unsubscribeDb();
    }, [db, currentUser, toast]);

    const value: AppContextType = {
        employees,
        users,
        absences,
        config,
        notifications,
        statsHistory,
        isLoading,
        isHistoryLoading,
        activeView,
        setActiveView,
        handleSaveEmployee,
        handleTerminateEmployee,
        handleRestoreEmployee,
        handleDeleteEmployeePermanently,
        handleDeleteAllHireDates,
        handleUpdateHireDates,
        handleUpdateContractEndDates,
        handleDeleteAllEmployees,
        handleRestoreAllTerminatedEmployees,
        addConfigItems,
        updateConfigItem,
        removeConfigItem,
        handleSaveJobTitleClothingSet,
        handleSaveResendApiKey,
        handleUpdateUserRole,
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
