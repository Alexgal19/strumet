'use client';

import type { RecruitmentArrival } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { ArrivalRow } from './arrival-row';

export const RecruitmentArrivalsEditor = ({
  recruitmentId,
  sortedArrivals,
  plannedTotal,
  isAddingArrival,
  handleAddArrival,
  handleRemoveArrival,
}: {
  recruitmentId: string;
  sortedArrivals: RecruitmentArrival[];
  plannedTotal: number;
  isAddingArrival: boolean;
  handleAddArrival: () => Promise<void>;
  handleRemoveArrival: (arrivalId: string) => Promise<void>;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Planowane przyjęcia ({plannedTotal} os.):
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-primary/30 px-3 text-primary hover:bg-primary/5"
          disabled={isAddingArrival}
          onClick={handleAddArrival}
        >
          {isAddingArrival ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Dodaj datę
        </Button>
      </div>
      {sortedArrivals.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
          Brak zaplanowanych dat przyjęć — kliknij „Dodaj datę”.
        </p>
      ) : (
        sortedArrivals.map(arrival => (
          <ArrivalRow
            key={arrival.id}
            recruitmentId={recruitmentId}
            arrival={arrival}
            onRemove={handleRemoveArrival}
          />
        ))
      )}
    </div>
  );
};
