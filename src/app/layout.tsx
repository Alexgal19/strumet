import './globals.css';
import React from 'react';
import { Merriweather, Nunito } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/app-shell';
import type { Metadata, Viewport } from 'next';

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-heading',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Baza - ST',
  description: 'System do zarządzania pracownikami',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'Baza-ST',
  },
  icons: {
    apple: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#209cee',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className={cn(
          "font-sans antialiased bg-background text-foreground",
          nunito.variable,
          merriweather.variable
      )}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
