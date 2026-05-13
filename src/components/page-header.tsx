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
    <header className={cn('mb-8 animate-in-slide-up', className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 relative">
          <div className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-primary rounded-r-full hidden md:block" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1.5 hidden md:block font-medium">
              {description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 bg-white/40 dark:bg-black/20 p-1 rounded-2xl border border-white/40 dark:border-white/10 backdrop-blur-md empty:hidden">
          {children}
        </div>
      </div>
    </header>
  );
}

