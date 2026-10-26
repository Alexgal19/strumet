'use client';

import React from 'react';

const PANEL_TONES: Record<string, string> = {
  violet: 'border-l-violet-500',
  amber: 'border-l-amber-500',
  red: 'border-l-red-500',
  blue: 'border-l-blue-500',
  slate: 'border-l-slate-500',
};

/** Osobny blok informacji w panelu stanowiska: nagłówek (+ licznik/podpowiedź) i treść. */
export function PanelBlock({ title, hint, count, tone = 'slate', children }: {
  title: string;
  hint?: string;
  count?: number;
  tone?: keyof typeof PANEL_TONES | string;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 rounded-lg border border-l-4 bg-card p-3 text-sm text-foreground shadow-sm ${PANEL_TONES[tone] ?? PANEL_TONES.slate}`}>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
        <h4 className="text-base font-bold">
          {title}
          {count !== undefined && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums">{count}</span>}
        </h4>
        {hint && <span className="text-xs">{hint}</span>}
      </header>
      {children}
    </section>
  );
}
