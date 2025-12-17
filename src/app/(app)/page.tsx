'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This is the main entry point for the authenticated part of the app.
// It redirects to the default view ('statystyki').
export default function AppPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/statystyki');
  }, [router]);

  return null; // Or a loading spinner
}
