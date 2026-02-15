'use client';

import './globals.css';
import React from 'react';
import { Merriweather, Nunito } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/app-shell';
import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegister from '@/components/service-worker-register';

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-heading',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
});

// Metadata i Viewport nie mogą być eksportowane z pliku 'use client'.
// Przenosimy je do osobnej logiki lub zostawiamy jako komentarz, jeśli layout musi być kliencki.
// export const metadata: Metadata = { ... };
// export const viewport: Viewport = { ... };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Te meta tagi są ważne dla PWA i powinny być w <head> */}
        <meta name="application-name" content="Baza-ST" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Baza-ST" />
        <meta name="description" content="System do zarządzania pracownikami" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#209cee" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      </head>
      <body className={cn(
          "font-sans antialiased bg-background text-foreground",
          nunito.variable,
          merriweather.variable
      )}>
        <ServiceWorkerRegister />
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
