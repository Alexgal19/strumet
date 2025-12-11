
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import type { HierarchicalOption, OptionType } from "@/lib/types";


interface MultiSelectProps {
  options: OptionType[] | HierarchicalOption[];
  selected: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  className?: string;
  title?: string;
}

function isHierarchical(options: any[]): options is HierarchicalOption[] {
    return options.length > 0 && 'children' in options[0];
}


const RecursiveAccordion = ({ items, selected, onSelect, level = 0 }: { items: HierarchicalOption[], selected: string[], onSelect: (value: string, children?: HierarchicalOption[]) => void, level?: number }) => {
    return (
        <Accordion type="multiple" className="w-full">
            {items.map((item) => {
                const isSelected = selected.includes(item.value);
                const hasChildren = item.children && item.children.length > 0;

                return hasChildren ? (
                     <AccordionItem value={item.value} key={item.value} className={cn(level > 0 && "pl-4")}>
                        <AccordionTrigger className="py-2 px-2 text-sm hover:no-underline [&[data-state=open]]:bg-accent">
                             <div className="flex items-center gap-2">
                                <Check
                                    className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
                                    onClick={(e) => { e.stopPropagation(); onSelect(item.value, item.children); }}
                                />
                                <span onClick={(e) => { e.stopPropagation(); onSelect(item.value, item.children); }}>{item.label}</span>
                             </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <RecursiveAccordion items={item.children!} selected={selected} onSelect={onSelect} level={level + 1} />
                        </AccordionContent>
                    </AccordionItem>
                ) : (
                    <CommandItem
                        key={item.value}
                        onSelect={() => onSelect(item.value)}
                        className={cn("rounded-md", level > 0 && "pl-6")}
                    >
                        <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {item.label}
                    </CommandItem>
                )
            })}
        </Accordion>
    )
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
     const flatten = (items: HierarchicalOption[]): OptionType[] => {
        return items.reduce((acc, item) => {
            acc.push({ label: item.label, value: item.value });
            if (item.children) {
                acc.push(...flatten(item.children));
            }
            return acc;
        }, [] as OptionType[]);
     }
     return isHierarchical(options) ? flatten(options as HierarchicalOption[]) : (options as OptionType[]);
  }, [options]);

  const selectedOptions = allOptions.filter(option => selected.includes(option.value));

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };
  
  const handleSelect = (value: string, children?: HierarchicalOption[]) => {
    const allChildValues = children ? children.flatMap(child => [child.value, ...(child.children || []).map(c => c.value)]) : [];
    const valuesToToggle = [value, ...allChildValues];
    
    const isCurrentlySelected = selected.includes(value);

    if(isCurrentlySelected) {
        onChange(selected.filter(item => !valuesToToggle.includes(item)));
    } else {
        onChange([...new Set([...selected, ...valuesToToggle])]);
    }
  };

  const isGrouped = isHierarchical(options);

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
              <RecursiveAccordion 
                items={options as HierarchicalOption[]}
                selected={selected}
                onSelect={handleSelect}
              />
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
