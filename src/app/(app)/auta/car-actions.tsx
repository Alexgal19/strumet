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
        <DropdownMenuItem onSelect={() => onEdit(car)}>
          <Edit className="mr-2 h-4 w-4" />
          Edytuj
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {car.status === "active" && onTerminate && (
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => onTerminate(car)}
          >
            <Archive className="mr-2 h-4 w-4" />
            Przenieś do historii
          </DropdownMenuItem>
        )}
        
        {car.status === "history" && onRestore && (
          <DropdownMenuItem onSelect={() => onRestore(car)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Przywróć z historii
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem
          className="text-destructive"
          onSelect={() => onDelete(car)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Usuń trwale
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
