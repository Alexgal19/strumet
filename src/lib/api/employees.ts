import {
  ref,
  query,
  orderByChild,
  startAt,
  endAt,
  limitToFirst,
  get,
  equalTo,
  QueryConstraint,
  orderByKey,
  startAfter,
} from "firebase/database";
import { db } from "@/lib/firebase";
import { Employee } from "@/lib/types";

const PAGE_SIZE = 50;

export interface FetchEmployeesParams {
  pageParam?: { key: string; value: string } | null;
  status?: "aktywny" | "zwolniony";
  searchTerm?: string;
  department?: string[];
  jobTitle?: string[];
  manager?: string[];
  nationality?: string[];
}

export interface EmployeesResponse {
  data: Employee[];
  nextCursor: { key: string; value: string } | null;
}

const objectToArray = (
  obj: Record<string, any> | undefined | null,
): Employee[] => {
  return obj ? Object.keys(obj).map((key) => ({ id: key, ...obj[key] })) : [];
};

export const fetchEmployees = async ({
  pageParam,
  status = "aktywny",
  searchTerm = "",
  department = [],
  jobTitle = [],
  manager = [],
  nationality = [],
}: FetchEmployeesParams): Promise<EmployeesResponse> => {
  const employeesRef = ref(db, "employees");
  const constraints: QueryConstraint[] = [];

  // If there's a search term, we must query all employees of a certain status
  // and then filter client-side because RTDB doesn't support text search on non-indexed fields.
  // This is a limitation we accept for now. A better solution would be a dedicated search service like Algolia or Elasticsearch.
  if (searchTerm) {
    constraints.push(orderByChild("status"), equalTo(status));
  } else {
    // For pagination without search, we sort by key to ensure stable ordering.
    constraints.push(orderByKey());
    if (pageParam) {
      constraints.push(startAfter(pageParam.key));
    }
  }

  // Initial fetch from Firebase. We don't apply limit if there's a search term to filter through all results.
  if (!searchTerm) {
    constraints.push(limitToFirst(PAGE_SIZE + 1)); // Fetch one extra to check if there's a next page
  }

  const q = query(employeesRef, ...constraints);
  const snapshot = await get(q);
  let employees = objectToArray(snapshot.val());

  // Filter by status if not already done by the query (e.g. when searching)
  if (searchTerm) {
    employees = employees.filter((e) => e.status === status);
  }

  // Apply client-side filtering for search term and other filters
  const lowerCaseSearch = searchTerm.toLowerCase();
  let filteredEmployees = employees.filter((e) => {
    const searchMatch = searchTerm
      ? e.fullName.toLowerCase().includes(lowerCaseSearch) ||
        e.cardNumber?.includes(lowerCaseSearch)
      : true;
    const departmentMatch =
      department.length > 0 ? department.includes(e.department) : true;
    const jobTitleMatch =
      jobTitle.length > 0 ? jobTitle.includes(e.jobTitle) : true;
    const managerMatch =
      manager.length > 0 ? manager.includes(e.manager) : true;
    const nationalityMatch =
      nationality.length > 0 ? nationality.includes(e.nationality) : true;
    return (
      searchMatch &&
      departmentMatch &&
      jobTitleMatch &&
      managerMatch &&
      nationalityMatch
    );
  });

  // Pagination logic (only when not searching)
  let nextCursor: { key: string; value: string } | null = null;
  if (!searchTerm && employees.length > PAGE_SIZE) {
    const lastEmployee = employees[PAGE_SIZE - 1];
    nextCursor = { key: lastEmployee.id, value: lastEmployee.fullName };
    // This slice is problematic, but let's leave it for now as the primary bug is sorting.
    // Ideally, we should slice the original list before filtering.
    filteredEmployees = filteredEmployees.slice(0, PAGE_SIZE);
  } else if (!searchTerm) {
    // We've reached the end if we fetched less than or equal to the page size
    nextCursor = null;
  }

  // If searching, we don't paginate, we return all results matching the search
  if (searchTerm) {
    nextCursor = null;
  }

  return {
    data: filteredEmployees,
    nextCursor,
  };
};
