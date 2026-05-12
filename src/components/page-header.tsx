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
    <header className={cn('mb-6', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {children && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
        )}
      </div>
      <div className="mt-4 border-b border-gray-200" />
    </header>
  );
}
