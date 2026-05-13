"use client"

import React from "react"
import { Table } from "@tanstack/react-table"
import { X, Filter } from "lucide-react"
import {
  Sheet,
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

  const filters = (
    <>

      {lastNameOptions && table.getColumn("lastName") && (
        <DataTableFacetedFilter
          column={table.getColumn("lastName")}
          title="Nazwisko"
          options={lastNameOptions}
        />
      )}
      {table.getColumn("department") && (
        <DataTableFacetedFilter
          column={table.getColumn("department")}
          title="Dział"
          options={departmentOptions}
        />
      )}
      {table.getColumn("jobTitle") && (
        <DataTableFacetedFilter
          column={table.getColumn("jobTitle")}
          title="Stanowisko"
          options={jobTitleOptions}
        />
      )}
      {table.getColumn("manager") && (
        <DataTableFacetedFilter
          column={table.getColumn("manager")}
          title="Kierownik"
          options={managerOptions}
        />
      )}
      {table.getColumn("nationality") && (
        <DataTableFacetedFilter
          column={table.getColumn("nationality")}
          title="Narodowość"
          options={nationalityOptions}
        />
      )}
    </>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      <div className="flex-1 min-w-[150px]">
        <Input
          aria-label="Szukaj pracownika"
          placeholder="Szukaj..."
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-9 w-full lg:w-64"
        />
      </div>
      
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
              Filtruj
              {isFiltered && (
                <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal lg:hidden">
                  {table.getState().columnFilters.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] glass-morphism sm:w-[400px]">
            <SheetHeader className="mb-6">
              <SheetTitle>Filtrowanie</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4">
              {filters}
              {isFiltered && (
                <Button
                  variant="ghost"
                  onClick={() => table.resetColumnFilters()}
                  className="mt-2 w-full justify-center"
                >
                  Wyczyść filtry
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="hidden lg:flex h-9 px-2 lg:px-3"
        >
          Wyczyść
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


