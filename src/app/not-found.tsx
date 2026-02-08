'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-4xl font-bold">404 - Nie znaleziono strony</h2>
      <p className="text-muted-foreground">Strona, której szukasz, nie istnieje.</p>
      <Button asChild>
        <Link href="/">Wróć na stronę główną</Link>
      </Button>
    </div>
  );
}
