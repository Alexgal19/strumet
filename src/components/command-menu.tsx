'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { SunMoon } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useAppContext } from '@/context/app-context';
import { commandExcelFilter } from '@/lib/search';
import {
  ALL_NAV_ITEMS,
  GUEST_VIEWS,
  NAV_SECTIONS,
} from '@/components/app-sidebar';

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const { isAdmin } = useAppContext();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const visibleItems = React.useMemo(
    () =>
      isAdmin
        ? ALL_NAV_ITEMS
        : ALL_NAV_ITEMS.filter((item) => GUEST_VIEWS.includes(item.href)),
    [isAdmin]
  );

  const run = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      action();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} filter={commandExcelFilter}>
      <CommandInput placeholder="Szukaj strony lub akcji..." />
      <CommandList>
        <CommandEmpty>Brak wyników.</CommandEmpty>
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) =>
            visibleItems.some((visible) => visible.href === item.href)
          );
          if (items.length === 0) return null;
          return (
            <CommandGroup key={section.title} heading={section.title}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
        <CommandSeparator />
        <CommandGroup heading="Akcje">
          <CommandItem
            onSelect={() =>
              run(() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              )
            }
          >
            <SunMoon className="mr-2 h-4 w-4" />
            Zmień motyw ({resolvedTheme === 'dark' ? 'jasny' : 'ciemny'})
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
