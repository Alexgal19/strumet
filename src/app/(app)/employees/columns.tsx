"use client"

import { ColumnDef, HeaderContext, CellContext } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Employee } from "@/lib/types"
import { formatDate, parseMaybeDate, vacationHasStarted } from "@/lib/date"
import { getStatusColor } from "@/lib/legalization-statuses"
import { cn } from "@/lib/utils"
import { Copy, UserX } from "lucide-react"
import { getEmployeeNameParts } from "@/lib/person-name"
import { EmployeeRowActions } from "./employee-actions"
import type { I18nValue } from "@/lib/i18n"

const isPlannedTermination = (employee: Employee): boolean => {
  const planned = parseMaybeDate(employee.plannedTerminationDate);
  if (!planned) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return startOfDayCompare(planned, today) >= 0;
};

const startOfDayCompare = (a: Date, b: Date): number => {
  const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return aDay - bDay;
};

interface GetColumnsProps {
  onEdit: (employee: Employee) => void
  onTerminate?: (employee: Employee) => void
  onRestore?: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onLegalizationEmail?: (employee: Employee) => void
  onAbsenceEmail?: (employee: Employee) => void
  onToggleAbsenceToday?: (employee: Employee, isAbsent: boolean) => void
  onDuplicate?: (employee: Employee) => void
  absentTodayIds?: Set<string>
  status: 'aktywny' | 'zwolniony'
  t: I18nValue['t']
}

// Custom, robust sorting function for dates.
// It uses the same reliable `parseMaybeDate` utility as other parts of the app.
const dateSortingFn = (rowA: any, rowB: any, columnId: string) => {
    const dateA = parseMaybeDate(rowA.getValue(columnId));
    const dateB = parseMaybeDate(rowB.getValue(columnId));

    // Treat nulls as "smaller" so they appear at the end in descending sort
    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;

    return dateA.getTime() - dateB.getTime();
}

