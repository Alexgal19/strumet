'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AppProvider } from '@/context/app-context';
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </I18nProvider>
    </NextThemesProvider>
  );
}
