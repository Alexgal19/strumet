'use client';

import { useEffect, useState } from 'react';
import { ref as dbRef, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import type { RecruitmentPosition } from '@/lib/types';
import { Input } from '@/components/ui/input';

export const PositionCountInput = ({
  recruitmentId,
  position,
}: {
  recruitmentId: string;
  position: RecruitmentPosition;
}) => {
  const { toast } = useToast();
  const [draft, setDraft] = useState(String(position.toRecruit ?? 0));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setDraft(String(position.toRecruit ?? 0));
  }, [position.toRecruit, isFocused]);

  const handleBlur = async () => {
    const db = getDB();
    if (!db) return;
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setDraft(String(position.toRecruit ?? 0));
      return;
    }
    if (parsed === position.toRecruit) return;
    try {
      await update(dbRef(db, `recruitment/${recruitmentId}/positions/${position.id}`), {
        toRecruit: parsed,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać liczby osób.' });
    }
  };

  return (
    <Input
      type="number"
      min={1}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        handleBlur();
      }}
      onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="h-9 w-24 tabular-nums"
      aria-label="Liczba osób do rekrutacji"
    />
  );
};
