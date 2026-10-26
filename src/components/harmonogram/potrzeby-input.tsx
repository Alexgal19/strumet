'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

/** Pole potrzeb: zapis dopiero po opuszczeniu pola / Enter (bez zapisu przy każdym znaku). */
export function PotrzebyInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!Number.isInteger(n) || n < 0) {
      setDraft(String(value));
      return;
    }
    if (n !== value) onCommit(n);
  };

  return (
    <Input
      type="number"
      min={0}
      aria-label="Potrzeby"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      onClick={e => e.stopPropagation()}
      className="inline-block h-8 w-20 px-1 py-0 text-right text-base font-semibold"
    />
  );
}
