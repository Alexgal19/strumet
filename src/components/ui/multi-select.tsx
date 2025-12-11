"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "./badge";

export interface OptionType {
  label: string;
  value: string;
}

export interface GroupedOptionType {
  [groupLabel: string]: OptionType[];
}


interface MultiSelectProps {
  options: OptionType[] | GroupedOptionType;
  selected: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  className?: string;
  title?: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  className,
  title,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  
  const allOptions = React.useMemo(() => {
    if (Array.isArray(options)) {
      return options;
    }
    return Object.values(options).flat();
  }, [options]);

  const selectedOptions = allOptions.filter(option => selected.includes(option.value));

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };
  
  const handleSelect = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  };

  const isGrouped = !Array.isArray(options);

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn("w-full justify-between font-normal min-h-10 h-auto rounded-md", className)}
                onClick={() => setOpen(!open)}
            >
                <div className="flex gap-1 flex-wrap">
                    {!selected.length && title}
                    {selectedOptions.map(option => (
                        <Badge
                            key={option.value}
                            variant="secondary"
                            className="mr-1 rounded-md"
                        >
                            {option.label}
                            <div
                                role="button"
                                tabIndex={0}
                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleUnselect(option.value);
                                    }
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onClick={() => handleUnselect(option.value)}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </div>
                        </Badge>
                    ))}
                </div>
                 <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Szukaj ${title?.toLowerCase() ?? 'opcji'}...`} />
          <CommandList>
            <CommandEmpty>Brak wyników.</CommandEmpty>
            {isGrouped ? (
              Object.entries(options).map(([groupLabel, groupOptions]) => (
                <CommandGroup key={groupLabel} heading={groupLabel}>
                  {groupOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="rounded-md"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup>
                {(options as OptionType[]).map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="rounded-md"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
