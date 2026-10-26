'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { Recruitment, RecruitmentPosition } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Briefcase, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { PositionCountInput } from './position-count-input';

export const RecruitmentPositionsEditor = ({
  recruitment,
  positions,
  jobTitles,
  draftPositions,
  setDraftPositions,
  isSavingPositions,
  handleAddPositionDraft,
  handleRemoveDraftPosition,
  handleSaveDraftPositions,
  handlePositionJobTitleChange,
  handleRemovePosition,
  getPositionOptions,
  getPositionStat,
}: {
  recruitment: Recruitment;
  positions: RecruitmentPosition[];
  jobTitles: { id: string; name: string }[];
  draftPositions: { jobTitle: string; count: string }[];
  setDraftPositions: Dispatch<SetStateAction<{ jobTitle: string; count: string }[]>>;
  isSavingPositions: boolean;
  handleAddPositionDraft: () => void;
  handleRemoveDraftPosition: (index: number) => void;
  handleSaveDraftPositions: () => Promise<void>;
  handlePositionJobTitleChange: (posId: string, jobTitle: string) => Promise<void>;
  handleRemovePosition: (posId: string) => Promise<void>;
  getPositionOptions: (posId: string) => { id: string; name: string }[];
  getPositionStat: (pos: RecruitmentPosition) => {
    obecnie: number;
    zwalnia: number;
    potrzeby: number;
  };
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Stanowiska i liczba osób:
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-primary/30 px-3 text-primary hover:bg-primary/5"
          onClick={handleAddPositionDraft}
        >
          <Plus className="h-3.5 w-3.5" />
          Dodaj stanowisko
        </Button>
      </div>
      {positions.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
          Brak stanowisk — kliknij „Dodaj stanowisko”.
        </p>
      ) : (
        positions.map(pos => {
          const rowOptions = getPositionOptions(pos.id);
          return (
            <div
              key={pos.id}
              className="flex flex-wrap items-center gap-2 rounded-md border bg-background/50 px-3 py-2"
            >
              <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" />
              <Select
                value={pos.jobTitle}
                onValueChange={value => handlePositionJobTitleChange(pos.id, value)}
              >
                <SelectTrigger
                  className="h-9 w-full sm:w-56"
                  aria-label="Stanowisko"
                >
                  <SelectValue placeholder="Wybierz stanowisko…" />
                </SelectTrigger>
                <SelectContent>
                  {rowOptions.map(jt => (
                    <SelectItem key={jt.id} value={jt.name}>
                      {jt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <PositionCountInput recruitmentId={recruitment.id} position={pos} />
                <span className="text-xs text-muted-foreground">os.</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="ml-auto sm:order-last h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemovePosition(pos.id)}
                aria-label="Usuń stanowisko"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {pos.jobTitle && (
                <div className="w-full sm:w-auto text-xs text-muted-foreground">
                  Potrzeby:{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {getPositionStat(pos).potrzeby} os.
                  </span>{' '}
                  (jest {getPositionStat(pos).obecnie}, zwalnia {getPositionStat(pos).zwalnia})
                </div>
              )}
            </div>
          );
        })
      )}

      {draftPositions.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Nowe stanowiska (niezapisane):</p>
          {draftPositions.map((draft, idx) => {
            const usedInExisting = new Set(positions.map(p => p.jobTitle));
            const usedInDrafts = new Set(draftPositions.map((d, i) => i !== idx ? d.jobTitle : null).filter(Boolean));
            const availableTitles = jobTitles.filter(jt => !usedInExisting.has(jt.name) && !usedInDrafts.has(jt.name));
            return (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <Select
                  value={draft.jobTitle}
                  onValueChange={(val) => setDraftPositions(prev => prev.map((d, i) => i === idx ? { ...d, jobTitle: val } : d))}
                >
                  <SelectTrigger className="h-9 w-full sm:w-56">
                    <SelectValue placeholder="Wybierz stanowisko..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTitles.map(jt => (
                      <SelectItem key={jt.id} value={jt.name}>{jt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    className="h-9 w-20 tabular-nums"
                    value={draft.count}
                    onChange={e => setDraftPositions(prev => prev.map((d, i) => i === idx ? { ...d, count: e.target.value } : d))}
                  />
                  <span className="text-xs text-muted-foreground">os.</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-auto h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveDraftPosition(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={handleSaveDraftPositions} disabled={isSavingPositions} className="gap-1.5">
              {isSavingPositions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Zapisz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
