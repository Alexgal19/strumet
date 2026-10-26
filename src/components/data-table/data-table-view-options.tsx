"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Settings2 } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

/** Czytelne nazwy kolumn — zamiast surowych identyfikatorów z tabeli. */
const COLUMN_LABELS: Record<string, string> = {
  lastName: "Nazwisko",
  firstName: "Imię",
  hireDate: "Data zatrudnienia",
  contractEndDate: "Umowa do",
  terminationDate: "Data zwolnienia",
  daysWorked: "Przepracowane dni",
  jobTitle: "Stanowisko",
  department: "Dział",
  manager: "Kierownik",
  cardNumber: "Nr karty",
  nationality: "Narodowość",
  welderLicense: "Licencja spawacza",
  legalizationStatus: "Status legalizacyjny",
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Kolumny
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Wybór kolumn</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {COLUMN_LABELS[column.id] ?? column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
