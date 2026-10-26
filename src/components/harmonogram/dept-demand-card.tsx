'use client';

import React from 'react';
import { Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { commentKey } from '@/lib/komentarze-validation';
import type { DemandRenderContext } from './demand-context';
import type { DeptDemandModel } from './demand-types';
import { DEMAND_COLS, DemandColgroup, DemandColumnLabels } from './demand-table-parts';
import { JobDemandPanel } from './job-demand-panel';
import { PotrzebyInput } from './potrzeby-input';

const numCell = (v: number, danger = true) => (
  <span className={v > 0 && danger ? 'font-semibold text-red-600 dark:text-red-400' : v === 0 ? 'text-foreground' : ''}>{v}</span>
);

export function DeptDemandCard({
  model,
  flash,
  ctx,
}: {
  model: DeptDemandModel;
  flash: boolean;
  ctx: DemandRenderContext;
}) {
  const { dept, agg, jobs } = model;
  const collapsed = !!ctx.collapsedDepts[dept];

  return (
    <Card className="overflow-hidden border-2 shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-base md:min-w-[820px]">
          <DemandColgroup />
          <thead>
            <tr
              className={`zap-row cursor-pointer border-b bg-primary/15 font-semibold ${flash ? 'demand-flash-row' : ''}`}
              onClick={() => ctx.toggleDept(dept)}
            >
              <td className="px-3 py-2">
                {/* Przycisk bez własnego onClick: klik/Enter/Spacja bąbelkuje do <tr> (jedno przełączenie). */}
                <button type="button" aria-expanded={!collapsed} className="flex items-start gap-1.5 text-left font-semibold">
                  {collapsed ? <ChevronRight className="h-4 w-4 shrink-0 text-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-foreground" />}
                  <span className="[overflow-wrap:anywhere]">{dept}</span>
                </button>
              </td>
              <td className="px-1 md:px-2 py-2 text-right tabular-nums">{agg.potrzeby}</td>
              <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{agg.obecnie}</td>
              <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{numCell(agg.zwalnia, false)}</td>
              <td className="px-1 md:px-2 py-2 text-right tabular-nums">{numCell(agg.now)}</td>
              <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{numCell(agg.in7)}</td>
              <td className="px-1 md:px-2 py-2 text-right tabular-nums">{numCell(agg.in30)}</td>
              <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{agg.planned}</td>
              <td className="px-2 md:px-3 py-2 text-right tabular-nums">
                {agg.net > 0 ? (
                  <Badge variant="destructive" className="text-sm font-semibold">{agg.net}</Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500/60 text-sm text-emerald-700 dark:text-emerald-400">Komplet</Badge>
                )}
              </td>
            </tr>

            {!collapsed && <DemandColumnLabels plus7={ctx.plus7} plus30={ctx.plus30} />}
          </thead>
          <tbody>
            {!collapsed && jobs.map(model => {
              const { job, now, in7, in30, plannedTotal, net } = model;
              const key = `${dept}|${job.jobTitle}`;
              const cKey = commentKey(dept, job.jobTitle);
              const open = !!ctx.expandedJobs[key];
              const singleManager = job.managers.length === 1 ? job.managers[0] : null;
              const hasComment = !!ctx.comments?.[cKey]?.text;
              return (
                <React.Fragment key={key}>
                  <tr
                    className="zap-row cursor-pointer border-b"
                    onClick={() => ctx.toggleJob(key)}
                  >
                    <td className="py-2 pl-4 pr-2 md:pl-8 md:pr-3">
                      <button type="button" aria-expanded={open} className="flex items-start gap-1.5 text-left">
                        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground" />}
                        <Briefcase className="hidden h-3.5 w-3.5 shrink-0 text-foreground sm:block" />
                        <span className="font-semibold">{job.jobTitle}</span>
                        {hasComment && <span title="Jest komentarz" aria-label="Jest komentarz">💬</span>}
                      </button>
                    </td>
                    <td className="px-1 md:px-2 py-1 text-right tabular-nums">
                      {ctx.isAdmin && singleManager ? (
                        <PotrzebyInput
                          value={job.potrzeby}
                          onCommit={n => ctx.commitPotrzeby(dept, singleManager.manager, job.jobTitle, n)}
                        />
                      ) : (
                        job.potrzeby
                      )}
                    </td>
                    <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{job.obecnie}</td>
                    <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{numCell(job.zwalnia, false)}</td>
                    <td className="px-1 md:px-2 py-2 text-right tabular-nums">{numCell(now)}</td>
                    <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{numCell(in7)}</td>
                    <td className="px-1 md:px-2 py-2 text-right tabular-nums">{numCell(in30)}</td>
                    <td className="hidden md:table-cell px-1 md:px-2 py-2 text-right tabular-nums">{plannedTotal}</td>
                    <td className="px-2 md:px-3 py-2 text-right tabular-nums">
                      {net > 0 ? (
                        <Badge variant="destructive" className="px-1.5 py-0 text-sm">{net}</Badge>
                      ) : (
                        <span className="text-sm text-emerald-700 dark:text-emerald-400">Komplet</span>
                      )}
                    </td>
                  </tr>

                  {open && (
                    <tr className="border-b bg-muted/20">
                      <td colSpan={DEMAND_COLS} className="px-4 py-3">
                        <JobDemandPanel dept={dept} model={model} ctx={ctx} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
