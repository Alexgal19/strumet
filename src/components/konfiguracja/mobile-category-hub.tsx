'use client';

import { ChevronRight } from 'lucide-react';
import type { ConfigCategory } from './config-meta';

type MobileCategoryHubProps = {
  categories: ConfigCategory[];
  onSelect: (value: string) => void;
};

export function MobileCategoryHub({ categories, onSelect }: MobileCategoryHubProps) {
  return (
    <div className="mt-2 space-y-2">
      {categories.map((category) => (
        <button
          key={category.value}
          type="button"
          onClick={() => onSelect(category.value)}
          className="flex min-h-[64px] w-full items-center justify-start gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-muted/50 active:bg-muted"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
            <category.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-sm">{category.label}</span>
            <span className="block truncate text-xs text-muted-foreground">{category.description}</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
