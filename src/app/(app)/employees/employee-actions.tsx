"use client"

import dynamic from "next/dynamic"
import { MoreHorizontal, Edit, Copy, Bot, UserX, Trash2, RotateCcw, Mail } from "lucide-react"
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
import { useI18n } from "@/lib/i18n"

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
  onAbsenceEmail?: (employee: Employee) => void
  onDuplicate?: (employee: Employee) => void
}

export function EmployeeRowActions<TData>({
  row,
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
  onLegalizationEmail,
  onAbsenceEmail,
  onDuplicate,
}: EmployeeRowActionsProps<TData>) {
  const employee = row.original as Employee
  const { t } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t('employee.openMenu')}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onEdit(employee)}>
          <Edit className="mr-2 h-4 w-4" />
          {t('common.edit')}
        </DropdownMenuItem>
        {onDuplicate && (
          <DropdownMenuItem onSelect={() => onDuplicate(employee)}>
            <Copy className="mr-2 h-4 w-4" />
            {t('employee.duplicate')}
          </DropdownMenuItem>
        )}
        {onLegalizationEmail && (
          <DropdownMenuItem onSelect={() => onLegalizationEmail(employee)}>
            <Mail className="mr-2 h-4 w-4" />
            {t('employee.legalizationRequest')}
          </DropdownMenuItem>
        )}
        {onAbsenceEmail && (
          <DropdownMenuItem onSelect={() => onAbsenceEmail(employee)}>
            <Mail className="mr-2 h-4 w-4" />
            {t('employee.reportAbsence')}
          </DropdownMenuItem>
        )}
        {employee.status === "aktywny" && (
          <EmployeeSummary employee={employee}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Bot className="mr-2 h-4 w-4" />
              {t('employee.generateSummary')}
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
            {t('employee.terminate')}
          </DropdownMenuItem>
        )}
        {employee.status === "zwolniony" && onRestore && (
          <DropdownMenuItem onSelect={() => onRestore(employee)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('common.restore')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-destructive"
          onSelect={() => onDelete(employee)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('employee.deletePermanently')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
