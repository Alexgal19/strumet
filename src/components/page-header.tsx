import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function PageHeader({ title, description, children, className, icon }: PageHeaderProps) {
  return (
    <header className={cn('mb-4 sm:mb-8 animate-in-slide-up', className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex items-center gap-3">
          {icon && <span className="hidden md:flex shrink-0 text-muted-foreground">{icon}</span>}
          <div>
            {/* Tytuł strony — na mobile ukryty, bo topbar już go pokazuje (Android pattern) */}
            <h1 className="hidden md:block text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0 sm:mt-1.5 font-medium">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3 empty:hidden w-full sm:w-auto">
          {children}
        </div>
      </div>
    </header>
  );
}

