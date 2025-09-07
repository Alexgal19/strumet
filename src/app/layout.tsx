import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from 'react';

// This metadata is now static and won't be used by the PWA manifest directly
// But it's good practice to keep it for SEO and browser tabs.
export const metadata: Metadata = {
  title: 'HOL manager',
  description: 'System do zarządzania pracownikami',
};

function ClientSideEffect() {
  'use client';
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  return null;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/font-geist/latest/geist.css" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
      </head>
      <body className="font-body antialiased">
        <ClientSideEffect />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
