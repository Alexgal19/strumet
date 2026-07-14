"use client"

import { ColumnDef, HeaderContext, CellContext } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Employee } from "@/lib/types"
import { formatDate, parseMaybeDate } from "@/lib/date"
import { getStatusColor } from "@/lib/legalization-statuses"
import { cn } from "@/lib/utils"
import { EmployeeRowActions } from "./employee-actions"

interface GetColumnsProps {
  onEdit: (employee: Employee) => void
  onTerminate?: (employee: Employee) => void
  onRestore?: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onLegalizationEmail?: (employee: Employee) => void
  status: 'aktywny' | 'zwolniony'
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
      cell: ({ row }) => formatDate(row.getValue("hireDate"), "dd.MM.yyyy"),
      sortingFn: dateSortingFn,
    },
    ...(status === 'aktywny' ? [{
      accessorKey: "contractEndDate",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title="Umowa do" />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => formatDate(row.getValue("contractEndDate"), "dd.MM.yyyy"),
      sortingFn: dateSortingFn,
    }] : []),
     ...(status === 'zwolniony' ? [{
      accessorKey: "terminationDate",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title="Data zwolnienia" />
      ),
      cell: ({ row }: CellContext<Employee, unknown>) => formatDate(row.getValue("terminationDate"), "dd.MM.yyyy"),
      sortingFn: dateSortingFn,
    },
    {
      id: "daysWorked",
      header: ({ column }: HeaderContext<Employee, unknown>) => (
        <DataTableColumnHeader column={column} title="Przepracowane dni" />
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
    {
      accessorKey: "welderLicense",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Licencja spraw." />
      ),
      cell: ({ row }) => {
        const value = row.getValue("welderLicense") as string | undefined;
        return <span>{value === 'Tak' ? 'Tak' : 'Nie'}</span>;
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
      cell: ({ row }) => {
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative cursor-pointer"
          >
            <EmployeeRowActions
              row={row}
              onEdit={onEdit}
              onTerminate={onTerminate}
              onRestore={onRestore}
              onDelete={onDelete}
              onLegalizationEmail={onLegalizationEmail}
            />
          </div>
        );
      },
      header: () => null,
    },
  ]
}
