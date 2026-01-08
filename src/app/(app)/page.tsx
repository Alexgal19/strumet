
'use client';
import { redirect } from 'next/navigation';

// This is the main entry point for the authenticated part of the app.
// It redirects to the default view ('statystyki').
export default function AppPage() {
  redirect('/statystyki');
}
