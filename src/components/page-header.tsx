import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center", className)}>
      <div className="grid gap-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center space-x-2">{children}</div>}
    </div>
  );
}
