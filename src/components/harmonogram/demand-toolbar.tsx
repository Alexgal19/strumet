'use client';

import { CalendarPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { t } from '@/lib/i18n';
export function DemandToolbar({
  query,
  onQueryChange,
  onlyProblems,
  onToggleOnlyProblems,
  sortMode,
  onSortModeChange,
  onOpenBulk,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onlyProblems: boolean;
  onToggleOnlyProblems: () => void;
  sortMode: 'deficit' | 'name';
  onSortModeChange: (value: 'deficit' | 'name') => void;
  onOpenBulk: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full min-w-[200px] sm:w-64">
        <Search className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-foreground" />
        <Input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={t('schedule.searchDepartmentOrJobTitle')}
          className="h-8 pl-8 text-sm"
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant={onlyProblems ? 'default' : 'outline'}
        className="h-8"
        aria-pressed={onlyProblems}
        onClick={onToggleOnlyProblems}
      >
        {t('schedule.onlyWithGaps')}
      </Button>
      <select
        aria-label={t('schedule.sorting')}
        value={sortMode}
        onChange={e => onSortModeChange(e.target.value as 'deficit' | 'name')}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="deficit">{t('schedule.sortBiggestGaps')}</option>
        <option value="name">{t('schedule.sortNameAZ')}</option>
      </select>
      <Button type="button" size="sm" variant="outline" className=" gap-1.5 sm:ml-auto" onClick={onOpenBulk}>
        <CalendarPlus className="h-4 w-4" />
        {t('schedule.addArrivalsInBulk')}
      </Button>
    </div>
  );
}
