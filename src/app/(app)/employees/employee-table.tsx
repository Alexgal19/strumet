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
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Loader2, UserX } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Employee, AllConfig } from "@/lib/types"
import { DataTableToolbar } from "./data-table-toolbar"
import { getColumns } from "./columns"
import { useIsMobile } from "@/hooks/use-mobile"
import { EmployeeCard } from "@/components/employee-card"
import { cn } from "@/lib/utils"
import { getStatusColor } from "@/lib/legalization-statuses"

interface EmployeeTableProps {
  data: Employee[]
  isLoading: boolean
  status: "aktywny" | "zwolniony"
  config: AllConfig
  onEdit: (employee: Employee) => void
  onTerminate?: (employee: Employee) => void
  onRestore?: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  exportColumns?: { key: keyof Employee; name: string }[]
  exportFileName?: string
}

export function EmployeeTable({
  data,
  isLoading,
  status,
  config,
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
  exportColumns,
  exportFileName,
}: EmployeeTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    {
        id: 'hireDate',
        desc: true,
    }
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const isMobile = useIsMobile()

  // Memoize options for filters
  const departmentOptions = React.useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);
  const jobTitleOptions = React.useMemo(() => config.jobTitles.map(j => ({ value: j.name, label: j.name })), [config.jobTitles]);
  const managerOptions = React.useMemo(() => config.managers.map(m => ({ value: m.name, label: m.name })), [config.managers]);
  const nationalityOptions = React.useMemo(() => config.nationalities.map(n => ({ value: n.name, label: n.name })), [config.nationalities]);
  
  const lastNameOptions = React.useMemo(() => {
    const lastNames = data.map(e => {
        const nameParts = e.fullName.trim().split(' ');
        return nameParts.pop() || '';
    });
    return [...new Set(lastNames)].sort().map(lastName => ({ value: lastName, label: lastName }));
  }, [data]);

  const columns = React.useMemo(
    () =>
      getColumns({
        onEdit,
        onTerminate,
        onRestore,
        onDelete,
        status,
      }),
    [onEdit, onTerminate, onRestore, onDelete, status]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, columnId, filterValue) => {
        const searchValue = filterValue.toLowerCase();
        const fullName = row.original.fullName.toLowerCase();
        const cardNumber = row.original.cardNumber?.toLowerCase() || '';
        return fullName.includes(searchValue) || cardNumber.includes(searchValue);
    }
  })

  // We need all rows for virtualization
  const { rows } = table.getRowModel()

  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 170 : 45), // Adjusted estimate
    overscan: 5,
  })

  if (isLoading && data.length === 0) {
    return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  // Mobile View
  if (isMobile) {
    if (rows.length === 0) {
         return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
          <UserX className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold">Brak pracowników</h3>
          <p className="text-sm">Nie znaleziono pracowników pasujących do wybranych kryteriów filtrowania.</p>
        </div>
      )
    }

    return (
        <div className="flex flex-col h-full space-y-4">
        <DataTableToolbar
          table={table}
          departmentOptions={departmentOptions}
               jobTitleOptions={jobTitleOptions}
               managerOptions={managerOptions}
               nationalityOptions={nationalityOptions}
               lastNameOptions={lastNameOptions}
               exportColumns={exportColumns}
               exportFileName={exportFileName}
             />
            <div ref={parentRef} className="w-full h-full overflow-y-auto">
                <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
                >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const row = rows[virtualItem.index];
                    const employee = row.original;
                    return (
                    <div
                        key={virtualItem.key}
                        style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="p-2"
                    >
                         <EmployeeCard 
                            employee={employee}
                            onEdit={() => onEdit(employee)}
                            onTerminate={onTerminate ? () => onTerminate(employee) : undefined}
                            onRestore={onRestore ? () => onRestore(employee) : undefined}
                            onDeletePermanently={() => onDelete(employee)}
                        />
                    </div>
                    );
                })}
                </div>
            </div>
        </div>
    )
  }

  // Desktop View
  const virtualItems = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0

  return (
    <div className="flex flex-col h-full space-y-4">
      <DataTableToolbar
        table={table}
        departmentOptions={departmentOptions}
         jobTitleOptions={jobTitleOptions}
         managerOptions={managerOptions}
         nationalityOptions={nationalityOptions}
         lastNameOptions={lastNameOptions}
         exportColumns={exportColumns}
         exportFileName={exportFileName}
     />
      <div
        ref={parentRef}
        className="flex-grow overflow-auto rounded-md border"
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
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
            {rows?.length ? (
               <>
                 {paddingTop > 0 && (
                    <tr>
                      <td colSpan={columns.length} style={{ height: `${paddingTop}px` }} />
                    </tr>
                 )}
                 {virtualItems.map((virtualRow) => {
                    const row = rows[virtualRow.index]
                    const status = row.original.legalizationStatus;
                    let rowClassName = "cursor-pointer";
                    if (status && status !== 'Brak') {
                         const colorClass = getStatusColor(status, true);
                         rowClassName = cn(rowClassName, colorClass);
                    }

                    return (
                        <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            onClick={() => onEdit(row.original)}
                            className={rowClassName}
                        >
                             {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                )}
                                </TableCell>
                            ))}
                        </TableRow>
                    )
                 })}
                 {paddingBottom > 0 && (
                    <tr>
                      <td colSpan={columns.length} style={{ height: `${paddingBottom}px` }} />
                    </tr>
                 )}
               </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
                        <UserX className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">Brak wyników</h3>
                        <p className="text-sm max-w-sm">
                            Nie znaleziono pracowników pasujących do wybranych kryteriów.
                        </p>
                    </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} z{" "}
        {table.getFilteredRowModel().rows.length} wierszy wybrano.
      </div>
    </div>
  )
}
