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
import { useI18n, type TranslationKey } from "@/lib/i18n"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

/** Czytelne nazwy kolumn — zamiast surowych identyfikatorów z tabeli. */
const COLUMN_LABELS: Record<string, TranslationKey> = {
  lastName: "employee.lastName",
  firstName: "employee.firstName",
  hireDate: "employee.hireDate",
  contractEndDate: "employee.contractEndDate",
  terminationDate: "employee.terminationDate",
  daysWorked: "employee.daysWorked",
  terminationReason: "employee.terminationReason",
  jobTitle: "employee.jobTitle",
  department: "employee.department",
  manager: "employee.manager",
  cardNumber: "employee.cardNumber",
  nationality: "employee.nationality",
  welderLicense: "employee.welderLicense",
  legalizationStatus: "employee.legalizationStatus",
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const { t } = useI18n()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          {t('employee.columns')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>{t('employee.chooseColumns')}</DropdownMenuLabel>
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
                {COLUMN_LABELS[column.id] ? t(COLUMN_LABELS[column.id]) : column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
