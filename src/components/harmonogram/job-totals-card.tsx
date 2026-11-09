'use client';

import { useState } from 'react';
import { Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { JobTotal } from './demand-types';

const H = 'hidden md:table-cell';

function Num({ value, danger = true }: { value: number; danger?: boolean }) {
  return (
    <span className={value > 0 && danger ? 'font-semibold text-red-600 dark:text-red-400' : ''}>{value}</span>
  );
}

/**
 * Ogólne zapotrzebowanie po stanowiskach (wszystkie działy razem): ile osób potrzeba, ile jest,
 * ile brakuje dziś i docelowo — np. ilu spawaczy, montażystów palet, szlifierzy.
 */
export function JobTotalsCard({ totals }: { totals: JobTotal[] }) {
  const [open, setOpen] = useState(false); // domyślnie zwinięta: odpowiedź „kogo i ilu” jest w etykietach powyżej tabeli
  const sum = totals.reduce(
    (s, t) => ({
      potrzeby: s.potrzeby + t.potrzeby,
      obecnie: s.obecnie + t.obecnie,
      zwalnia: s.zwalnia + t.zwalnia,
      now: s.now + t.now,
      in30: s.in30 + t.in30,
      planned: s.planned + t.planned,
      net: s.net + t.net,
    }),
    { potrzeby: 0, obecnie: 0, zwalnia: 0, now: 0, in30: 0, planned: 0, net: 0 }
  );

  const needed = totals.filter(t => t.now > 0);

  return (
    <section className="min-w-0 shrink-0 overflow-hidden rounded-lg border border-l-4 border-l-violet-500 bg-card text-foreground shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-base font-bold">
          {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <Briefcase className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
          Zapotrzebowania na dziś — po stanowiskach
        </span>
        <span className="text-sm">
          brakuje dziś: <strong className="tabular-nums">{sum.now}</strong>
        </span>
      </button>

      {/* Szybka odpowiedź „kogo i ilu potrzebujemy dziś” — widoczna także po zwinięciu tabeli */}
      <div className="flex flex-wrap gap-2 border-t px-4 py-3">
        {needed.length === 0 ? (
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Dziś komplet na wszystkich stanowiskach.</span>
        ) : (
          needed.map(t => (
            <span
              key={t.jobTitle}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-sm font-semibold text-foreground"
            >
              {t.jobTitle}
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold tabular-nums text-white">{t.now}</span>
            </span>
          ))
        )}
      </div>

      {open && (
        <div className="overflow-x-auto border-t">
          <table className="w-full border-collapse text-sm md:min-w-[760px]">
            <thead className="bg-muted/60 text-left font-semibold">
              <tr className="border-b">
                <th className="px-3 py-2">Stanowisko</th>
                <th className={`${H} px-2 py-2 text-right`} title="W ilu działach jest to stanowisko">Działy</th>
                <th className="px-2 py-2 text-right" title="Obsada docelowa">Potrzeby</th>
                <th className="px-2 py-2 text-right" title="Aktywni pracownicy dziś">Jest</th>
                <th className={`${H} px-2 py-2 text-right`} title="Osoby z datą zwolnienia dziś lub później">Zwalnia</th>
                <th className="px-2 py-2 text-right" title="Potrzeby − Jest, dziś">Brakuje dziś</th>
                <th className={`${H} px-2 py-2 text-right`} title="Prognoza za 30 dni (po zwolnieniach i przyjęciach)">Za 30 dni</th>
                <th className={`${H} px-2 py-2 text-right`} title="Zaplanowane przyjęcia (data od dziś)">Przyjęcia</th>
                <th className="px-3 py-2 text-right" title="Stan docelowy po wszystkich zwolnieniach i przyjęciach">Netto</th>
              </tr>
            </thead>
            <tbody>
              {totals.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center">Brak stanowisk.</td>
                </tr>
              )}
              {totals.map(t => (
                <tr key={t.jobTitle} className="zap-row border-b">
                  <td className="px-3 py-2 font-semibold [overflow-wrap:anywhere]">{t.jobTitle}</td>
                  <td className={`${H} px-2 py-2 text-right tabular-nums`}>{t.departments}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{t.potrzeby}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{t.obecnie}</td>
                  <td className={`${H} px-2 py-2 text-right tabular-nums`}><Num value={t.zwalnia} danger={false} /></td>
                  <td className="px-2 py-2 text-right tabular-nums"><Num value={t.now} /></td>
                  <td className={`${H} px-2 py-2 text-right tabular-nums`}><Num value={t.in30} /></td>
                  <td className={`${H} px-2 py-2 text-right tabular-nums`}>{t.planned}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {t.net > 0 ? (
                      <Badge variant="destructive" className="px-1.5 py-0 text-sm">{t.net}</Badge>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400">Komplet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {totals.length > 0 && (
              <tfoot>
                <tr className="border-t-2 bg-muted/40 font-bold">
                  <td className="px-3 py-2">Razem</td>
                  <td className={`${H} px-2 py-2`} />
                  <td className="px-2 py-2 text-right tabular-nums">{sum.potrzeby}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{sum.obecnie}</td>
                  <td className={`${H} px-2 py-2 text-right tabular-nums`}>{sum.zwalnia}</td>
                  <td className="px-2 py-2 text-right tabular-nums"><Num value={sum.now} /></td>
                  <td className={`${H} px-2 py-2 text-right tabular-nums`}><Num value={sum.in30} /></td>
                  <td className={`${H} px-2 py-2 text-right tabular-nums`}>{sum.planned}</td>
                  <td className="px-3 py-2 text-right tabular-nums"><Num value={sum.net} /></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  );
}
