"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Loader2, Car as CarIcon, MoreVertical, ShieldAlert, ShieldCheck, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Car } from "@/lib/types"
import { getColumns } from "./columns"
import { formatDate, parseMaybeDate } from "@/lib/date"
import { useIsMobile } from "@/hooks/use-mobile"

interface CarTableProps {
  data: Car[]
  isLoading: boolean
  status: "active" | "history"
  onEdit: (car: Car) => void
  onTerminate?: (car: Car) => void
  onRestore?: (car: Car) => void
  onDelete: (car: Car) => void
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

function renderMobileStatusRow(dateStr: string | null | undefined, type: 'insurance' | 'inspection') {
  const status = getExpiryStatus(dateStr);
  const formatted = formatDate(dateStr, "dd.MM.yyyy");
  const label = type === 'insurance' ? 'Ubezpieczenie' : 'Przegląd';

  if (status === 'none') {
    return (
      <div key={type} className="flex items-center text-sm text-muted-foreground">
        <span>{label}: -</span>
      </div>
    );
  }

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
    <div key={type} className={`flex items-center text-sm ${textColor}`}>
      {icon}
      <span>{label}: {formatted}</span>
    </div>
  );
}

export function CarTable({
  data,
  isLoading,
  status: tableStatus,
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
}: CarTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns = React.useMemo(
    () =>
      getColumns({
        onEdit,
        onTerminate,
        onRestore,
        onDelete,
        status: tableStatus,
      }),
    [onEdit, onTerminate, onRestore, onDelete, tableStatus]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const { rows } = table.getRowModel()
  
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  })

  const isMobile = useIsMobile()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-card/50 rounded-xl border border-border/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Ładowanie danych aut...</p>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {data.length === 0 ? (
          <div className="rounded-xl border bg-card/50 h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <CarIcon className="h-8 w-8 opacity-20" />
            <p className="text-sm">Brak aut w bazie.</p>
          </div>
        ) : (
          data.map((car) => (
            <Card key={car.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-base uppercase tracking-wider">{car.registrationNumber}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Akcje">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="min-h-[48px]" onClick={() => onEdit(car)}>
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="min-h-[48px] text-destructive focus:text-destructive"
                      onClick={() => onDelete(car)}
                    >
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-muted-foreground">{car.makeModel || "-"}</p>
              <div className="text-sm">
                {car.driverFullName ? (
                  <span className="font-medium text-primary">{car.driverFullName}</span>
                ) : (
                  <span className="text-muted-foreground italic">Brak kierowcy</span>
                )}
              </div>
              {tableStatus === 'active' && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                  {renderMobileStatusRow(car.insuranceEndDate, 'insurance')}
                  {renderMobileStatusRow(car.inspectionEndDate, 'inspection')}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div 
        ref={parentRef} 
        className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-auto max-h-[calc(100dvh-220px)] custom-scrollbar [&>div]:overflow-visible"
      >
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-20 backdrop-blur-md">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-border/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan} className="font-semibold text-xs uppercase tracking-wider h-11">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              <>
                <tr style={{ height: `${virtualizer.getTotalSize()}px`, display: 'block', width: '100%' }}></tr>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="group cursor-pointer hover:bg-muted/30 transition-colors border-b-border/50 absolute w-full"
                      style={{
                        top: 0,
                        left: 0,
                        transform: `translateY(${virtualRow.start}px)`,
                        height: `${virtualRow.size}px`,
                      }}
                      onClick={(e) => {
                          // Prevent opening edit form if clicking on actions button
                          if ((e.target as HTMLElement).closest('button')) return;
                          onEdit(row.original);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                            key={cell.id} 
                            className="py-3 h-full"
                            style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <CarIcon className="h-8 w-8 opacity-20" />
                    <p>Brak aut w tej zakładce.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
