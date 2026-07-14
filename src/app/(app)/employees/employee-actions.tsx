"use client"

import dynamic from "next/dynamic"
import { MoreHorizontal, Edit, Bot, UserX, Trash2, RotateCcw, Mail } from "lucide-react"
import { Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Employee } from "@/lib/types"

const EmployeeSummary = dynamic(
  () => import("@/components/employee-summary").then((mod) => mod.EmployeeSummary),
  {
    ssr: false,
  }
)

interface EmployeeRowActionsProps<TData> {
  row: Row<TData>
  onEdit: (employee: Employee) => void
  onTerminate?: (employee: Employee) => void
  onRestore?: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onLegalizationEmail?: (employee: Employee) => void
}

export function EmployeeRowActions<TData>({
  row,
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
  onLegalizationEmail,
}: EmployeeRowActionsProps<TData>) {
  const employee = row.original as Employee

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Otwórz menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Akcje</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onEdit(employee)}>
          <Edit className="mr-2 h-4 w-4" />
          Edytuj
        </DropdownMenuItem>
        {onLegalizationEmail && (
          <DropdownMenuItem onSelect={() => onLegalizationEmail(employee)}>
            <Mail className="mr-2 h-4 w-4" />
            Wniosek do Legalizacji
          </DropdownMenuItem>
        )}
        {employee.status === "aktywny" && (
          <EmployeeSummary employee={employee}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Bot className="mr-2 h-4 w-4" />
              Generuj podsumowanie
            </DropdownMenuItem>
          </EmployeeSummary>
        )}
        <DropdownMenuSeparator />
        {employee.status === "aktywny" && onTerminate && (
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => onTerminate(employee)}
          >
            <UserX className="mr-2 h-4 w-4" />
            Zwolnij
          </DropdownMenuItem>
        )}
        {employee.status === "zwolniony" && onRestore && (
          <DropdownMenuItem onSelect={() => onRestore(employee)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Przywróć
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-destructive"
          onSelect={() => onDelete(employee)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Usuń trwale
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
