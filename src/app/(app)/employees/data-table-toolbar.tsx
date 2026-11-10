"use client"

import React from "react"
import { Table } from "@tanstack/react-table"
import { Search, X, Filter } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"
import { ExcelExportButton } from "@/components/excel-export-button"
import { Employee } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"
import { useI18n } from "@/lib/i18n"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  departmentOptions: { label: string; value: string }[]
  jobTitleOptions: { label: string; value: string }[]
  managerOptions: { label: string; value: string }[]
  nationalityOptions: { label: string; value: string }[]
  lastNameOptions?: { label: string; value: string }[]
  exportColumns?: { key: keyof Employee; name: string }[]
  exportFileName?: string
}
export function DataTableToolbar<TData>({
  table,
  departmentOptions,
  jobTitleOptions,
  managerOptions,
  nationalityOptions,
  lastNameOptions,
  exportColumns,
  exportFileName,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const isMobile = useIsMobile()
  const { t } = useI18n()
  const searchValue = (table.getState().globalFilter as string) ?? ""
  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = table.getCoreRowModel().rows.length

  const filters = (
    <>

      {lastNameOptions && table.getColumn("lastName") && (
        <DataTableFacetedFilter
          column={table.getColumn("lastName")}
          title={t('employee.lastName')}
          options={lastNameOptions}
        />
      )}
      {table.getColumn("department") && (
        <DataTableFacetedFilter
          column={table.getColumn("department")}
          title={t('employee.department')}
          options={departmentOptions}
        />
      )}
      {table.getColumn("jobTitle") && (
        <DataTableFacetedFilter
          column={table.getColumn("jobTitle")}
          title={t('employee.jobTitle')}
          options={jobTitleOptions}
        />
      )}
      {table.getColumn("manager") && (
        <DataTableFacetedFilter
          column={table.getColumn("manager")}
          title={t('employee.manager')}
          options={managerOptions}
        />
      )}
      {table.getColumn("nationality") && (
        <DataTableFacetedFilter
          column={table.getColumn("nationality")}
          title={t('employee.nationality')}
          options={nationalityOptions}
        />
      )}
    </>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      <div className="relative flex-1 min-w-[150px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={t('employee.searchLabel')}
          placeholder={t('employee.searchPlaceholder')}
          value={searchValue}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-9 w-full pl-8 pr-10 lg:w-64"
        />
        {searchValue && (
          <button
            type="button"
            aria-label={t('employee.clearSearch')}
            title={t('employee.clearSearch')}
            onClick={() => table.setGlobalFilter("")}
            className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {(searchValue || isFiltered) && (
        <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
          {t('employee.foundCount', { count: filteredCount, total: totalCount })}
        </span>
      )}
      
      {/* Desktop Filters */}
      <div className="hidden lg:flex items-center gap-2">
        {filters}
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-4 w-4" />
              {t('employee.filter')}
              {isFiltered && (
                <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal lg:hidden">
                  {table.getState().columnFilters.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side={isMobile ? "bottom" : "right"}
            className={
              isMobile
                ? "h-[75dvh] glass-morphism rounded-t-3xl flex flex-col pb-[env(safe-area-inset-bottom)]"
                : "w-[300px] glass-morphism sm:w-[400px]"
            }
          >
            <SheetHeader className="mb-6">
              <SheetTitle>{t('employee.filtering')}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4">
              {filters}
              {isFiltered && (
                <Button
                  variant="ghost"
                  onClick={() => table.resetColumnFilters()}
                  className="mt-2 w-full justify-center"
                >
                  {t('employee.clearFilters')}
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
            {isMobile && (
              <SheetClose asChild>
                <Button className="w-full mt-2" variant="secondary">
                  {t('employee.showResults', { count: filteredCount, total: totalCount })}
                </Button>
              </SheetClose>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="hidden lg:flex h-9 px-2 lg:px-3"
        >
          {t('common.clear')}
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {exportColumns && (
          <ExcelExportButton
            employees={table.getCoreRowModel().rows.map(row => row.original as Employee)}
            columns={exportColumns}
            fileName={exportFileName}
          />
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}


