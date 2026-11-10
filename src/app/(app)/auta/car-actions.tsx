"use client"

import { MoreHorizontal, Edit, Archive, Trash2, RotateCcw } from "lucide-react"
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
import type { Car } from "@/lib/types"
import { useI18n } from "@/lib/i18n"

interface CarRowActionsProps<TData> {
  row: Row<TData>
  onEdit: (car: Car) => void
  onTerminate?: (car: Car) => void
  onRestore?: (car: Car) => void
  onDelete: (car: Car) => void
}

export function CarRowActions<TData>({
  row,
  onEdit,
  onTerminate,
  onRestore,
  onDelete,
}: CarRowActionsProps<TData>) {
  const car = row.original as Car
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
        <DropdownMenuItem onSelect={() => onEdit(car)}>
          <Edit className="mr-2 h-4 w-4" />
          {t('common.edit')}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {car.status === "active" && onTerminate && (
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => onTerminate(car)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {t('cars.moveToHistory')}
          </DropdownMenuItem>
        )}
        
        {car.status === "history" && onRestore && (
          <DropdownMenuItem onSelect={() => onRestore(car)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('cars.restoreFromHistory')}
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem
          className="text-destructive"
          onSelect={() => onDelete(car)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('employee.deletePermanently')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
