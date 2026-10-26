'use client';

import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { commentKey } from '@/lib/komentarze-validation';
import { formatYmdPl } from '@/lib/date';
import type { DemandRenderContext } from './demand-context';
import type { JobDemandModel } from './demand-types';
import { JobArrivalsPanel } from './job-arrivals-panel';
import { PanelBlock } from './panel-block';
import { PotrzebyInput } from './potrzeby-input';
import { PositionComment } from './position-comment';

export function JobDemandPanel({
  dept,
  model,
  ctx,
}: {
  dept: string;
  model: JobDemandModel;
  ctx: DemandRenderContext;
}) {
  const { job, forecast, plannedTotal } = model;
  const cKey = commentKey(dept, job.jobTitle);

  return (
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {job.managers.length > 1 && (
        <PanelBlock title="Obsada wg kierowników" hint="Jest = aktywni dziś" tone="violet">
          <div className="flex flex-col gap-1.5">
            {job.managers.map(m => {
              const lack = Math.max(0, m.potrzeby - m.obecnie);
              return (
                <div key={m.manager} className="rounded-md bg-muted/60 px-3 py-2">
                  <div className="mb-1 font-semibold">{m.manager === 'Brak kierownika' ? m.manager : `Kierownik: ${m.manager}`}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Jest: <strong className="text-base tabular-nums">{m.obecnie}</strong></span>
                    <span className="flex items-center gap-1.5">
                      Potrzeby:
                      {ctx.isAdmin ? (
                        <PotrzebyInput value={m.potrzeby} onCommit={n => ctx.commitPotrzeby(dept, m.manager, job.jobTitle, n)} />
                      ) : (
                        <strong className="text-base tabular-nums">{m.potrzeby}</strong>
                      )}
                    </span>
                    {m.zwalnia > 0 && (
                      <span className="text-red-700 dark:text-red-400">Zwalnia: <strong className="tabular-nums">{m.zwalnia}</strong></span>
                    )}
                    {lack > 0 ? (
                      <Badge variant="destructive" className="px-2 py-0 text-sm tabular-nums">brakuje {lack}</Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/60 px-2 py-0 text-sm text-emerald-700 dark:text-emerald-400">komplet</Badge>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 pt-2 font-semibold">
              <span>Razem</span>
              <span>Jest: <span className="text-base tabular-nums">{job.obecnie}</span></span>
              <span>Potrzeby: <span className="text-base tabular-nums">{job.potrzeby}</span></span>
            </div>
          </div>
        </PanelBlock>
      )}

      <PanelBlock title="Prognoza braków" tone="amber">
        {forecast.length > 1 ? (
          <div className="flex flex-col gap-1.5">
            {forecast.map((r, ri) => (
              <div key={ri} className="flex items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-2">
                <span className="font-medium">{r.kind === 'now' ? 'Teraz' : `od ${formatYmdPl(r.date)}`}</span>
                <span className="flex items-center gap-1.5">
                  brakuje
                  {r.shortage > 0 ? (
                    <Badge variant="destructive" className="px-2 py-0 text-sm tabular-nums">{r.shortage}</Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-500/60 px-2 py-0 text-sm text-emerald-700 dark:text-emerald-400">0</Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>Brak zmian — nie ma zaplanowanych zwolnień ani przyjęć.</p>
        )}
      </PanelBlock>

      {job.zwalniani.length > 0 && (
        <PanelBlock title="Planowane zwolnienia" hint="data = ostatni dzień pracy" count={job.zwalnia} tone="red">
          <div className="flex flex-col gap-1.5">
            {job.zwalniani.map((z, idx) => {
              const expKey = `${dept}|${job.jobTitle}|${z.date}`;
              const expanded = !!ctx.expandedTerminations[expKey];
              return (
                <div key={idx} className="rounded-md bg-red-500/10">
                  <button
                    type="button"
                    onClick={() => ctx.toggleTermination(expKey)}
                    aria-expanded={expanded}
                    title="Pokaż pracowników"
                    className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left font-medium text-red-700 dark:text-red-400"
                  >
                    <span>{formatYmdPl(z.date)} — <strong>{z.count} os.</strong></span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded && (
                    <ul className="space-y-0.5 border-t border-red-500/20 px-3 py-2 text-red-700 dark:text-red-400">
                      {z.names.map(name => (
                        <li key={name} className="flex items-center gap-1.5">
                          <span aria-hidden="true">•</span>
                          <span className="font-medium">{name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </PanelBlock>
      )}

      <JobArrivalsPanel dept={dept} model={model} ctx={ctx} />

      <PanelBlock title="Komentarz" tone="slate">
        <PositionComment
          saved={ctx.comments?.[cKey]}
          draft={ctx.commentDrafts[cKey] ?? ''}
          isEditing={!!ctx.editingComment[cKey]}
          onStartEdit={() => ctx.startComment(cKey, ctx.comments?.[cKey]?.text)}
          onDraftChange={v => ctx.setCommentDraft(cKey, v)}
          onCancel={() => ctx.cancelComment(cKey)}
          onSave={() => ctx.saveComment(dept, job.jobTitle)}
        />
      </PanelBlock>
    </div>
  );
}
