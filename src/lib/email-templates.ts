/**
 * Email template variable interpolation
 */
export function interpolateTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Build variable map from employee data
 */
export function buildTemplateVars(employee: {
  fullName: string;
  department: string;
  jobTitle: string;
  manager: string;
  hireDate?: string;
  contractEndDate?: string;
  legalizationStatus?: string;
}) {
  return {
    employeeFullName: employee.fullName,
    employeeEmail: '', // employees don't have email field in this system
    contractEndDate: employee.contractEndDate ?? '',
    department: employee.department,
    jobTitle: employee.jobTitle,
    managerName: employee.manager,
    hireDate: employee.hireDate ?? '',
    companyName: 'Strumet',
    daysUntilExpiry: 0, // default, will be overridden if contractEndDate exists
  };
}

/**
 * Parse days until expiry from contract end date
 */
export function getDaysUntilExpiry(contractEndDate: string | undefined): number | null {
  if (!contractEndDate) return null;
  const end = new Date(contractEndDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}