'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileDown } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';
import { format } from 'date-fns';
import writeXlsxFile from 'write-excel-file';

interface DepartmentExcelExportButtonProps {
  employees: Employee[];
  departments: string[];
  columns: { key: keyof Employee; name: string }[];
}

const DATE_KEYS: (keyof Employee)[] = ['hireDate', 'terminationDate', 'contractEndDate'];

export function DepartmentExcelExportButton({ employees, departments, columns }: DepartmentExcelExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const sortedDepartments = useMemo(() => [...departments].sort((a, b) => a.localeCompare(b, 'pl')), [departments]);

  const toggleDept = (dept: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(dept) ? next.delete(dept) : next.add(dept);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sortedDepartments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedDepartments));
    }
  };

  const handleOpen = () => {
    setSelected(new Set(sortedDepartments));
    setOpen(true);
  };

  const handleExport = async () => {
    if (selected.size === 0) return;
    setIsExporting(true);

    try {
      const schema = columns.map(col => ({
        column: col.name,
        type: DATE_KEYS.includes(col.key) ? Date : String,
        format: DATE_KEYS.includes(col.key) ? 'yyyy-mm-dd' : undefined,
        width: 22,
        value: (row: Record<string, any>) => row[col.name],
      }));

      const selectedDepts = sortedDepartments.filter(d => selected.has(d));

      const sheets = selectedDepts.map(dept => {
        const deptEmployees = employees
          .filter(e => e.department === dept)
          .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pl'));

        const data = deptEmployees.map(emp => {
          const row: Record<string, any> = {};
          columns.forEach(col => {
            let value: any = emp[col.key];
            if (DATE_KEYS.includes(col.key) && value) {
              value = parseMaybeDate(value) ?? value;
            }
            row[col.name] = value ?? '';
          });
          return row;
        });

        return { data, name: dept.slice(0, 31) }; // Excel sheet name max 31 chars
      });

      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');

      await writeXlsxFile(
        sheets.map(s => s.data),
        {
          fileName: `pracownicy_dzialy_${timestamp}.xlsx`,
          schema: sheets.map(() => schema),
          sheets: sheets.map(s => s.name),
        }
      );

      setOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const allSelected = selected.size === sortedDepartments.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <>
      <Button variant="outline" onClick={handleOpen} disabled={employees.length === 0}>
        <FileDown className="mr-2 h-4 w-4" />
        Eksportuj wg działów
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eksportuj do Excel – wybierz działy</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            {/* Zaznacz wszystkie */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={allSelected}
                data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                onCheckedChange={toggleAll}
              />
              <Label htmlFor="select-all" className="font-semibold cursor-pointer select-none">
                {allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
              </Label>
              <span className="ml-auto text-sm text-muted-foreground">
                {selected.size} / {sortedDepartments.length}
              </span>
            </div>

            {/* Lista działów */}
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {sortedDepartments.map(dept => {
                const count = employees.filter(e => e.department === dept).length;
                return (
                  <div key={dept} className="flex items-center gap-2">
                    <Checkbox
                      id={`dept-${dept}`}
                      checked={selected.has(dept)}
                      onCheckedChange={() => toggleDept(dept)}
                    />
                    <Label htmlFor={`dept-${dept}`} className="cursor-pointer select-none flex-1">
                      {dept}
                    </Label>
                    <span className="text-sm text-muted-foreground">{count} os.</span>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
            <Button
              onClick={handleExport}
              disabled={selected.size === 0 || isExporting}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExporting ? 'Eksportowanie...' : `Eksportuj (${selected.size} ${selected.size === 1 ? 'dział' : 'działy/ów'})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
