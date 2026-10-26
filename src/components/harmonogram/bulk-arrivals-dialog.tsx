'use client';

import { useRef, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatYmdPl } from '@/lib/date';

type BulkLine = { id: number; dept: string; job: string; count: string };

/** Dodawanie wielu przyjęć naraz (jedna data, wiele stanowisk). */
export function BulkArrivalsDialog({ open, onOpenChange, options, todayYmd, onAdd }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: Map<string, { jobTitle: string; net: number }[]>;
  todayYmd: string;
  onAdd: (dept: string, job: string, date: string, count: number) => Promise<string | null>;
}) {
  const { toast } = useToast();
  const [date, setDate] = useState('');
  const [lines, setLines] = useState<BulkLine[]>([]);
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const depts = Array.from(options.keys()).sort((a, b) => a.localeCompare(b, 'pl'));

  const newLine = (dept?: string, job?: string, count = ''): BulkLine => {
    const d = dept ?? depts[0] ?? '';
    return { id: nextId.current++, dept: d, job: job ?? options.get(d)?.[0]?.jobTitle ?? '', count };
  };
  const patch = (id: number, p: Partial<BulkLine>) =>
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...p } : l)));

  const fillShortages = () => {
    const next: BulkLine[] = [];
    depts.forEach(d => (options.get(d) ?? []).forEach(j => {
      if (j.net > 0) next.push(newLine(d, j.jobTitle, String(Math.min(50, j.net))));
    }));
    if (next.length === 0) {
      toast({ title: 'Brak braków do uzupełnienia' });
      return;
    }
    setLines(next);
  };

  const submit = async () => {
    if (!date || date < todayYmd) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Wybierz datę od dziś.' });
      return;
    }
    const valid = lines.filter(l => l.dept && l.job);
    if (valid.length === 0) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Dodaj co najmniej jeden wiersz.' });
      return;
    }
    const parsed = valid.map(l => ({ ...l, n: Number(l.count) }));
    if (parsed.some(l => !Number.isInteger(l.n) || l.n < 1 || l.n > 50)) {
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Liczba osób w każdym wierszu: 1–50.' });
      return;
    }
    setBusy(true);
    const failed: (BulkLine & { error: string })[] = [];
    let saved = 0;
    for (const l of parsed) {
      const error = await onAdd(l.dept, l.job, date, l.n);
      if (error === null) saved += 1;
      else failed.push({ id: l.id, dept: l.dept, job: l.job, count: l.count, error });
    }
    setBusy(false);
    if (failed.length === 0) {
      toast({ title: 'Zapisano', description: `Dodano przyjęć: ${saved} (${formatYmdPl(date)}).` });
      setLines([]);
      setDate('');
      onOpenChange(false);
    } else {
      setLines(failed.map(({ error: _e, ...line }) => line));
      toast({
        variant: 'destructive',
        title: `Zapisano ${saved}, nie zapisano ${failed.length}`,
        description: failed[0].error,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dodaj przyjęcia hurtem</DialogTitle>
          <DialogDescription>Jedna data, wiele stanowisk. Każdy wiersz zapisuje się jako osobne przyjęcie.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" min={todayYmd} value={date} onChange={e => setDate(e.target.value)} className="h-8 w-44 text-sm" aria-label="Data przyjęcia" />
          <Button type="button" size="sm" variant="outline"  onClick={fillShortages} disabled={busy}>Wypełnij brakami</Button>
          <Button type="button" size="sm" variant="outline" className=" gap-1" onClick={() => setLines(prev => [...prev, newLine()])} disabled={busy || depts.length === 0}>
            <Plus className="h-3.5 w-3.5" /> Dodaj wiersz
          </Button>
        </div>
        <div className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
          {lines.length === 0 && <p className="py-4 text-center text-sm text-foreground">Brak wierszy — użyj „Wypełnij brakami” albo „Dodaj wiersz”.</p>}
          {lines.map(l => (
            <div key={l.id} className="flex items-center gap-2">
              <select
                aria-label="Dział"
                value={l.dept}
                onChange={e => patch(l.id, { dept: e.target.value, job: options.get(e.target.value)?.[0]?.jobTitle ?? '' })}
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
              >
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                aria-label="Stanowisko"
                value={l.job}
                onChange={e => patch(l.id, { job: e.target.value })}
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
              >
                {(options.get(l.dept) ?? []).map(j => <option key={j.jobTitle} value={j.jobTitle}>{j.jobTitle}</option>)}
              </select>
              <Input type="number" min="1" max="50" placeholder="Ilość" value={l.count} onChange={e => patch(l.id, { count: e.target.value })} className="h-8 w-20 text-sm" aria-label="Ilość" />
              <Button type="button" variant="ghost" size="icon-sm" className=" shrink-0 text-foreground" aria-label="Usuń wiersz" onClick={() => setLines(prev => prev.filter(x => x.id !== l.id))} disabled={busy}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Anuluj</Button>
          <Button type="button" onClick={submit} disabled={busy || lines.length === 0}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Zapisz (${lines.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
