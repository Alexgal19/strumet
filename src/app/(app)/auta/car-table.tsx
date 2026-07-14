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
import { Loader2, Car as CarIcon } from "lucide-react"

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
import { cn } from "@/lib/utils"

interface CarTableProps {
  data: Car[]
  isLoading: boolean
  status: "active" | "history"
  onEdit: (car: Car) => void
  onTerminate?: (car: Car) => void
  onRestore?: (car: Car) => void
  onDelete: (car: Car) => void
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-card/50 rounded-xl border border-border/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Ładowanie danych aut...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div 
        ref={parentRef} 
        className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-auto max-h-[calc(100dvh-220px)] custom-scrollbar"
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
