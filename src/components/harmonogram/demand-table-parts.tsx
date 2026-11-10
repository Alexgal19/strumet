'use client';

import { formatYmdPl } from '@/lib/date';

import { t } from '@/lib/i18n';
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
      <th className="px-3 py-2 text-left font-semibold">{t('schedule.departmentJobTitle')}</th>
      <th className="px-1 md:px-2 py-2 text-right font-semibold" title={t('schedule.targetStaffing')}>{t('schedule.needed')}</th>
      <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title={t('schedule.activeEmployeesToday')}>{t('schedule.have')}</th>
      <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title={t('schedule.peopleWithATerminationDate')}>{t('schedule.leaving2')}</th>
      <th className="px-1 md:px-2 py-2 text-right font-semibold" title={t('schedule.neededHaveToday')}>{t('schedule.now')}</th>
      <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title={t('schedule.forecastForDateAfterTerminations', { date: formatYmdPl(plus7) })}>{t('schedule.in7Days')}</th>
      <th className="px-1 md:px-2 py-2 text-right font-semibold" title={t('schedule.forecastForDateAfterTerminations', { date: formatYmdPl(plus30) })}>{t('schedule.in30Days')}</th>
      <th className="hidden md:table-cell px-1 md:px-2 py-2 text-right font-semibold" title={t('schedule.plannedArrivalsFromToday')}>{t('schedule.arrivals')}</th>
      <th className="px-2 md:px-3 py-2 text-right font-semibold" title={t('schedule.targetAfterAllTerminationsAnd')}><span className="md:hidden">{t('schedule.net')}</span><span className="hidden md:inline">{t('schedule.netShortage')}</span></th>
    </tr>
  );
}
