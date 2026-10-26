'use client';

import { formatYmdPl } from '@/lib/date';

export const DEMAND_COLS = 9;

// Stałe szerokości kolumn: każdy dział to osobna tabela, a kolumny mają się zgadzać między działami.
export function DemandColgroup() {
  return (
    <colgroup>
      <col />
      <col className="w-[72px] md:w-[90px]" />
      <col className="hidden md:table-column md:w-[70px]" />
      <col className="hidden md:table-column md:w-[85px]" />
      <col className="w-[56px] md:w-[75px]" />
      <col className="hidden md:table-column md:w-[85px]" />
      <col className="w-[64px] md:w-[95px]" />
      <col className="hidden md:table-column md:w-[95px]" />
      <col className="w-[72px] md:w-[130px]" />
    </colgroup>
  );
}

export function DemandColumnLabels({ plus7, plus30 }: { plus7: string; plus30: string }) {
  return (
    <tr className="border-b bg-muted/60 text-sm font-semibold text-foreground">
      <th className="px-3 py-2 text-left font-semibold">Dział / Stanowisko</th>
      <th className="px-1 md:px-2 py-2 text-right font-semibold" title="Obsada docelowa">Potrzeby</th>
      <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title="Aktywni pracownicy dziś">Jest</th>
      <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title="Osoby z datą zwolnienia dziś lub później">Zwalnia</th>
      <th className="px-1 md:px-2 py-2 text-right font-semibold" title="Potrzeby − Jest, dziś">Teraz</th>
      <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title={`Prognoza na ${formatYmdPl(plus7)} (po zwolnieniach i przyjęciach)`}>Za 7 dni</th>
      <th className="px-1 md:px-2 py-2 text-right font-semibold" title={`Prognoza na ${formatYmdPl(plus30)} (po zwolnieniach i przyjęciach)`}>Za 30 dni</th>
      <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title="Zaplanowane przyjęcia (data od dziś)">Przyjęcia</th>
      <th className="px-2 md:px-3 py-2 text-right font-semibold" title="Stan docelowy po wszystkich zwolnieniach i zaplanowanych przyjęciach"><span className="md:hidden">Netto</span><span className="hidden md:inline">Brakuje netto</span></th>
    </tr>
  );
}
