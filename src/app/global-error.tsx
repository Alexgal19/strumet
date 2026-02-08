'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">Coś poszło nie tak!</h2>
          <button
            className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
          >
            Spróbuj ponownie
          </button>
        </div>
      </body>
    </html>
  );
}
