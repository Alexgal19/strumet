"use client"

import { ColumnDef, HeaderContext, CellContext } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Employee } from "@/lib/types"
import { formatDate } from "@/lib/date"
import { getStatusColor } from "@/lib/legalization-statuses"
import { cn } from "@/lib/utils"
import { EmployeeRowActions } from "./employee-actions"

interface GetColumnsProps {
  onEdit: (employee: Employee) => void
  onTerminate?: (employee: Employee) => void
  onRestore?: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  status: 'aktywny' | 'zwolniony'
}

export function getColumns({
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
  status
}: GetColumnsProps): ColumnDef<Employee>[] {
  return [
    {
      id: "lastName",
      accessorFn: (row) => {
        const nameParts = row.fullName.trim().split(' ');
        return nameParts.pop() || '';
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nazwisko" />
      ),
      cell: ({ row }) => {
        const nameParts = row.original.fullName.trim().split(' ');
        const lastName = nameParts.pop() || '';
        return <span className="font-medium">{lastName}</span>;
      },
      enableSorting: true,
    },
    {
      id: "firstName",
      accessorFn: (row) => {
        const nameParts = row.fullName.trim().split(' ');
        nameParts.pop();
        return nameParts.join(' ');
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Imię" />
      ),
      cell: ({ row }) => {
        const nameParts = row.original.fullName.trim().split(' ');
        nameParts.pop();
        const firstName = nameParts.join(' ');
        return <span className="font-medium">{firstName}</span>;
      },
      enableSorting: false, 
    },
    {
      accessorKey: "hireDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data zatrudnienia" />
      ),
      cell: ({ row }) => formatDate(row.getValue("hireDate")),
    },
    ...(status === 'aktywny' ? [{
      accessorKey: "contractEndDate",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title="Umowa do" />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => formatDate(row.getValue("contractEndDate")),
    }] : []),
     ...(status === 'zwolniony' ? [{
      accessorKey: "terminationDate",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title="Data zwolnienia" />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => formatDate(row.getValue("terminationDate")),
    }] : []),
    {
      accessorKey: "jobTitle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stanowisko" />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dział" />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "manager",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kierownik" />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "cardNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nr karty" />
      ),
    },
    {
      accessorKey: "nationality",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Narodowość" />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    ...(status === 'aktywny' ? [{
      accessorKey: "legalizationStatus",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title="Status legalizacyjny" />
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
      cell: ({ row }) => (
        <EmployeeRowActions
          row={row}
          onEdit={onEdit}
          onTerminate={onTerminate}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ),
    },
  ]
}
