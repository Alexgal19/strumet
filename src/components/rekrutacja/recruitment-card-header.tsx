'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { Recruitment } from '@/lib/types';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react';

export const RecruitmentCardHeader = ({
  recruitment,
  departments,
  isEditingDept,
  deptDraft,
  setDeptDraft,
  isSavingDept,
  startEditingDept,
  handleSaveDept,
  setIsEditingDept,
  onDelete,
  positionCount,
  departmentHeadcount,
  sumZwalnia,
  sumPotrzeby,
  missing,
  sumToRecruit,
  surplus,
  plannedTotal,
}: {
  recruitment: Recruitment;
  departments: { id: string; name: string }[];
  isEditingDept: boolean;
  deptDraft: string;
  setDeptDraft: Dispatch<SetStateAction<string>>;
  isSavingDept: boolean;
  startEditingDept: () => void;
  handleSaveDept: () => void;
  setIsEditingDept: Dispatch<SetStateAction<boolean>>;
  onDelete: (recruitment: Recruitment) => void;
  positionCount: number;
  departmentHeadcount: number;
  sumZwalnia: number;
  sumPotrzeby: number;
  missing: number;
  sumToRecruit: number;
  surplus: number;
  plannedTotal: number;
}) => {
  return (
    <CardHeader className="pb-3">
      {isEditingDept ? (
        <div className="flex w-full flex-wrap items-center gap-2">
          <Select value={deptDraft} onValueChange={setDeptDraft}>
            <SelectTrigger className="h-9 flex-1 min-w-[180px] sm:w-64 sm:flex-none" aria-label="Edytuj dział">
              <SelectValue placeholder="Dział…" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
              disabled={isSavingDept || !deptDraft}
              onClick={handleSaveDept}
              aria-label="Zapisz zmiany"
            >
              {isSavingDept ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              disabled={isSavingDept}
              onClick={() => setIsEditingDept(false)}
              aria-label="Anuluj edycję"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="text-base truncate">{recruitment.department}</CardTitle>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {positionCount} {positionCount === 1 ? 'stanowisko' : 'stanowiska'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={startEditingDept}
                aria-label={`Edytuj dział ${recruitment.department}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(recruitment)}
                aria-label={`Usuń zapotrzebowanie ${recruitment.department}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge variant="outline" className="tabular-nums text-xs">
              Na dziale: {departmentHeadcount} os.
            </Badge>
            {sumZwalnia > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/60 text-amber-700 tabular-nums dark:text-amber-400 text-xs"
              >
                Zwalnia się: −{sumZwalnia}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400 text-xs"
            >
              Potrzeby: {sumPotrzeby} os.
            </Badge>
            {missing > 0 && (
              <Badge variant="destructive" className="tabular-nums text-xs">
                Brakuje: {missing}
              </Badge>
            )}
            <Badge variant="outline" className="tabular-nums text-xs">
              Rekrutacja: {sumToRecruit} os.
            </Badge>
            {surplus > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/60 text-amber-700 tabular-nums dark:text-amber-400 text-xs"
              >
                Nadwyżka: +{surplus}
              </Badge>
            )}
            {plannedTotal > 0 && missing === 0 && surplus === 0 && (
              <Badge
                variant="outline"
                className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400 text-xs"
              >
                Komplet: {plannedTotal}/{sumToRecruit}
              </Badge>
            )}
          </div>
        </div>
      )}
    </CardHeader>
  );
};
