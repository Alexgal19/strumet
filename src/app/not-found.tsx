'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { t } from '@/lib/i18n';
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-4xl font-bold">404 - Nie znaleziono strony</h2>
      <p className="text-muted-foreground">{t('importx.thePageYouAreLooking')}</p>
      <Button asChild>
        <Link href="/">{t('importx.backToTheHomePage')}</Link>
      </Button>
    </div>
  );
}
