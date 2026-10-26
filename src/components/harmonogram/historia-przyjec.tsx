'use client';

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, History, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import { type HarmonogramData } from '@/lib/harmonogram';
import { getDB } from '@/lib/firebase';
import { ref as dbRef, remove } from 'firebase/database';
import { allocateArrivals, arrivalStatus, arrivalWindowEnd, splitArrivals, type HistoriaEmployee, type TransferRecord } from '@/lib/przyjecia-historia';
import { formatYmdPl } from '@/lib/date';

/** Historia minionych przyjęć (data < dziś) z weryfikacją, czy osoby faktycznie doszły. */
export function HistoriaPrzyjec({ data, setData }: { data: HarmonogramData, setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>> }) {
  const { isAdmin, logAudit } = useAppContext();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const todayYmd = format(new Date(), 'yyyy-MM-dd');

  // Dopasowanie przyjęć do zatrudnień jest kosztowne (przyjęcia × pracownicy) — liczymy tylko
  // przy zmianie danych, a nie przy każdym rozwinięciu wiersza.
  const rows = useMemo(() => {
    const { past } = splitArrivals(Object.values(data.planowanePrzyjecia || {}), todayYmd);
    // `hires` = wszyscy zatrudnieni (także zwolnieni bez daty) z ostatniego roku; fallback na employees.
    const employees: HistoriaEmployee[] = (data.hires ?? data.employees ?? []).map(e => ({
      fullName: e.fullName,
      department: e.department,
      jobTitle: e.jobTitle,
      hireDate: e.hireDate,
    }));
    const transfers: TransferRecord[] = Object.values(data.transfery || {});
    const allocation = allocateArrivals(past, employees, transfers);
    return past.map(a => {
      const { hired, moved } = allocation.get(a.id) ?? { hired: [], moved: [] };
      return { arrival: a, hired, moved, status: arrivalStatus(a, hired.length + moved.length, todayYmd) };
    });
  }, [data.planowanePrzyjecia, data.hires, data.employees, data.transfery, todayYmd]);

  const doneCount = rows.filter(r => r.status === 'done').length;
  const partialCount = rows.filter(r => r.status === 'partial').length;
  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const missingCount = rows.filter(r => r.status === 'missing').length;

  const byDept = new Map<string, typeof rows>();
  rows.forEach(r => {
    const list = byDept.get(r.arrival.department) ?? [];
    list.push(r);
    byDept.set(r.arrival.department, list);
  });

  const handleRemove = async (id: string) => {
    if (!isAdmin) return;
    const db = getDB();
    if (!db) return;
    try {
      const target = data.planowanePrzyjecia?.[id];
      await remove(dbRef(db, `planowanePrzyjecia/${id}`));
      void logAudit('Usunięto planowane przyjęcie (Historia)', `${target?.department ?? ''} / ${target?.jobTitle ?? ''} — ${target?.date ?? ''} — ${target?.count ?? ''} os.`);
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.planowanePrzyjecia || {}) };
        delete current[id];
        return { ...prev, planowanePrzyjecia: current };
      });
    } catch (err) {
      console.error('Failed to remove arrival:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
          <History className="h-4 w-4" />
          Minione przyjęcia: {rows.length}
        </Badge>
        {doneCount > 0 && (
          <Badge variant="outline" className="gap-1.5 border-emerald-500/60 px-3 py-1.5 text-sm text-emerald-700 tabular-nums dark:text-emerald-400">
            Zrealizowane: {doneCount}
          </Badge>
        )}
        {partialCount > 0 && (
          <Badge variant="outline" className="gap-1.5 border-amber-500/60 px-3 py-1.5 text-sm text-amber-700 tabular-nums dark:text-amber-400">
            Częściowo: {partialCount}
          </Badge>
        )}
        {pendingCount > 0 && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm text-muted-foreground tabular-nums">
            Oczekuje: {pendingCount}
          </Badge>
        )}
        {missingCount > 0 && (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
            Niezrealizowane: {missingCount}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Weryfikacja po dacie zatrudnienia i transferach (okno −7 / +14 dni od planowanej daty); każda osoba liczy się tylko do jednego przyjęcia. W trakcie okna brak dopasowań = „Oczekuje”.
      </p>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <History className="mx-auto mb-3 h-8 w-8 opacity-40" />
            Brak historii — minione przyjęcia pojawią się tutaj automatycznie.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from(byDept.entries()).sort(([a], [b]) => a.localeCompare(b, 'pl')).map(([dept, deptRows]) => (
            <Card key={dept}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base truncate">{dept}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {deptRows.map(({ arrival: a, hired, moved, status }) => {
                  const expKey = `hist|${a.id}`;
                  const isOpen = !!expanded[expKey];
                  const totalMatched = hired.length + moved.length;
                  return (
                    <div key={a.id} className="rounded-md border bg-background/50 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setExpanded(prev => ({ ...prev, [expKey]: !prev[expKey] }))}
                          aria-expanded={isOpen}
                          title={totalMatched > 0 ? 'Pokaż zatrudnionych i transfery' : undefined}
                          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                        >
                          <span className="text-xs">
                            📅 {formatYmdPl(a.date)} — <strong>{a.jobTitle}</strong> — plan: <strong>{a.count} os.</strong>
                          </span>
                          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="flex items-center gap-1.5">
                          {status === 'done' && (
                            <Badge variant="outline" className="border-emerald-500/60 text-emerald-700 dark:text-emerald-400 text-xs">Zrealizowane</Badge>
                          )}
                          {status === 'partial' && (
                            <Badge variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-400 text-xs">Częściowo {totalMatched}/{a.count}</Badge>
                          )}
                          {status === 'pending' && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Oczekuje do {formatYmdPl(arrivalWindowEnd(a) ?? '')}</Badge>
                          )}
                          {status === 'missing' && (
                            <Badge variant="destructive" className="text-xs">Niezrealizowane</Badge>
                          )}
                          {isAdmin && (
                            <Button type="button" variant="ghost" size="icon-sm" className=" text-destructive" onClick={() => handleRemove(a.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {isOpen && (
                        <ul className="mt-1.5 space-y-0.5 border-t pt-1.5 text-xs">
                          {hired.length === 0 && moved.length === 0 ? (
                            <li className="text-muted-foreground">Brak dopasowanych zatrudnień ani transferów w oknie dat.</li>
                          ) : (
                            <>
                              {hired.map(m => (
                                <li key={`h-${m.fullName}`} className="flex items-center justify-between gap-2">
                                  <span className="font-medium">{m.fullName}</span>
                                  <span className="text-muted-foreground">zatr. {formatYmdPl(m.hireDate)}</span>
                                </li>
                              ))}
                              {moved.map(m => (
                                <li key={`t-${m.fullName}-${m.date}`} className="flex items-center justify-between gap-2">
                                  <span className="font-medium">🔀 {m.fullName}</span>
                                  <span className="text-muted-foreground">transfer z {m.fromDepartment} • {formatYmdPl(m.date)}</span>
                                </li>
                              ))}
                            </>
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
