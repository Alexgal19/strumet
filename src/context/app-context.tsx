'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
    EmailTemplate,
    EmailLog,
} from '@/lib/types';


const STORAGE_KEYS = {
  employees: 'strumet_employees',
  config: 'strumet_config',
  users: 'strumet_users',
  absences: 'strumet_absences',
  notifications: 'strumet_notifications',
  statsHistory: 'strumet_statsHistory',
  absenceRecords: 'strumet_absenceRecords',
  circulationCards: 'strumet_circulationCards',
  clothingIssuances: 'strumet_clothingIssuances',
  fingerprintAppointments: 'strumet_fingerprintAppointments',
  emailTemplates: 'strumet_emailTemplates',
  emailLogs: 'strumet_emailLogs',
};

const loadFromStorage = (key: string): any | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    if (item) return JSON.parse(item);
  } catch {
    // ignore parse errors
  }
  return null;
};

const saveToStorage = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage errors (e.g. quota exceeded)
  }
};

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }
  return matrix[b.length][a.length];
}

function findBestFuzzyMatch(
  employees: any[],
  inputName: string,
  maxDistance = 2
): any | undefined {
  let bestMatch: any | undefined;
  let bestDistance = Infinity;
  const normalizedInput = normalizeName(inputName);

  for (const emp of employees) {
    const normalizedEmp = normalizeName(emp.fullName || '');
    if (Math.abs(normalizedEmp.length - normalizedInput.length) > maxDistance) continue;
    const dist = levenshteinDistance(normalizedEmp, normalizedInput);
    if (dist <= maxDistance && dist < bestDistance) {
      bestDistance = dist;
      bestMatch = emp;
    }
  }
  return bestMatch;
}

const dedupeByName = <T extends { name: string }>(arr: T[]): T[] => {
  const seen = new Set<string>();
  return arr.filter(item => {
    if (seen.has(item.name)) {
      console.warn(`[config] Duplicate entry dropped: "${item.name}" (id: ${(item as any).id})`);
      return false;
    }
    seen.add(item.name);
    return true;
  });
};

interface FirebaseServices {
    db: Database;
    auth: Auth;
}

