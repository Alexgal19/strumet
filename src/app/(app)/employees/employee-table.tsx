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
import { Loader2, UserX, ArrowUpDown, Users, RotateCcw, Trash2, CalendarX, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Employee, AllConfig } from "@/lib/types"
import { excelLikeMatch } from "@/lib/search"
import { useAppContext } from "@/context/app-context"
import { DataTableToolbar } from "./data-table-toolbar"
import { getColumns } from "./columns"
import { useIsMobile } from "@/hooks/use-mobile"
import { EmployeeCard } from "@/components/employee-card"
import { ExcelExportButton } from "@/components/excel-export-button"
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
  onDuplicate?: (employee: Employee) => void
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
  onDuplicate,
  exportColumns,
  exportFileName,
  initialSorting = [],
}: EmployeeTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [globalFilter, setGlobalFilter] = React.useState("")

  const { absences, addAbsence, deleteAbsence, handleTerminateEmployee, handleRestoreEmployee, handleDeleteEmployeePermanently } = useAppContext()

  const [bulkConfirm, setBulkConfirm] = React.useState<'terminate' | 'delete' | null>(null)
  const [isBulkWorking, setIsBulkWorking] = React.useState(false)

  // Mapa nieobecnych dzisiaj: employeeId -> absenceId
  const todayString = new Date().toISOString().slice(0, 10)
  const absentTodayMap = React.useMemo(() => {
    const map = new Map<string, string>()
    absences.forEach(a => {
      if (a.date === todayString) map.set(a.employeeId, a.id)
    })
    return map
  }, [absences, todayString])

  const handleToggleAbsenceToday = React.useCallback(
    async (employee: Employee, isAbsent: boolean) => {
      if (isAbsent) {
        const absenceId = absentTodayMap.get(employee.id)
        if (absenceId) await deleteAbsence(absenceId)
      } else {
        await addAbsence(employee.id, todayString)
      }
    },
    [absentTodayMap, addAbsence, deleteAbsence, todayString]
  )

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
        onDuplicate,
        onToggleAbsenceToday:
          tableStatus === 'aktywny' ? handleToggleAbsenceToday : undefined,
        absentTodayIds:
          tableStatus === 'aktywny'
            ? new Set(absentTodayMap.keys())
            : undefined,
        status: tableStatus,
      }),
    [onEdit, onTerminate, onRestore, onDelete, onLegalizationEmail, onAbsenceEmail, onDuplicate, handleToggleAbsenceToday, absentTodayMap, tableStatus]
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
      const employee = row.original;

      // Wyszukiwanie w stylu Excel: każde słowo zapytania musi wystąpić
      // w co najmniej jednym polu (ignoruje wielkość liter i polskie znaki).
      return excelLikeMatch(String(filterValue ?? ''), [
        employee.fullName,
        employee.cardNumber,
        employee.department,
        employee.jobTitle,
        employee.manager,
        employee.nationality,
        employee.lockerNumber,
        employee.departmentLockerNumber,
        employee.sealNumber,
        employee.welderLicense,
        employee.legalizationStatus,
      ]);
    },
  })

  // We need all rows for virtualization
  const { rows } = table.getRowModel()

  // --- Bulk actions ---
  const selectedEmployees = React.useMemo(
    () => table.getFilteredSelectedRowModel().rows.map(r => r.original as Employee),
    [table]
  )

  const handleBulkAbsence = React.useCallback(async () => {
    for (const employee of selectedEmployees) {
      if (!absentTodayMap.has(employee.id)) {
        await addAbsence(employee.id, todayString)
      }
    }
    setRowSelection({})
  }, [selectedEmployees, absentTodayMap, addAbsence, todayString])

  const handleBulkTerminate = React.useCallback(async () => {
    setIsBulkWorking(true)
    try {
      for (const employee of selectedEmployees) {
        await handleTerminateEmployee(employee.id, employee.fullName)
      }
    } finally {
      setIsBulkWorking(false)
      setBulkConfirm(null)
      setRowSelection({})
    }
  }, [selectedEmployees, handleTerminateEmployee])

  const handleBulkRestore = React.useCallback(async () => {
    setIsBulkWorking(true)
    try {
      for (const employee of selectedEmployees) {
        await handleRestoreEmployee(employee.id, employee.fullName)
      }
    } finally {
      setIsBulkWorking(false)
      setRowSelection({})
    }
  }, [selectedEmployees, handleRestoreEmployee])

  const handleBulkDelete = React.useCallback(async () => {
    setIsBulkWorking(true)
    try {
      for (const employee of selectedEmployees) {
        await handleDeleteEmployeePermanently(employee.id)
      }
    } finally {
      setIsBulkWorking(false)
      setBulkConfirm(null)
      setRowSelection({})
    }
  }, [selectedEmployees, handleDeleteEmployeePermanently])

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
                    isAbsentToday={
                      tableStatus === 'aktywny'
                        ? absentTodayMap.has(employee.id)
                        : undefined
                    }
                    onToggleAbsenceToday={
                      tableStatus === 'aktywny'
                        ? () => handleToggleAbsenceToday(employee, absentTodayMap.has(employee.id))
                        : undefined
                    }
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
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-6 py-2.5">
          <Badge variant="secondary">Zaznaczono: {selectedEmployees.length}</Badge>
          {exportColumns && (
            <ExcelExportButton
              employees={selectedEmployees}
              columns={exportColumns}
              fileName={exportFileName}
            />
          )}
          {tableStatus === 'aktywny' && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkAbsence} disabled={isBulkWorking}>
                <CalendarX className="mr-2 h-4 w-4" />
                Nieobecni dziś
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 hover:bg-amber-500/10"
                onClick={() => setBulkConfirm('terminate')}
                disabled={isBulkWorking}
              >
                <Users className="mr-2 h-4 w-4" />
                Zwolnij zaznaczonych
              </Button>
            </>
          )}
          {tableStatus === 'zwolniony' && (
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-600 hover:bg-emerald-500/10"
              onClick={handleBulkRestore}
              disabled={isBulkWorking}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Przywróć zaznaczonych
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setBulkConfirm('delete')}
            disabled={isBulkWorking}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń trwale
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setRowSelection({})}>
            <X className="mr-1 h-4 w-4" />
            Odznacz
          </Button>
        </div>
      )}
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
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <span>
            Wybrano {table.getFilteredSelectedRowModel().rows.length} z{" "}
            {table.getFilteredRowModel().rows.length} wierszy.
          </span>
        )}
      </div>

      <AlertDialog open={bulkConfirm !== null} onOpenChange={(open) => !open && setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirm === 'terminate'
                ? `Zwolnić ${selectedEmployees.length} zaznaczonych pracowników?`
                : `Trwale usunąć ${selectedEmployees.length} zaznaczonych pracowników?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirm === 'terminate'
                ? 'Pracownicy zostaną przeniesieni do archiwum zwolnionych.'
                : 'Tej akcji nie można cofnąć. Wszyscy zaznaczeni pracownicy i ich dane zostaną trwale usunięci z bazy.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className={bulkConfirm === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              disabled={isBulkWorking}
              onClick={(e) => {
                e.preventDefault()
                if (bulkConfirm === 'terminate') handleBulkTerminate()
                if (bulkConfirm === 'delete') handleBulkDelete()
              }}
            >
              {bulkConfirm === 'terminate' ? 'Zwolnij' : 'Usuń trwale'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
