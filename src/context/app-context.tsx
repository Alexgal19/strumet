"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { ref, onValue } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  type Auth,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import {
  saveEmployee as saveEmployeeAction,
  terminateEmployee as terminateEmployeeAction,
  restoreEmployee as restoreEmployeeAction,
  deleteEmployeePermanently as deleteEmployeePermanentlyAction,
  deleteAllHireDates as deleteAllHireDatesAction,
  deleteAllEmployees as deleteAllEmployeesAction,
  updateHireDates as updateHireDatesAction,
  updateContractEndDates as updateContractEndDatesAction,
  restoreAllTerminatedEmployees as restoreAllTerminatedEmployeesAction,
  addConfigItems as addConfigItemsAction,
  updateConfigItem as updateConfigItemAction,
  removeConfigItem as removeConfigItemAction,
  handleSaveJobTitleClothingSet as handleSaveJobTitleClothingSetAction,
  handleSaveResendApiKey as handleSaveResendApiKeyAction,
  handleUpdateUserRole as handleUpdateUserRoleAction,
  addAbsence as addAbsenceAction,
  deleteAbsence as deleteAbsenceAction,
  addAbsenceRecord as addAbsenceRecordAction,
  deleteAbsenceRecord as deleteAbsenceRecordAction,
  addCirculationCard as addCirculationCardAction,
  addFingerprintAppointment as addFingerprintAppointmentAction,
  deleteFingerprintAppointment as deleteFingerprintAppointmentAction,
  addClothingIssuance as addClothingIssuanceAction,
  deleteClothingIssuance as deleteClothingIssuanceAction,
  addOrder as addOrderAction,
  updateOrder as updateOrderAction,
  deleteOrder as deleteOrderAction,
} from "@/lib/actions/employee-actions";

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
} from "@/lib/types";

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map((key) => ({ id: key, ...obj[key] })) : [];
};

interface FirebaseServices {
  db: any; // Using `any` to avoid deep type issues with Firebase SDK
  auth: Auth;
}