export function getColumns({
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
  onLegalizationEmail,
  onAbsenceEmail,
  onToggleAbsenceToday,
  onDuplicate,
  absentTodayIds,
  status,
  t,
}: GetColumnsProps): ColumnDef<Employee>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllRowsSelected() ||
            (table.getIsSomeRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          aria-label={t('employee.selectAll')}
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('employee.selectRow')}
            className="translate-y-[2px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "lastName",
      accessorFn: (row) => getEmployeeNameParts(row).lastName,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.lastName')} />
      ),
      cell: ({ row }) => {
        const employee = row.original;
        const { lastName } = getEmployeeNameParts(employee);
        const onVacation = vacationHasStarted(employee.vacationStartDate);
        const plannedTerm = isPlannedTermination(employee);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{lastName}</span>
            {onVacation && (
              <Badge
                className="animate-pulse bg-pink-500 text-white hover:bg-pink-500"
                title={employee.vacationEndDate ? t('employee.onVacationUntil', { date: formatDate(employee.vacationEndDate) }) : t('employee.onVacation')}
              >
                {t('employee.onVacationBadge')}
              </Badge>
            )}
            {plannedTerm && (
              <Badge
                variant="outline"
                className="whitespace-nowrap border-orange-500/60 text-orange-600 dark:text-orange-400"
                title={t('employee.plannedTermination', { date: formatDate(employee.plannedTerminationDate) })}
              >
                {t('employee.leaving')}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: "firstName",
      accessorFn: (row) => getEmployeeNameParts(row).firstName,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.firstName')} />
      ),
      cell: ({ row }) => {
        const { firstName } = getEmployeeNameParts(row.original);
        return <span className="font-medium">{firstName}</span>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "hireDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.hireDate')} />
      ),
      cell: ({ row }) => formatDate(row.getValue("hireDate"), "dd.MM.yyyy"),
      sortingFn: dateSortingFn,
    },
    ...(status === 'aktywny' ? [{
      accessorKey: "contractEndDate",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title={t('employee.contractEndDate')} />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => formatDate(row.getValue("contractEndDate"), "dd.MM.yyyy"),
      sortingFn: dateSortingFn,
    }] : []),
     ...(status === 'zwolniony' ? [{
      accessorKey: "terminationDate",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title={t('employee.terminationDate')} />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => formatDate(row.getValue("terminationDate"), "dd.MM.yyyy"),
      sortingFn: dateSortingFn,
    },
    {
      id: "daysWorked",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title={t('employee.daysWorked')} />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => {
        const hireDate = parseMaybeDate(row.original.hireDate);
        const termDate = parseMaybeDate(row.original.terminationDate);
        if (hireDate && termDate) {
          const diff = Math.floor((termDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
          return <span>{Math.max(0, diff)}</span>;
        }
        return <span className="text-muted-foreground">—</span>;
      },
      sortingFn: (rowA: any, rowB: any) => {
        const getDays = (row: any) => {
          const h = parseMaybeDate(row.original.hireDate);
          const t = parseMaybeDate(row.original.terminationDate);
          if (h && t) return Math.floor((t.getTime() - h.getTime()) / (1000 * 60 * 60 * 24));
          return -1;
        };
        return getDays(rowA) - getDays(rowB);
      }
    },
    {
      accessorKey: "terminationReason",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title={t('employee.terminationReason')} />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => {
        const reason = row.original.terminationReason;
        return reason ? <span>{reason}</span> : <span className="text-muted-foreground">—</span>;
      },
    }] : []),
    {
      accessorKey: "jobTitle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.jobTitle')} />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.department')} />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "manager",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.manager')} />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "cardNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.cardNumber')} />
      ),
    },
    {
      accessorKey: "nationality",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.nationality')} />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "welderLicense",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('employee.welderLicenseShort')} />
      ),
      cell: ({ row }) => {
        const value = row.getValue("welderLicense") as string | undefined;
        return <span>{value === 'Tak' ? t('common.yes') : t('common.no')}</span>;
      },
      filterFn: (row, id, value) => {
        if (!value || value.length === 0) return true;
        const cellValue = row.getValue(id) as string | undefined;
        const normalized = cellValue === 'Tak' ? 'Tak' : 'Nie';
        return value.includes(normalized);
      },
    },
    ...(status === 'aktywny' ? [{
      accessorKey: "legalizationStatus",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title={t('employee.legalizationStatus')} />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => {
        const status = row.getValue("legalizationStatus") as string | undefined;
        if (!status || status === "Brak") {
          return <span className="text-muted-foreground">—</span>;
        }
        const colorClass = getStatusColor(status);
        return (
          <Badge className={cn("text-xs font-semibold", colorClass)}>
            {status}
          </Badge>
        );
      },
    }] : []),

    {
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original;
        const isAbsentToday = absentTodayIds?.has(employee.id) ?? false;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative cursor-pointer"
          >
            <div className="flex items-center gap-1">
              {onToggleAbsenceToday && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    isAbsentToday
                      ? "text-destructive bg-destructive/10 hover:bg-destructive/20"
                      : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  )}
                  title={isAbsentToday ? t('employee.absentTodayUndo') : t('employee.markAbsentToday')}
                  onClick={() => onToggleAbsenceToday(employee, isAbsentToday)}
                >
                  <UserX className="h-4 w-4" />
                  <span className="sr-only">{t('employee.absentToday')}</span>
                </Button>
              )}
              <EmployeeRowActions
                row={row}
                onEdit={onEdit}
                onTerminate={onTerminate}
                onRestore={onRestore}
                onDelete={onDelete}
                onLegalizationEmail={onLegalizationEmail}
                onAbsenceEmail={onAbsenceEmail}
                onDuplicate={onDuplicate}
              />
            </div>
          </div>
        );
      },
      header: () => null,
    },
  ]
}
