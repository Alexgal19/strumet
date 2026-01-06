
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
    serverTimestamp,
    type Firestore,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, type Auth } from 'firebase/auth';
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

const docToObject = (doc: any): any => {
    if (!doc.exists()) return null;
    return { id: doc.id, ...doc.data() };
}

const docsToArray = (snapshot: any): any[] => {
    return snapshot.docs.map(docToObject);
}

interface FirebaseServices {
    firestore: Firestore;
    auth: Auth;
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
    const [services, setServices] = useState<FirebaseServices | null>(null);

    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        // This effect only runs once to initialize Firebase services.
        const { firestore, auth } = getFirebaseServices();
        setServices({ firestore, auth });
    }, []);

    const handleSaveEmployee = useCallback(async (employeeData: Employee) => {
        if (!services) return;
        try {
            const { id, ...dataToSave } = employeeData;
            
            const finalData: { [key: string]: any } = {};
            for (const key in dataToSave) {
                const typedKey = key as keyof typeof dataToSave;
                finalData[key] = dataToSave[typedKey] === undefined ? null : dataToSave[typedKey];
            }

            if (id) {
                await updateDoc(doc(services.firestore, "employees", id), finalData);
                toast({ title: 'Sukces', description: 'Dane pracownika zostały zaktualizowane.' });
            } else {
                const newDocRef = doc(collection(services.firestore, "employees"));
                await setDoc(newDocRef, { ...finalData, status: 'aktywny', id: newDocRef.id });
                toast({ title: 'Sukces', description: 'Nowy pracownik został dodany.' });
            }
        } catch (error) {
            console.error("Error saving employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać danych pracownika.' });
        }
    }, [services, toast]);

    const handleTerminateEmployee = useCallback(async (employeeId: string, employeeFullName: string) => {
        if (!services) return;
        try {
            await updateDoc(doc(services.firestore, `employees/${employeeId}`), {
                status: 'zwolniony',
                terminationDate: format(new Date(), 'yyyy-MM-dd')
            });
            toast({ title: 'Pracownik zwolniony', description: 'Status pracownika został zmieniony na "zwolniony".' });
        } catch (error) {
            console.error("Error terminating employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zwolnić pracownika.' });
        }
    }, [services, toast]);

    const handleRestoreEmployee = useCallback(async (employeeId: string, employeeFullName: string) => {
        if (!services) return;
        try {
            await updateDoc(doc(services.firestore, `employees/${employeeId}`), {
                status: 'aktywny',
                terminationDate: null 
            });
            toast({ title: 'Sukces', description: 'Pracownik został przywrócony.' });
        } catch (error) {
            console.error("Error restoring employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracownika.' });
        }
    }, [services, toast]);

    const handleDeleteEmployeePermanently = useCallback(async (employeeId: string) => {
        if (!services) return;
        try {
            await deleteDoc(doc(services.firestore, `employees/${employeeId}`));
            toast({ title: 'Sukces', description: 'Pracownik został trwale usunięty z bazy danych.' });
        } catch (error) {
            console.error("Error deleting employee permanently: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracownika.' });
        }
    }, [services, toast]);

    const handleDeleteAllHireDates = useCallback(async () => {
        if (!services) return;
        try {
            const batch = writeBatch(services.firestore);
            employees.forEach(employee => {
                batch.update(doc(services.firestore, `employees/${employee.id}`), { hireDate: null });
            });
            await batch.commit();
            toast({ title: 'Sukces', description: 'Wszystkie daty zatrudnienia zostały usunięte.' });
        } catch (error) {
            console.error("Error deleting all hire dates: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć dat zatrudnienia.' });
        }
    }, [services, employees, toast]);

    const handleUpdateHireDates = useCallback(async (dateUpdates: { fullName: string; hireDate: string }[]) => {
        if (!services) return;
        const batch = writeBatch(services.firestore);
        let updatedCount = 0;
        const notFound: string[] = [];

        dateUpdates.forEach(updateData => {
            const employeeToUpdate = employees.find(emp => emp.fullName === updateData.fullName);
            if (employeeToUpdate) {
                batch.update(doc(services.firestore, `employees/${employeeToUpdate.id}`), { hireDate: updateData.hireDate });
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
    }, [services, employees, toast]);
    
    const handleUpdateContractEndDates = useCallback(async (dateUpdates: { fullName: string; contractEndDate: string }[]) => {
        if (!services) return;
        const batch = writeBatch(services.firestore);
        let updatedCount = 0;
        const notFound: string[] = [];

        dateUpdates.forEach(updateData => {
            const employeeToUpdate = employees.find(emp => emp.fullName === updateData.fullName);
            if (employeeToUpdate) {
                batch.update(doc(services.firestore, `employees/${employeeToUpdate.id}`), { contractEndDate: updateData.contractEndDate });
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
    }, [services, employees, toast]);


    const handleDeleteAllEmployees = useCallback(async () => {
        if (!services) return;
        try {
            const batch = writeBatch(services.firestore);
            employees.forEach(employee => {
                batch.delete(doc(services.firestore, `employees/${employee.id}`));
            });
            await batch.commit();
            toast({ title: 'Sukces', description: 'Wszyscy pracownicy zostali usunięci.' });
        } catch (error) {
            console.error("Error deleting all employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracowników.' });
        }
    }, [services, employees, toast]);

    const handleRestoreAllTerminatedEmployees = useCallback(async () => {
        if (!services) return;
        try {
            const batch = writeBatch(services.firestore);
            const terminatedEmployees = employees.filter(e => e.status === 'zwolniony');
            if (terminatedEmployees.length === 0) {
                toast({ title: 'Informacja', description: 'Brak zwolnionych pracowników do przywrócenia.' });
                return;
            }

            for (const employee of terminatedEmployees) {
                 batch.update(doc(services.firestore, `employees/${employee.id}`), { status: 'aktywny', terminationDate: null });
            }
            await batch.commit();
            toast({ title: 'Sukces', description: `Przywrócono ${terminatedEmployees.length} pracowników.` });
        } catch (error) {
            console.error("Error restoring all terminated employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracowników.' });
        }
    }, [services, employees, toast]);
    
    const addConfigItems = useCallback(async (configType: ConfigType, items: string[]) => {
        if (!services) return;
        const batch = writeBatch(services.firestore);
        items.forEach(itemName => {
            const newDocRef = doc(collection(services.firestore, `config/${configType}/items`));
            batch.set(newDocRef, { name: itemName });
        });
        await batch.commit();
    }, [services]);

    const updateConfigItem = useCallback(async (configType: ConfigType, itemId: string, newName: string) => {
        if (!services) return;
        const itemDocRef = doc(services.firestore, `config/${configType}/items/${itemId}`);
        const itemToUpdate = config[configType].find(i => i.id === itemId);
        if (!itemToUpdate) return;
        
        const oldName = itemToUpdate.name;
        
        try {
            const batch = writeBatch(services.firestore);
            batch.update(itemDocRef, { name: newName });
            
            const employeeFieldToUpdate = configType === 'departments' ? 'department' : configType === 'jobTitles' ? 'jobTitle' : configType === 'managers' ? 'manager' : configType === 'nationalities' ? 'nationality' : null;
            
            if (employeeFieldToUpdate) {
                const q = query(collection(services.firestore, "employees"), where(employeeFieldToUpdate, "==", oldName));
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
    }, [services, config, toast]);

    const removeConfigItem = useCallback(async (configType: ConfigType, itemId: string) => {
        if (!services) return;
        await deleteDoc(doc(services.firestore, `config/${configType}/items/${itemId}`));
        toast({ title: "Sukces", description: "Element został usunięty."});
    }, [services, toast]);
    
    const handleSaveJobTitleClothingSet = useCallback(async (jobTitleId: string, description: string) => {
        if (!services) return;
        try {
            await setDoc(doc(services.firestore, `config/jobTitleClothingSets/items/${jobTitleId}`), {
                id: jobTitleId,
                description: description
            });
            toast({ title: "Sukces", description: "Zestaw odzieży dla stanowiska został zaktualizowany."});
        } catch(error) {
            console.error("Error saving job title clothing set:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać zestawu odzieży."});
        }
    }, [services, toast]);

    const handleSaveResendApiKey = useCallback(async (apiKey: string) => {
        if (!services) return;
        try {
            await setDoc(doc(services.firestore, 'config/resendApiKey'), { value: apiKey });
            toast({ title: "Sukces", description: "Klucz API Resend został zapisany."});
        } catch (error) {
            console.error("Error saving Resend API key:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać klucza API."});
        }
    }, [services, toast]);

    const handleUpdateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
        if (!services) return;
        try {
            await updateDoc(doc(services.firestore, `users/${userId}`), { role: newRole });
            toast({ title: 'Sukces', description: 'Rola użytkownika została zaktualizowana.' });
        } catch (error) {
            console.error("Error updating user role: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować roli użytkownika.' });
        }
    }, [services, toast]);

    const addAbsence = useCallback(async (employeeId: string, date: string) => {
        if (!services) return;
        const newDocRef = doc(collection(services.firestore, 'absences'));
        await setDoc(newDocRef, { employeeId, date, id: newDocRef.id });
    }, [services]);

    const deleteAbsence = useCallback(async (absenceId: string) => {
        if (!services) return;
        await deleteDoc(doc(services.firestore, `absences/${absenceId}`));
    }, [services]);
    
    const addAbsenceRecord = useCallback(async (record: Omit<AbsenceRecord, 'id'>) => {
        if (!services) return;
        try {
            const newDocRef = doc(collection(services.firestore, 'absenceRecords'));
            await setDoc(newDocRef, { ...record, id: newDocRef.id });
            toast({ title: 'Sukces', description: 'Zapis został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving record:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać rekordu.' });
        }
    }, [services, toast]);
    
    const deleteAbsenceRecord = useCallback(async (recordId: string) => {
        if (!services) return;
        try {
            await deleteDoc(doc(services.firestore, `absenceRecords/${recordId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            console.error('Error deleting record:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [services, toast]);
    
    const addCirculationCard = useCallback(async (employeeId: string, employeeFullName: string) => {
        if (!services) return null;
        try {
            const newDocRef = doc(collection(services.firestore, 'circulationCards'));
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
    }, [services, toast]);
    
    const addFingerprintAppointment = useCallback(async (appointment: Omit<FingerprintAppointment, 'id'>) => {
        if (!services) return;
        try {
            const newDocRef = doc(collection(services.firestore, 'fingerprintAppointments'));
            await setDoc(newDocRef, { ...appointment, id: newDocRef.id });
            toast({ title: 'Sukces', description: 'Termin został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać terminu.' });
        }
    }, [services, toast]);
    
    const deleteFingerprintAppointment = useCallback(async (appointmentId: string) => {
        if (!services) return;
        try {
            await deleteDoc(doc(services.firestore, `fingerprintAppointments/${appointmentId}`));
            toast({ title: 'Sukces', description: 'Termin został usunięty.' });
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć terminu.' });
        }
    }, [services, toast]);
    
    const addClothingIssuance = useCallback(async (issuance: Omit<ClothingIssuance, 'id'>) => {
        if (!services) return null;
        try {
            const newDocRef = doc(collection(services.firestore, 'clothingIssuances'));
            await setDoc(newDocRef, { ...issuance, id: newDocRef.id });
            toast({ title: 'Sukces', description: 'Zapis o wydaniu odzieży został zapisany.' });
            return { ...issuance, id: newDocRef.id };
        } catch (error) {
            console.error('Error saving clothing issuance:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać danych.' });
            return null;
        }
    }, [services, toast]);

    const deleteClothingIssuance = useCallback(async (issuanceId: string) => {
        if (!services) return;
        try {
            await deleteDoc(doc(services.firestore, `clothingIssuances/${issuanceId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [services, toast]);

    const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt'>) => {
        if (!services) return;
        try {
            const newDocRef = doc(collection(services.firestore, 'orders'));
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
    }, [services, toast]);
    
    const updateOrder = useCallback(async (order: Order) => {
        if (!services) return;
        try {
            const { id, ...dataToUpdate } = order;
            await updateDoc(doc(services.firestore, `orders/${id}`), dataToUpdate);
            toast({ title: 'Sukces', description: 'Zamówienie zostało zaktualizowane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować zamówienia.'});
        }
    }, [services, toast]);

    const deleteOrder = useCallback(async (orderId: string) => {
        if (!services) return;
        try {
            await deleteDoc(doc(services.firestore, `orders/${orderId}`));
            toast({ title: 'Sukces', description: 'Zamówienie zostało usunięte.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zamówienia.'});
        }
    }, [services, toast]);

    useEffect(() => {
        if (!services) return;

        const unsubscribeAuth = onAuthStateChanged(services.auth, async (user: FirebaseUser | null) => {
            if (user) {
                const userDocRef = doc(services.firestore, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                const role = userDocSnap.exists() ? (userDocSnap.data().role as UserRole) : 'guest';
                
                if (!userDocSnap.exists()) {
                    const usersCollRef = collection(services.firestore, 'users');
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
            }
        });

        return () => unsubscribeAuth();
    }, [services]);


    useEffect(() => {
        if (!currentUser || !services) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        
        const { firestore } = services;

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
        
        // This sets the initial loading state to false after the first data fetch attempt.
        const finishLoading = () => setIsLoading(false);

        const allPromises = [
            getDocs(collection(firestore, "employees")),
            getDocs(collection(firestore, "users")),
            getDocs(collection(firestore, "absences")),
            getDocs(collection(firestore, "notifications")),
            getDocs(collection(firestore, "statisticsHistory")),
            getDoc(doc(firestore, "config", "v1")),
        ];

        Promise.all(allPromises).then(finishLoading).catch(error => {
            console.error("Initial data load failed: ", error);
            toast({ variant: 'destructive', title: 'Błąd Bazy Danych', description: 'Nie udało się załadować danych.'});
            finishLoading();
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [services, currentUser, toast]);

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
