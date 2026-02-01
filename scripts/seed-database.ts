import { config } from "dotenv";
config(); // Load .env variables

import { getAdminApp, adminDb } from "../src/lib/firebase-admin";
import { ref, set, update, push } from "firebase/database";
import { format, subDays, addDays } from "date-fns";
import type { Employee } from "../src/lib/types";

// --- Sample Data ---
const FIRST_NAMES_M = [
  "Jan",
  "Piotr",
  "Krzysztof",
  "Andrzej",
  "Tomasz",
  "Marek",
  "Grzegorz",
  "Paweł",
  "Marcin",
  "Michał",
];
const FIRST_NAMES_F = [
  "Anna",
  "Katarzyna",
  "Małgorzata",
  "Agnieszka",
  "Barbara",
  "Ewa",
  "Elżbieta",
  "Zofia",
  "Teresa",
  "Monika",
];
const LAST_NAMES = [
  "Nowak",
  "Kowalski",
  "Wiśniewski",
  "Wójcik",
  "Kowalczyk",
  "Kamiński",
  "Lewandowski",
  "Zieliński",
  "Szymański",
  "Woźniak",
  "Dąbrowski",
];
const DEPARTMENTS = [
  "Produkcja A",
  "Produkcja B",
  "Logistyka",
  "Magazyn",
  "Kontrola Jakości",
  "Utrzymanie Ruchu",
];
const JOB_TITLES = [
  "Operator Maszyn",
  "Pracownik Produkcji",
  "Magazynier",
  "Kontroler Jakości",
  "Mechanik",
  "Lider Zmiany",
];
const MANAGERS = ["Janusz Kowalski", "Grażyna Nowak", "Andrzej Wiśniewski"];
const NATIONALITIES = ["Polska", "Ukraina", "Białoruś", "Mołdawia", "Gruzja"];

const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const generateEmployee = (isTerminated: boolean): Omit<Employee, "id"> => {
  const isMale = Math.random() > 0.5;
  const firstName = randomItem(isMale ? FIRST_NAMES_M : FIRST_NAMES_F);
  const lastName = randomItem(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;

  const hireDate = subDays(new Date(), Math.floor(Math.random() * 3 * 365)); // Hired within the last 3 years
  const contractEndDate = addDays(hireDate, 365); // 1 year contract

  const terminationDate = isTerminated
    ? subDays(new Date(), Math.floor(Math.random() * 90))
    : undefined; // Terminated within last 3 months

  const status = isTerminated ? "zwolniony" : "aktywny";
  const status_fullName = `${status}_${fullName.toLowerCase()}`;

  return {
    fullName,
    hireDate: format(hireDate, "yyyy-MM-dd"),
    contractEndDate: format(contractEndDate, "yyyy-MM-dd"),
    jobTitle: randomItem(JOB_TITLES),
    department: randomItem(DEPARTMENTS),
    manager: randomItem(MANAGERS),
    cardNumber: String(Math.floor(10000 + Math.random() * 90000)),
    nationality: randomItem(NATIONALITIES),
    status,
    status_fullName,
    terminationDate: terminationDate
      ? format(terminationDate, "yyyy-MM-dd")
      : undefined,
    lockerNumber: String(Math.floor(100 + Math.random() * 900)),
    departmentLockerNumber: "",
    sealNumber: "",
    legalizationStatus: "Wiza",
    plannedTerminationDate: undefined,
    vacationStartDate: undefined,
    vacationEndDate: undefined,
  };
};

async function seedDatabase() {
  console.log("--- Starting database seed ---");
  try {
    getAdminApp();
    const db = adminDb();
    const employeesRef = ref(db, "employees");
    const configRef = ref(db, "config");

    console.log("Clearing existing data...");
    await set(employeesRef, null);

    // Seed config if it doesn't exist
    await set(configRef, {
      departments: DEPARTMENTS.map((d, i) => ({ id: `d${i}`, name: d })),
      jobTitles: JOB_TITLES.map((j, i) => ({ id: `jt${i}`, name: j })),
      managers: MANAGERS.map((m, i) => ({ id: `m${i}`, name: m })),
      nationalities: NATIONALITIES.map((n, i) => ({ id: `n${i}`, name: n })),
    });

    console.log("Generating new employee data...");
    const totalEmployees = 80;
    const terminatedCount = 20;
    const activeCount = totalEmployees - terminatedCount;

    const updates: Record<string, Employee> = {};

    for (let i = 0; i < activeCount; i++) {
      const newKey = push(employeesRef).key;
      if (newKey) {
        updates[newKey] = generateEmployee(false) as Employee;
      }
    }

    for (let i = 0; i < terminatedCount; i++) {
      const newKey = push(employeesRef).key;
      if (newKey) {
        updates[newKey] = generateEmployee(true) as Employee;
      }
    }

    console.log(
      `Generated ${Object.keys(updates).length} employees. Writing to database...`,
    );
    await update(employeesRef, updates);

    console.log("--- Database seed successful! ---");
    console.log(
      `Added ${activeCount} active and ${terminatedCount} terminated employees.`,
    );
  } catch (error) {
    console.error("--- Database seed failed ---");
    console.error(error);
    process.exit(1);
  }
}

seedDatabase().then(() => {
  process.exit(0);
});
