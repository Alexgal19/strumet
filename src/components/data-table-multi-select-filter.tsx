"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Filter as FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "./ui/badge";

interface OptionType {
  value: string;
  label: string;
}

interface DataTableMultiSelectFilterProps {
  options: OptionType[];
  title?: string;
  onFilter: (selected: string[]) => void;
  className?: string;
}

export function DataTableMultiSelectFilter({
  options,
  title,
  onFilter,
  className,
}: DataTableMultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [tempSelected, setTempSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    setTempSelected(selected);
  }, [selected]);


  const handleSelectAll = () => {
    setTempSelected(options.map((option) => option.value));
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const handleApply = () => {
    setSelected(tempSelected);
    onFilter(tempSelected);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempSelected(selected);
    setOpen(false);
  };

  const handleToggle = (value: string) => {
    setTempSelected((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value]
    );
  };

  const selectedOptions = options.filter(option => selected.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal min-h-10 h-auto rounded-md", className, selected.length > 0 && "border-primary")}
        >
           <FilterIcon className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <div className="p-2 border-b">
             <p className="text-sm font-medium">{title}</p>
          </div>
          <CommandInput placeholder={`Szukaj ${title?.toLowerCase() ?? 'opcji'}...`} />
          <CommandList>
            <CommandEmpty>Brak wyników.</CommandEmpty>
            <CommandGroup>
              <div className="flex justify-between p-2">
                <Button variant="link" size="sm" onClick={handleSelectAll}>
                  Zaznacz wszystko
                </Button>
                <Button variant="link" size="sm" onClick={handleClearAll}>
                  Wyczyść zaznaczenie
                </Button>
              </div>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleToggle(option.value)}
                  className="rounded-md"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      tempSelected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="flex justify-end p-2 border-t">
            <Button variant="outline" size="sm" onClick={handleCancel} className="mr-2">
              Anuluj
            </Button>
            <Button size="sm" onClick={handleApply}>
              Zastosuj
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
