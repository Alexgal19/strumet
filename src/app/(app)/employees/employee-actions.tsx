"use client"

import dynamic from "next/dynamic"
import { MoreHorizontal, Edit, Bot, UserX, Trash2, RotateCcw } from "lucide-react"
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
}

export function EmployeeRowActions<TData>({
  row,
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
}: EmployeeRowActionsProps<TData>) {
  const employee = row.original as Employee

  return (
    <EmployeeSummary employee={employee}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Otwórz menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Akcje</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(employee)}>
            <Edit className="mr-2 h-4 w-4" />
            Edytuj
          </DropdownMenuItem>
          {employee.status === "aktywny" && (
            <DropdownMenuItem>
              <Bot className="mr-2 h-4 w-4" />
              Generuj podsumowanie
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {employee.status === "aktywny" && onTerminate && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onTerminate(employee)}
            >
              <UserX className="mr-2 h-4 w-4" />
              Zwolnij
            </DropdownMenuItem>
          )}
          {employee.status === "zwolniony" && onRestore && (
            <DropdownMenuItem onClick={() => onRestore(employee)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Przywróć
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(employee)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń trwale
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </EmployeeSummary>
  )
}