interface AppContextType {
  allEmployees: Employee[];
  users: User[];
  absences: Absence[];
  config: AllConfig;
  notifications: AppNotification[];
  statsHistory: StatsSnapshot[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  addConfigItems: (configType: ConfigType, items: string[]) => Promise<void>;
  updateConfigItem: (
    configType: ConfigType,
    itemId: string,
    newName: string,
  ) => Promise<void>;
  removeConfigItem: (configType: ConfigType, itemId: string) => Promise<void>;
  handleSaveJobTitleClothingSet: (
    jobTitleId: string,
    description: string,
  ) => Promise<void>;
  handleSaveResendApiKey: (apiKey: string) => Promise<void>;
  handleUpdateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  addAbsence: (employeeId: string, date: string) => Promise<void>;
  deleteAbsence: (absenceId: string) => Promise<void>;
  addAbsenceRecord: (record: Omit<AbsenceRecord, "id">) => Promise<void>;
  deleteAbsenceRecord: (recordId: string) => Promise<void>;
  addCirculationCard: (
    employeeId: string,
    employeeFullName: string,
  ) => Promise<CirculationCard | null>;
  addFingerprintAppointment: (
    appointment: Omit<FingerprintAppointment, "id">,
  ) => Promise<void>;
  deleteFingerprintAppointment: (appointmentId: string) => Promise<void>;
  addClothingIssuance: (
    issuance: Omit<ClothingIssuance, "id">,
  ) => Promise<ClothingIssuance | null>;
  deleteClothingIssuance: (issuanceId: string) => Promise<void>;
  addOrder: (order: Omit<Order, "id" | "createdAt">) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  currentUser: AuthUser | null;
  isAdmin: boolean;
  handleSaveEmployee: (employeeData: Employee) => Promise<void>;
  handleTerminateEmployee: (args: {
    id: string;
    fullName: string;
  }) => Promise<void>;
  handleRestoreEmployee: (args: {
    id: string;
    fullName: string;
  }) => Promise<void>;
  handleDeleteEmployeePermanently: (id: string) => Promise<void>;
  handleDeleteAllHireDates: () => Promise<void>;
  handleDeleteAllEmployees: () => Promise<void>;
  handleUpdateHireDates: (
    updates: { fullName: string; hireDate: string }[],
  ) => Promise<void>;
  handleUpdateContractEndDates: (
    updates: { fullName: string; contractEndDate: string }[],
  ) => Promise<void>;
  handleRestoreAllTerminatedEmployees: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [config, setConfig] = useState<AllConfig>({
    departments: [],
    jobTitles: [],
    managers: [],
    nationalities: [],
    clothingItems: [],
    jobTitleClothingSets: [],
    resendApiKey: "",
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [statsHistory, setStatsHistory] = useState<StatsSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [services, setServices] = useState<FirebaseServices | null>(null);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    const { auth, db } = getFirebaseServices();
    setServices({ auth, db });

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        if (user) {
          const userRoleRef = ref(db, `users/${user.uid}/role`);
          onValue(userRoleRef, (snapshot) => {
            const role = (snapshot.val() as UserRole) || "guest";
            setCurrentUser({ uid: user.uid, email: user.email, role });
          });
        } else {
          setCurrentUser(null);
          setIsLoading(false); // Set loading to false if no user
        }
      },
    );

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!services || !currentUser) {
      setAllEmployees([]);
      setUsers([]);
      setConfig({
        departments: [],
        jobTitles: [],
        managers: [],
        nationalities: [],
        clothingItems: [],
        jobTitleClothingSets: [],
        resendApiKey: "",
      });
      setAbsences([]);
      setNotifications([]);
      setStatsHistory([]);
      if (!currentUser) setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { db } = services;

    const dataRefs = [
      {
        path: "employees",
        setter: (data: any) => setAllEmployees(objectToArray(data)),
      },
      { path: "users", setter: (data: any) => setUsers(objectToArray(data)) },
      {
        path: "absences",
        setter: (data: any) => setAbsences(objectToArray(data)),
      },
      {
        path: "notifications",
        setter: (data: any) => setNotifications(objectToArray(data)),
      },
      {
        path: "config",
        setter: (data: any) => {
          const configData = data || {};
          const newConfig: AllConfig = {
            departments: objectToArray(configData.departments),
            jobTitles: objectToArray(configData.jobTitles),
            managers: objectToArray(configData.managers),
            nationalities: objectToArray(configData.nationalities),
            clothingItems: objectToArray(configData.clothingItems),
            jobTitleClothingSets: objectToArray(
              configData.jobTitleClothingSets,
            ),
            resendApiKey: configData.resendApiKey || "",
          };
          setConfig(newConfig);
        },
      },
    ];

    const unsubscribes = dataRefs.map(({ path, setter }) =>
      onValue(
        ref(db, path),
        (snapshot) => {
          setter(snapshot.val());
          setIsLoading(false);
        },
        (error) => {
          console.error(`Firebase read error on path ${path}:`, error);
          toast({
            variant: "destructive",
            title: "Błąd odczytu danych",
            description: `Nie udało się pobrać danych dla: ${path}`,
          });
          setIsLoading(false);
        },
      ),
    );

    const historyRef = ref(db, "statisticsHistory");
    unsubscribes.push(
      onValue(historyRef, (snapshot) => {
        setStatsHistory(
          objectToArray(snapshot.val()).sort(
            (a: any, b: any) =>
              new Date(b.id).getTime() - new Date(a.id).getTime(),
          ),
        );
        setIsHistoryLoading(false);
      }),
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [services, currentUser, toast]);

  // --- Employee Mutations ---
  const handleSaveEmployee = useCallback(
    async (employeeData: Employee) => {
      try {
        await saveEmployeeAction(employeeData);
        const action = employeeData.id ? "zaktualizowane" : "dodany";
        toast({
          title: "Sukces",
          description: `Dane pracownika zostały ${action}.`,
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Nie udało się zapisać danych pracownika.",
        });
      }
    },
    [toast],
  );

  const handleTerminateEmployee = useCallback(
    async ({ id, fullName }: { id: string; fullName: string }) => {
      try {
        await terminateEmployeeAction(id, fullName);
        toast({
          title: "Pracownik zwolniony",
          description: 'Status pracownika został zmieniony na "zwolniony".',
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Nie udało się zwolnić pracownika.",
        });
      }
    },
    [toast],
  );

  const handleRestoreEmployee = useCallback(
    async ({ id, fullName }: { id: string; fullName: string }) => {
      try {
        await restoreEmployeeAction(id, fullName);
        toast({
          title: "Sukces",
          description: "Pracownik został przywrócony.",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Nie udało się przywrócić pracownika.",
        });
      }
    },
    [toast],
  );

  const handleDeleteEmployeePermanently = useCallback(
    async (id: string) => {
      try {
        await deleteEmployeePermanentlyAction(id);
        toast({
          title: "Sukces",
          description: "Pracownik został trwale usunięty z bazy danych.",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Nie udało się usunąć pracownika.",
        });
      }
    },
    [toast],
  );

  const handleDeleteAllHireDates = useCallback(async () => {
    try {
      await deleteAllHireDatesAction();
      toast({
        title: "Sukces",
        description: "Wszystkie daty zatrudnienia zostały usunięte.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się usunąć dat zatrudnienia.",
      });
    }
  }, [toast]);

  const handleUpdateHireDates = useCallback(
    async (updates: { fullName: string; hireDate: string }[]) => {
      try {
        const { updatedCount, notFound } = await updateHireDatesAction(updates);
        if (updatedCount > 0) {
          toast({
            title: "Aktualizacja zakończona",
            description: `Zaktualizowano daty zatrudnienia dla ${updatedCount} pracowników.`,
          });
        }
        if (notFound.length > 0) {
          toast({
            variant: "destructive",
            title: "Nie znaleziono pracowników",
            description: `Nie można było znaleźć ${notFound.length} pracowników: ${notFound.slice(0, 3).join(", ")}...`,
          });
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Wystąpił błąd podczas aktualizacji dat.",
        });
      }
    },
    [toast],
  );

