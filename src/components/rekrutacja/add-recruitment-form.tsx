'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Briefcase, Loader2, Plus, Trash2, Users } from 'lucide-react';
import { formatHeadcount } from './format';

export const AddRecruitmentForm = ({
  newDepartment,
  onDepartmentChange,
  availableDepartments,
  headcountByDepartment,
  formRows,
  setFormRows,
  getRowJobTitleOptions,
  selectedDepartmentStats,
  canSubmitForm,
  isAdding,
  onSubmit,
}: {
  newDepartment: string;
  onDepartmentChange: (value: string) => void;
  availableDepartments: { id: string; name: string }[];
  headcountByDepartment: Map<string, number>;
  formRows: { jobTitle: string; count: string }[];
  setFormRows: Dispatch<SetStateAction<{ jobTitle: string; count: string }[]>>;
  getRowJobTitleOptions: (rowIndex: number) => { id: string; name: string }[];
  selectedDepartmentStats: {
    total: number;
    rows: { jobTitle: string; count: number; managers: string[] }[];
  } | null;
  canSubmitForm: boolean;
  isAdding: boolean;
  onSubmit: () => void;
}) => {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <Select
          value={newDepartment}
          onValueChange={onDepartmentChange}
        >
          <SelectTrigger className="w-full lg:w-80" aria-label="Wybierz dział">
            <SelectValue placeholder="Wybierz dział…" />
          </SelectTrigger>
          <SelectContent>
            {availableDepartments.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Brak dostępnych działów.
              </p>
            ) : (
              availableDepartments.map(dept => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name} ({formatHeadcount(headcountByDepartment.get(dept.name) ?? 0)})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {newDepartment && (
          <div className="space-y-2">
            {formRows.map((row, index) => {
              const rowOptions = getRowJobTitleOptions(index);
              return (
                <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={row.jobTitle}
                    onValueChange={value =>
                      setFormRows(prev =>
                        prev.map((r, i) => (i === index ? { ...r, jobTitle: value } : r))
                      )
                    }
                  >
                    <SelectTrigger
                      className="w-full sm:w-64"
                      aria-label={`Stanowisko — wiersz ${index + 1}`}
                    >
                      <SelectValue placeholder="Wybierz stanowisko…" />
                    </SelectTrigger>
                    <SelectContent>
                      {rowOptions.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          Brak dostępnych stanowisk.
                        </p>
                      ) : (
                        rowOptions.map(jt => (
                          <SelectItem key={jt.id} value={jt.name}>
                            {jt.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ile osób?"
                    value={row.count}
                    onChange={e =>
                      setFormRows(prev =>
                        prev.map((r, i) => (i === index ? { ...r, count: e.target.value } : r))
                      )
                    }
                    className="w-full sm:w-32"
                    aria-label={`Liczba osób — stanowisko ${index + 1}`}
                  />
                  {formRows.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setFormRows(prev => prev.filter((_, i) => i !== index))}
                      aria-label={`Usuń wiersz ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setFormRows(prev => [...prev, { jobTitle: '', count: '' }])}
            >
              <Plus className="h-3.5 w-3.5" />
              Dodaj stanowisko
            </Button>
          </div>
        )}

        {selectedDepartmentStats && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Obecnie w dziale: {formatHeadcount(selectedDepartmentStats.total)}
            </p>
            {selectedDepartmentStats.rows.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Brak aktywnych pracowników w tym dziale.
              </p>
            ) : (
              <div className="space-y-1.5">
                {selectedDepartmentStats.rows.map(row => (
                  <div
                    key={row.jobTitle}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {row.jobTitle} — {formatHeadcount(row.count)}
                    </span>
                    <span className="text-muted-foreground">
                      {row.managers.length > 0
                        ? `Kierownik: ${row.managers.join(', ')}`
                        : 'Brak kierownika'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button className="gap-2" disabled={!canSubmitForm || isAdding} onClick={onSubmit}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {formRows.length > 1 ? `Dodaj zapotrzebowanie (${formRows.length} stanowiska)` : 'Dodaj'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
