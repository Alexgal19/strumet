import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/app-shell';
import ServiceWorkerRegister from '@/components/service-worker-register';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '900'],
  variable: '--font-heading',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  applicationName: 'Baza-ST',
  description: 'System do zarządzania pracownikami',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Baza-ST',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#111827',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className={cn(
        "font-sans antialiased bg-background text-foreground tracking-tight selection:bg-primary/20",
        inter.variable,
        outfit.variable
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
