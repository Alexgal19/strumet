import { ref, set, push, update, remove, get } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Employee } from "@/lib/types";
import { format } from "date-fns";

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map((key) => ({ id: key, ...obj[key] })) : [];
};

export const saveEmployee = async (employeeData: Employee) => {
  try {
    const { id, ...dataToSave } = employeeData;

    const status = dataToSave.status || "aktywny";
    const status_fullName = `${status}_${dataToSave.fullName.toLowerCase()}`;

    const finalData: { [key: string]: any } = {
      ...dataToSave,
      status_fullName,
    };

    for (const key in finalData) {
      if (finalData[key] === undefined) {
        finalData[key] = null;
      }
    }

    if (id) {
      await set(ref(db, `employees/${id}`), finalData);
    } else {
      const newEmployeeRef = push(ref(db, "employees"));
      await set(newEmployeeRef, {
        ...finalData,
        status: "aktywny",
        status_fullName: `aktywny_${finalData.fullName.toLowerCase()}`,
      });
    }
  } catch (error) {
    console.error("Error saving employee: ", error);
    throw error;
  }
};

export const terminateEmployee = async (
  employeeId: string,
  employeeFullName: string,
) => {
  try {
    await update(ref(db, `employees/${employeeId}`), {
      status: "zwolniony",
      terminationDate: format(new Date(), "yyyy-MM-dd"),
      status_fullName: `zwolniony_${employeeFullName.toLowerCase()}`,
    });
  } catch (error) {
    console.error("Error terminating employee: ", error);
    throw error;
  }
};

export const restoreEmployee = async (
  employeeId: string,
  employeeFullName: string,
) => {
  try {
    await update(ref(db, `employees/${employeeId}`), {
      status: "aktywny",
      terminationDate: null,
      status_fullName: `aktywny_${employeeFullName.toLowerCase()}`,
    });
  } catch (error) {
    console.error("Error restoring employee: ", error);
    throw error;
  }
};

export const deleteEmployeePermanently = async (employeeId: string) => {
  try {
    await remove(ref(db, `employees/${employeeId}`));
  } catch (error) {
    console.error("Error deleting employee permanently: ", error);
    throw error;
  }
};

export const deleteAllHireDates = async () => {
  try {
    const updates: Record<string, any> = {};
    const allEmployeesSnapshot = await get(ref(db, "employees"));
    const allEmployees = objectToArray(allEmployeesSnapshot.val());

    allEmployees.forEach((employee) => {
      updates[`/employees/${employee.id}/hireDate`] = null;
    });
    await update(ref(db), updates);
  } catch (error) {
    console.error("Error deleting all hire dates: ", error);
    throw error;
  }
};

export const updateHireDates = async (
  dateUpdates: { fullName: string; hireDate: string }[],
) => {
  const updates: Record<string, any> = {};
  let updatedCount = 0;
  const notFound: string[] = [];

  const allEmployeesSnapshot = await get(ref(db, "employees"));
  const allEmployees = objectToArray(allEmployeesSnapshot.val());

  dateUpdates.forEach((updateData) => {
    const employeeToUpdate = allEmployees.find(
      (emp) => emp.fullName === updateData.fullName,
    );
    if (employeeToUpdate) {
      updates[`/employees/${employeeToUpdate.id}/hireDate`] =
        updateData.hireDate;
      updatedCount++;
    } else {
      notFound.push(updateData.fullName);
    }
  });

  if (updatedCount > 0) {
    try {
      await update(ref(db), updates);
    } catch (error) {
      console.error("Error updating hire dates:", error);
      throw error;
    }
  }

  return { updatedCount, notFound };
};

export const updateContractEndDates = async (
  dateUpdates: { fullName: string; contractEndDate: string }[],
) => {
  const updates: Record<string, any> = {};
  let updatedCount = 0;
  const notFound: string[] = [];

  const allEmployeesSnapshot = await get(ref(db, "employees"));
  const allEmployees = objectToArray(allEmployeesSnapshot.val());

  dateUpdates.forEach((updateData) => {
    const employeeToUpdate = allEmployees.find(
      (emp) => emp.fullName === updateData.fullName,
    );
    if (employeeToUpdate) {
      updates[`/employees/${employeeToUpdate.id}/contractEndDate`] =
        updateData.contractEndDate;
      updatedCount++;
    } else {
      notFound.push(updateData.fullName);
    }
  });

  if (updatedCount > 0) {
    try {
      await update(ref(db), updates);
    } catch (error) {
      console.error("Error updating contract end dates:", error);
      throw error;
    }
  }

  return { updatedCount, notFound };
};

export const deleteAllEmployees = async () => {
  try {
    await set(ref(db, "employees"), null);
  } catch (error) {
    console.error("Error deleting all employees: ", error);
    throw error;
  }
};

export const restoreAllTerminatedEmployees = async () => {
  try {
    const updates: Record<string, any> = {};

    const allEmployeesSnapshot = await get(ref(db, "employees"));
    const allEmployees = objectToArray(allEmployeesSnapshot.val());
    const terminatedEmployees = allEmployees.filter(
      (e) => e.status === "zwolniony",
    );

    if (terminatedEmployees.length === 0) {
      return { restoredCount: 0 };
    }

    for (const employee of terminatedEmployees) {
      updates[`/employees/${employee.id}/status`] = "aktywny";
      updates[`/employees/${employee.id}/terminationDate`] = null;
      updates[`/employees/${employee.id}/status_fullName`] =
        `aktywny_${employee.fullName.toLowerCase()}`;
    }
    await update(ref(db), updates);
    return { restoredCount: terminatedEmployees.length };
  } catch (error) {
    console.error("Error restoring all terminated employees: ", error);
    throw error;
  }
};
