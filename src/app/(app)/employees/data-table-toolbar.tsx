"use client"

import React from "react"
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

function DataTableToolbarComponent<TData>({
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
    <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-200">
      <Input
        aria-label="Szukaj pracownika"
        placeholder="Szukaj..."
        value={(table.getState().globalFilter as string) ?? ""}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className="h-8 w-48 lg:w-64"
      />
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

export const DataTableToolbar = React.memo(DataTableToolbarComponent) as <TData>(props: DataTableToolbarProps<TData>) => React.JSX.Element;
