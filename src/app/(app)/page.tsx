'use client';
import { redirect } from 'next/navigation';

// This is the main entry point for the authenticated part of the app.
// It redirects to the default view ('aktywni').
export default function AppPage() {
  redirect('/aktywni');
}
