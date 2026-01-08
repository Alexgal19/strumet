

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    ref,
    onValue,
    set,
    update,
    remove,
    push,
    get,
    query,
    orderByChild,
    startAt,
    endAt,
    limitToFirst,
    equalTo,
    orderByKey,
    type Database,
} from 'firebase/database';
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
    ConfigType,
    Order,
    JobTitleClothingSet,
    StatsSnapshot,
    AuthUser,
    User,
    UserRole,
} from '@/lib/types';


const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

interface FirebaseServices {
    db: Database;
    auth: Auth;
}

interface FetchEmployeesParams {
    status: 'aktywny' | 'zwolniony';
    limit: number;
    startAfter?: string | null;
    startAfterId?: string | null; // Add this
    searchTerm?: string;
    departments?: string[];
    jobTitles?: string[];
    managers?: string[];
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
    isFetchingNextPage: boolean;
    hasMore: boolean;
    fetchEmployees: (params: FetchEmployeesParams) => Promise<void>;
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

    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
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
        const { auth, db } = getFirebaseServices();
        setServices({ auth, db });

        const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                const userRoleRef = ref(db, `users/${user.uid}/role`);
                const snapshot = await get(userRoleRef);
                const role = snapshot.val() as UserRole || 'guest';
                setCurrentUser({ uid: user.uid, email: user.email, role });
            } else {
                setCurrentUser(null);
                setIsLoading(false); // Set loading to false if no user
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const fetchEmployees = useCallback(async (params: FetchEmployeesParams) => {
        if (!services) return;
        const { db } = services;

        // Since we are fetching all employees now, we don't need pagination logic here.
        // This function will now just filter the allEmployees list.
        const filtered = allEmployees.filter(emp => {
            let matches = emp.status === params.status;
            if (params.searchTerm) {
                 const lowerCaseSearch = params.searchTerm.toLowerCase();
                 matches = matches && (emp.fullName.toLowerCase().includes(lowerCaseSearch) || (emp.cardNumber && emp.cardNumber.includes(lowerCaseSearch)));
            }
            if (params.departments && params.departments.length > 0) {
                 matches = matches && params.departments.includes(emp.department);
            }
             if (params.jobTitles && params.jobTitles.length > 0) {
                 matches = matches && params.jobTitles.includes(emp.jobTitle);
            }
             if (params.managers && params.managers.length > 0) {
                 matches = matches && params.managers.includes(emp.manager);
            }
            return matches;
        });
        
        // Client-side sorting
        if (params.status === 'aktywny') {
            filtered.sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime());
        } else {
            filtered.sort((a, b) => new Date(b.terminationDate || 0).getTime() - new Date(a.terminationDate || 0).getTime());
        }

        setEmployees(filtered);
        setHasMore(false); // We have all the data client-side
        setIsFetchingNextPage(false);

    }, [services, allEmployees]);

    const runMigration = useCallback(async (db: Database) => {
        console.log("Checking for necessary data migrations...");
        try {
            const allEmployeesSnapshot = await get(ref(db, 'employees'));
            if (!allEmployeesSnapshot.exists()) {
                console.log("No employees found, no migration necessary.");
                return;
            }

            const updates: Record<string, any> = {};
            let count = 0;

            allEmployeesSnapshot.forEach(childSnapshot => {
                const employee = childSnapshot.val();
                if (employee && !employee.status_fullName) {
                    updates[`/employees/${childSnapshot.key}/status_fullName`] = `${employee.status}_${employee.fullName.toLowerCase()}`;
                    count++;
                }
            });

            if (count > 0) {
                console.log(`Migration needed for ${count} employees. Updating...`);
                toast({ title: 'Migracja danych', description: 'Aktualizujemy strukturę danych w tle. Aplikacja może działać wolniej przez chwilę.' });
                await update(ref(db), updates);
                console.log(`Migration complete. Updated ${count} employees.`);
                toast({ title: 'Migracja zakończona', description: `Zaktualizowano ${count} pracowników.` });
            } else {
                console.log("No employees needed migration.");
            }
        } catch (error) {
            console.error("Error during migration check:", error);
            // Don't toast here as it might be an index issue on a large dataset during initial load
        }
    }, [toast]);


    useEffect(() => {
        if (!services || !currentUser) {
            setAllEmployees([]);
            setEmployees([]);
            setUsers([]);
            setConfig({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [], jobTitleClothingSets: [], resendApiKey: '' });
            setAbsences([]);
            setNotifications([]);
            setStatsHistory([]);
            setIsLoading(!currentUser);
            return;
        }

        const { db } = services;
        runMigration(db);
        
        const dataRefs = [
            { path: "users", setter: (data: any) => setUsers(objectToArray(data)) },
            { path: "absences", setter: (data: any) => setAbsences(objectToArray(data)) },
            { path: "notifications", setter: (data: any) => setNotifications(objectToArray(data)) },
            { path: "config", setter: (data: any) => {
                const configData = data || {};
                const newConfig: AllConfig = {
                    departments: objectToArray(configData.departments),
                    jobTitles: objectToArray(configData.jobTitles),
                    managers: objectToArray(configData.managers),
                    nationalities: objectToArray(configData.nationalities),
                    clothingItems: objectToArray(configData.clothingItems),
                    jobTitleClothingSets: objectToArray(configData.jobTitleClothingSets),
                    resendApiKey: configData.resendApiKey || '',
                };
                setConfig(newConfig);
            }},
        ];
        
        // Fetch all employees once
        const employeesRef = ref(db, 'employees');
        const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
            setAllEmployees(objectToArray(snapshot.val()));
             // Initial load for default view
            const activeEmps = objectToArray(snapshot.val()).filter((e: Employee) => e.status === 'aktywny');
            activeEmps.sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime());
            setEmployees(activeEmps);
            setHasMore(false);
            
            if (isLoading) setIsLoading(false);
        }, (error) => {
            console.error("Firebase read error on employees:", error);
            toast({ variant: 'destructive', title: 'Błąd odczytu danych', description: `Nie udało się pobrać pracowników.` });
             if (isLoading) setIsLoading(false);
        });

        const unsubscribes = dataRefs.map(({ path, setter }) => 
            onValue(ref(db, path), snapshot => {
                setter(snapshot.val());
            }, (error) => {
                console.error(`Firebase read error on path ${path}:`, error);
                toast({ variant: 'destructive', title: 'Błąd odczytu danych', description: `Nie udało się pobrać danych dla: ${path}` });
            })
        );
        
        const historyRef = ref(db, "statisticsHistory");
        unsubscribes.push(onValue(historyRef, snapshot => {
            setStatsHistory(objectToArray(snapshot.val()).sort((a:any, b:any) => new Date(b.id).getTime() - new Date(a.id).getTime()));
            setIsHistoryLoading(false);
        }));

        return () => {
            unsubscribes.forEach(unsub => unsub());
            unsubscribeEmployees();
        }
    }, [services, currentUser, toast, runMigration, isLoading]);


    const handleSaveEmployee = useCallback(async (employeeData: Employee) => {
        if (!services) return;
        const { db } = services;
        try {
            const { id, ...dataToSave } = employeeData;
            
            const status = dataToSave.status || 'aktywny';
            const status_fullName = `${status}_${dataToSave.fullName.toLowerCase()}`;

            const finalData: { [key: string]: any } = { ...dataToSave, status_fullName };

            for (const key in finalData) {
                if (finalData[key] === undefined) {
                  finalData[key] = null;
                }
            }

            if (id) {
                await set(ref(db, `employees/${id}`), finalData);
                toast({ title: 'Sukces', description: 'Dane pracownika zostały zaktualizowane.' });
            } else {
                const newEmployeeRef = push(ref(db, 'employees'));
                await set(newEmployeeRef, { ...finalData, status: 'aktywny', status_fullName: `aktywny_${finalData.fullName.toLowerCase()}` });
                toast({ title: 'Sukces', description: 'Nowy pracownik został dodany.' });
            }
        } catch (error) {
            console.error("Error saving employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać danych pracownika.' });
        }
    }, [services, toast]);

    const handleTerminateEmployee = useCallback(async (employeeId: string, employeeFullName: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await update(ref(db, `employees/${employeeId}`), {
                status: 'zwolniony',
                terminationDate: format(new Date(), 'yyyy-MM-dd'),
                status_fullName: `zwolniony_${employeeFullName.toLowerCase()}`
            });
            toast({ title: 'Pracownik zwolniony', description: 'Status pracownika został zmieniony na "zwolniony".' });
        } catch (error) {
            console.error("Error terminating employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zwolnić pracownika.' });
        }
    }, [services, toast]);

    const handleRestoreEmployee = useCallback(async (employeeId: string, employeeFullName: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await update(ref(db, `employees/${employeeId}`), {
                status: 'aktywny',
                terminationDate: null,
                status_fullName: `aktywny_${employeeFullName.toLowerCase()}`
            });
            toast({ title: 'Sukces', description: 'Pracownik został przywrócony.' });
        } catch (error) {
            console.error("Error restoring employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracownika.' });
        }
    }, [services, toast]);

    const handleDeleteEmployeePermanently = useCallback(async (employeeId: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await remove(ref(db, `employees/${employeeId}`));
            toast({ title: 'Sukces', description: 'Pracownik został trwale usunięty z bazy danych.' });
        } catch (error) {
            console.error("Error deleting employee permanently: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracownika.' });
        }
    }, [services, toast]);

    const handleDeleteAllHireDates = useCallback(async () => {
        if (!services) return;
        const { db } = services;
        try {
            const updates: Record<string, any> = {};
            const allEmployeesSnapshot = await get(ref(db, 'employees'));
            const allEmployees = objectToArray(allEmployeesSnapshot.val());

            allEmployees.forEach(employee => {
                updates[`/employees/${employee.id}/hireDate`] = null;
            });
            await update(ref(db), updates);
            toast({ title: 'Sukces', description: 'Wszystkie daty zatrudnienia zostały usunięte.' });
        } catch (error) {
            console.error("Error deleting all hire dates: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć dat zatrudnienia.' });
        }
    }, [services, toast]);

    const handleUpdateHireDates = useCallback(async (dateUpdates: { fullName: string; hireDate: string }[]) => {
        if (!services) return;
        const { db } = services;
        const updates: Record<string, any> = {};
        let updatedCount = 0;
        const notFound: string[] = [];

        const allEmployeesSnapshot = await get(ref(db, 'employees'));
        const allEmployees = objectToArray(allEmployeesSnapshot.val());

        dateUpdates.forEach(updateData => {
            const employeeToUpdate = allEmployees.find(emp => emp.fullName === updateData.fullName);
            if (employeeToUpdate) {
                updates[`/employees/${employeeToUpdate.id}/hireDate`] = updateData.hireDate;
                updatedCount++;
            } else {
                notFound.push(updateData.fullName);
            }
        });

        if (updatedCount > 0) {
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
    }, [services, toast]);

    const handleUpdateContractEndDates = useCallback(async (dateUpdates: { fullName: string; contractEndDate: string }[]) => {
        if (!services) return;
        const { db } = services;
        const updates: Record<string, any> = {};
        let updatedCount = 0;
        const notFound: string[] = [];
        
        const allEmployeesSnapshot = await get(ref(db, 'employees'));
        const allEmployees = objectToArray(allEmployeesSnapshot.val());

        dateUpdates.forEach(updateData => {
            const employeeToUpdate = allEmployees.find(emp => emp.fullName === updateData.fullName);
            if (employeeToUpdate) {
                updates[`/employees/${employeeToUpdate.id}/contractEndDate`] = updateData.contractEndDate;
                updatedCount++;
            } else {
                notFound.push(updateData.fullName);
            }
        });

        if (updatedCount > 0) {
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
    }, [services, toast]);

    const handleDeleteAllEmployees = useCallback(async () => {
        if (!services) return;
        const { db } = services;
        try {
            await set(ref(db, 'employees'), null);
            toast({ title: 'Sukces', description: 'Wszyscy pracownicy zostali usunięci.' });
        } catch (error) {
            console.error("Error deleting all employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracowników.' });
        }
    }, [services, toast]);

    const handleRestoreAllTerminatedEmployees = useCallback(async () => {
        if (!services) return;
        const { db } = services;
        try {
            const updates: Record<string, any> = {};
            
            const allEmployeesSnapshot = await get(ref(db, 'employees'));
            const allEmployees = objectToArray(allEmployeesSnapshot.val());
            const terminatedEmployees = allEmployees.filter(e => e.status === 'zwolniony');

            if (terminatedEmployees.length === 0) {
                toast({ title: 'Informacja', description: 'Brak zwolnionych pracowników do przywrócenia.' });
                return;
            }

            for (const employee of terminatedEmployees) {
                 updates[`/employees/${employee.id}/status`] = 'aktywny';
                 updates[`/employees/${employee.id}/terminationDate`] = null;
                 updates[`/employees/${employee.id}/status_fullName`] = `aktywny_${employee.fullName.toLowerCase()}`;
            }
            await update(ref(db), updates);
            toast({ title: 'Sukces', description: `Przywrócono ${terminatedEmployees.length} pracowników.` });
        } catch (error) {
            console.error("Error restoring all terminated employees: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracowników.' });
        }
    }, [services, toast]);

    const addConfigItems = useCallback(async (configType: ConfigType, items: string[]) => {
        if (!services) return;
        const { db } = services;
        const updates: Record<string, any> = {};
        items.forEach(itemName => {
            const newKey = push(ref(db, `config/${configType}`)).key;
            updates[`/config/${configType}/${newKey}`] = { name: itemName };
        });
        await update(ref(db), updates);
    }, [services]);

    const updateConfigItem = useCallback(async (configType: ConfigType, itemId: string, newName: string) => {
        if (!services) return;
        const { db } = services;
        const itemToUpdate = config[configType].find(i => i.id === itemId);
        if (!itemToUpdate) return;

        const oldName = itemToUpdate.name;

        try {
            const updates: Record<string, any> = {};
            updates[`/config/${configType}/${itemId}/name`] = newName;

            const employeeFieldToUpdate = configType === 'departments' ? 'department' : configType === 'jobTitles' ? 'jobTitle' : configType === 'managers' ? 'manager' : configType === 'nationalities' ? 'nationality' : null;

            if (employeeFieldToUpdate) {
                const allEmployeesSnapshot = await get(ref(db, 'employees'));
                const allEmployees = objectToArray(allEmployeesSnapshot.val());
                allEmployees.forEach(emp => {
                    if (emp[employeeFieldToUpdate] === oldName) {
                        updates[`/employees/${emp.id}/${employeeFieldToUpdate}`] = newName;
                    }
                });
            }

            await update(ref(db), updates);
            toast({ title: "Sukces", description: "Element został zaktualizowany."});
        } catch (error) {
            console.error("Error updating item:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zaktualizować elementu."});
        }
    }, [services, config, toast]);

    const removeConfigItem = useCallback(async (configType: ConfigType, itemId: string) => {
        if (!services) return;
        const { db } = services;
        await remove(ref(db, `/config/${configType}/${itemId}`));
        toast({ title: "Sukces", description: "Element został usunięty."});
    }, [services, toast]);

    const handleSaveJobTitleClothingSet = useCallback(async (jobTitleId: string, description: string) => {
        if (!services) return;
        const { db } = services;
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
    }, [services, toast]);

    const handleSaveResendApiKey = useCallback(async (apiKey: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await set(ref(db, 'config/resendApiKey'), apiKey);
            toast({ title: "Sukces", description: "Klucz API Resend został zapisany."});
        } catch (error) {
            console.error("Error saving Resend API key:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać klucza API."});
        }
    }, [services, toast]);

    const handleUpdateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
        if (!services) return;
        const { db } = services;
        try {
            await update(ref(db, `users/${userId}`), { role: newRole });
            toast({ title: 'Sukces', description: 'Rola użytkownika została zaktualizowana.' });
        } catch (error) {
            console.error("Error updating user role: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować roli użytkownika.' });
        }
    }, [services, toast]);

    const addAbsence = useCallback(async (employeeId: string, date: string) => {
        if (!services) return;
        const { db } = services;
        const newRef = push(ref(db, 'absences'));
        await set(newRef, { employeeId, date });
    }, [services]);

    const deleteAbsence = useCallback(async (absenceId: string) => {
        if (!services) return;
        const { db } = services;
        await remove(ref(db, `absences/${absenceId}`));
    }, [services]);

    const addAbsenceRecord = useCallback(async (record: Omit<AbsenceRecord, 'id'>) => {
        if (!services) return;
        const { db } = services;
        try {
            const newRef = push(ref(db, 'absenceRecords'));
            await set(newRef, record);
            toast({ title: 'Sukces', description: 'Zapis został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving record:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać rekordu.' });
        }
    }, [services, toast]);

    const deleteAbsenceRecord = useCallback(async (recordId: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await remove(ref(db, `absenceRecords/${recordId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            console.error('Error deleting record:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [services, toast]);

    const addCirculationCard = useCallback(async (employeeId: string, employeeFullName: string) => {
        if (!services) return null;
        const { db } = services;
        try {
            const newRef = push(ref(db, 'circulationCards'));
            const newCard: CirculationCard = {
                id: newRef.key!,
                employeeId, employeeFullName, date: new Date().toISOString(),
            };
            await set(newRef, newCard);
            return newCard;
        } catch (error) {
            console.error('Error saving circulation card:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać karty.' });
            return null;
        }
    }, [services, toast]);

    const addFingerprintAppointment = useCallback(async (appointment: Omit<FingerprintAppointment, 'id'>) => {
        if (!services) return;
        const { db } = services;
        try {
            const newRef = push(ref(db, 'fingerprintAppointments'));
            await set(newRef, appointment);
            toast({ title: 'Sukces', description: 'Termin został pomyślnie dodany.' });
        } catch (error) {
            console.error('Error saving appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać terminu.' });
        }
    }, [services, toast]);

    const deleteFingerprintAppointment = useCallback(async (appointmentId: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await remove(ref(db, `fingerprintAppointments/${appointmentId}`));
            toast({ title: 'Sukces', description: 'Termin został usunięty.' });
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć terminu.' });
        }
    }, [services, toast]);

    const addClothingIssuance = useCallback(async (issuance: Omit<ClothingIssuance, 'id'>) => {
        if (!services) return null;
        const { db } = services;
        try {
            const newRef = push(ref(db, 'clothingIssuances'));
            const newIssuance = { ...issuance, id: newRef.key! };
            await set(newRef, newIssuance);
            toast({ title: 'Sukces', description: 'Zapis o wydaniu odzieży został zapisany.' });
            return newIssuance;
        } catch (error) {
            console.error('Error saving clothing issuance:', error);
            toast({ variant: 'destructive', title: 'Błąd serwera', description: 'Nie udało się zapisać danych.' });
            return null;
        }
    }, [services, toast]);

    const deleteClothingIssuance = useCallback(async (issuanceId: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await remove(ref(db, `clothingIssuances/${issuanceId}`));
            toast({ title: 'Sukces', description: 'Zapis został usunięty.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zapisu.' });
        }
    }, [services, toast]);

    const addOrder = useCallback(async (order: Omit<Order, 'id' | 'createdAt'>) => {
        if (!services) return;
        const { db } = services;
        try {
            const newRef = push(ref(db, 'orders'));
            await set(newRef, {
                ...order,
                createdAt: new Date().toISOString(),
                realizedQuantity: order.realizedQuantity || 0
            });
            toast({ title: 'Sukces', description: 'Nowe zamówienie zostało dodane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać zamówienia.'});
        }
    }, [services, toast]);

    const updateOrder = useCallback(async (order: Order) => {
        if (!services) return;
        const { db } = services;
        try {
            const { id, ...dataToUpdate } = order;
            await update(ref(db, `orders/${id}`), dataToUpdate);
            toast({ title: 'Sukces', description: 'Zamówienie zostało zaktualizowane.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować zamówienia.'});
        }
    }, [services, toast]);

    const deleteOrder = useCallback(async (orderId: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await remove(ref(db, `orders/${orderId}`));
            toast({ title: 'Sukces', description: 'Zamówienie zostało usunięte.'});
        } catch(e) {
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć zamówienia.'});
        }
    }, [services, toast]);

    const value: AppContextType = {
        employees,
        users,
        absences,
        config,
        notifications,
        statsHistory,
        isLoading,
        isHistoryLoading,
        isFetchingNextPage,
        hasMore,
        fetchEmployees,
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
