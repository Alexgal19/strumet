
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
    collection, 
    onSnapshot, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    writeBatch,
    getDocs,
    query,
    where,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
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
import type { Firestore } from 'firebase/firestore';

const docToObject = (doc: any): any => {
    if (!doc.exists()) return null;
    return { id: doc.id, ...doc.data() };
}

const docsToArray = (snapshot: any): any[] => {
    return snapshot.docs.map(docToObject);
}

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

    const { firestore, auth } = getFirebaseServices();

    const isAdmin = currentUser?.role === 'admin';

    const handleSaveEmployee = useCallback(async (employeeData: Employee) => {
        try {
            const { id, ...dataToSave } = employeeData;
            
            const finalData: { [key: string]: any } = {};
            for (const key in dataToSave) {
                const typedKey = key as keyof typeof dataToSave;
                finalData[key] = dataToSave[typedKey] === undefined ? null : dataToSave[typedKey];
            }

            if (id) {
                await updateDoc(doc(firestore, "employees", id), finalData);
                toast({ title: 'Sukces', description: 'Dane pracownika zostały zaktualizowane.' });
            } else {
                const newDocRef = doc(collection(firestore, "employees"));
                await setDoc(newDocRef, { ...finalData, status: 'aktywny', id: newDocRef.id });
                toast({ title: 'Sukces', description: 'Nowy pracownik został dodany.' });
            }
        } catch (error) {
            console.error("Error saving employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać danych pracownika.' });
        }
    }, [firestore, toast]);

    const handleTerminateEmployee = useCallback(async (employeeId: string, employeeFullName: string) => {
        try {
            await updateDoc(doc(firestore, `employees/${employeeId}`), {
                status: 'zwolniony',
                terminationDate: format(new Date(), 'yyyy-MM-dd')
            });
            toast({ title: 'Pracownik zwolniony', description: 'Status pracownika został zmieniony na "zwolniony".' });
        } catch (error) {
            console.error("Error terminating employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zwolnić pracownika.' });
        }
    }, [firestore, toast]);

    const handleRestoreEmployee = useCallback(async (employeeId: string, employeeFullName: string) => {
        try {
            await updateDoc(doc(firestore, `employees/${employeeId}`), {
                status: 'aktywny',
                terminationDate: null 
            });
            toast({ title: 'Sukces', description: 'Pracownik został przywrócony.' });
        } catch (error) {
            console.error("Error restoring employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracownika.' });
        }
    }, [firestore, toast]);

    const handleDeleteEmployeePermanently = useCallback(async (employeeId: string) => {
        try {
            await deleteDoc(doc(firestore, `employees/${employeeId}`));
            toast({ title: 'Sukces', description: 'Pracownik został trwale usunięty z bazy danych.' });
        } catch (error) {
            console.error("Error deleting employee permanently: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracownika.' });
        }
    }, [firestore, toast]);

    const handleDeleteAllHireDates = useCallback(async () => {
        try {
            const batch = writeBatch(firestore);
            employees.forEach(employee => {
                batch.update(doc(firestore, `employees/${employee.id}`), { hireDate: null });
            });
            await batch.commit();
            toast({ title: 'Sukces', description: 'Wszystkie daty zatrudnienia zostały usunięte.' });
        } catch (error) {
            console.error("Error deleting all hire dates: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć dat zatrudnienia.' });
        }
    }, [firestore, employees, toast]);

    const handleUpdateHireDates = useCallback(async (dateUpdates: { fullName: string; hireDate: string }[]) => {
        const batch = writeBatch(firestore);
        let updatedCount = 0;
        const notFound: string[] = [];

        dateUpdates.forEach(updateData => {
            const employeeToUpdate = employees.find(emp => emp.fullName === updateData.fullName);
            if (employeeToUpdate) {
                batch.update(doc(firestore, `employees/${employeeToUpdate.id}`), { hireDate: updateData.hireDate });
                updatedCount++;
            } else {
                notFound.push(updateData.fullName);
            }
        });

        if (updatedCount > 0) {
            try {
                await batch.commit();
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
    }, [firestore, employees, toast]);
    
    const handleUpdateContractEndDates = useCallback(async (dateUpdates: { fullName: string; contractEndDate: string }[]) => {
        const batch = writeBatch(firestore);
        let updatedCount = 0;
        const notFound: string[] = [];

        dateUpdates.forEach(updateData => {
            const employeeToUpdate = employees.find(emp => emp.fullName === updateData.fullName);
            if (employeeToUpdate) {
                batch.update(doc(firestore, `employees/${employeeToUpdate.id}`), { contractEndDate: updateData.contractEndDate });
                updatedCount++;
            } else {
                notFound.push(updateData.fullName);
            }
        });

        if (updatedCount > 0) {
            try {
                await batch.commit();
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
    }, [firestore, employees, toast]);


    const handleDeleteAllEmployees = useCallback(async () => {
        try {
            const batch = writeBatch(firestore);
            employees.forEach(employee => {
                batch.delete(doc(firestore, `employees/${employee.id}`));
            });
            await batch.commit();
            toast({ title: 'Sukces', description: 'Wszyscy pracownicy zostali usunięci.' });
        } catch (error) {
            console.error("Error deleting all employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracowników.' });
        }
    }, [firestore, employees, toast]);

    const handleRestoreAllTerminatedEmployees = useCallback(async () => {
        try {
            const batch = writeBatch(firestore);
            const terminatedEmployees = employees.filter(e => e.status === 'zwolniony');
            if (terminatedEmployees.length === 0) {
                toast({ title: 'Informacja', description: 'Brak zwolnionych pracowników do przywrócenia.' });
                return;
            }

            for (const employee of terminatedEmployees) {
                 batch.update(doc(firestore, `employees/${employee.id}`), { status: 'aktywny', terminationDate: null });
            }
            await batch.commit();
            toast({ title: 'Sukces', description: `Przywrócono ${terminatedEmployees.length} pracowników.` });
        } catch (error) {
            console.error("Error restoring all terminated employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracowników.' });
        }
    }, [firestore, employees, toast]);
    
    const addConfigItems = useCallback(async (configType: ConfigType, items: string[]) => {
        const batch = writeBatch(firestore);
        items.forEach(itemName => {
            const newDocRef = doc(collection(firestore, `config/${configType}/items`));
            batch.set(newDocRef, { name: itemName });
        });
        await batch.commit();
    }, [firestore]);

    const updateConfigItem = useCallback(async (configType: ConfigType, itemId: string, newName: string) => {
        const itemDocRef = doc(firestore, `config/${configType}/items/${itemId}`);
        const itemToUpdate = config[configType].find(i => i.id === itemId);
        if (!itemToUpdate) return;
        
        const oldName = itemToUpdate.name;
        
        try {
            const batch = writeBatch(firestore);
            batch.update(itemDocRef, { name: newName });
            
            const employeeFieldToUpdate = configType === 'departments' ? 'department' : configType === 'jobTitles' ? 'jobTitle' : configType === 'managers' ? 'manager' : configType === 'nationalities' ? 'nationality' : null;
            
            if (employeeFieldToUpdate) {
                const q = query(collection(firestore, "employees"), where(employeeFieldToUpdate, "==", oldName));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((employeeDoc) => {
                    batch.update(employeeDoc.ref, { [employeeFieldToUpdate]: newName });
                });
            }
            
            await batch.commit();
            toast({ title: "Sukces", description: "Element został zaktualizowany."});
        } catch (error) {
            console.error("Error updating item:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zaktualizować elementu."});
        }
    }, [firestore, config, toast]);

    const removeConfigItem = useCallback(async (configType: ConfigType, itemId: string) => {
        await deleteDoc(doc(firestore, `config/${configType}/items/${itemId}`));
        toast({ title: "Sukces", description: "Element został usunięty."});
    }, [firestore, toast]);
    
    const handleSaveJobTitleClothingSet = useCallback(async (jobTitleId: string, description: string) => {
        try {
            await setDoc(doc(firestore, `config/jobTitleClothingSets/items/${jobTitleId}`), {
                id: jobTitleId,
                description: description
            });
            toast({ title: "Sukces", description: "Zestaw odzieży dla stanowiska został zaktualizowany."});
        } catch(error) {
            console.error("Error saving job title clothing set:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać zestawu odzieży."});
        }
    }, [firestore, toast]);

    const handleSaveResendApiKey = useCallback(async (apiKey: string) => {
        try {
            await setDoc(doc(firestore, 'config/resendApiKey'), { value: apiKey });
            toast({ title: "Sukces", description: "Klucz API Resend został zapisany."});
        } catch (error) {
            console.error("Error saving Resend API key:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać klucza API."});
        }
    }, [firestore, toast]);

    const handleUpdateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
        try {
            await updateDoc(doc(firestore, `users/${userId}`), { role: newRole });
            toast({ title: 'Sukces', description: 'Rola użytkownika została zaktualizowana.' });
        } catch (error) {
            console.error("Error updating user role: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować roli użytkownika.' });
        }
    }, [firestore, toast]);

    const addAbsence = useCallback(async (employeeId: string, date: string) => {
        const newDocRef = doc(collection(firestore, 'absences'));
        await setDoc(newDocRef, { employeeId, date, id: newDocRef.id });
    }, [firestore]);

    const deleteAbsence = useCallback(async (absenceId: string) => {
        await deleteDoc(doc(firestore, `absences/${absenceId}`));
    }, [firestore]);
    
    const addAbsenceRecord = useCallback(async (record: Omit<AbsenceRecord, 'id'>) => {
        try {
            const newDocRef = doc(collection(firestore, 'absenceRecords'));
            await setDoc(newDocRef, { ...record, id: newDocRef.id });
            toast({ title: 'Sukces', description: 'Zapis został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving record:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać rekordu.' });
        }
    }, [firestore, toast]);
    
    const deleteAbsenceRecord = useCallback(async (recordId: string) => {
        try {
            await deleteDoc(doc(firestore, `absenceRecords/${recordId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            console.error('Error deleting record:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [firestore, toast]);
    
    const addCirculationCard = useCallback(async (employeeId: string, employeeFullName: string) => {
        try {
            const newDocRef = doc(collection(firestore, 'circulationCards'));
            const newCard: Omit<CirculationCard, 'id'> = {
                employeeId, employeeFullName, date: new Date().toISOString(),
            };
            await setDoc(newDocRef, { ...newCard, id: newDocRef.id });
            return { ...newCard, id: newDocRef.id };
        } catch (error) {
            console.error('Error saving circulation card:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać karty.' });
            return null;
        }
    }, [firestore, toast]);
    
    const addFingerprintAppointment = useCallback(async (appointment: Omit<FingerprintAppointment, 'id'>) => {
        try {
            const newDocRef = doc(collection(firestore, 'fingerprintAppointments'));
            await setDoc(newDocRef, { ...appointment, id: newDocRef.id });
            toast({ title: 'Sukces', description: 'Termin został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać terminu.' });
        }
    }, [firestore, toast]);
    
    const deleteFingerprintAppointment = useCallback(async (appointmentId: string) => {
        try {
            await deleteDoc(doc(firestore, `fingerprintAppointments/${appointmentId}`));
            toast({ title: 'Sukces', description: 'Termin został usunięty.' });
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć terminu.' });
        }
    }, [firestore, toast]);
    
    const addClothingIssuance = useCallback(async (issuance: Omit<ClothingIssuance, 'id'>) => {
        try {
            const newDocRef = doc(collection(firestore, 'clothingIssuances'));
            await setDoc(newDocRef, { ...issuance, id: newDocRef.id });
            toast({ title: 'Sukces', description: 'Zapis o wydaniu odzieży został zapisany.' });
            return { ...issuance, id: newDocRef.id };
        } catch (error) {
            console.error('Error saving clothing issuance:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać danych.' });
            return null;
        }
    }, [firestore, toast]);

    const deleteClothingIssuance = useCallback(async (issuanceId: string) => {
        try {
            await deleteDoc(doc(firestore, `clothingIssuances/${issuanceId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [firestore, toast]);

    const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt'>) => {
        try {
            const newDocRef = doc(collection(firestore, 'orders'));
            const dataToSet: Omit<Order, 'id'> = {
                ...order,
                createdAt: new Date().toISOString(),
                realizedQuantity: order.realizedQuantity || 0
            };
            await setDoc(newDocRef, { ...dataToSet, id: newDocRef.id });
            toast({ title: 'Sukces', description: 'Nowe zamówienie zostało dodane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać zamówienia.'});
        }
    }, [firestore, toast]);
    
    const updateOrder = useCallback(async (order: Order) => {
        try {
            const { id, ...dataToUpdate } = order;
            await updateDoc(doc(firestore, `orders/${id}`), dataToUpdate);
            toast({ title: 'Sukces', description: 'Zamówienie zostało zaktualizowane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować zamówienia.'});
        }
    }, [firestore, toast]);

    const deleteOrder = useCallback(async (orderId: string) => {
        try {
            await deleteDoc(doc(firestore, `orders/${orderId}`));
            toast({ title: 'Sukces', description: 'Zamówienie zostało usunięte.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zamówienia.'});
        }
    }, [firestore, toast]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                const role = userDocSnap.exists() ? (userDocSnap.data().role as UserRole) : 'guest';
                
                if (!userDocSnap.exists()) {
                    const usersCollRef = collection(firestore, 'users');
                    const allUsersSnap = await getDocs(usersCollRef);
                    const isFirstUser = allUsersSnap.empty;
                    const newRole = isFirstUser ? 'admin' : 'guest';
                    await setDoc(userDocRef, { email: user.email, role: newRole });
                     setCurrentUser({ uid: user.uid, email: user.email, role: newRole });
                } else {
                     setCurrentUser({ uid: user.uid, email: user.email, role });
                }

            } else {
                setCurrentUser(null);
                setIsLoading(true);
            }
        });

        return () => unsubscribeAuth();
    }, [firestore, auth]);


    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        
        const unsubscribes = [
            onSnapshot(collection(firestore, "employees"), snapshot => setEmployees(docsToArray(snapshot))),
            onSnapshot(collection(firestore, "users"), snapshot => setUsers(docsToArray(snapshot))),
            onSnapshot(collection(firestore, "absences"), snapshot => setAbsences(docsToArray(snapshot))),
            onSnapshot(collection(firestore, "notifications"), snapshot => setNotifications(docsToArray(snapshot))),
            onSnapshot(collection(firestore, "statisticsHistory"), snapshot => {
                setStatsHistory(docsToArray(snapshot).sort((a:any, b:any) => new Date(b.id).getTime() - new Date(a.id).getTime()));
                setIsHistoryLoading(false);
            }),
        ];

        const configTypes: ConfigType[] = ['departments', 'jobTitles', 'managers', 'nationalities', 'clothingItems'];
        
        const unsubConfig = onSnapshot(doc(firestore, "config", "v1"), async (docSnap) => {
            const newConfig: AllConfig = { departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [], jobTitleClothingSets: [], resendApiKey: '' };
            if (docSnap.exists()) {
                 const configData = docSnap.data();
                 for (const type of configTypes) {
                    const itemsSnapshot = await getDocs(collection(firestore, `config/v1/${type}`));
                    newConfig[type] = docsToArray(itemsSnapshot);
                 }
                 const clothingSetsSnapshot = await getDocs(collection(firestore, `config/v1/jobTitleClothingSets`));
                 newConfig.jobTitleClothingSets = docsToArray(clothingSetsSnapshot);
                 newConfig.resendApiKey = configData.resendApiKey || '';
            }
            setConfig(newConfig);
        });
        unsubscribes.push(unsubConfig);
        
        Promise.all([
            getDocs(collection(firestore, "employees")),
            getDocs(collection(firestore, "users")),
            getDocs(collection(firestore, "absences")),
            getDocs(collection(firestore, "notifications")),
            getDocs(collection(firestore, "statisticsHistory")),
            getDoc(doc(firestore, "config", "v1")),
        ]).then(() => setIsLoading(false))
        .catch(error => {
            console.error("Initial data load failed: ", error);
            setIsLoading(false);
            toast({ variant: 'destructive', title: 'Błąd Bazy Danych', description: 'Nie udało się załadować danych.'});
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [firestore, currentUser, toast]);

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
