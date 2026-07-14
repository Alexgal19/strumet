"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import type { Car } from "@/lib/types"
import { formatDate, parseMaybeDate } from "@/lib/date"
import { CarRowActions } from "./car-actions"
import { ShieldAlert, ShieldCheck, Wrench } from "lucide-react"

interface GetColumnsProps {
  onEdit: (car: Car) => void
  onTerminate?: (car: Car) => void
  onRestore?: (car: Car) => void
  onDelete: (car: Car) => void
  status: 'active' | 'history'
}

const dateSortingFn = (rowA: any, rowB: any, columnId: string) => {
    const dateA = parseMaybeDate(rowA.getValue(columnId));
    const dateB = parseMaybeDate(rowB.getValue(columnId));

    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;

    return dateA.getTime() - dateB.getTime();
}

function getExpiryStatus(dateStr: string | null | undefined): 'ok' | 'warning' | 'expired' | 'none' {
  if (!dateStr) return 'none';
  const date = parseMaybeDate(dateStr);
  if (!date) return 'none';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  thirtyDaysFromNow.setHours(0, 0, 0, 0);

  if (date < now) return 'expired';
  if (date <= thirtyDaysFromNow) return 'warning';
  return 'ok';
}

function renderExpiryCell(dateStr: string | null | undefined, type: 'insurance' | 'inspection') {
  const status = getExpiryStatus(dateStr);
  const formatted = formatDate(dateStr, "dd.MM.yyyy");
  
  if (status === 'none') return <span className="text-muted-foreground">-</span>;
  
  let icon = null;
  let textColor = "text-foreground";
  
  if (status === 'expired') {
    icon = <ShieldAlert className="w-4 h-4 text-destructive mr-1.5" />;
    textColor = "text-destructive font-bold";
  } else if (status === 'warning') {
    icon = <ShieldAlert className="w-4 h-4 text-amber-500 mr-1.5" />;
    textColor = "text-amber-500 font-medium";
  } else {
    icon = type === 'insurance' 
      ? <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1.5" /> 
      : <Wrench className="w-4 h-4 text-emerald-500 mr-1.5" />;
  }

  return (
    <div className={`flex items-center ${textColor}`}>
      {icon}
      <span>{formatted}</span>
    </div>
  );
}

export function getColumns({
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
  status
}: GetColumnsProps): ColumnDef<Car>[] {
  return [
    {
      accessorKey: "registrationNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rejestracja" />
      ),
      cell: ({ row }) => (
        <span className="font-bold uppercase tracking-wider">{row.getValue("registrationNumber")}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "makeModel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Marka / Model" />
      ),
      cell: ({ row }) => (
        <span>{row.getValue("makeModel") || "-"}</span>
      ),
    },
    {
      accessorKey: "driverFullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Kierowca" />
      ),
      cell: ({ row }) => {
        const driverName = row.getValue("driverFullName") as string;
        return driverName ? (
          <span className="font-medium text-primary">{driverName}</span>
        ) : (
          <span className="text-muted-foreground italic text-sm">Brak</span>
        );
      },
    },
    {
      accessorKey: "dateFrom",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Od kiedy" />
      ),
      cell: ({ row }) => formatDate(row.getValue("dateFrom"), "dd.MM.yyyy"),
      sortingFn: dateSortingFn,
    },
    ...(status === 'history' ? [{
      accessorKey: "dateTo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Do kiedy" />
      ),
      cell: ({ row }) => formatDate(row.getValue("dateTo"), "dd.MM.yyyy"),
      sortingFn: dateSortingFn,
    } as ColumnDef<Car>] : []),
    ...(status === 'active' ? [
      {
        accessorKey: "insuranceEndDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ubezpieczenie do" />
        ),
        cell: ({ row }) => renderExpiryCell(row.getValue("insuranceEndDate"), 'insurance'),
        sortingFn: dateSortingFn,
      } as ColumnDef<Car>,
      {
        accessorKey: "inspectionEndDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Przegląd do" />
        ),
        cell: ({ row }) => renderExpiryCell(row.getValue("inspectionEndDate"), 'inspection'),
        sortingFn: dateSortingFn,
      } as ColumnDef<Car>,
    ] : []),
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end pr-2">
            <CarRowActions 
              row={row} 
              onEdit={onEdit}
              onTerminate={onTerminate}
              onRestore={onRestore}
              onDelete={onDelete}
            />
        </div>
      ),
    },
  ]
}
