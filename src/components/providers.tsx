'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AppProvider } from '@/context/app-context';
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppProvider>
        {children}
        <Toaster />
      </AppProvider>
    </NextThemesProvider>
  );
}
