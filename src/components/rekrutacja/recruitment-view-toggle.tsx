'use client';

import { Button } from '@/components/ui/button';

export const RecruitmentViewToggle = ({
  view,
  onViewChange,
}: {
  view: 'karty' | 'harmonogram';
  onViewChange: (view: 'karty' | 'harmonogram') => void;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded-lg border border-border">
        <Button
          type="button"
          size="sm"
          variant={view === 'karty' ? 'default' : 'ghost'}
          className="rounded-none border-0"
          onClick={() => onViewChange('karty')}
        >
          Zapotrzebowania
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === 'harmonogram' ? 'default' : 'ghost'}
          className="rounded-none border-0"
          onClick={() => onViewChange('harmonogram')}
        >
          Harmonogram obsady
        </Button>
      </div>
    </div>
  );
};
