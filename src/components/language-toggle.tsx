'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Przełącznik PL/EN — pokazuje język, na który się przełączy. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const next = locale === 'pl' ? 'en' : 'pl';
  const label = next === 'en' ? t('common.switchToEnglish') : t('common.switchToPolish');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLocale(next)}
      className={cn('h-9 w-9 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground', className)}
      title={label}
      aria-label={label}
    >
      {next.toUpperCase()}
    </Button>
  );
}