  const handleUpdateContractEndDates = useCallback(
    async (updates: { fullName: string; contractEndDate: string }[]) => {
      try {
        const { updatedCount, notFound } =
          await updateContractEndDatesAction(updates);
        if (updatedCount > 0) {
          toast({
            title: "Aktualizacja zakończona",
            description: `Zaktualizowano daty końca umowy dla ${updatedCount} pracowników.`,
          });
        }
        if (notFound.length > 0) {
          toast({
            variant: "destructive",
            title: "Nie znaleziono pracowników",
            description: `Nie można było znaleźć ${notFound.length} pracowników: ${notFound.slice(0, 3).join(", ")}...`,
          });
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Błąd",
          description: "Wystąpił błąd podczas aktualizacji dat.",
        });
      }
    },
    [toast],
  );

  const handleDeleteAllEmployees = useCallback(async () => {
    try {
      await deleteAllEmployeesAction();
      toast({
        title: "Sukces",
        description: "Wszyscy pracownicy zostali usunięci.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się usunąć pracowników.",
      });
    }
  }, [toast]);

  const handleRestoreAllTerminatedEmployees = useCallback(async () => {
    try {
      const { restoredCount } = await restoreAllTerminatedEmployeesAction();
      if (restoredCount === 0) {
        toast({
          title: "Informacja",
          description: "Brak zwolnionych pracowników do przywrócenia.",
        });
      } else {
        toast({
          title: "Sukces",
          description: `Przywrócono ${restoredCount} pracowników.`,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się przywrócić pracowników.",
      });
    }
  }, [toast]);

  const value: AppContextType = {
    allEmployees,
    users,
    absences,
    config,
    notifications,
    statsHistory,
    isLoading,
    isHistoryLoading,
    addConfigItems: addConfigItemsAction,
    updateConfigItem: updateConfigItemAction,
    removeConfigItem: removeConfigItemAction,
    handleSaveJobTitleClothingSet: handleSaveJobTitleClothingSetAction,
    handleSaveResendApiKey: handleSaveResendApiKeyAction,
    handleUpdateUserRole: handleUpdateUserRoleAction,
    addAbsence: addAbsenceAction,
    deleteAbsence: deleteAbsenceAction,
    addAbsenceRecord: addAbsenceRecordAction,
    deleteAbsenceRecord: deleteAbsenceRecordAction,
    addCirculationCard: addCirculationCardAction,
    addFingerprintAppointment: addFingerprintAppointmentAction,
    deleteFingerprintAppointment: deleteFingerprintAppointmentAction,
    addClothingIssuance: addClothingIssuanceAction,
    deleteClothingIssuance: deleteClothingIssuanceAction,
    addOrder: addOrderAction,
    updateOrder: updateOrderAction,
    deleteOrder: deleteOrderAction,
    currentUser,
    isAdmin,
    handleSaveEmployee,
    handleTerminateEmployee,
    handleRestoreEmployee,
    handleDeleteEmployeePermanently,
    handleDeleteAllHireDates,
    handleDeleteAllEmployees,
    handleUpdateHireDates,
    handleUpdateContractEndDates,
    handleRestoreAllTerminatedEmployees,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
