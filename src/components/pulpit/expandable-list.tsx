'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ExpandableList<T>({
  items,
  renderItem,
  limit = 3,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > limit;
  const visibleItems = expanded || !hasMore ? items : items.slice(0, limit);

  return (
    <div>
      <div className="space-y-3">
        {visibleItems.map((item, index) => renderItem(item, index))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 w-full min-h-[44px] rounded-xl text-sm text-primary hover:bg-primary/5"
        >
          {expanded ? 'Pokaż mniej' : `Pokaż więcej (+${items.length - limit})`}
        </Button>
      )}
    </div>
  );
}
