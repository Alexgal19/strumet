import os

file_path = "c:/strumet/strumet/src/context/app-context.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Car to imports
content = content.replace("EmailLog,\n} from '@/lib/types';", "EmailLog,\n    Car,\n} from '@/lib/types';")

# 2. Add STORAGE_KEYS.cars
content = content.replace("employees: 'strumet_employees',", "employees: 'strumet_employees',\n  cars: 'strumet_cars',")

# 3. Add to AppContextType properties
content = content.replace("employees: Employee[];\n    users: User[];", "employees: Employee[];\n    cars: Car[];\n    users: User[];")

# 4. Add to AppContextType functions
old_funcs = "handleDeleteEmployeePermanently: (employeeId: string) => Promise<boolean>;"
new_funcs = old_funcs + "\n    handleSaveCar: (carData: Car) => Promise<boolean>;\n    handleTerminateCar: (carId: string) => Promise<boolean>;\n    handleRestoreCar: (carId: string) => Promise<boolean>;\n    handleDeleteCarPermanently: (carId: string) => Promise<boolean>;"
content = content.replace(old_funcs, new_funcs)

# 5. Add to AppProvider state
old_state = "const [employees, setEmployees] = useState<Employee[]>([]);"
new_state = old_state + "\n    const [cars, setCars] = useState<Car[]>([]);"
content = content.replace(old_state, new_state)

# 6. Clear cars state when unauthenticated
content = content.replace("setEmployees([]);\n            setUsers([]);", "setEmployees([]);\n            setCars([]);\n            setUsers([]);")

# 7. Load from local storage
content = content.replace("const cachedEmployees = loadFromStorage(STORAGE_KEYS.employees);", "const cachedEmployees = loadFromStorage(STORAGE_KEYS.employees);\n        const cachedCars = loadFromStorage(STORAGE_KEYS.cars);")
content = content.replace("if (cachedEmployees) setEmployees(cachedEmployees);", "if (cachedEmployees) setEmployees(cachedEmployees);\n        if (cachedCars) setCars(cachedCars);")

# 8. Add data ref for cars
old_data_refs = "const dataRefs = [\n            {\n                path: \"employees\","
new_data_refs = "const dataRefs = [\n            {\n                path: \"cars\",\n                setter: (data: any) => {\n                    const arr = objectToArray(data);\n                    setCars(arr);\n                    saveToStorage(STORAGE_KEYS.cars, arr);\n                    dataLoadedRef.current.add('cars');\n                },\n                essential: false,\n            },\n            {\n                path: \"employees\","
content = content.replace(old_data_refs, new_data_refs)

# 9. Add car handler functions
handlers = """
    const handleSaveCar = useCallback(async (carData: Car): Promise<boolean> => {
        if (!services) return false;
        const { db } = services;
        try {
            const { id, ...dataToSave } = carData;
            const finalData: { [key: string]: any } = { ...dataToSave };
            for (const key in finalData) {
                if (finalData[key] === undefined) {
                  finalData[key] = null;
                }
            }
            if (id) {
                await set(ref(db, `cars/${id}`), finalData);
                toast({ title: 'Sukces', description: 'Dane auta zostały zaktualizowane.' });
            } else {
                const newCarRef = push(ref(db, 'cars'));
                await set(newCarRef, { ...finalData, status: 'active' });
                toast({ title: 'Sukces', description: 'Nowe auto zostało dodane.' });
            }
            return true;
        } catch (error) {
            console.error("Error saving car: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać auta.' });
            return false;
        }
    }, [services, toast]);

    const handleTerminateCar = useCallback(async (carId: string): Promise<boolean> => {
        if (!services) return false;
        const { db } = services;
        try {
            await update(ref(db, `cars/${carId}`), {
                status: 'history',
                dateTo: format(new Date(), 'yyyy-MM-dd')
            });
            toast({ title: 'Sukces', description: 'Auto przeniesione do historii.' });
            return true;
        } catch (error) {
            console.error("Error terminating car: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować statusu.' });
            return false;
        }
    }, [services, toast]);

    const handleRestoreCar = useCallback(async (carId: string): Promise<boolean> => {
        if (!services) return false;
        const { db } = services;
        try {
            await update(ref(db, `cars/${carId}`), {
                status: 'active',
                dateTo: null
            });
            toast({ title: 'Sukces', description: 'Auto przywrócone do aktywnych.' });
            return true;
        } catch (error) {
            console.error("Error restoring car:", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić auta.' });
            return false;
        }
    }, [services, toast]);

    const handleDeleteCarPermanently = useCallback(async (carId: string): Promise<boolean> => {
        if (!services) return false;
        const { db } = services;
        try {
            await remove(ref(db, `cars/${carId}`));
            toast({ title: 'Sukces', description: 'Auto usunięte bezpowrotnie.' });
            return true;
        } catch (error) {
            console.error("Error deleting car: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć auta.' });
            return false;
        }
    }, [services, toast]);

    const handleSaveEmployee"""
content = content.replace("    const handleSaveEmployee", handlers)

# 10. Add to returned value
content = content.replace("        employees,\n        users,", "        employees,\n        cars,\n        users,")
content = content.replace("        handleDeleteEmployeePermanently,\n        handleDeleteAllHireDates,", "        handleDeleteEmployeePermanently,\n        handleSaveCar,\n        handleTerminateCar,\n        handleRestoreCar,\n        handleDeleteCarPermanently,\n        handleDeleteAllHireDates,")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
