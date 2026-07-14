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
import { Loader2, UserX, ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


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
  onLegalizationEmail?: (employee: Employee) => void
  onAbsenceEmail?: (employee: Employee) => void
  exportColumns?: { key: keyof Employee; name: string }[]
  exportFileName?: string
  initialSorting?: SortingState
}

export function EmployeeTable({
  data,
  isLoading,
  status: tableStatus,
  config,
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
  onLegalizationEmail,
  onAbsenceEmail,
  exportColumns,
  exportFileName,
  initialSorting = [],
}: EmployeeTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
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
        onLegalizationEmail,
        onAbsenceEmail,
        status: tableStatus,
      }),
    [onEdit, onTerminate, onRestore, onDelete, onLegalizationEmail, onAbsenceEmail, tableStatus]
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
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = String(filterValue).toLowerCase().trim();
      if (!searchValue) return true;

      // Excel-like search: split query into individual words (AND logic)
      // Each word must match at least one field in the row
      const searchWords = searchValue.split(/\s+/).filter(Boolean);
      if (searchWords.length === 0) return true;

      const employee = row.original;

      // Collect all searchable fields
      const searchableFields: string[] = [
        String(employee.fullName || "").toLowerCase(),
        String(employee.cardNumber || "").toLowerCase(),
        String(employee.department || "").toLowerCase(),
        String(employee.jobTitle || "").toLowerCase(),
        String(employee.manager || "").toLowerCase(),
        String(employee.nationality || "").toLowerCase(),
        String(employee.lockerNumber || "").toLowerCase(),
        String(employee.departmentLockerNumber || "").toLowerCase(),
        String(employee.sealNumber || "").toLowerCase(),
        String(employee.welderLicense || "").toLowerCase(),
        String(employee.legalizationStatus || "").toLowerCase(),
      ];

      // Also extract firstName and lastName separately for better matching
      const nameParts = employee.fullName?.trim().split(/\s+/) || [];
      if (nameParts.length >= 2) {
        const lastName = nameParts.pop() || "";
        const firstName = nameParts.join(" ");
        searchableFields.push(firstName.toLowerCase());
        searchableFields.push(lastName.toLowerCase());
      }

      // Excel-like AND logic: every search word must be found in at least one field
      return searchWords.every(word =>
        searchableFields.some(field => field.includes(word))
      );
    }
  })

  // We need all rows for virtualization
  const { rows } = table.getRowModel()

  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 85 : 45),
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
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
      <div className="flex flex-col h-full">
        <div className="px-3 pt-2 pb-1.5 bg-background border-b border-border/40 space-y-2">
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
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : ''}
              onValueChange={(val) => {
                if (!val) {
                  setSorting([]);
                  return;
                }
                const [id, dir] = val.split(':') as [string, 'asc' | 'desc'];
                setSorting([{ id, desc: dir === 'desc' }]);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Sortuj według..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fullName:asc">Nazwisko A-Z</SelectItem>
                <SelectItem value="fullName:desc">Nazwisko Z-A</SelectItem>
                <SelectItem value="hireDate:desc">Data zatrudnienia (najnowsze)</SelectItem>
                <SelectItem value="hireDate:asc">Data zatrudnienia (najstarsze)</SelectItem>
                <SelectItem value="department:asc">Dział A-Z</SelectItem>
                <SelectItem value="jobTitle:asc">Stanowisko A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div ref={parentRef} className="flex-1 overflow-y-auto">
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
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    padding: '4px 12px',
                  }}
                >
                  <EmployeeCard
                    employee={employee}
                    onEdit={() => onEdit(employee)}
                    onTerminate={onTerminate ? () => onTerminate(employee) : undefined}
                    onRestore={onRestore ? () => onRestore(employee) : undefined}
                    onDeletePermanently={() => onDelete(employee)}
                    onLegalizationEmail={onLegalizationEmail ? () => onLegalizationEmail(employee) : undefined}
                    onAbsenceEmail={onAbsenceEmail ? () => onAbsenceEmail(employee) : undefined}
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
    <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden animate-in-slide-up">
      <div className="px-6 py-4 border-b bg-background relative z-10">
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
      </div>
      <div
        ref={parentRef}
        className="flex-grow overflow-auto"
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
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
                  const legalizationStatus = row.original.legalizationStatus;
                  let rowClassName = tableStatus === 'zwolniony' ? "" : "cursor-pointer";
                  if (legalizationStatus && legalizationStatus !== 'Brak') {
                    const colorClass = getStatusColor(legalizationStatus, true);
                    rowClassName = cn(rowClassName, colorClass);
                  }

                  return (
                    <TableRow
                      key={row.id}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => onEdit(row.original)}
                      className={rowClassName}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isActions = cell.column.id === 'actions';
                        return (
                          <TableCell
                            key={cell.id}
                            onClick={isActions ? (e) => e.stopPropagation() : undefined}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        );
                      })}
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
