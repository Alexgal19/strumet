import React from 'react';
import AppSidebar from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ConfigProvider } from '@/context/config-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ConfigProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8 bg-background">
              {children}
          </main>
        </div>
      </ConfigProvider>
    </SidebarProvider>
  );
}
