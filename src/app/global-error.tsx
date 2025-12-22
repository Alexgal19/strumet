'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Wystąpił nieoczekiwany błąd</h2>
        <p className="text-muted-foreground max-w-md">
            Coś poszło nie tak. Możesz spróbować odświeżyć stronę lub wrócić do niej później.
        </p>
        <Button onClick={() => reset()}>Spróbuj ponownie</Button>
    </div>
  );
}
