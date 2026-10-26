'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrivalRow } from './arrival-row';
import type { DemandRenderContext } from './demand-context';
import type { JobDemandModel } from './demand-types';
import { PanelBlock } from './panel-block';

export function JobArrivalsPanel({
  dept,
  model,
  ctx,
}: {
  dept: string;
  model: JobDemandModel;
  ctx: DemandRenderContext;
}) {
  const key = `${dept}|${model.job.jobTitle}`;
  const { planned, plannedTotal } = model;

  return (
    <PanelBlock title="Zaplanowane przyjęcia" count={plannedTotal} tone="blue">
      <div className="flex flex-col gap-2">
        {planned.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {planned.map(p => (
              <ArrivalRow
                key={p.id}
                p={p}
                onUpdate={ctx.updateArrival}
                onRemove={ctx.removeArrival}
                canDelete={ctx.isAdmin}
              />
            ))}
          </div>
        ) : (
          <p>Brak zaplanowanych przyjęć.</p>
        )}
        <div className="mt-1 flex flex-col gap-1.5 border-t pt-2">
          <span className="font-semibold">Dodaj przyjęcie</span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              min={ctx.todayYmd}
              className="h-9 flex-1 text-sm"
              value={ctx.newArrivalDate[key] || ''}
              onChange={e => ctx.setNewArrivalDate(prev => ({ ...prev, [key]: e.target.value }))}
            />
            <Input
              type="number"
              min="1"
              max="50"
              placeholder="Ilość"
              className={`h-9 w-20 text-sm ${ctx.newArrivalDate[key] && !ctx.newArrivalCount[key] ? 'guide-pulse' : ''}`}
              value={ctx.newArrivalCount[key] || ''}
              onChange={e => ctx.setNewArrivalCount(prev => ({ ...prev, [key]: e.target.value }))}
            />
            <Button
              type="button"
              size="sm"
              className="h-9 text-sm"
              onClick={() => ctx.addArrival(dept, model.job.jobTitle)}
              disabled={!ctx.newArrivalDate[key] || !ctx.newArrivalCount[key]}
            >
              Dodaj
            </Button>
            {(ctx.newArrivalDate[key] || ctx.newArrivalCount[key]) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Anuluj wpisywanie"
                aria-label="Anuluj wpisywanie"
                className="h-9 w-9 shrink-0 text-foreground"
                onClick={() => {
                  ctx.setNewArrivalDate(prev => ({ ...prev, [key]: '' }));
                  ctx.setNewArrivalCount(prev => ({ ...prev, [key]: '' }));
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!ctx.isAdmin && (
            <p className="text-sm">
              Jako Gość możesz dodawać i edytować przyjęcia oraz komentarze. Usuwanie i zmiana potrzeb — dla administratora.
            </p>
          )}
        </div>
      </div>
    </PanelBlock>
  );
}