interface AppContextType {
    employees: Employee[];
    users: User[];
    absences: Absence[];
    config: AllConfig;
    notifications: AppNotification[];
    statsHistory: StatsSnapshot[];
    absenceRecords: AbsenceRecord[];
    circulationCards: CirculationCard[];
    clothingIssuances: ClothingIssuance[];
    fingerprintAppointments: FingerprintAppointment[];
    emailTemplates: EmailTemplate[];
    emailLogs: EmailLog[];
    isLoading: boolean;
    isHistoryLoading: boolean;
    handleSaveEmployee: (employeeData: Employee) => Promise<boolean>;
    handleTerminateEmployee: (employeeId: string, employeeFullName: string) => Promise<boolean>;
    handleRestoreEmployee: (employeeId: string, employeeFullName: string) => Promise<boolean>;
    handleDeleteEmployeePermanently: (employeeId: string) => Promise<boolean>;
    handleDeleteAllHireDates: () => Promise<void>;
    handleUpdateHireDates: (updates: { fullName: string; hireDate: string }[]) => Promise<void>;
    handleUpdateContractEndDates: (updates: { fullName: string; contractEndDate: string }[]) => Promise<void>;
    handleDeleteAllEmployees: () => Promise<void>;
    handleRestoreAllTerminatedEmployees: () => Promise<void>;
    addConfigItems: (configType: ConfigType, items: string[]) => Promise<void>;
    updateConfigItem: (configType: ConfigType, itemId: string, newName: string) => Promise<void>;
    removeConfigItem: (configType: ConfigType, itemId: string) => Promise<void>;
    handleSaveJobTitleClothingSet: (jobTitleId: string, description: string) => Promise<void>;
    handleSaveGmailCredentials: (user: string, pass: string) => Promise<void>;
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
    addEmailTemplate: (template: Omit<EmailTemplate, 'id'>) => Promise<string | null>;
    updateEmailTemplate: (templateId: string, updates: Partial<EmailTemplate>) => Promise<void>;
    deleteEmailTemplate: (templateId: string) => Promise<void>;
    addEmailLog: (log: Omit<EmailLog, 'id'>) => Promise<void>;
    updateRecipientEmails: (emails: string[]) => Promise<boolean>;
    currentUser: AuthUser | null;
    isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [config, setConfig] = useState<AllConfig>({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [], jobTitleClothingSets: [], gmailUser: '', gmailAppPassword: '' });
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [statsHistory, setStatsHistory] = useState<StatsSnapshot[]>([]);
    const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
    const [circulationCards, setCirculationCards] = useState<CirculationCard[]>([]);
    const [clothingIssuances, setClothingIssuances] = useState<ClothingIssuance[]>([]);
    const [fingerprintAppointments, setFingerprintAppointments] = useState<FingerprintAppointment[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [services, setServices] = useState<FirebaseServices | null>(null);
    
    const dataLoadedRef = useRef<Set<string>>(new Set());
    const authInitializedRef = useRef(false);

    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        const services = getFirebaseServices();
        if (!services) return;
        const { auth, db } = services;
        setServices({ auth, db });

        let unsubscribeRole: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            authInitializedRef.current = true;
            if (unsubscribeRole) {
                unsubscribeRole();
                unsubscribeRole = null;
            }
            if (user) {
                const userRoleRef = ref(db, `users/${user.uid}/role`);
                unsubscribeRole = onValue(userRoleRef, (snapshot) => {
                    const role = snapshot.val() as UserRole || 'guest';
                    setCurrentUser({ uid: user.uid, email: user.email, role });
                    // Nie ustawiaj isLoading tutaj - zostanie to ustawione gdy dane się załadują
                });
            } else {
                setCurrentUser(null);
                setIsLoading(false); // User is not logged in
            }
        });

        return () => {
            if (unsubscribeRole) unsubscribeRole();
            unsubscribeAuth();
        };
    }, []);

    useEffect(() => {
        if (!services || !currentUser) {
            setEmployees([]);
            setUsers([]);
            setConfig({ departments: [], jobTitles: [], managers: [], nationalities: [], clothingItems: [], jobTitleClothingSets: [], gmailUser: '', gmailAppPassword: '' });
            setAbsences([]);
            setNotifications([]);
            setStatsHistory([]);
            setAbsenceRecords([]);
            setCirculationCards([]);
            setClothingIssuances([]);
            setFingerprintAppointments([]);
            if (authInitializedRef.current) {
                setIsLoading(false);
            }
            return;
        }

        // 1. Load from localStorage instantly
        const cachedEmployees = loadFromStorage(STORAGE_KEYS.employees);
        const cachedConfig = loadFromStorage(STORAGE_KEYS.config);
        const cachedUsers = loadFromStorage(STORAGE_KEYS.users);
        const cachedAbsences = loadFromStorage(STORAGE_KEYS.absences);
        const cachedNotifications = loadFromStorage(STORAGE_KEYS.notifications);
        const cachedStatsHistory = loadFromStorage(STORAGE_KEYS.statsHistory);
        const cachedAbsenceRecords = loadFromStorage(STORAGE_KEYS.absenceRecords);
        const cachedCirculationCards = loadFromStorage(STORAGE_KEYS.circulationCards);
        const cachedClothingIssuances = loadFromStorage(STORAGE_KEYS.clothingIssuances);
        const cachedFingerprintAppointments = loadFromStorage(STORAGE_KEYS.fingerprintAppointments);

        if (cachedEmployees) setEmployees(cachedEmployees);
        if (cachedConfig) {
            setConfig({
                departments: dedupeByName(cachedConfig.departments || []),
                jobTitles: dedupeByName(cachedConfig.jobTitles || []),
                managers: dedupeByName(cachedConfig.managers || []),
                nationalities: dedupeByName(cachedConfig.nationalities || []),
                clothingItems: cachedConfig.clothingItems || [],
                jobTitleClothingSets: cachedConfig.jobTitleClothingSets || [],
                gmailUser: cachedConfig.gmailUser || '',
                gmailAppPassword: cachedConfig.gmailAppPassword || '',
            });
        }
        if (cachedUsers) setUsers(cachedUsers);
        if (cachedAbsences) setAbsences(cachedAbsences);
        if (cachedNotifications) setNotifications(cachedNotifications);
        if (cachedStatsHistory) setStatsHistory(cachedStatsHistory);
        if (cachedAbsenceRecords) setAbsenceRecords(cachedAbsenceRecords);
        if (cachedCirculationCards) setCirculationCards(cachedCirculationCards);
        if (cachedClothingIssuances) setClothingIssuances(cachedClothingIssuances);
        if (cachedFingerprintAppointments) setFingerprintAppointments(cachedFingerprintAppointments);
        const cachedEmailTemplates = loadFromStorage(STORAGE_KEYS.emailTemplates);
        const cachedEmailLogs = loadFromStorage(STORAGE_KEYS.emailLogs);
        if (cachedEmailTemplates) setEmailTemplates(cachedEmailTemplates);
        if (cachedEmailLogs) setEmailLogs(cachedEmailLogs);

        // If we have cached essential data, show UI immediately
        const hasCachedEssential = cachedEmployees && cachedConfig;
        if (hasCachedEssential) {
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }
        if (cachedStatsHistory) {
            setIsHistoryLoading(false);
        }

        dataLoadedRef.current.clear();
        const { db } = services;

        const dataRefs = [
            {
                path: "employees",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setEmployees(arr);
                    saveToStorage(STORAGE_KEYS.employees, arr);
                    dataLoadedRef.current.add('employees');
                },
                essential: true,
            },
            {
                path: "users",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setUsers(arr);
                    saveToStorage(STORAGE_KEYS.users, arr);
                    dataLoadedRef.current.add('users');
                },
                essential: false,
            },
            {
                path: "absences",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setAbsences(arr);
                    saveToStorage(STORAGE_KEYS.absences, arr);
                    dataLoadedRef.current.add('absences');
                },
                essential: false,
            },
            {
                path: "notifications",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setNotifications(arr);
                    saveToStorage(STORAGE_KEYS.notifications, arr);
                    dataLoadedRef.current.add('notifications');
                },
                essential: false,
            },
            {
                path: "config",
                setter: (data: any) => {
                    const configData = data || {};
                    setConfig(prev => {
                        const updated = {
                            ...prev,
                            departments: dedupeByName(objectToArray(configData.departments)),
                            jobTitles: dedupeByName(objectToArray(configData.jobTitles)),
                            managers: dedupeByName(objectToArray(configData.managers)),
                            nationalities: dedupeByName(objectToArray(configData.nationalities)),
                            clothingItems: objectToArray(configData.clothingItems),
                            jobTitleClothingSets: objectToArray(configData.jobTitleClothingSets),
                        };
                        saveToStorage(STORAGE_KEYS.config, updated);
                        return updated;
                    });
                    dataLoadedRef.current.add('config');
                },
                essential: true,
            },
            {
                path: "configPrivate",
                setter: (data: any) => {
                    const privateData = data || {};
                    setConfig(prev => ({
                        ...prev,
                        gmailUser: privateData.gmailUser || '',
                        gmailAppPassword: privateData.gmailAppPassword || '',
                        recipientEmails: privateData.recipientEmails || [],
                    }));
                },
                essential: false,
            },
            {
                path: "absenceRecords",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setAbsenceRecords(arr);
                    saveToStorage(STORAGE_KEYS.absenceRecords, arr);
                    dataLoadedRef.current.add('absenceRecords');
                },
                essential: false,
            },
            {
                path: "circulationCards",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setCirculationCards(arr);
                    saveToStorage(STORAGE_KEYS.circulationCards, arr);
                    dataLoadedRef.current.add('circulationCards');
                },
                essential: false,
            },
            {
                path: "clothingIssuances",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setClothingIssuances(arr);
                    saveToStorage(STORAGE_KEYS.clothingIssuances, arr);
                    dataLoadedRef.current.add('clothingIssuances');
                },
                essential: false,
            },
            {
                path: "fingerprintAppointments",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setFingerprintAppointments(arr);
                    saveToStorage(STORAGE_KEYS.fingerprintAppointments, arr);
                    dataLoadedRef.current.add('fingerprintAppointments');
                },
                essential: false,
            },
            {
                path: "emailTemplates",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setEmailTemplates(arr);
                    saveToStorage(STORAGE_KEYS.emailTemplates, arr);
                    dataLoadedRef.current.add('emailTemplates');
                },
                essential: false,
            },
            {
                path: "emailLogs",
                setter: (data: any) => {
                    const arr = objectToArray(data);
                    setEmailLogs(arr);
                    saveToStorage(STORAGE_KEYS.emailLogs, arr);
                    dataLoadedRef.current.add('emailLogs');
                },
                essential: false,
            },
        ];

        const checkEssentialLoaded = () => {
            const essentialPaths = dataRefs.filter(r => r.essential).map(r => r.path);
            const loadedEssential = essentialPaths.filter(p => dataLoadedRef.current.has(p));
            return loadedEssential.length === essentialPaths.length;
        };

        const unsubscribes = dataRefs.map(({ path, setter, essential }) =>
            onValue(ref(db, path), snapshot => {
                setter(snapshot.val());
                if (checkEssentialLoaded()) {
                    setIsLoading(false);
                }
            }, (error) => {
                console.error(`Firebase read error on path ${path}:`, error);
                if (essential) {
                    toast({ variant: 'destructive', title: 'Błąd odczytu danych', description: `Nie udało się pobrać danych dla: ${path}` });
                }
                dataLoadedRef.current.add(path);
                if (checkEssentialLoaded()) {
                    setIsLoading(false);
                }
            })
        );
        
        const historyRef = ref(db, "statisticsHistory");
        unsubscribes.push(onValue(historyRef, snapshot => {
            const arr = objectToArray(snapshot.val()).sort((a:any, b:any) => new Date(b.id).getTime() - new Date(a.id).getTime());
            setStatsHistory(arr);
            saveToStorage(STORAGE_KEYS.statsHistory, arr);
            setIsHistoryLoading(false);
        }));

        return () => {
            unsubscribes.forEach(unsub => unsub());
        }
    }, [services, currentUser, toast]);


    const handleSaveEmployee = useCallback(async (employeeData: Employee): Promise<boolean> => {
        if (!services) return false;
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
            return true;
        } catch (error) {
            console.error("Error saving employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać danych pracownika.' });
            return false;
        }
    }, [services, toast]);

    const handleTerminateEmployee = useCallback(async (employeeId: string, employeeFullName: string): Promise<boolean> => {
        if (!services) return false;
        const { db } = services;
        try {
            await update(ref(db, `employees/${employeeId}`), {
                status: 'zwolniony',
                terminationDate: format(new Date(), 'yyyy-MM-dd'),
                status_fullName: `zwolniony_${employeeFullName.toLowerCase()}`
            });
            toast({ title: 'Pracownik zwolniony', description: 'Status pracownika został zmieniony na "zwolniony".' });
            return true;
        } catch (error) {
            console.error("Error terminating employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zwolnić pracownika.' });
            return false;
        }
    }, [services, toast]);

    const handleRestoreEmployee = useCallback(async (employeeId: string, employeeFullName: string): Promise<boolean> => {
        console.log('[handleRestoreEmployee] called with:', { employeeId, employeeFullName });
        if (!services) {
            console.error('[handleRestoreEmployee] services is null!');
            toast({ variant: 'destructive', title: 'Błąd', description: 'Firebase nie jest zainicjowany.' });
            return false;
        }
        const { db } = services;
        try {
            console.log('[handleRestoreEmployee] updating RTDB for employees/', employeeId);
            await update(ref(db, `employees/${employeeId}`), {
                status: 'aktywny',
                terminationDate: null,
                status_fullName: `aktywny_${employeeFullName.toLowerCase()}`
            });
            console.log('[handleRestoreEmployee] success');
            toast({ title: 'Sukces', description: 'Pracownik został przywrócony.' });
            return true;
        } catch (error) {
            console.error("[handleRestoreEmployee] Error:", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracownika.' });
            return false;
        }
    }, [services, toast]);

    const handleDeleteEmployeePermanently = useCallback(async (employeeId: string): Promise<boolean> => {
        if (!services) return false;
        const { db } = services;
        try {
            const updates: Record<string, null> = {};
            updates[`employees/${employeeId}`] = null;

            const relatedPaths = ['absences', 'absenceRecords', 'circulationCards', 'fingerprintAppointments', 'clothingIssuances'];
            for (const path of relatedPaths) {
                const snapshot = await get(ref(db, path));
                const data = snapshot.val();
                if (data) {
                    Object.keys(data).forEach(key => {
                        if (data[key]?.employeeId === employeeId) {
                            updates[`${path}/${key}`] = null;
                        }
                    });
                }
            }

            await update(ref(db), updates);
            toast({ title: 'Sukces', description: 'Pracownik i wszystkie powiązane dane zostały trwale usunięte.' });
            return true;
        } catch (error) {
            console.error("Error deleting employee permanently: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć pracownika.' });
            return false;
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
        const fuzzyMatched: string[] = [];

        const allEmployeesSnapshot = await get(ref(db, 'employees'));
        const allEmployees = objectToArray(allEmployeesSnapshot.val());

        dateUpdates.forEach(updateData => {
            const normalizedInput = normalizeName(updateData.fullName);

            // 1. Exact match (normalized)
            let employeeToUpdate = allEmployees.find(emp => normalizeName(emp.fullName) === normalizedInput);

            // 2. Fuzzy match if no exact
            if (!employeeToUpdate) {
                employeeToUpdate = findBestFuzzyMatch(allEmployees, updateData.fullName, 2);
                if (employeeToUpdate) {
                    fuzzyMatched.push(`${updateData.fullName} → ${employeeToUpdate.fullName}`);
                }
            }

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
                let description = `Zaktualizowano daty końca umowy dla ${updatedCount} pracowników.`;
                if (fuzzyMatched.length > 0) {
                    description += `\nDopasowano z literówką: ${fuzzyMatched.slice(0, 3).join(', ')}${fuzzyMatched.length > 3 ? '...' : ''}`;
                }
                toast({
                    title: 'Aktualizacja zakończona',
                    description,
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
                description: `Nie można było dopasować ${notFound.length} pracowników: ${notFound.slice(0, 3).join(', ')}...`,
            });
        }
    }, [services, toast]);

    const handleDeleteAllEmployees = useCallback(async () => {
        if (!services) return;
        const { db } = services;
        try {
            const updates: Record<string, null> = {};
            updates['employees'] = null;

            const relatedPaths = ['absences', 'absenceRecords', 'circulationCards', 'fingerprintAppointments', 'clothingIssuances'];
            for (const path of relatedPaths) {
                updates[path] = null;
            }

            await update(ref(db), updates);
            toast({ title: 'Sukces', description: 'Wszyscy pracownicy i powiązane dane zostały usunięci.' });
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

    const handleSaveGmailCredentials = useCallback(async (user: string, pass: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await update(ref(db, 'configPrivate'), {
                gmailUser: user,
                gmailAppPassword: pass
            });
            toast({ title: "Sukces", description: "Dane logowania Gmail zostały zapisane."});
        } catch (error) {
            console.error("Error saving Gmail credentials:", error);
            toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zapisać danych."});
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

    const addEmailTemplate = useCallback(async (template: Omit<EmailTemplate, 'id'>): Promise<string | null> => {
        if (!services) return null;
        const { db } = services;
        try {
            const newRef = push(ref(db, 'emailTemplates'));
            await set(newRef, template);
            toast({ title: 'Sukces', description: 'Szablon został dodany.' });
            return newRef.key;
        } catch (error) {
            console.error('Error adding email template:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się dodać szablonu.' });
            return null;
        }
    }, [services, toast]);

    const updateEmailTemplate = useCallback(async (templateId: string, updates: Partial<EmailTemplate>) => {
        if (!services) return;
        const { db } = services;
        try {
            await update(ref(db, `emailTemplates/${templateId}`), updates);
            toast({ title: 'Sukces', description: 'Szablon został zaktualizowany.' });
        } catch (error) {
            console.error('Error updating email template:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować szablonu.' });
        }
    }, [services, toast]);

    const deleteEmailTemplate = useCallback(async (templateId: string) => {
        if (!services) return;
        const { db } = services;
        try {
            await remove(ref(db, `emailTemplates/${templateId}`));
            toast({ title: 'Sukces', description: 'Szablon został usunięty.' });
        } catch (error) {
            console.error('Error deleting email template:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć szablonu.' });
        }
    }, [services, toast]);

    const addEmailLog = useCallback(async (log: Omit<EmailLog, 'id'>) => {
        if (!services) return;
        const { db } = services;
        try {
            const newRef = push(ref(db, 'emailLogs'));
            await set(newRef, log);
        } catch (error) {
            console.error('Error adding email log:', error);
        }
    }, [services]);

    const updateRecipientEmails = useCallback(async (emails: string[]) => {
        if (!services) return false;
        const { db } = services;
        try {
            await set(ref(db, 'configPrivate/recipientEmails'), emails);
            toast({ title: 'Sukces', description: 'Lista adresów email została zaktualizowana.' });
            return true;
        } catch (error) {
            console.error('Error updating recipient emails:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować listy adresów.' });
            return false;
        }
    }, [services, toast]);

    const value: AppContextType = {
        employees,
        users,
        absences,
        config,
        notifications,
        statsHistory,
        absenceRecords,
        circulationCards,
        clothingIssuances,
        fingerprintAppointments,
        emailTemplates,
        emailLogs,
        isLoading,
        isHistoryLoading,
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
        handleSaveGmailCredentials,
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
        addEmailTemplate,
        updateEmailTemplate,
        deleteEmailTemplate,
        addEmailLog,
        updateRecipientEmails,
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
