"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  return (
    <div className="flex flex-col space-y-4">
      <Input
        placeholder="Szukaj..."
        value={(table.getState().globalFilter as string) ?? ""}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className="h-8 w-full lg:w-1/3"
      />
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 overflow-x-auto pb-2">
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
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Wyczyść
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
