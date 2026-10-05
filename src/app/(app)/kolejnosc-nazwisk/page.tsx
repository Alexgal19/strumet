'use client';

import React, { useMemo, useState } from 'react';
import { ref as dbRef, update } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import { buildTokenFrequency, guessNameOrder, suggestReordered, type NameOrderGuess } from '@/lib/person-name';

type Filter = 'suspect' | 'unclear' | 'ok' | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'suspect', label: 'Wygląda na „Imię Nazwisko”' },
  { id: 'unclear', label: 'Niepewne' },
  { id: 'ok', label: 'Wygląda poprawnie' },
  { id: 'all', label: 'Wszyscy' },
];

const GUESS_OF: Record<Exclude<Filter, 'all'>, NameOrderGuess> = {
  suspect: 'firstLast',
  unclear: 'unclear',
  ok: 'lastFirst',
};

/**
 * Narzędzie dla admina: docelowa kolejność w bazie to „Nazwisko Imię”. Starsze rekordy bywają zapisane
 * odwrotnie, a kolejności nie da się pewnie odgadnąć automatycznie — dlatego lista podejrzanych rekordów,
 * podgląd propozycji (do ręcznej poprawki) i zapis dopiero po zaznaczeniu i potwierdzeniu.
 */
export default function KolejnoscNazwiskPage() {
  const { employees, isLoading, isAdmin, logAudit } = useAppContext();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('suspect');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const freq = buildTokenFrequency(employees.map(e => e.fullName ?? ''));
    return employees
      .filter(e => e.fullName?.trim())
      .map(e => ({
        id: e.id,
        fullName: e.fullName,
        status: e.status as string,
        guess: guessNameOrder(e.fullName, freq),
        proposal: suggestReordered(e.fullName),
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pl'));
  }, [employees]);

  const counts = useMemo(
    () => ({
      suspect: rows.filter(r => r.guess === 'firstLast').length,
      unclear: rows.filter(r => r.guess === 'unclear').length,
      ok: rows.filter(r => r.guess === 'lastFirst').length,
      all: rows.length,
    }),
    [rows]
  );

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    r => (filter === 'all' || r.guess === GUESS_OF[filter]) && (!q || r.fullName.toLowerCase().includes(q))
  );

  const proposalOf = (r: (typeof rows)[number]) => (edits[r.id] ?? r.proposal).trim().replace(/\s+/g, ' ');
  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allVisibleSelected = visible.length > 0 && visible.every(r => selected.has(r.id));

  const apply = async () => {
    const chosen = rows.filter(r => selected.has(r.id));
    const changes = chosen.filter(r => proposalOf(r) && proposalOf(r) !== r.fullName);
    if (changes.length === 0) {
      toast({ title: 'Brak zmian do zapisania' });
      return;
    }
    if (!window.confirm(`Zapisać nową kolejność dla ${changes.length} pracowników?`)) return;
    const db = getDB();
    if (!db) return;
    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      changes.forEach(r => {
        const name = proposalOf(r);
        updates[`employees/${r.id}/fullName`] = name;
        updates[`employees/${r.id}/status_fullName`] = `${r.status}_${name.toLowerCase()}`;
      });
      await update(dbRef(db), updates);
      void logAudit('Zmiana kolejności nazwiska', `Zmieniono ${changes.length} rekordów na „Nazwisko Imię”`);
      toast({ title: 'Zapisano', description: `Zmieniono kolejność: ${changes.length}.` });
      setSelected(new Set());
      setEdits({});
    } catch (err) {
      console.error('Failed to reorder names:', err);
      toast({ variant: 'destructive', title: 'Nie zapisano', description: 'Spróbuj ponownie.' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Kolejność nazwisk" description="Narzędzie dostępne tylko dla administratora." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6 text-foreground">
      <PageHeader
        title="Kolejność nazwisk"
        description="Docelowa kolejność w bazie: „Nazwisko Imię”. Sprawdź podejrzane rekordy i zapisz poprawki."
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? 'default' : 'outline'}
            onClick={() => setFilter(f.id)}
          >
            {f.label} <Badge variant="secondary" className="ml-2 tabular-nums">{counts[f.id]}</Badge>
          </Button>
        ))}
      </div>

      <p className="text-sm">
        Kolejność jest zgadywana po tym, które słowo powtarza się w firmie częściej (imiona powtarzają się częściej niż
        nazwiska) — to tylko wskazówka, np. częste nazwisko „Singh” bywa mylone z imieniem. Propozycję można poprawić ręcznie
        (przy nazwiskach dwuczłonowych). W bazie nic nie zmienia się automatycznie.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Szukaj nazwiska…"
          className="h-9 w-64 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setSelected(prev => {
              const next = new Set(prev);
              visible.forEach(r => (allVisibleSelected ? next.delete(r.id) : next.add(r.id)));
              return next;
            })
          }
        >
          {allVisibleSelected ? 'Odznacz widoczne' : 'Zaznacz widoczne'}
        </Button>
        <Button type="button" size="sm" onClick={apply} disabled={saving || selected.size === 0}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Zapisz zaznaczone (${selected.size})`}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-muted/60 text-left font-semibold">
                <tr className="border-b">
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2">Obecnie w bazie</th>
                  <th className="px-3 py-2">Propozycja „Nazwisko Imię”</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center">Brak rekordów w tym widoku.</td>
                  </tr>
                )}
                {visible.map(r => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="px-3 py-1.5">
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggle(r.id)}
                        aria-label={`Zaznacz ${r.fullName}`}
                      />
                    </td>
                    <td className="px-3 py-1.5 font-medium">{r.fullName}</td>
                    <td className="px-3 py-1.5">
                      <Input
                        value={edits[r.id] ?? r.proposal}
                        onChange={e => setEdits(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="h-8 text-sm"
                        aria-label={`Propozycja dla ${r.fullName}`}
                      />
                    </td>
                    <td className="px-3 py-1.5">{r.status === 'zwolniony' ? 'zwolniony' : 'aktywny'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
