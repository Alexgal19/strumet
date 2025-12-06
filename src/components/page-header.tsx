
import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6", className)}>
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
             {children && <div className="flex shrink-0 items-center space-x-2">{children}</div>}
        </div>
        <Separator className="my-4" />
    </header>
  );
}
