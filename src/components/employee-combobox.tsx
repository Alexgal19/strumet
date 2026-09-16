'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { commandExcelFilter } from '@/lib/search';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Employee } from '@/lib/types';

interface EmployeeComboboxProps {
  employees: Employee[];
  value: string | null;
  onValueChange: (employeeId: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  /** Opcja „wyczyść wybór" np. „Brak kierowcy" — wymaga onSelectNone */
  noneLabel?: string;
  onSelectNone?: () => void;
}

/**
 * Wspólny combobox wyboru pracownika.
 * - Desktop: Popover z listą (Command)
 * - Mobile: dolny sheet (strefa kciuka) — klawiatura nie zasłania listy
 */
export function EmployeeCombobox({
  employees,
  value,
  onValueChange,
  placeholder = 'Wybierz pracownika...',
  triggerClassName,
  noneLabel,
  onSelectNone,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const selected = employees.find((e) => e.id === value) ?? null;

  const renderList = (listClassName?: string) => (
    <Command filter={commandExcelFilter}>
      <CommandInput placeholder="Szukaj pracownika..." />
      <CommandList className={listClassName}>
        <CommandEmpty>Nie znaleziono pracownika.</CommandEmpty>
        <CommandGroup>
          {noneLabel && onSelectNone && (
            <CommandItem
              value={noneLabel}
              onSelect={() => {
                onSelectNone();
                setOpen(false);
              }}
              className="font-medium text-muted-foreground"
            >
              <Check className="mr-2 h-4 w-4 opacity-0" />
              {noneLabel}
            </CommandItem>
          )}
          {employees.map((employee) => (
            <CommandItem
              key={employee.id}
              value={employee.fullName}
              onSelect={() => {
                onValueChange(employee.id);
                setOpen(false);
              }}
            >
              <Check
                className={cn('mr-2 h-4 w-4', value === employee.id ? 'opacity-100' : 'opacity-0')}
              />
              {employee.fullName}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn('w-full justify-between', triggerClassName)}
    >
      <span className="truncate">{selected ? selected.fullName : placeholder}</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[75dvh] flex flex-col p-0 rounded-t-3xl [&>button]:hidden pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="p-4 pb-2 border-b shrink-0 text-left">
            <SheetTitle className="text-base">Wybierz pracownika</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0">{renderList('max-h-full')}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {renderList()}
      </PopoverContent>
    </Popover>
  );
}
