'use client';

import React from 'react';
import { AppProvider } from '@/context/app-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <SidebarProvider>
        {children}
        <Toaster />
      </SidebarProvider>
    </AppProvider>
  );
}
