'use client';

import { useEffect, useState } from 'react';
import { ref as dbRef, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import type { RecruitmentArrival } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarPlus, Trash2 } from 'lucide-react';

export const ArrivalRow = ({
  recruitmentId,
  arrival,
  onRemove,
}: {
  recruitmentId: string;
  arrival: RecruitmentArrival;
  onRemove: (arrivalId: string) => void;
}) => {
  const { toast } = useToast();
  const [countDraft, setCountDraft] = useState(String(arrival.count ?? 1));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setCountDraft(String(arrival.count ?? 1));
  }, [arrival.count, isFocused]);

  const handleDateChange = async (value: string) => {
    const db = getDB();
    if (!db) return;
    try {
      await update(dbRef(db, `recruitment/${recruitmentId}/arrivals/${arrival.id}`), {
        date: value,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać daty.' });
    }
  };

  const handleCountBlur = async () => {
    const db = getDB();
    if (!db) return;
    const parsed = parseInt(countDraft, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setCountDraft(String(arrival.count ?? 1));
      return;
    }
    if (parsed === arrival.count) return;
    try {
      await update(dbRef(db, `recruitment/${recruitmentId}/arrivals/${arrival.id}`), {
        count: parsed,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać liczby osób.' });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
        <CalendarPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          type="date"
          value={arrival.date ?? ''}
          onChange={e => handleDateChange(e.target.value)}
          className="h-9 flex-1"
          aria-label="Data przyjęcia"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={1}
          value={countDraft}
          onChange={e => setCountDraft(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleCountBlur();
          }}
          className="h-9 w-20 tabular-nums"
          aria-label="Liczba osób"
        />
        <span className="text-xs text-muted-foreground">os.</span>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="ml-auto h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(arrival.id)}
        aria-label="Usuń datę"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
